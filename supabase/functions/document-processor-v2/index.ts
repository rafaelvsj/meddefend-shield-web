import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { fileId } = await req.json();

    if (!fileId) {
      throw new Error('fileId is required');
    }

    console.log(`[document-processor-v2] Processing file: ${fileId}`);

    // Log STARTED stage
    await supabase.from('kb_processing_logs').insert({
      file_id: fileId,
      stage: 'STARTED',
      message: 'Universal pipeline processing initiated',
      metadata: { pipeline: 'universal-v2', timestamp: new Date().toISOString() }
    });

    // Get pipeline settings
    const { data: settingsData } = await supabase
      .from('pipeline_settings')
      .select('setting_key, setting_value');

    const settings = settingsData?.reduce((acc: any, setting: any) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {}) || {};

    // Check if universal pipeline is enabled
    if (settings.USE_UNIVERSAL_PIPELINE !== 'true') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Universal pipeline is disabled'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get file info and update status
    const { data: fileInfo } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', fileId)
      .single();

    if (!fileInfo) {
      throw new Error(`File not found: ${fileId}`);
    }

    await supabase
      .from('knowledge_base')
      .update({ 
        status: 'processing',
        processing_logs: { pipeline: 'universal-v2', started_at: new Date().toISOString() }
      })
      .eq('id', fileId);

    // Log EXTRACTED stage
    await supabase.from('kb_processing_logs').insert({
      file_id: fileId,
      stage: 'DOWNLOADING',
      message: 'Downloading file from storage',
      metadata: { file_name: fileInfo.file_name, original_name: fileInfo.original_name }
    });

    // Download file from storage
    const { data: fileData } = await supabase.storage
      .from('knowledge-base')
      .download(fileInfo.file_name);

    if (!fileData) {
      throw new Error('Failed to download file');
    }

    const buffer = await fileData.arrayBuffer();

    // Call extraction service
    if (!settings.EXTRACTOR_SERVICE_URL) {
      throw new Error('EXTRACTOR_SERVICE_URL not configured');
    }

    const formData = new FormData();
    const blob = new Blob([buffer]);
    formData.append('file', blob, fileInfo.original_name);

    const response = await fetch(`${settings.EXTRACTOR_SERVICE_URL}/extract`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Extraction service error: ${response.status}`);
    }

    const extractionResult = await response.json();

    if (!extractionResult.success) {
      await supabase.from('kb_processing_logs').insert({
        file_id: fileId,
        stage: 'EXTRACTED',
        message: 'Extraction service failed',
        metadata: { error: 'extraction_service_failure', service_response: extractionResult }
      });
      throw new Error('Extraction service returned failure');
    }

    // Log EXTRACTED stage
    await supabase.from('kb_processing_logs').insert({
      file_id: fileId,
      stage: 'EXTRACTED',
      message: 'Text extraction completed',
      metadata: { 
        extraction_method: extractionResult.extraction_method,
        mime_type: extractionResult.mime_type,
        ocr_used: extractionResult.ocr_used,
        text_length: extractionResult.original_text?.length || 0,
        markdown_length: extractionResult.markdown?.length || 0
      }
    });

    // Validate similarity
    const similarityThreshold = parseFloat(settings.SIMILARITY_THRESHOLD) || 0.99;
    if (extractionResult.similarity < similarityThreshold) {
      await supabase.from('kb_processing_logs').insert({
        file_id: fileId,
        stage: 'VALIDATED',
        message: 'Document rejected - similarity below threshold',
        metadata: { 
          similarity_score: extractionResult.similarity,
          threshold: similarityThreshold,
          rejection_reason: 'low_similarity'
        }
      });

      await supabase
        .from('knowledge_base')
        .update({
          status: 'error',
          similarity_score: extractionResult.similarity,
          processing_logs: { error: 'Similarity below threshold', similarity: extractionResult.similarity }
        })
        .eq('id', fileId);

      return new Response(JSON.stringify({
        success: false,
        message: `Similarity too low: ${extractionResult.similarity} < ${similarityThreshold}`
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log VALIDATED stage
    await supabase.from('kb_processing_logs').insert({
      file_id: fileId,
      stage: 'VALIDATED',
      message: 'Document approved - similarity above threshold',
      metadata: { 
        similarity_score: extractionResult.similarity,
        threshold: similarityThreshold
      }
    });

    // Generate embeddings and chunks
    const chunkSize = parseInt(settings.CHUNK_SIZE) || 1000;
    const overlap = parseInt(settings.CHUNK_OVERLAP) || 200;
    
    const chunks: string[] = [];
    let start = 0;
    const text = extractionResult.markdown;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start = end - overlap;
      if (start >= text.length) break;
    }

    // Log CHUNKED stage
    await supabase.from('kb_processing_logs').insert({
      file_id: fileId,
      stage: 'CHUNKED',
      message: 'Text divided into chunks',
      metadata: { 
        total_chunks: chunks.length,
        chunk_size: chunkSize,
        overlap: overlap,
        total_text_length: text.length
      }
    });

    // Generate embeddings for chunks using OpenAI
    const chunksWithEmbeddings = await Promise.all(chunks.map(async (chunk, index) => {
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-large',
          input: chunk,
          encoding_format: 'float'
        })
      });

      if (!embeddingResponse.ok) {
        throw new Error(`OpenAI embedding error: ${embeddingResponse.status}`);
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data?.[0]?.embedding || [];

      return {
        knowledge_base_id: fileId,
        content: chunk,
        embedding: `[${embedding.join(',')}]`,
        chunk_index: index,
        chunk_size: chunk.length,
        metadata: { generation_timestamp: new Date().toISOString() }
      };
    }));

    // Log EMBEDDED stage
    await supabase.from('kb_processing_logs').insert({
      file_id: fileId,
      stage: 'EMBEDDED',
      message: 'Embeddings generated for all chunks',
      metadata: { 
        total_embeddings: chunksWithEmbeddings.length,
        embedding_model: 'text-embedding-3-large',
        provider: 'openai'
      }
    });

    // Save chunks
    await supabase.from('document_chunks').insert(chunksWithEmbeddings);

    // Log COMPLETED stage
    await supabase.from('kb_processing_logs').insert({
      file_id: fileId,
      stage: 'COMPLETED',
      message: 'Document processing completed successfully',
      metadata: { 
        total_processing_time: Date.now() - new Date(fileInfo.created_at).getTime(),
        final_similarity: extractionResult.similarity,
        chunks_created: chunks.length,
        final_status: 'processed'
      }
    });

    // Update knowledge_base record
    await supabase
      .from('knowledge_base')
      .update({
        status: 'processed',
        content: extractionResult.original_text,
        markdown_content: extractionResult.markdown,
        similarity_score: extractionResult.similarity,
        extraction_method: extractionResult.extraction_method,
        mime_type: extractionResult.mime_type,
        ocr_used: extractionResult.ocr_used,
        processed_at: new Date().toISOString(),
        processing_logs: {
          pipeline: 'universal-v2',
          completed_at: new Date().toISOString(),
          chunks_created: chunks.length
        }
      })
      .eq('id', fileId);

    return new Response(JSON.stringify({
      success: true,
      message: 'Document processed successfully',
      fileId,
      similarity: extractionResult.similarity,
      chunksCreated: chunks.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[document-processor-v2] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});