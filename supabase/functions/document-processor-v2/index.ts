import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Universal Document Processor - Multi-format support with external extraction service
class UniversalDocumentProcessor {
  private supabase: any;
  private geminiApiKey: string;
  private extractorServiceUrl: string;
  private useUniversalPipeline: boolean;

  constructor(supabaseClient: any, geminiKey: string) {
    this.supabase = supabaseClient;
    this.geminiApiKey = geminiKey;
    this.extractorServiceUrl = Deno.env.get('EXTRACTOR_SERVICE_URL') || 'http://localhost:8000';
    this.useUniversalPipeline = Deno.env.get('USE_UNIVERSAL_PIPELINE') === 'true';
  }

  async logProcessingStep(fileId: string, stage: string, message: string, score?: number, metadata?: any) {
    await this.supabase.from('kb_processing_logs').insert({
      file_id: fileId,
      stage,
      message,
      score,
      metadata: metadata || {}
    });
  }

  async callExtractionService(buffer: ArrayBuffer, fileName: string): Promise<{
    text: string;
    markdown: string;
    similarity: number;
    extraction_method: string;
    ocr_used: boolean;
    mime_type: string;
  }> {
    console.log(`[EXTRACTOR-SERVICE] Calling extraction service for ${fileName}`);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      const blob = new Blob([buffer]);
      formData.append('file', blob, fileName);

      // Call extraction service
      const response = await fetch(`${this.extractorServiceUrl}/extract`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Extraction service failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Extraction service returned failure');
      }

      console.log(`[EXTRACTOR-SERVICE] Success: ${result.extraction_method}, similarity: ${result.similarity}`);
      
      return {
        text: result.original_text,
        markdown: result.markdown,
        similarity: result.similarity,
        extraction_method: result.extraction_method,
        ocr_used: result.ocr_used,
        mime_type: result.mime_type
      };
      
    } catch (error) {
      console.error(`[EXTRACTOR-SERVICE] Error: ${error.message}`);
      throw error;
    }
  }

  detectMimeType(fileName: string, buffer: ArrayBuffer): string {
    const uint8 = new Uint8Array(buffer);
    const ext = fileName.toLowerCase().split('.').pop();
    
    // Magic number detection
    if (uint8[0] === 0x25 && uint8[1] === 0x50 && uint8[2] === 0x44 && uint8[3] === 0x46) {
      return 'application/pdf';
    }
    if (uint8[0] === 0x50 && uint8[1] === 0x4B) { // PK zip signature
      if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (ext === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      if (ext === 'epub') return 'application/epub+zip';
    }
    if (uint8[0] === 0xFF && uint8[1] === 0xD8 && uint8[2] === 0xFF) {
      return 'image/jpeg';
    }
    if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) {
      return 'image/png';
    }

    // Fallback to extension
    const mimeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'html': 'text/html',
      'htm': 'text/html',
      'rtf': 'application/rtf',
      'epub': 'application/epub+zip',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'tiff': 'image/tiff',
      'bmp': 'image/bmp'
    };

    return mimeMap[ext || ''] || 'application/octet-stream';
  }

  async extractTextFallback(buffer: ArrayBuffer, fileName: string, mimeType: string): Promise<{
    text: string;
    method: string;
    ocr_used: boolean;
  }> {
    console.log(`[FALLBACK] Using fallback extraction for ${fileName} as ${mimeType}`);

    try {
      if (mimeType === 'text/html') {
        const decoder = new TextDecoder();
        const html = decoder.decode(buffer);
        
        // Simple HTML tag removal
        const textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        return { text: textContent, method: 'html-fallback', ocr_used: false };
      }
      
      if (mimeType === 'text/plain') {
        const decoder = new TextDecoder();
        const text = decoder.decode(buffer);
        return { text, method: 'plain-text-fallback', ocr_used: false };
      }
      
      throw new Error(`No fallback available for ${mimeType}`);
      
    } catch (error) {
      console.error(`[FALLBACK] Error processing ${mimeType}:`, error);
      throw error;
    }
  }

  convertToMarkdown(text: string, fileName: string): string {
    console.log("[MARKDOWN] Converting text to markdown format...");
    
    // Basic markdown conversion
    let markdown = text;
    
    // Add title from filename
    const title = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
    markdown = `# ${title}\n\n${markdown}`;
    
    // Basic structure detection and conversion
    markdown = markdown
      .replace(/^([A-Z][^.!?]*[.!?])\s*$/gm, '## $1') // Headers
      .replace(/^\s*[-*•]\s+(.+)$/gm, '- $1') // Lists
      .replace(/^\s*\d+\.\s+(.+)$/gm, '1. $1') // Numbered lists
      .replace(/\n{3,}/g, '\n\n') // Normalize spacing
      .trim();

    return markdown;
  }

  calculateSimilarity(originalText: string, markdownText: string): number {
    console.log("[SIMILARITY] Calculating text similarity...");
    
    // Normalize both texts for comparison
    const normalize = (text: string) => text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const orig = normalize(originalText);
    const md = normalize(markdownText.replace(/[#*`-]/g, '')); // Remove markdown syntax
    
    // Simple Levenshtein-based similarity
    const maxLen = Math.max(orig.length, md.length);
    if (maxLen === 0) return 1.0;
    
    const distance = this.levenshteinDistance(orig, md);
    const similarity = 1 - (distance / maxLen);
    
    console.log(`[SIMILARITY] Score: ${similarity.toFixed(4)} (${Math.round(similarity * 100)}%)`);
    return similarity;
  }

  levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  async generateEmbedding(text: string): Promise<number[]> {
    console.log("[EMBEDDING] Generating embedding via Gemini...");
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.geminiApiKey,
      },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text: text.slice(0, 30000) }] // Limit for embedding
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding?.values || [];
  }

  async chunkText(text: string, chunkSize = 800, overlap = 200): Promise<string[]> {
    console.log("[CHUNKING] Creating text chunks...");
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        
        // Add overlap
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 10));
        currentChunk = overlapWords.join(' ') + ' ' + sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    console.log(`[CHUNKING] Created ${chunks.length} chunks`);
    return chunks;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[PROCESSOR-V2] 🚀 Universal Document Processor Started");
    
    // Environment validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
      throw new Error('Missing required environment variables');
    }

    // Get request body
    const { fileId } = await req.json();
    if (!fileId) {
      throw new Error('fileId is required');
    }

    // Initialize clients
    const supabase = createClient(supabaseUrl, supabaseKey);
    const processor = new UniversalDocumentProcessor(supabase, geminiApiKey);

    console.log(`[PROCESSOR-V2] Processing file: ${fileId}`);
    await processor.logProcessingStep(fileId, 'STARTED', 'Universal processing initiated');

    // Get file metadata
    const { data: fileData, error: fileError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !fileData) {
      throw new Error(`File not found: ${fileError?.message}`);
    }

    await processor.logProcessingStep(fileId, 'METADATA', `File: ${fileData.original_name}, Size: ${fileData.file_size}`);

    // Update status to processing
    await supabase
      .from('knowledge_base')
      .update({ status: 'processing' })
      .eq('id', fileId);

    // Download file from storage
    const { data: fileBuffer, error: downloadError } = await supabase.storage
      .from('knowledge-base')
      .download(fileData.file_name);

    if (downloadError || !fileBuffer) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const buffer = await fileBuffer.arrayBuffer();
    await processor.logProcessingStep(fileId, 'DOWNLOADED', `Downloaded ${buffer.byteLength} bytes`);

    // Detect mime type
    const mimeType = processor.detectMimeType(fileData.original_name, buffer);
    console.log(`[PROCESSOR-V2] Detected mime type: ${mimeType}`);
    await processor.logProcessingStep(fileId, 'MIME_DETECTED', `Type: ${mimeType}`);

    // Extract text using external service or fallback
    let extractionResult;
    let markdownContent;
    let similarityScore;

    if (processor.useUniversalPipeline) {
      try {
        console.log("[PROCESSOR-V2] Using universal extraction service");
        const serviceResult = await processor.callExtractionService(buffer, fileData.original_name);
        
        extractionResult = {
          text: serviceResult.text,
          method: serviceResult.extraction_method,
          ocr_used: serviceResult.ocr_used
        };
        markdownContent = serviceResult.markdown;
        similarityScore = serviceResult.similarity;
        mimeType = serviceResult.mime_type; // Update with detected type
        
        await processor.logProcessingStep(fileId, 'EXTRACTED', `Method: ${extractionResult.method}, Chars: ${extractionResult.text.length}`, undefined, {
          method: extractionResult.method,
          ocr_used: extractionResult.ocr_used,
          char_count: extractionResult.text.length,
          service_used: 'external'
        });
      } catch (error) {
        console.warn("[PROCESSOR-V2] External service failed, using fallback:", error.message);
        await processor.logProcessingStep(fileId, 'SERVICE_FAILED', `External service error: ${error.message}`);
        
        // Use fallback extraction
        extractionResult = await processor.extractTextFallback(buffer, fileData.original_name, mimeType);
        markdownContent = processor.convertToMarkdown(extractionResult.text, fileData.original_name);
        similarityScore = processor.calculateSimilarity(extractionResult.text, markdownContent);
        
        await processor.logProcessingStep(fileId, 'FALLBACK_USED', `Fallback method: ${extractionResult.method}`);
      }
    } else {
      console.log("[PROCESSOR-V2] Using fallback extraction (universal pipeline disabled)");
      extractionResult = await processor.extractTextFallback(buffer, fileData.original_name, mimeType);
      markdownContent = processor.convertToMarkdown(extractionResult.text, fileData.original_name);
      similarityScore = processor.calculateSimilarity(extractionResult.text, markdownContent);
    }

    await processor.logProcessingStep(fileId, 'MARKDOWN', `Converted to markdown, Length: ${markdownContent.length}`);
    await processor.logProcessingStep(fileId, 'SIMILARITY', `Score: ${similarityScore.toFixed(4)}`, similarityScore);

    // Quality gate - require 99% similarity
    if (similarityScore < 0.99) {
      await processor.logProcessingStep(fileId, 'QUALITY_FAILED', `Low similarity: ${similarityScore.toFixed(4)} < 0.99`);
      
      await supabase
        .from('knowledge_base')
        .update({ 
          status: 'error',
          validation_errors: [`Low similarity score: ${similarityScore.toFixed(4)}`],
          similarity_score: similarityScore,
          mime_type: mimeType,
          extraction_method: extractionResult.method,
          ocr_used: extractionResult.ocr_used
        })
        .eq('id', fileId);

      return new Response(JSON.stringify({
        success: false,
        error: `Quality gate failed: similarity ${Math.round(similarityScore * 100)}% < 99%`
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate chunks
    const chunks = await processor.chunkText(markdownContent);
    await processor.logProcessingStep(fileId, 'CHUNKED', `Created ${chunks.length} chunks`);

    // Generate embeddings and save chunks
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await processor.generateEmbedding(chunks[i]);
      
      await supabase.from('document_chunks').insert({
        knowledge_base_id: fileId,
        content: chunks[i],
        embedding: embedding,
        chunk_index: i,
        chunk_size: chunks[i].length
      });
    }

    await processor.logProcessingStep(fileId, 'EMBEDDINGS', `Generated embeddings for ${chunks.length} chunks`);

    // Update final status
    await supabase
      .from('knowledge_base')
      .update({
        status: 'processed',
        content: extractionResult.text,
        markdown_content: markdownContent,
        processed_at: new Date().toISOString(),
        similarity_score: similarityScore,
        mime_type: mimeType,
        extraction_method: extractionResult.method,
        ocr_used: extractionResult.ocr_used,
        quality_score: similarityScore
      })
      .eq('id', fileId);

    await processor.logProcessingStep(fileId, 'COMPLETED', `Successfully processed with ${Math.round(similarityScore * 100)}% similarity`);

    console.log(`[PROCESSOR-V2] ✅ Successfully processed ${fileData.original_name}`);

    return new Response(JSON.stringify({
      success: true,
      fileId,
      mimeType,
      extractionMethod: extractionResult.method,
      ocrUsed: extractionResult.ocr_used,
      similarityScore,
      chunksCreated: chunks.length,
      textLength: extractionResult.text.length,
      markdownLength: markdownContent.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[PROCESSOR-V2] ❌ Critical Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});