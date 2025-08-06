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
    file_type: string;
    page?: number;
    section?: string;
  };
}

interface ProcessingResult {
  success: boolean;
  text?: string;
  metadata?: Record<string, any>;
  error?: string;
  warnings?: string[];
}

class FileValidator {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly SUPPORTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/msword', // DOC
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/vnd.ms-excel', // XLS
    'text/csv',
    'text/plain',
    'text/html',
    'application/rtf',
    'text/rtf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'application/vnd.ms-powerpoint', // PPT
    'application/vnd.oasis.opendocument.text', // ODT
    'application/vnd.oasis.opendocument.spreadsheet', // ODS
    'application/vnd.oasis.opendocument.presentation', // ODP
    'application/json',
    'application/xml',
    'text/xml'
  ];

  static validate(fileBuffer: ArrayBuffer, fileType: string, fileName: string): { valid: boolean; error?: string } {
    // Verificar tamanho
    if (fileBuffer.byteLength > this.MAX_FILE_SIZE) {
      return { valid: false, error: `Arquivo muito grande. Máximo permitido: ${this.MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    // Verificar tipo
    if (!this.SUPPORTED_TYPES.includes(fileType.toLowerCase())) {
      return { valid: false, error: `Tipo de arquivo não suportado: ${fileType}` };
    }

    // Verificar se o arquivo não está vazio
    if (fileBuffer.byteLength === 0) {
      return { valid: false, error: 'Arquivo vazio' };
    }

    // Verificar assinatura do arquivo (magic numbers)
    const signature = this.getFileSignature(fileBuffer);
    if (!this.validateSignature(signature, fileType)) {
      console.warn(`[process-document] Aviso: Assinatura do arquivo não corresponde ao tipo declarado`);
    }

    return { valid: true };
  }

  private static getFileSignature(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    return Array.from(uint8Array.slice(0, 8))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private static validateSignature(signature: string, fileType: string): boolean {
    const signatures: Record<string, string[]> = {
      'application/pdf': ['25504446'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['504b0304'],
      'application/msword': ['d0cf11e0'],
      'application/vnd.ms-excel': ['d0cf11e0'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['504b0304'],
    };

    const expectedSignatures = signatures[fileType.toLowerCase()];
    if (!expectedSignatures) return true; // Não validamos se não conhecemos

    return expectedSignatures.some(expected => signature.startsWith(expected));
  }
}

class UniversalDocumentParser {
  async parse(fileBuffer: ArrayBuffer, fileType: string, fileName: string): Promise<ProcessingResult> {
    console.log(`[process-document] Iniciando parsing de ${fileName} (${fileType})`);
    
    try {
      const validation = FileValidator.validate(fileBuffer, fileType, fileName);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const result = await this.parseByType(fileBuffer, fileType, fileName);
      
      if (!result.success) {
        console.warn(`[process-document] Parser específico falhou, tentando parser genérico`);
        return await this.parseGeneric(fileBuffer, fileName);
      }

      return result;
    } catch (error) {
      console.error(`[process-document] Erro no parsing:`, error);
      return await this.parseGeneric(fileBuffer, fileName);
    }
  }

  private async parseByType(fileBuffer: ArrayBuffer, fileType: string, fileName: string): Promise<ProcessingResult> {
    const type = fileType.toLowerCase();
    
    switch (type) {
      case 'application/pdf':
        return await this.parsePDF(fileBuffer);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await this.parseDOCX(fileBuffer);
      
      case 'application/msword':
        return await this.parseDOC(fileBuffer);
      
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        return await this.parseSpreadsheet(fileBuffer, type);
      
      case 'text/csv':
        return await this.parseCSV(fileBuffer);
      
      case 'text/plain':
        return await this.parsePlainText(fileBuffer);
      
      case 'text/html':
        return await this.parseHTML(fileBuffer);
      
      case 'application/rtf':
      case 'text/rtf':
        return await this.parseRTF(fileBuffer);
      
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      case 'application/vnd.ms-powerpoint':
        return await this.parsePresentation(fileBuffer, type);
      
      case 'application/vnd.oasis.opendocument.text':
      case 'application/vnd.oasis.opendocument.spreadsheet':
      case 'application/vnd.oasis.opendocument.presentation':
        return await this.parseOpenDocument(fileBuffer, type);
      
      case 'application/json':
        return await this.parseJSON(fileBuffer);
      
      case 'application/xml':
      case 'text/xml':
        return await this.parseXML(fileBuffer);
      
      default:
        return await this.parseGeneric(fileBuffer, fileName);
    }
  }

  private async parsePDF(buffer: ArrayBuffer): Promise<ProcessingResult> {
    console.log(`[process-document] Processando PDF avançado`);
    
    try {
      const uint8Array = new Uint8Array(buffer);
      let text = '';
      
      // Converter para string preservando bytes
      for (let i = 0; i < uint8Array.length; i++) {
        text += String.fromCharCode(uint8Array[i]);
      }

      const extractedTexts: string[] = [];
      
      // Método 1: Buscar streams de texto comprimidos e não comprimidos
      const streamPattern = /stream\s*([\s\S]*?)\s*endstream/g;
      let match;
      
      while ((match = streamPattern.exec(text)) !== null) {
        const streamContent = match[1];
        const readableText = this.extractReadableTextAdvanced(streamContent);
        if (readableText.length > 10) {
          extractedTexts.push(readableText);
        }
      }

      // Método 2: Comandos de texto PDF
      const textCommands = [
        /\(([^)]+)\)\s*Tj/g,
        /\(([^)]+)\)\s*TJ/g,
        /\[([^\]]+)\]\s*TJ/g,
        /<([^>]+)>\s*Tj/g
      ];

      textCommands.forEach(pattern => {
        while ((match = pattern.exec(text)) !== null) {
          const textContent = match[1];
          if (textContent && textContent.length > 1) {
            const cleaned = this.cleanPDFText(textContent);
            if (cleaned.length > 2) {
              extractedTexts.push(cleaned);
            }
          }
        }
      });

      // Método 3: Texto entre parênteses
      const textInParensPattern = /\(([^)]{2,})\)/g;
      while ((match = textInParensPattern.exec(text)) !== null) {
        const textContent = match[1];
        if (textContent && /[a-zA-ZÀ-ÿ0-9]/.test(textContent)) {
          const cleaned = this.cleanPDFText(textContent);
          if (cleaned.length > 2) {
            extractedTexts.push(cleaned);
          }
        }
      }

      // Método 4: Buscar objetos de fonte e texto associado
      const fontObjectPattern = /\/Font\s+<<[^>]*>>/g;
      const textObjectPattern = /BT\s+([\s\S]*?)\s+ET/g;
      
      while ((match = textObjectPattern.exec(text)) !== null) {
        const textObject = match[1];
        const textLines = textObject.split(/\s+/).filter(line => 
          line.includes('(') && line.includes(')') && line.length > 3
        );
        
        textLines.forEach(line => {
          const extracted = this.extractTextFromPDFLine(line);
          if (extracted.length > 2) {
            extractedTexts.push(extracted);
          }
        });
      }

      if (extractedTexts.length > 0) {
        const result = extractedTexts
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (result.length > 50) {
          console.log(`[process-document] PDF processado com sucesso: ${result.length} caracteres`);
          return {
            success: true,
            text: result,
            metadata: {
              extraction_method: 'advanced_pdf_parser',
              text_objects_found: extractedTexts.length
            }
          };
        }
      }

      // Fallback para extração básica
      const fallbackText = this.extractReadableTextAdvanced(text);
      if (fallbackText.length > 100) {
        return {
          success: true,
          text: fallbackText,
          metadata: {
            extraction_method: 'fallback_text_extraction'
          }
        };
      }

      return { success: false, error: 'Não foi possível extrair texto significativo do PDF' };
    } catch (error) {
      console.error(`[process-document] Erro no parsing de PDF:`, error);
      return { success: false, error: `Erro no parsing de PDF: ${(error as Error).message}` };
    }
  }

  private extractTextFromPDFLine(line: string): string {
    const patterns = [
      /\(([^)]+)\)/g,
      /<([^>]+)>/g,
      /\[([^\]]+)\]/g
    ];

    let extracted = '';
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        extracted += ' ' + this.cleanPDFText(match[1]);
      }
    });

    return extracted.trim();
  }

  private cleanPDFText(text: string): string {
    return text
      .replace(/\\[nr]/g, ' ')
      .replace(/\\[()]/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async parseDOCX(buffer: ArrayBuffer): Promise<ProcessingResult> {
    console.log(`[process-document] Processando DOCX avançado`);
    
    try {
      const uint8Array = new Uint8Array(buffer);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      
      // DOCX é um arquivo ZIP com XML dentro
      const extractedTexts: string[] = [];
      
      // Buscar padrões XML do Word
      const xmlPatterns = [
        /<w:t[^>]*>([^<]+)<\/w:t>/g,
        /<w:r[^>]*><w:t[^>]*>([^<]+)<\/w:t><\/w:r>/g,
        /<text[^>]*>([^<]+)<\/text>/g
      ];

      xmlPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const textContent = match[1];
          if (textContent && textContent.trim().length > 1) {
            extractedTexts.push(this.cleanXMLText(textContent));
          }
        }
      });

      // Buscar cabeçalhos e parágrafos
      const paragraphPattern = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
      let match;
      while ((match = paragraphPattern.exec(text)) !== null) {
        const paragraph = match[1];
        const textInParagraph = paragraph.replace(/<[^>]*>/g, ' ').trim();
        if (textInParagraph.length > 2) {
          extractedTexts.push(textInParagraph);
        }
      }

      if (extractedTexts.length > 0) {
        const result = extractedTexts
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (result.length > 10) {
          console.log(`[process-document] DOCX processado: ${result.length} caracteres`);
          return {
            success: true,
            text: result,
            metadata: {
              extraction_method: 'advanced_docx_parser',
              paragraphs_found: extractedTexts.length
            }
          };
        }
      }

      return { success: false, error: 'Não foi possível extrair texto do DOCX' };
    } catch (error) {
      console.error(`[process-document] Erro no parsing de DOCX:`, error);
      return { success: false, error: `Erro no parsing de DOCX: ${(error as Error).message}` };
    }
  }

  private async parseDOC(buffer: ArrayBuffer): Promise<ProcessingResult> {
    console.log(`[process-document] Processando DOC legado`);
    
    try {
      const uint8Array = new Uint8Array(buffer);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      
      // DOC usa formato binário mais complexo
      const readableText = this.extractReadableTextAdvanced(text);
      
      if (readableText.length > 50) {
        return {
          success: true,
          text: readableText,
          metadata: {
            extraction_method: 'doc_binary_parser'
          }
        };
      }

      return { success: false, error: 'Não foi possível extrair texto do DOC' };
    } catch (error) {
      return { success: false, error: `Erro no parsing de DOC: ${(error as Error).message}` };
    }
  }

  private async parseSpreadsheet(buffer: ArrayBuffer, fileType: string): Promise<ProcessingResult> {
    console.log(`[process-document] Processando planilha: ${fileType}`);
    
    try {
      const uint8Array = new Uint8Array(buffer);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      
      const extractedData: string[] = [];
      
      if (fileType.includes('openxml')) {
        // XLSX - buscar por strings compartilhadas e células
        const sharedStringPattern = /<t[^>]*>([^<]+)<\/t>/g;
        const cellValuePattern = /<v[^>]*>([^<]+)<\/v>/g;
        
        let match;
        while ((match = sharedStringPattern.exec(text)) !== null) {
          const cellText = this.cleanXMLText(match[1]);
          if (cellText.length > 0 && !this.isNumericOnly(cellText)) {
            extractedData.push(cellText);
          }
        }
        
        while ((match = cellValuePattern.exec(text)) !== null) {
          const cellValue = match[1];
          if (cellValue && !this.isNumericOnly(cellValue)) {
            extractedData.push(cellValue);
          }
        }
      } else {
        // XLS - formato binário
        const readableText = this.extractReadableTextAdvanced(text);
        const words = readableText.split(/\s+/).filter(word => 
          word.length > 2 && !this.isNumericOnly(word)
        );
        extractedData.push(...words);
      }

      if (extractedData.length > 0) {
        const result = extractedData.join(' ').replace(/\s+/g, ' ').trim();
        return {
          success: true,
          text: result,
          metadata: {
            extraction_method: 'spreadsheet_parser',
            cells_found: extractedData.length
          }
        };
      }

      return { success: false, error: 'Não foi possível extrair texto da planilha' };
    } catch (error) {
      return { success: false, error: `Erro no parsing de planilha: ${(error as Error).message}` };
    }
  }

  private async parseCSV(buffer: ArrayBuffer): Promise<ProcessingResult> {
    try {
      const text = new TextDecoder('utf-8').decode(buffer);
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      
      // Extrair texto de todas as células, ignorando números puros
      const extractedText = lines
        .map(line => {
          const cells = line.split(/[,;|\t]/).map(cell => 
            cell.replace(/['"]/g, '').trim()
          );
          return cells.filter(cell => 
            cell.length > 1 && !this.isNumericOnly(cell)
          ).join(' ');
        })
        .filter(line => line.length > 0)
        .join(' ');

      return {
        success: true,
        text: extractedText,
        metadata: {
          extraction_method: 'csv_parser',
          rows_processed: lines.length
        }
      };
    } catch (error) {
      return { success: false, error: `Erro no parsing de CSV: ${(error as Error).message}` };
    }
  }

  private async parsePlainText(buffer: ArrayBuffer): Promise<ProcessingResult> {
    try {
      const text = new TextDecoder('utf-8').decode(buffer);
      return {
        success: true,
        text: text.trim(),
        metadata: {
          extraction_method: 'plain_text',
          length: text.length
        }
      };
    } catch (error) {
      return { success: false, error: `Erro no parsing de texto: ${(error as Error).message}` };
    }
  }

  private async parseHTML(buffer: ArrayBuffer): Promise<ProcessingResult> {
    try {
      const html = new TextDecoder('utf-8').decode(buffer);
      const text = this.stripHTML(html);
      
      return {
        success: true,
        text: text,
        metadata: {
          extraction_method: 'html_parser',
          original_length: html.length,
          extracted_length: text.length
        }
      };
    } catch (error) {
      return { success: false, error: `Erro no parsing de HTML: ${(error as Error).message}` };
    }
  }

  private async parseRTF(buffer: ArrayBuffer): Promise<ProcessingResult> {
    try {
      const rtf = new TextDecoder('utf-8').decode(buffer);
      
      // Remover comandos RTF e extrair texto
      const text = rtf
        .replace(/\{\\[^}]*\}/g, '') // Remove comandos RTF
        .replace(/\\[a-z]+\d*/g, '') // Remove comandos simples
        .replace(/[{}]/g, '') // Remove chaves
        .replace(/\s+/g, ' ')
        .trim();

      return {
        success: true,
        text: text,
        metadata: {
          extraction_method: 'rtf_parser'
        }
      };
    } catch (error) {
      return { success: false, error: `Erro no parsing de RTF: ${(error as Error).message}` };
    }
  }

  private async parsePresentation(buffer: ArrayBuffer, fileType: string): Promise<ProcessingResult> {
    try {
      const uint8Array = new Uint8Array(buffer);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      
      const extractedTexts: string[] = [];
      
      if (fileType.includes('openxml')) {
        // PPTX
        const slideTextPatterns = [
          /<a:t[^>]*>([^<]+)<\/a:t>/g,
          /<p:txBody[^>]*>([\s\S]*?)<\/p:txBody>/g
        ];

        slideTextPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(text)) !== null) {
            const slideText = match[1].replace(/<[^>]*>/g, ' ');
            if (slideText.trim().length > 1) {
              extractedTexts.push(this.cleanXMLText(slideText));
            }
          }
        });
      } else {
        // PPT
        const readableText = this.extractReadableTextAdvanced(text);
        if (readableText.length > 10) {
          extractedTexts.push(readableText);
        }
      }

      if (extractedTexts.length > 0) {
        const result = extractedTexts.join(' ').replace(/\s+/g, ' ').trim();
        return {
          success: true,
          text: result,
          metadata: {
            extraction_method: 'presentation_parser',
            slides_found: extractedTexts.length
          }
        };
      }

      return { success: false, error: 'Não foi possível extrair texto da apresentação' };
    } catch (error) {
      return { success: false, error: `Erro no parsing de apresentação: ${(error as Error).message}` };
    }
  }

  private async parseOpenDocument(buffer: ArrayBuffer, fileType: string): Promise<ProcessingResult> {
    try {
      const uint8Array = new Uint8Array(buffer);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      
      // OpenDocument usa XML similar ao DOCX
      const textPattern = /<text:p[^>]*>([^<]+)<\/text:p>/g;
      const extractedTexts: string[] = [];
      
      let match;
      while ((match = textPattern.exec(text)) !== null) {
        const textContent = this.cleanXMLText(match[1]);
        if (textContent.length > 1) {
          extractedTexts.push(textContent);
        }
      }

      if (extractedTexts.length > 0) {
        const result = extractedTexts.join(' ').replace(/\s+/g, ' ').trim();
        return {
          success: true,
          text: result,
          metadata: {
            extraction_method: 'opendocument_parser',
            paragraphs_found: extractedTexts.length
          }
        };
      }

      return { success: false, error: 'Não foi possível extrair texto do OpenDocument' };
    } catch (error) {
      return { success: false, error: `Erro no parsing de OpenDocument: ${(error as Error).message}` };
    }
  }

  private async parseJSON(buffer: ArrayBuffer): Promise<ProcessingResult> {
    try {
      const jsonText = new TextDecoder('utf-8').decode(buffer);
      const data = JSON.parse(jsonText);
      
      // Extrair todos os valores de string do JSON
      const extractedText = this.extractTextFromObject(data);
      
      return {
        success: true,
        text: extractedText,
        metadata: {
          extraction_method: 'json_parser',
          structure: typeof data
        }
      };
    } catch (error) {
      return { success: false, error: `Erro no parsing de JSON: ${(error as Error).message}` };
    }
  }

  private async parseXML(buffer: ArrayBuffer): Promise<ProcessingResult> {
    try {
      const xml = new TextDecoder('utf-8').decode(buffer);
      const text = xml
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        success: true,
        text: text,
        metadata: {
          extraction_method: 'xml_parser'
        }
      };
    } catch (error) {
      return { success: false, error: `Erro no parsing de XML: ${(error as Error).message}` };
    }
  }

  private async parseGeneric(buffer: ArrayBuffer, fileName: string): Promise<ProcessingResult> {
    console.log(`[process-document] Usando parser genérico para ${fileName}`);
    
    try {
      const uint8Array = new Uint8Array(buffer);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      
      const readableText = this.extractReadableTextAdvanced(text);
      
      if (readableText.length > 20) {
        return {
          success: true,
          text: readableText,
          metadata: {
            extraction_method: 'generic_text_extraction'
          },
          warnings: ['Arquivo processado com parser genérico - qualidade pode ser limitada']
        };
      }

      return { success: false, error: 'Não foi possível extrair texto significativo do arquivo' };
    } catch (error) {
      return { success: false, error: `Erro no parser genérico: ${(error as Error).message}` };
    }
  }

  // Métodos auxiliares
  private extractReadableTextAdvanced(content: string): string {
    // Remove caracteres de controle e mantém apenas texto legível
    const readable = content
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u024F\u1E00-\u1EFF\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Filtrar apenas palavras que parecem ter conteúdo textual significativo
    const words = readable.split(/\s+/).filter(word => {
      return word.length > 1 && 
             /[a-zA-ZÀ-ÿ]/.test(word) && 
             !this.isGibberish(word);
    });
    
    return words.join(' ');
  }

  private cleanXMLText(text: string): string {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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

  private extractTextFromObject(obj: any): string {
    const texts: string[] = [];
    
    const extract = (value: any) => {
      if (typeof value === 'string' && value.length > 1) {
        texts.push(value);
      } else if (Array.isArray(value)) {
        value.forEach(extract);
      } else if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(extract);
      }
    };
    
    extract(obj);
    return texts.join(' ');
  }

  private isNumericOnly(text: string): boolean {
    return /^\d+(\.\d+)?$/.test(text.trim());
  }

  private isGibberish(word: string): boolean {
    // Detectar sequências que parecem ser lixo
    const consonantPattern = /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{4,}/;
    const randomPattern = /[^a-zA-ZÀ-ÿ\s]{3,}/;
    
    return consonantPattern.test(word) || randomPattern.test(word) || word.length > 50;
  }
}

class TextChunker {
  static chunk(text: string, chunkSize: number = 1000, overlap: number = 100): string[] {
    console.log(`[process-document] Dividindo texto em chunks inteligentes. Tamanho: ${text.length} chars`);
    
    if (text.length <= chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    const sentences = this.splitIntoSentences(text);
    
    let currentChunk = '';
    let sentenceIndex = 0;
    
    while (sentenceIndex < sentences.length) {
      const sentence = sentences[sentenceIndex];
      
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        
        // Adicionar overlap
        const overlapText = this.getOverlapText(currentChunk, overlap);
        currentChunk = overlapText + sentence;
      } else {
        currentChunk += (currentChunk.length > 0 ? ' ' : '') + sentence;
      }
      
      sentenceIndex++;
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    console.log(`[process-document] Texto dividido em ${chunks.length} chunks com overlap`);
    return chunks;
  }

  private static splitIntoSentences(text: string): string[] {
    // Divisão mais inteligente considerando abreviações comuns
    const sentences = text
      .replace(/([.!?])\s+/g, '$1|SPLIT|')
      .split('|SPLIT|')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    return sentences;
  }

  private static getOverlapText(text: string, overlapSize: number): string {
    const words = text.split(/\s+/);
    const overlapWords = Math.min(overlapSize / 5, words.length); // Aproximadamente 5 chars por palavra
    
    return words.slice(-overlapWords).join(' ') + ' ';
  }
}

class EmbeddingGenerator {
  private static async generateEmbedding(text: string): Promise<number[]> {
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

  static async generateForChunks(chunks: string[], fileName: string, fileType: string): Promise<DocumentChunk[]> {
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
            chunk_size: chunks[i].length,
            file_type: fileType
          }
        });
        
        // Pequena pausa para evitar rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`[process-document] Erro ao processar chunk ${i}:`, error);
        // Continua com os outros chunks em caso de erro
      }
    }

    return documentChunks;
  }
}

class DocumentProcessor {
  private parser: UniversalDocumentParser;

  constructor() {
    this.parser = new UniversalDocumentParser();
  }

  async processDocument(fileBuffer: ArrayBuffer, fileName: string, fileType: string): Promise<DocumentChunk[]> {
    console.log(`[process-document] Iniciando processamento robusto do documento: ${fileName}`);
    
    // Parse do documento
    const parseResult = await this.parser.parse(fileBuffer, fileType, fileName);
    
    if (!parseResult.success) {
      throw new Error(parseResult.error || 'Falha no parsing do documento');
    }

    const text = parseResult.text!;
    
    if (!text || text.length < 10) {
      throw new Error('Texto extraído muito pequeno ou vazio');
    }
    
    console.log(`[process-document] Texto extraído com sucesso: ${text.length} caracteres`);
    if (parseResult.warnings) {
      parseResult.warnings.forEach(warning => console.warn(`[process-document] ${warning}`));
    }
    
    // Dividir em chunks inteligentes
    const chunks = TextChunker.chunk(text, 1000, 100);
    
    if (chunks.length === 0) {
      throw new Error('Não foi possível dividir o texto em chunks');
    }
    
    // Gerar embeddings
    const documentChunks = await EmbeddingGenerator.generateForChunks(chunks, fileName, fileType);

    if (documentChunks.length === 0) {
      throw new Error('Nenhum chunk foi processado com sucesso');
    }

    console.log(`[process-document] Documento processado com sucesso: ${documentChunks.length}/${chunks.length} chunks com embeddings`);
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

    // Processar documento com sistema robusto
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
      embedding: `[${chunk.embedding.join(',')}]`,
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
      message: 'Documento processado com sucesso com sistema robusto'
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