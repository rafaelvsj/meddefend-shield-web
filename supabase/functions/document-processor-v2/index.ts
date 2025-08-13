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
    if (settings.UNIVERSAL_PIPELINE !== 'true' && settings.USE_UNIVERSAL_PIPELINE !== 'true') {
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

    const response = await fetch(`${settings.EXTRACTOR_SERVICE_URL}`, {
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

    // LLM pre-process: restructure into clean Markdown using GPT-5 (or configured model)
    const similarityThreshold = parseFloat(settings.SIMILARITY_THRESHOLD) || 0.99;
    const llmModelRaw = settings.LLM_PROVIDER || 'openai:gpt-5';
    const llmModelBase = llmModelRaw.includes(':') ? llmModelRaw.split(':')[1] : llmModelRaw;
    const llmModel = /^gpt-5/i.test(llmModelBase) ? 'gpt-4.1-2025-04-14' : llmModelBase;
    await supabase.from('kb_processing_logs').insert({
      file_id: fileId,
      stage: 'LLM_PREPROCESS',
      message: 'Starting LLM structuring of extracted content',
      metadata: { provider: 'openai', model: llmModel, original_text_length: extractionResult.original_text?.length || 0 }
    });

    // Call OpenAI Chat Completions to produce structured Markdown
    const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: llmModel,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: [
              'Você é um especialista sênior em normalização documental.',
              'Tarefa: Receber um texto bruto extraído de um documento e produzir um Markdown limpo, fiel e estruturado, pronto para indexação em base de conhecimento.',
              'Regras:',
              '- Não invente conteúdo; preserve 100% da informação factual.',
              '- Use títulos e subtítulos (H1..H4) claros; mantenha ordem lógica.',
              '- Converta listas e tabelas para formatos markdown quando possível.',
              '- Preserve citações, números, medições, nomes próprios e datas.',
              '- Não inclua explicações; responda com APENAS o conteúdo em Markdown.',
            ].join('\n')
          },
          {
            role: 'user',
            content: `Texto bruto extraído:\n\n${extractionResult.original_text || extractionResult.markdown || ''}`
          }
        ]
      })
    });

    if (!llmResponse.ok) {
      throw new Error(`OpenAI LLM preprocessing error: ${llmResponse.status}`);
    }
    const llmData = await llmResponse.json();
    const structuredMarkdown: string = llmData.choices?.[0]?.message?.content || '';

    await supabase.from('kb_processing_logs').insert({
      file_id: fileId,
      stage: 'LLM_STRUCTURED',
      message: 'LLM produced structured Markdown',
      metadata: { markdown_length: structuredMarkdown.length }
    });

    // Persist pre-processed document in KB (step 4)
    await supabase
      .from('knowledge_base')
      .update({ markdown_content: structuredMarkdown })
      .eq('id', fileId);

    // Similarity calculation (original vs structured markdown)
    function normalizeText(t: string): string {
      return (t || '')
        .toLowerCase()
        .replace(/[#*_`>\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    function levenshtein(a: string, b: string): number {
      const m = a.length, n = b.length;
      if (m === 0) return n;
      if (n === 0) return m;
      const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + cost
          );
        }
      }
      return dp[m][n];
    }
    function cosineTFIDF(a: string, b: string): number {
      const A = normalizeText(a).split(' ');
      const B = normalizeText(b).split(' ');
      const vocab = new Map<string, { tfA: number; tfB: number; df: number }>();
      for (const w of A) {
        const e = vocab.get(w) || { tfA: 0, tfB: 0, df: 0 };
        e.tfA++; e.df = 1; vocab.set(w, e);
      }
      for (const w of B) {
        const e = vocab.get(w) || { tfA: 0, tfB: 0, df: 0 };
        e.tfB++; e.df = e.df ? 2 : 1; vocab.set(w, e);
      }
      const N = 2;
      let dot = 0, na = 0, nb = 0;
      for (const [, e] of vocab) {
        const idf = Math.log((N + 1) / (e.df + 1)) + 1; // smoothed idf
        const wa = e.tfA * idf;
        const wb = e.tfB * idf;
        dot += wa * wb; na += wa * wa; nb += wb * wb;
      }
      if (!na || !nb) return 0;
      return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    const normOriginal = normalizeText(extractionResult.original_text || '');
    const normStructured = normalizeText(structuredMarkdown);
    const levSim = 1 - (levenshtein(normOriginal, normStructured) / Math.max(normOriginal.length || 1, normStructured.length || 1));
    const cosSim = cosineTFIDF(normOriginal, normStructured);
    const finalSimilarity = 0.6 * levSim + 0.4 * cosSim;

    // Validate similarity with detailed logs and suggestions
    if (finalSimilarity < similarityThreshold) {
      const suggestions = [
        'Revise a configuração do extrator (OCR/idioma).',
        'Ajuste o prompt da LLM para reforçar fidelidade literal.',
        'Verifique se há tabelas/figuras complexas exigindo pós-processamento.',
      ];

      await supabase.from('kb_processing_logs').insert({
        file_id: fileId,
        stage: 'VALIDATED',
        message: 'Document rejected - similarity below threshold after LLM preprocessing',
        metadata: { similarity_score: finalSimilarity, threshold: similarityThreshold, levSim, cosSim, suggestions }
      });

      await supabase
        .from('knowledge_base')
        .update({
          status: 'error',
          similarity_score: finalSimilarity,
          validation_errors: suggestions,
          processing_logs: { error: 'Similarity below threshold after LLM', similarity: finalSimilarity }
        })
        .eq('id', fileId);

      return new Response(JSON.stringify({
        success: false,
        message: `Similarity too low: ${finalSimilarity} < ${similarityThreshold}`
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Approved
    await supabase.from('kb_processing_logs').insert({
      file_id: fileId,
      stage: 'VALIDATED',
      message: 'Document approved - similarity above threshold after LLM preprocessing',
      metadata: { similarity_score: finalSimilarity, threshold: similarityThreshold }
    });

    // Generate chunks from structured Markdown with metadata
    const chunkSize = parseInt(settings.CHUNK_SIZE) || 1000;
    const overlap = parseInt(settings.CHUNK_OVERLAP) || 200;

    const chunks: string[] = [];
    let start = 0;
    const text = structuredMarkdown;
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
    const embedModelRaw = settings.EMBEDDING_PROVIDER || 'openai:text-embedding-3-large';
    const embedModel = embedModelRaw.includes(':') ? embedModelRaw.split(':')[1] : embedModelRaw;
    const chunksWithEmbeddings = await Promise.all(chunks.map(async (chunk, index) => {
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: embedModel,
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
        embedding: embedding,
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
        embedding_model: embedModel,
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
        final_similarity: finalSimilarity,
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
        markdown_content: structuredMarkdown,
        similarity_score: finalSimilarity,
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
      similarity: finalSimilarity,
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