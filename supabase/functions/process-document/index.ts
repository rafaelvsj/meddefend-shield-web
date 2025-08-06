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
    console.log(`[process-document] Iniciando extração de texto. Tipo: ${fileType}, Tamanho: ${fileBuffer.byteLength} bytes`);
    
    try {
      let text: string;
      
      switch (fileType.toLowerCase()) {
        case 'application/pdf':
        case 'pdf':
          text = await this.extractFromPDF(fileBuffer);
          break;
          
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'docx':
          text = await this.extractFromDOCX(fileBuffer);
          break;
          
        case 'text/plain':
        case 'txt':
          text = new TextDecoder().decode(fileBuffer);
          break;
          
        case 'text/html':
        case 'html':
          text = this.stripHTML(new TextDecoder().decode(fileBuffer));
          break;
          
        default:
          console.log(`[process-document] Tipo não suportado, tentando extrair como texto plano: ${fileType}`);
          text = new TextDecoder().decode(fileBuffer);
          if (text.length === 0) {
            throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
          }
      }

      console.log(`[process-document] Texto extraído com sucesso. Caracteres: ${text.length}`);
      return text;
    } catch (error) {
      console.error(`[process-document] Erro na extração de texto:`, error);
      throw new Error(`Falha na extração de texto: ${(error as Error).message}`);
    }
  }

  private async extractFromPDF(buffer: ArrayBuffer): Promise<string> {
    console.log(`[process-document] Processando PDF de ${buffer.byteLength} bytes`);
    
    try {
      const uint8Array = new Uint8Array(buffer);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      
      // Método básico de extração de PDF - procurar por texto legível
      const readableChars = /[\x20-\x7E\s]/g;
      const matches = text.match(readableChars);
      
      if (matches && matches.length > 100) {
        const extractedText = matches.join('').replace(/\s+/g, ' ').trim();
        
        if (extractedText.length > 50) {
          console.log(`[process-document] PDF processado: ${extractedText.length} caracteres extraídos`);
          return extractedText;
        }
      }
      
      // Fallback: tentar método alternativo
      const lines = text.split('\n').filter(line => {
        const cleanLine = line.replace(/[^\x20-\x7E]/g, '').trim();
        return cleanLine.length > 5 && cleanLine.match(/[a-zA-Z]/);
      });
      
      if (lines.length > 0) {
        const result = lines.join(' ').replace(/\s+/g, ' ').trim();
        console.log(`[process-document] PDF processado (método alternativo): ${result.length} caracteres`);
        return result;
      }
      
      throw new Error('Não foi possível extrair texto legível do PDF');
    } catch (error) {
      console.error(`[process-document] Erro no processamento de PDF:`, error);
      throw new Error(`Falha ao processar PDF: ${(error as Error).message}`);
    }
  }

  private async extractFromDOCX(buffer: ArrayBuffer): Promise<string> {
    console.log(`[process-document] Processando DOCX de ${buffer.byteLength} bytes`);
    
    try {
      const uint8Array = new Uint8Array(buffer);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      
      // Buscar padrões XML típicos de DOCX
      const xmlTextPattern = /<w:t[^>]*>([^<]+)<\/w:t>/g;
      const matches = [...text.matchAll(xmlTextPattern)];
      
      if (matches.length > 0) {
        const extractedText = matches
          .map(match => match[1])
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
          
        if (extractedText.length > 10) {
          console.log(`[process-document] DOCX processado: ${extractedText.length} caracteres extraídos`);
          return extractedText;
        }
      }
      
      // Método alternativo: buscar texto legível
      const readableText = text
        .replace(/[^\x20-\x7E\n\r]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      if (readableText.length > 50) {
        console.log(`[process-document] DOCX processado (método alternativo): ${readableText.length} caracteres`);
        return readableText;
      }
      
      throw new Error('Não foi possível extrair texto do DOCX');
    } catch (error) {
      console.error(`[process-document] Erro no processamento de DOCX:`, error);
      throw new Error(`Falha ao processar DOCX: ${(error as Error).message}`);
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
    console.log(`[process-document] Dividindo texto em chunks. Tamanho: ${text.length} chars, chunk size: ${chunkSize}`);
    
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      const sentenceWithPeriod = sentence.trim() + '.';
      
      if ((currentChunk + sentenceWithPeriod).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentenceWithPeriod;
      } else {
        currentChunk += (currentChunk.length > 0 ? ' ' : '') + sentenceWithPeriod;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    console.log(`[process-document] Texto dividido em ${chunks.length} chunks`);
    return chunks;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      console.error('[process-document] GEMINI_API_KEY não configurada');
      throw new Error('GEMINI_API_KEY não configurada');
    }

    console.log(`[process-document] Gerando embedding para texto de ${text.length} caracteres`);
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[process-document] Erro da API Gemini (${response.status}):`, errorText);
        throw new Error(`Erro da API Gemini: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const embedding = data.embedding?.values || [];
      
      if (embedding.length === 0) {
        console.error('[process-document] Embedding vazio retornado da API');
        throw new Error('Embedding vazio retornado da API');
      }
      
      console.log(`[process-document] Embedding gerado com ${embedding.length} dimensões`);
      return embedding;
    } catch (error) {
      console.error('[process-document] Erro ao gerar embedding:', error);
      throw error;
    }
  }

  async processDocument(fileBuffer: ArrayBuffer, fileName: string, fileType: string): Promise<DocumentChunk[]> {
    console.log(`[process-document] Iniciando processamento do documento: ${fileName}`);
    
    // Extrair texto do documento
    const text = await this.extractTextFromFile(fileBuffer, fileType);
    
    if (!text || text.length < 10) {
      throw new Error('Texto extraído muito pequeno ou vazio');
    }
    
    // Dividir em chunks
    const chunks = this.chunkText(text);
    
    if (chunks.length === 0) {
      throw new Error('Não foi possível dividir o texto em chunks');
    }
    
    // Gerar embeddings para cada chunk
    const documentChunks: DocumentChunk[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`[process-document] Processando chunk ${i + 1}/${chunks.length}`);
      
      try {
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
      } catch (error) {
        console.error(`[process-document] Erro ao processar chunk ${i}:`, error);
        // Continua com os outros chunks em caso de erro
      }
    }

    if (documentChunks.length === 0) {
      throw new Error('Nenhum chunk foi processado com sucesso');
    }

    console.log(`[process-document] Documento processado: ${documentChunks.length}/${chunks.length} chunks com embeddings`);
    return documentChunks;
  }
}

serve(async (req) => {
  console.log(`[process-document] Recebida requisição: ${req.method}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { fileId } = body;
    
    console.log(`[process-document] Processando arquivo ID: ${fileId}`);

    if (!fileId) {
      throw new Error('fileId é obrigatório');
    }

    // Buscar arquivo na base de conhecimento
    console.log('[process-document] Buscando arquivo na tabela knowledge_base');
    const { data: file, error } = await supabaseClient
      .from('knowledge_base')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) {
      console.error('[process-document] Erro ao buscar arquivo:', error);
      throw new Error(`Arquivo não encontrado: ${error.message}`);
    }
    
    if (!file) {
      console.error('[process-document] Arquivo não encontrado na base de dados');
      throw new Error('Arquivo não encontrado na base de dados');
    }

    console.log(`[process-document] Arquivo encontrado: ${file.original_name} (${file.file_type})`);

    // Atualizar status para "processing"
    const { error: statusError } = await supabaseClient
      .from('knowledge_base')
      .update({ status: 'processing' })
      .eq('id', fileId);

    if (statusError) {
      console.warn('[process-document] Aviso: não foi possível atualizar status para processing:', statusError);
    }

    // Download do arquivo do storage
    console.log(`[process-document] Fazendo download do arquivo: ${file.file_name}`);
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('knowledge-base')
      .download(file.file_name);

    if (downloadError) {
      console.error('[process-document] Erro ao baixar arquivo do storage:', downloadError);
      throw new Error(`Erro ao baixar arquivo: ${downloadError.message}`);
    }
    
    if (!fileData) {
      console.error('[process-document] Dados do arquivo são nulos');
      throw new Error('Dados do arquivo são nulos');
    }

    console.log(`[process-document] Arquivo baixado com sucesso. Tamanho: ${fileData.size} bytes`);

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
    console.log(`[process-document] Salvando ${chunks.length} chunks no banco de dados`);
    const chunkInserts = chunks.map(chunk => ({
      knowledge_base_id: fileId,
      content: chunk.content,
      embedding: `[${chunk.embedding.join(',')}]`, // Converter array para string no formato PostgreSQL
      chunk_index: chunk.metadata.chunk_index,
      chunk_size: chunk.metadata.chunk_size
    }));

    const { error: chunksError } = await supabaseClient
      .from('document_chunks')
      .insert(chunkInserts);

    if (chunksError) {
      console.error('[process-document] Erro ao salvar chunks:', chunksError);
      // Não falha completamente, mas registra o erro
    } else {
      console.log('[process-document] Chunks salvos com sucesso');
    }
    
    // Atualizar arquivo com conteúdo processado
    console.log('[process-document] Atualizando status do arquivo para "processed"');
    const { error: updateError } = await supabaseClient
      .from('knowledge_base')
      .update({
        content: processedContent,
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', fileId);

    if (updateError) {
      console.error('[process-document] Erro ao atualizar arquivo:', updateError);
      throw new Error(`Erro ao atualizar arquivo: ${updateError.message}`);
    }

    console.log(`[process-document] Documento processado com sucesso: ${chunks.length} chunks gerados, ${processedContent.length} caracteres`);

    return new Response(JSON.stringify({ 
      success: true,
      chunks_generated: chunks.length,
      content_length: processedContent.length,
      message: 'Documento processado com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[process-document] Erro fatal:', error);
    
    // Tentar atualizar status para erro se possível
    try {
      const body = await req.clone().json();
      const { fileId } = body;
      
      if (fileId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabaseClient
          .from('knowledge_base')
          .update({ status: 'error' })
          .eq('id', fileId);
      }
    } catch (updateError) {
      console.error('[process-document] Erro ao atualizar status de erro:', updateError);
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});