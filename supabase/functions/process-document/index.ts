import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentChunk {
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    chunk_index: number;
    chunk_size: number;
  };
}

class DocumentProcessor {
  private async extractTextFromFile(fileBuffer: ArrayBuffer, fileType: string): Promise<string> {
    try {
      switch (fileType.toLowerCase()) {
        case 'application/pdf':
        case 'pdf':
          return await this.extractFromPDF(fileBuffer);
          
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'docx':
          return await this.extractFromDOCX(fileBuffer);
          
        case 'text/plain':
        case 'txt':
          return new TextDecoder().decode(fileBuffer);
          
        case 'text/html':
        case 'html':
          return this.stripHTML(new TextDecoder().decode(fileBuffer));
          
        default:
          // Try to extract as plain text
          const text = new TextDecoder().decode(fileBuffer);
          if (text.length > 0) return text;
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      throw new Error(`Text extraction failed: ${(error as Error).message}`);
    }
  }

  private async extractFromPDF(buffer: ArrayBuffer): Promise<string> {
    // Using a simplified PDF text extraction
    // In production, would use: https://deno.land/x/pdf_parser or similar
    try {
      const uint8Array = new Uint8Array(buffer);
      const text = new TextDecoder().decode(uint8Array);
      
      // Basic PDF text extraction - look for text between streams
      const textPattern = /stream\s*(.*?)\s*endstream/gs;
      const matches = text.match(textPattern);
      
      if (matches) {
        return matches
          .map(match => match.replace(/stream|endstream/g, '').trim())
          .filter(text => text.length > 0)
          .join('\n');
      }
      
      // Fallback: try to find readable text
      const readableText = text.replace(/[^\x20-\x7E\n\r]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      if (readableText.length < 50) {
        throw new Error('No readable text found in PDF');
      }
      
      return readableText;
    } catch (error) {
      throw new Error(`PDF extraction failed: ${(error as Error).message}`);
    }
  }

  private async extractFromDOCX(buffer: ArrayBuffer): Promise<string> {
    // Simplified DOCX extraction - in production would use mammoth.js equivalent
    try {
      const uint8Array = new Uint8Array(buffer);
      
      // DOCX is a ZIP file - we need to extract the document.xml
      // This is a simplified approach - in production use proper ZIP parsing
      const text = new TextDecoder().decode(uint8Array);
      
      // Look for XML text content patterns
      const xmlTextPattern = /<w:t[^>]*>([^<]+)<\/w:t>/g;
      const matches = [...text.matchAll(xmlTextPattern)];
      
      if (matches.length > 0) {
        return matches
          .map(match => match[1])
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      // Fallback: extract readable text
      const readableText = text.replace(/[^\x20-\x7E\n\r]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      if (readableText.length < 50) {
        throw new Error('No readable text found in DOCX');
      }
      
      return readableText;
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${(error as Error).message}`);
    }
  }

  private stripHTML(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private chunkText(text: string, chunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '.';
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] }
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding?.values || [];
  }

  async processDocument(fileBuffer: ArrayBuffer, fileName: string, fileType: string): Promise<DocumentChunk[]> {
    // Extrair texto do documento
    const text = await this.extractTextFromFile(fileBuffer, fileType);
    
    // Dividir em chunks
    const chunks = this.chunkText(text);
    
    // Gerar embeddings para cada chunk
    const documentChunks: DocumentChunk[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await this.generateEmbedding(chunks[i]);
      
      documentChunks.push({
        content: chunks[i],
        embedding,
        metadata: {
          source: fileName,
          chunk_index: i,
          chunk_size: chunks[i].length
        }
      });
    }

    return documentChunks;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { fileId } = await req.json();

    // Buscar arquivo na base de conhecimento
    const { data: file, error } = await supabaseClient
      .from('knowledge_base')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error || !file) {
      throw new Error('Arquivo não encontrado');
    }

    // Download do arquivo do storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('knowledge-base')
      .download(file.file_name);

    if (downloadError || !fileData) {
      throw new Error('Erro ao baixar arquivo do storage');
    }

    // Converter para ArrayBuffer
    const fileBuffer = await fileData.arrayBuffer();

    // Processar documento
    const processor = new DocumentProcessor();
    const chunks = await processor.processDocument(
      fileBuffer,
      file.original_name,
      file.file_type
    );

    // Preparar conteúdo processado
    const processedContent = chunks.map(chunk => chunk.content).join('\n\n');
    
    // Salvar chunks com embeddings no banco
    const chunkInserts = chunks.map(chunk => ({
      knowledge_base_id: fileId,
      content: chunk.content,
      embedding: chunk.embedding, // Use native vector type
      chunk_index: chunk.metadata.chunk_index,
      chunk_size: chunk.metadata.chunk_size
    }));

    const { error: chunksError } = await supabaseClient
      .from('document_chunks')
      .insert(chunkInserts);

    if (chunksError) {
      console.error('Error saving chunks:', chunksError);
    }
    
    // Atualizar arquivo com conteúdo processado
    const { error: updateError } = await supabaseClient
      .from('knowledge_base')
      .update({
        content: processedContent,
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', fileId);

    if (updateError) {
      throw new Error('Erro ao atualizar arquivo processado');
    }

    console.log(`Documento processado: ${chunks.length} chunks gerados`);

    return new Response(JSON.stringify({ 
      success: true,
      chunks_generated: chunks.length,
      content_length: processedContent.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-document:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});