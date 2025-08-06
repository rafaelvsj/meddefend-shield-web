import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// FASE 2: Sistema de extração completamente reconstruído
class EnhancedPDFExtractor {
  static async extractText(buffer: ArrayBuffer, fileName: string): Promise<{
    text: string;
    quality: number;
    method: string;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    
    try {
      // Method 1: PDF-Parse robusto (biblioteca especializada)
      console.log(`[PDFExtractor] Iniciando extração robusta para ${fileName}`);
      
      // Importar pdf-parse com configuração otimizada
      const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
      
      const options = {
        pagerender: (pageData: any) => {
          // Renderizar página preservando formatação
          return pageData.getTextContent().then((textContent: any) => {
            let lastY: number, text = '';
            
            for (let item of textContent.items) {
              if (lastY == item.transform[5] || !lastY) {
                text += item.str;
              } else {
                text += '\n' + item.str;
              }
              lastY = item.transform[5];
            }
            return text;
          });
        }
      };
      
      const data = await pdfParse.default(new Uint8Array(buffer), options);
      let extractedText = data.text || '';
      
      // Validação rigorosa do texto extraído
      const validationResult = this.validateExtractedText(extractedText, fileName);
      
      if (validationResult.isValid) {
        console.log(`[PDFExtractor] ✅ PDF-Parse SUCCESS - Score: ${validationResult.quality}`);
        return {
          text: this.cleanAndStructureText(extractedText),
          quality: validationResult.quality,
          method: 'pdf-parse-optimized',
          warnings: validationResult.warnings
        };
      } else {
        warnings.push(...validationResult.warnings);
        console.warn(`[PDFExtractor] ⚠️ PDF-Parse text failed validation: ${validationResult.warnings.join(', ')}`);
      }
      
    } catch (error) {
      console.error(`[PDFExtractor] ❌ PDF-Parse critical error:`, error);
      warnings.push(`PDF-Parse error: ${error.message}`);
    }

    try {
      // Method 2: Fallback avançado com análise de estrutura
      console.log(`[PDFExtractor] Tentando fallback avançado para ${fileName}`);
      
      const fallbackText = await this.advancedFallbackExtraction(buffer);
      const validationResult = this.validateExtractedText(fallbackText, fileName);
      
      if (validationResult.isValid) {
        console.log(`[PDFExtractor] ✅ Fallback SUCCESS - Score: ${validationResult.quality}`);
        return {
          text: this.cleanAndStructureText(fallbackText),
          quality: validationResult.quality,
          method: 'advanced-fallback',
          warnings: validationResult.warnings
        };
      } else {
        warnings.push(...validationResult.warnings);
      }
      
    } catch (error) {
      console.error(`[PDFExtractor] ❌ Fallback error:`, error);
      warnings.push(`Fallback error: ${error.message}`);
    }

    // Se todos os métodos falharam, retornar erro estruturado
    const errorMessage = `EXTRACTION COMPLETELY FAILED for ${fileName}. All methods exhausted.`;
    console.error(`[PDFExtractor] ❌ ${errorMessage}`);
    console.error(`[PDFExtractor] ❌ Warnings: ${warnings.join(' | ')}`);
    
    throw new Error(`${errorMessage} Warnings: ${warnings.join('; ')}`);
  }

  // FASE 2: Sistema de validação rigoroso
  private static validateExtractedText(text: string, fileName: string): {
    isValid: boolean;
    quality: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    if (!text || text.length < 50) {
      return {
        isValid: false,
        quality: 0,
        warnings: ['Texto muito curto ou vazio']
      };
    }
    
    // 1. Detectar padrões de código PDF (CRÍTICO)
    const pdfPatterns = [
      /%PDF-\d\.\d/,
      /\/Type\s*\/Page/,
      /endobj\s*$/m,
      /startxref/,
      /xref\s*\n\d+/,
      /trailer\s*<</,
      /stream\s*\n[\x00-\x08\x0B\x0C\x0E-\x1F]/,
      /<<\s*\/Filter/
    ];
    
    const pdfArtifactCount = pdfPatterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    if (pdfArtifactCount > 3) {
      warnings.push(`DETECTED ${pdfArtifactCount} PDF artifacts - TEXT IS CORRUPTED`);
      return {
        isValid: false,
        quality: 0,
        warnings
      };
    }
    
    // 2. Análise de densidade textual
    const words = text.split(/\s+/).filter(word => 
      word.length > 1 && 
      /^[a-zA-ZÀ-ÿ0-9]/.test(word) &&
      !/%[A-F0-9]{2}/.test(word) // Excluir escape sequences
    );
    
    const textDensity = words.length / text.length;
    
    if (textDensity < 0.03) {
      warnings.push(`Low text density: ${(textDensity * 100).toFixed(2)}%`);
      return {
        isValid: false,
        quality: 0.1,
        warnings
      };
    }
    
    // 3. Score de qualidade aprimorado
    const quality = this.calculateAdvancedQuality(text, words, pdfArtifactCount);
    
    if (quality < 0.7) {
      warnings.push(`Quality below threshold: ${quality.toFixed(2)}`);
      return {
        isValid: false,
        quality,
        warnings
      };
    }
    
    console.log(`[Validation] ✅ Text validation PASSED for ${fileName} - Quality: ${quality.toFixed(2)}`);
    return {
      isValid: true,
      quality,
      warnings
    };
  }

  private static calculateAdvancedQuality(text: string, words: string[], pdfArtifactCount: number): number {
    const totalChars = text.length;
    
    // 1. Readability score (caracteres legíveis)
    const readableChars = text.match(/[a-zA-ZÀ-ÿ0-9\s.,;:!?()%-]/g)?.length || 0;
    const readabilityScore = readableChars / totalChars;
    
    // 2. Word density score
    const wordDensity = words.length / totalChars;
    const wordScore = Math.min(wordDensity * 40, 1); // Normalizar
    
    // 3. Structure score (presença de estrutura textual)
    const hasStructure = /[.!?]\s+[A-Z]/.test(text) || // Sentences
                        /\n\n/.test(text) ||         // Paragraphs
                        /\d+\./.test(text);          // Lists
    const structureScore = hasStructure ? 0.1 : 0;
    
    // 4. Penalty for artifacts
    const artifactPenalty = Math.min(pdfArtifactCount * 0.15, 0.5);
    
    // 5. Binary content penalty
    const binaryContent = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g)?.length || 0;
    const binaryPenalty = Math.min((binaryContent / totalChars) * 2, 0.3);
    
    const finalScore = Math.max(0, Math.min(1, 
      readabilityScore * 0.4 + 
      wordScore * 0.4 + 
      structureScore - 
      artifactPenalty - 
      binaryPenalty
    ));
    
    return Math.round(finalScore * 100) / 100;
  }

  private static async advancedFallbackExtraction(buffer: ArrayBuffer): Promise<string> {
    console.log('[PDFExtractor] Executing advanced fallback extraction...');
    
    // Decodificar como UTF-8 com limpeza
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let rawText = decoder.decode(buffer);
    
    // Estratégia: extrair texto entre marcadores específicos
    const extractionStrategies = [
      // 1. Extrair de streams decodificados
      () => {
        const streamPattern = /stream\s*\n([\s\S]*?)\nendstream/g;
        const textParts: string[] = [];
        let match;
        
        while ((match = streamPattern.exec(rawText)) !== null) {
          const streamContent = match[1];
          // Filtrar apenas streams que parecem conter texto
          if (this.looksLikeText(streamContent)) {
            textParts.push(this.decodeStreamContent(streamContent));
          }
        }
        return textParts.join('\n');
      },
      
      // 2. Extrair usando padrões de texto comum
      () => {
        const textPattern = /\(([\s\S]*?)\)/g;
        const textParts: string[] = [];
        let match;
        
        while ((match = textPattern.exec(rawText)) !== null) {
          const content = match[1];
          if (content.length > 10 && this.looksLikeText(content)) {
            textParts.push(content);
          }
        }
        return textParts.join(' ');
      }
    ];
    
    // Tentar cada estratégia
    for (let i = 0; i < extractionStrategies.length; i++) {
      try {
        const extracted = extractionStrategies[i]();
        if (extracted && extracted.length > 100) {
          console.log(`[PDFExtractor] Strategy ${i + 1} extracted ${extracted.length} chars`);
          return extracted;
        }
      } catch (error) {
        console.warn(`[PDFExtractor] Strategy ${i + 1} failed:`, error);
      }
    }
    
    throw new Error('All fallback strategies failed');
  }

  private static looksLikeText(content: string): boolean {
    if (!content || content.length < 10) return false;
    
    // Verificar se tem caracteres de texto
    const textChars = content.match(/[a-zA-ZÀ-ÿ0-9\s]/g)?.length || 0;
    const ratio = textChars / content.length;
    
    return ratio > 0.7;
  }

  private static decodeStreamContent(streamContent: string): string {
    // Remover caracteres de controle e decodificar escape sequences básicas
    return streamContent
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\(.)/g, '$1')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
  }

  private static cleanAndStructureText(text: string): string {
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g, ' ') // Remove control chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n\n') // Preserve paragraph breaks
      .trim();
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

  console.log('[process-document-optimized] 🚀 PIPELINE REESTRUTURADO INICIADO');
  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
      throw new Error('❌ Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { fileId } = await req.json();

    if (!fileId) {
      throw new Error('❌ fileId é obrigatório');
    }

    console.log(`[process-document-optimized] 📄 Processing file: ${fileId}`);

    // FASE 1: Buscar e validar arquivo
    const { data: kbFile, error: kbError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', fileId)
      .single();

    if (kbError || !kbFile) {
      throw new Error(`❌ File not found: ${kbError?.message}`);
    }

    console.log(`[process-document-optimized] 📋 File info:`, {
      name: kbFile.original_name,
      size: kbFile.file_size,
      type: kbFile.file_type,
      status: kbFile.status
    });

    // Atualizar status para processing com logs
    await supabase
      .from('knowledge_base')
      .update({ 
        status: 'processing',
        processing_logs: {
          stage: 'started',
          timestamp: new Date().toISOString(),
          pipeline_version: 'v2-restructured'
        }
      })
      .eq('id', fileId);

    // FASE 2: Download do arquivo
    console.log(`[process-document-optimized] ⬇️ Downloading from storage...`);
    const { data: fileData, error: storageError } = await supabase.storage
      .from('knowledge-base')
      .download(kbFile.file_name);

    if (storageError || !fileData) {
      throw new Error(`❌ Storage download failed: ${storageError?.message}`);
    }

    // FASE 2: Extração robusta com validação
    console.log(`[process-document-optimized] Iniciando extração para ${kbFile.original_name}`);
    
    const fileBuffer = await fileData.arrayBuffer();
    const extractionResult = await EnhancedPDFExtractor.extractText(fileBuffer, kbFile.original_name);
    
    console.log(`[process-document-optimized] Extração concluída:`, {
      method: extractionResult.method,
      quality: extractionResult.quality,
      textLength: extractionResult.text.length,
      warnings: extractionResult.warnings
    });
    
    // Validação crítica: rejeitar se qualidade muito baixa
    if (extractionResult.quality < 0.5) {
      const errorMsg = `Text quality too low: ${extractionResult.quality}. Warnings: ${extractionResult.warnings.join(', ')}`;
      
      await supabase
        .from('knowledge_base')
        .update({
          status: 'error',
          processing_logs: {
            error: errorMsg,
            extraction_method: extractionResult.method,
            quality_score: extractionResult.quality,
            warnings: extractionResult.warnings,
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', fileId);
      
      throw new Error(errorMsg);
    }
    
    const originalText = extractionResult.text;

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