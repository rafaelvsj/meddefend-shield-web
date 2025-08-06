import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Enhanced PDF parsing with multiple fallback strategies
class EnhancedPDFExtractor {
  static async extractText(buffer: ArrayBuffer, fileName: string): Promise<{
    text: string;
    quality: number;
    method: string;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    
    try {
      // Method 1: Try pdf-parse (most reliable)
      const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
      console.log(`[PDFExtractor] Tentando pdf-parse para ${fileName}`);
      
      const data = await pdfParse.default(new Uint8Array(buffer));
      const text = data.text || '';
      
      if (this.isValidText(text)) {
        const quality = this.calculateTextQuality(text);
        console.log(`[PDFExtractor] pdf-parse sucesso - Qualidade: ${quality}`);
        return {
          text: this.cleanText(text),
          quality,
          method: 'pdf-parse',
          warnings
        };
      } else {
        warnings.push('pdf-parse retornou texto de baixa qualidade');
      }
    } catch (error) {
      console.warn(`[PDFExtractor] pdf-parse falhou:`, error);
      warnings.push(`pdf-parse falhou: ${error.message}`);
    }

    try {
      // Method 2: Try basic text extraction
      console.log(`[PDFExtractor] Tentando extração básica para ${fileName}`);
      const text = await this.basicTextExtraction(buffer);
      
      if (this.isValidText(text)) {
        const quality = this.calculateTextQuality(text);
        console.log(`[PDFExtractor] Extração básica sucesso - Qualidade: ${quality}`);
        return {
          text: this.cleanText(text),
          quality,
          method: 'basic',
          warnings
        };
      } else {
        warnings.push('Extração básica retornou texto de baixa qualidade');
      }
    } catch (error) {
      console.warn(`[PDFExtractor] Extração básica falhou:`, error);
      warnings.push(`Extração básica falhou: ${error.message}`);
    }

    // If all methods fail, return structured error
    throw new Error(`Falha em todos os métodos de extração. Warnings: ${warnings.join('; ')}`);
  }

  private static async basicTextExtraction(buffer: ArrayBuffer): Promise<string> {
    const text = new TextDecoder().decode(buffer);
    
    // Extract text between stream/endstream markers
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    const textParts: string[] = [];
    let match;
    
    while ((match = streamRegex.exec(text)) !== null) {
      const streamContent = match[1];
      if (streamContent && !this.isBinaryContent(streamContent)) {
        textParts.push(streamContent);
      }
    }
    
    return textParts.join(' ').trim();
  }

  private static isValidText(text: string): boolean {
    if (!text || text.length < 10) return false;
    
    // Check for PDF garbage patterns
    const garbagePatterns = [
      /%PDF-/,
      /endobj/,
      /startxref/,
      /xref/,
      /trailer/,
      /^\s*\d+\s+\d+\s+obj/m,
      /<<\s*\/[A-Z]/
    ];
    
    const garbageCount = garbagePatterns.reduce((count, pattern) => {
      return count + (pattern.test(text) ? 1 : 0);
    }, 0);
    
    // If more than 2 garbage patterns found, consider invalid
    if (garbageCount > 2) {
      console.warn(`[PDFExtractor] Texto contém ${garbageCount} padrões de lixo PDF`);
      return false;
    }
    
    // Check text quality - should have reasonable word/char ratio
    const wordCount = text.split(/\s+/).filter(word => word.length > 1).length;
    const charCount = text.length;
    const ratio = wordCount / charCount;
    
    return ratio > 0.05; // At least 5% should be words
  }

  private static calculateTextQuality(text: string): number {
    const totalChars = text.length;
    if (totalChars === 0) return 0;
    
    // Count readable characters
    const readableChars = text.match(/[a-zA-ZÀ-ÿ0-9\s.,;:!?()-]/g)?.length || 0;
    const readabilityScore = readableChars / totalChars;
    
    // Count words vs total characters
    const words = text.split(/\s+/).filter(word => /^[a-zA-ZÀ-ÿ]/.test(word));
    const wordScore = Math.min(words.length / 100, 1); // Normalize to max 1
    
    // Penalty for PDF artifacts
    const artifactPenalty = this.countPDFArtifacts(text) * 0.1;
    
    const finalScore = Math.max(0, Math.min(1, (readabilityScore * 0.7 + wordScore * 0.3 - artifactPenalty)));
    
    return Math.round(finalScore * 100) / 100;
  }

  private static countPDFArtifacts(text: string): number {
    const artifacts = [
      /obj\s*$/gm,
      /endobj/g,
      /stream/g,
      /endstream/g,
      /%PDF/g,
      /xref/g,
      /trailer/g
    ];
    
    return artifacts.reduce((count, pattern) => {
      return count + (text.match(pattern)?.length || 0);
    }, 0);
  }

  private static isBinaryContent(content: string): boolean {
    // Check for high percentage of non-printable characters
    const nonPrintable = content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g)?.length || 0;
    return (nonPrintable / content.length) > 0.3;
  }

  private static cleanText(text: string): string {
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ') // Remove control chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizedContent {
  original_text: string;
  optimized_markdown: string;
  structure_summary: string;
  completeness_score: number;
  optimization_notes: string[];
}

interface DocumentChunk {
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    chunk_index: number;
    chunk_size: number;
    file_type: string;
    section?: string;
    optimization_type: string;
  };
}

class ContentOptimizer {
  private geminiApiKey: string;

  constructor(apiKey: string) {
    this.geminiApiKey = apiKey;
  }

  async optimizeContent(originalText: string, fileType: string, fileName: string): Promise<OptimizedContent> {
    console.log(`[ContentOptimizer] Iniciando otimização para ${fileName} (${fileType})`);
    
    try {
      const optimizationPrompt = this.buildOptimizationPrompt(originalText, fileType);
      
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + this.geminiApiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: optimizationPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const optimizedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!optimizedText) {
        throw new Error('Resposta vazia da API Gemini');
      }

      // Extrair markdown otimizado da resposta
      const markdownMatch = optimizedText.match(/```markdown\n([\s\S]*?)\n```/);
      const optimizedMarkdown = markdownMatch ? markdownMatch[1] : optimizedText;

      // Calcular score de completude
      const completenessScore = this.calculateCompletenessScore(originalText, optimizedMarkdown);
      
      console.log(`[ContentOptimizer] Otimização concluída. Score: ${completenessScore}`);

      return {
        original_text: originalText,
        optimized_markdown: optimizedMarkdown,
        structure_summary: this.generateStructureSummary(optimizedMarkdown),
        completeness_score: completenessScore,
        optimization_notes: this.generateOptimizationNotes(originalText, optimizedMarkdown)
      };

    } catch (error) {
      console.error(`[ContentOptimizer] Erro na otimização:`, error);
      
      // Fallback: estruturação básica
      return {
        original_text: originalText,
        optimized_markdown: this.basicMarkdownConversion(originalText, fileName),
        structure_summary: "Conversão básica realizada devido a erro na otimização",
        completeness_score: 0.8,
        optimization_notes: [`Erro na otimização avançada: ${error.message}`, "Aplicada conversão básica"]
      };
    }
  }

  private buildOptimizationPrompt(text: string, fileType: string): string {
    const maxChars = 50000; // Limitar tamanho do prompt
    const textSample = text.length > maxChars ? text.substring(0, maxChars) + "..." : text;
    
    return `Você é um especialista em estruturação de documentos para bases de conhecimento médicas. 

TAREFA: Otimize o seguinte texto de um documento ${fileType} para uma base de conhecimento, estruturando-o em markdown de forma clara e organizada.

DIRETRIZES:
1. Mantenha TODO o conteúdo informativo original
2. Estruture com cabeçalhos hierárquicos (# ## ###)
3. Organize informações em listas quando apropriado
4. Destaque termos médicos importantes
5. Crie seções lógicas e coerentes
6. Remova formatações desnecessárias mas preserve significado
7. Adicione separadores visuais quando necessário

TEXTO ORIGINAL:
${textSample}

RESPOSTA ESPERADA:
Forneça apenas o markdown otimizado, começando com:
\`\`\`markdown
[SEU MARKDOWN AQUI]
\`\`\``;
  }

  private calculateCompletenessScore(original: string, optimized: string): number {
    // Métricas básicas de completude
    const originalWords = original.split(/\s+/).length;
    const optimizedWords = optimized.split(/\s+/).length;
    
    // Score baseado na preservação do conteúdo
    const wordRatio = Math.min(optimizedWords / originalWords, 1);
    const structureBonus = optimized.includes('#') ? 0.1 : 0;
    const listBonus = optimized.includes('-') || optimized.includes('*') ? 0.05 : 0;
    
    return Math.min(0.6 + (wordRatio * 0.3) + structureBonus + listBonus, 1);
  }

  private generateStructureSummary(markdown: string): string {
    const headers = markdown.match(/^#+\s.+$/gm) || [];
    const lists = markdown.match(/^\s*[\*\-]\s/gm) || [];
    
    return `Estrutura: ${headers.length} cabeçalhos, ${lists.length} itens de lista, ${markdown.split('\n').length} linhas`;
  }

  private generateOptimizationNotes(original: string, optimized: string): string[] {
    const notes = [];
    
    if (optimized.includes('#')) notes.push("Adicionada estrutura hierárquica");
    if (optimized.includes('**')) notes.push("Destacados termos importantes");
    if (optimized.includes('-') || optimized.includes('*')) notes.push("Organizadas listas estruturadas");
    if (optimized.length < original.length * 0.5) notes.push("Conteúdo significativamente reduzido");
    if (optimized.length > original.length * 1.2) notes.push("Conteúdo expandido com estrutura");
    
    return notes.length > 0 ? notes : ["Otimização básica aplicada"];
  }

  private basicMarkdownConversion(text: string, fileName: string): string {
    // Conversão básica em caso de falha da IA
    const lines = text.split('\n');
    let markdown = `# ${fileName}\n\n`;
    
    let currentSection = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        markdown += '\n';
        continue;
      }
      
      // Detectar possíveis cabeçalhos
      if (trimmed.length < 80 && !trimmed.includes('.') && trimmed.match(/^[A-Z]/)) {
        markdown += `\n## ${trimmed}\n\n`;
      } else {
        markdown += `${trimmed}\n`;
      }
    }
    
    return markdown;
  }
}

class EmbeddingGenerator {
  private geminiApiKey: string;
  private rateLimitDelay = 100; // ms entre requests

  constructor(apiKey: string) {
    this.geminiApiKey = apiKey;
  }

  async generateEmbedding(text: string, retries = 3): Promise<number[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.delay(this.rateLimitDelay);
        
        console.log(`[EmbeddingGenerator] Gerando embedding para texto de ${text.length} caracteres (tentativa ${attempt})`);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: {
              parts: [{ text: text }]
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        const embedding = result.embedding?.values;
        
        if (!embedding || !Array.isArray(embedding)) {
          throw new Error('Resposta inválida da API de embedding');
        }

        console.log(`[EmbeddingGenerator] Embedding gerado com ${embedding.length} dimensões`);
        return embedding;
        
      } catch (error) {
        console.error(`[EmbeddingGenerator] Erro na tentativa ${attempt}:`, error);
        
        if (attempt === retries) {
          throw new Error(`Falha ao gerar embedding após ${retries} tentativas: ${error.message}`);
        }
        
        // Exponential backoff
        await this.delay(1000 * Math.pow(2, attempt));
      }
    }
    
    throw new Error('Máximo de tentativas excedido');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class TextChunker {
  static chunkOptimizedContent(optimizedMarkdown: string, chunkSize = 800, overlap = 200): string[] {
    const sections = optimizedMarkdown.split(/(?=^#+ )/gm).filter(s => s.trim());
    const chunks: string[] = [];
    
    for (const section of sections) {
      if (section.length <= chunkSize) {
        chunks.push(section.trim());
      } else {
        // Chunkar seções grandes preservando estrutura
        const lines = section.split('\n');
        let currentChunk = '';
        
        for (const line of lines) {
          if ((currentChunk + line).length > chunkSize && currentChunk) {
            chunks.push(currentChunk.trim());
            
            // Overlap: manter últimas linhas
            const overlapLines = currentChunk.split('\n').slice(-3);
            currentChunk = overlapLines.join('\n') + '\n' + line;
          } else {
            currentChunk += (currentChunk ? '\n' : '') + line;
          }
        }
        
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
      }
    }
    
    return chunks.filter(chunk => chunk.length > 50); // Filtrar chunks muito pequenos
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
      throw new Error('Variáveis de ambiente necessárias não encontradas');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { fileId } = await req.json();

    if (!fileId) {
      throw new Error('fileId é obrigatório');
    }

    console.log(`[process-document-optimized] Processando arquivo: ${fileId}`);

    // Buscar arquivo na base de conhecimento
    const { data: kbFile, error: kbError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', fileId)
      .single();

    if (kbError || !kbFile) {
      throw new Error(`Arquivo não encontrado: ${kbError?.message}`);
    }

    // Atualizar status para processing
    await supabase
      .from('knowledge_base')
      .update({ status: 'processing' })
      .eq('id', fileId);

    // Baixar arquivo do storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from('knowledge-base')
      .download(kbFile.file_name);

    if (storageError || !fileData) {
      throw new Error(`Falha ao baixar arquivo: ${storageError?.message}`);
    }

    // Converter para texto (implementação básica)
    const fileBuffer = await fileData.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const originalText = decoder.decode(fileBuffer);

    if (!originalText || originalText.length < 10) {
      throw new Error('Arquivo vazio ou muito pequeno');
    }

    console.log(`[process-document-optimized] Texto extraído: ${originalText.length} caracteres`);

    // Otimizar conteúdo
    const optimizer = new ContentOptimizer(geminiApiKey);
    const optimizedContent = await optimizer.optimizeContent(
      originalText, 
      kbFile.file_type, 
      kbFile.original_name
    );

    console.log(`[process-document-optimized] Conteúdo otimizado. Score: ${optimizedContent.completeness_score}`);

    // Chunkar conteúdo otimizado
    const chunks = TextChunker.chunkOptimizedContent(optimizedContent.optimized_markdown);
    console.log(`[process-document-optimized] Criados ${chunks.length} chunks`);

    // Gerar embeddings
    const embeddingGenerator = new EmbeddingGenerator(geminiApiKey);
    const documentChunks: DocumentChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[process-document-optimized] Processando chunk ${i + 1}/${chunks.length}`);
      
      try {
        const embedding = await embeddingGenerator.generateEmbedding(chunk);
        
        documentChunks.push({
          content: chunk,
          embedding,
          metadata: {
            source: kbFile.original_name,
            chunk_index: i,
            chunk_size: chunk.length,
            file_type: kbFile.file_type,
            section: chunk.match(/^#+\s(.+)$/m)?.[1] || `Chunk ${i + 1}`,
            optimization_type: 'markdown_structured'
          }
        });
      } catch (error) {
        console.error(`[process-document-optimized] Erro no chunk ${i + 1}:`, error);
        // Continuar com próximo chunk
      }
    }

    if (documentChunks.length === 0) {
      throw new Error('Nenhum chunk válido foi gerado');
    }

    // Salvar chunks no banco
    const chunksToInsert = documentChunks.map(chunk => ({
      knowledge_base_id: fileId,
      content: chunk.content,
      embedding: `[${chunk.embedding.join(',')}]`,
      chunk_index: chunk.metadata.chunk_index,
      chunk_size: chunk.metadata.chunk_size,
      metadata: chunk.metadata
    }));

    const { error: insertError } = await supabase
      .from('document_chunks')
      .insert(chunksToInsert);

    if (insertError) {
      throw new Error(`Erro ao inserir chunks: ${insertError.message}`);
    }

    // Atualizar arquivo com conteúdo otimizado
    await supabase
      .from('knowledge_base')
      .update({
        status: 'processed',
        content: optimizedContent.optimized_markdown,
        processed_at: new Date().toISOString(),
        metadata: {
          original_size: originalText.length,
          optimized_size: optimizedContent.optimized_markdown.length,
          completeness_score: optimizedContent.completeness_score,
          chunks_generated: documentChunks.length,
          optimization_notes: optimizedContent.optimization_notes,
          structure_summary: optimizedContent.structure_summary
        }
      })
      .eq('id', fileId);

    console.log(`[process-document-optimized] Processamento concluído: ${documentChunks.length} chunks salvos`);

    return new Response(JSON.stringify({
      success: true,
      chunks_processed: documentChunks.length,
      completeness_score: optimizedContent.completeness_score,
      optimization_notes: optimizedContent.optimization_notes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[process-document-optimized] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});