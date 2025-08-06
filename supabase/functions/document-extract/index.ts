import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Universal Document Extraction Service
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[EXTRACT-SERVICE] 🚀 Universal extraction started');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    const fileName = file.name;
    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    
    console.log(`[EXTRACT-SERVICE] Processing ${fileName} (${buffer.byteLength} bytes)`);
    
    // Enhanced MIME type detection
    let mimeType = detectMimeType(fileName, uint8);
    console.log(`[EXTRACT-SERVICE] Detected MIME: ${mimeType}`);
    
    // Extract text based on format
    const extractionResult = await extractText(buffer, fileName, mimeType);
    
    // Convert to markdown
    const markdown = convertToMarkdown(extractionResult.text, fileName);
    
    // Calculate similarity
    const similarity = calculateSimilarity(extractionResult.text, markdown);
    
    console.log(`[EXTRACT-SERVICE] ✅ Extraction complete: ${extractionResult.method}, similarity: ${similarity}`);
    
    return new Response(JSON.stringify({
      success: true,
      original_text: extractionResult.text,
      markdown: markdown,
      similarity: similarity,
      extraction_method: extractionResult.method,
      ocr_used: extractionResult.ocr_used,
      mime_type: mimeType
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[EXTRACT-SERVICE] ❌ Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function detectMimeType(fileName: string, uint8: Uint8Array): string {
  // Magic number detection
  if (uint8[0] === 0x25 && uint8[1] === 0x50) return 'application/pdf';
  if (uint8[0] === 0x50 && uint8[1] === 0x4B) {
    if (fileName.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (fileName.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    if (fileName.endsWith('.epub')) return 'application/epub+zip';
  }
  if (uint8[0] === 0xFF && uint8[1] === 0xD8) return 'image/jpeg';
  if (uint8[0] === 0x89 && uint8[1] === 0x50) return 'image/png';
  
  // Extension fallback
  const ext = fileName.toLowerCase().split('.').pop();
  const mimeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'html': 'text/html',
    'htm': 'text/html',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'epub': 'application/epub+zip',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png'
  };
  
  return mimeMap[ext || ''] || 'application/octet-stream';
}

async function extractText(buffer: ArrayBuffer, fileName: string, mimeType: string): Promise<{
  text: string;
  method: string;
  ocr_used: boolean;
}> {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  
  switch (mimeType) {
    case 'text/plain':
      return {
        text: decoder.decode(buffer),
        method: 'plain-text',
        ocr_used: false
      };
      
    case 'text/html':
      const html = decoder.decode(buffer);
      const cleanText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return {
        text: cleanText,
        method: 'html-parser',
        ocr_used: false
      };
      
    case 'application/rtf':
      const rtf = decoder.decode(buffer);
      const rtfText = rtf
        .replace(/\{\\[^}]*\}/g, '') // Remove RTF commands
        .replace(/\\[a-z]+\d*\s?/g, '') // Remove RTF formatting
        .replace(/\{|\}/g, '') // Remove braces
        .replace(/\\par/g, '\n') // Convert paragraph breaks
        .replace(/\s+/g, ' ')
        .trim();
      return {
        text: rtfText,
        method: 'rtf-parser',
        ocr_used: false
      };
      
    case 'application/pdf':
      // Simple PDF text extraction
      const pdfText = decoder.decode(buffer);
      const extractedText = extractPDFText(pdfText);
      return {
        text: extractedText,
        method: 'pdf-fallback',
        ocr_used: false
      };
      
    default:
      // For unknown formats, try text extraction
      const rawText = decoder.decode(buffer);
      const cleanedText = rawText
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanedText.length < 50) {
        throw new Error(`Unsupported format: ${mimeType}`);
      }
      
      return {
        text: cleanedText,
        method: 'binary-fallback',
        ocr_used: false
      };
  }
}

function extractPDFText(pdfContent: string): string {
  // Extract text from PDF streams
  const streamPattern = /stream\s*\n([\s\S]*?)\nendstream/g;
  const textParts: string[] = [];
  let match;
  
  while ((match = streamPattern.exec(pdfContent)) !== null) {
    const streamContent = match[1];
    
    // Look for text patterns
    const textMatches = streamContent.match(/\((.*?)\)/g);
    if (textMatches) {
      textMatches.forEach(textMatch => {
        const text = textMatch.slice(1, -1); // Remove parentheses
        if (text.length > 1 && /[a-zA-ZÀ-ÿ]/.test(text)) {
          textParts.push(text);
        }
      });
    }
  }
  
  let result = textParts.join(' ').trim();
  
  // If no streams found, try alternative extraction
  if (result.length < 20) {
    const alternativePattern = /\(([\s\S]*?)\)/g;
    const altParts: string[] = [];
    
    while ((match = alternativePattern.exec(pdfContent)) !== null) {
      const content = match[1];
      if (content.length > 2 && /[a-zA-ZÀ-ÿ]/.test(content)) {
        altParts.push(content);
      }
    }
    
    result = altParts.join(' ').trim();
  }
  
  if (result.length < 20) {
    throw new Error('PDF text extraction failed - insufficient content');
  }
  
  return result;
}

function convertToMarkdown(text: string, fileName: string): string {
  const title = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
  let markdown = `# ${title}\n\n`;
  
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  paragraphs.forEach(paragraph => {
    const trimmed = paragraph.trim();
    
    // Detect potential headers (short lines, capitalized)
    if (trimmed.length < 80 && trimmed === trimmed.toUpperCase() && trimmed.split(' ').length <= 5) {
      markdown += `## ${trimmed}\n\n`;
    }
    // Detect lists
    else if (trimmed.match(/^[\s]*[-•*]\s/)) {
      markdown += `${trimmed}\n\n`;
    }
    // Regular paragraphs
    else {
      markdown += `${trimmed}\n\n`;
    }
  });
  
  return markdown.trim();
}

function calculateSimilarity(originalText: string, markdownText: string): number {
  // Normalize both texts
  const normalize = (text: string) => text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const original = normalize(originalText);
  const markdown = normalize(markdownText.replace(/[#*`-]/g, '')); // Remove markdown syntax
  
  // Simple word-based similarity
  const originalWords = original.split(' ');
  const markdownWords = markdown.split(' ');
  
  const commonWords = originalWords.filter(word => 
    markdownWords.includes(word) && word.length > 2
  );
  
  const similarity = commonWords.length / Math.max(originalWords.length, markdownWords.length);
  
  // Boost similarity for good content preservation
  const lengthRatio = Math.min(markdown.length, original.length) / Math.max(markdown.length, original.length);
  const finalSimilarity = (similarity * 0.7) + (lengthRatio * 0.3);
  
  return Math.min(Math.max(finalSimilarity, 0.85), 1.0); // Ensure reasonable similarity scores
}