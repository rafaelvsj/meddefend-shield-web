import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QualityReport {
  documentId: string;
  overallQuality: number;
  textQuality: number;
  structureQuality: number;
  chunkQuality: number;
  issues: string[];
  recommendations: string[];
  contentSample: string;
  stats: {
    totalChunks: number;
    avgChunkSize: number;
    readablePercentage: number;
    artifactCount: number;
  };
}

class DocumentQualityValidator {
  static async validateDocument(supabase: any, documentId: string): Promise<QualityReport> {
    console.log(`[QualityValidator] Analisando documento: ${documentId}`);

    // Buscar documento e seus chunks
    const { data: document, error: docError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Documento não encontrado: ${docError?.message}`);
    }

    const { data: chunks, error: chunkError } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('knowledge_base_id', documentId)
      .order('chunk_index');

    if (chunkError) {
      throw new Error(`Erro ao buscar chunks: ${chunkError.message}`);
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // 1. Análise da qualidade do texto principal
    const textQuality = this.analyzeTextQuality(document.content || '');
    if (textQuality < 0.5) {
      issues.push(`Qualidade do texto baixa: ${textQuality.toFixed(2)}`);
      recommendations.push('Considere reprocessar o documento com método de extração diferente');
    }

    // 2. Análise dos chunks
    const chunkQuality = this.analyzeChunkQuality(chunks || []);
    if (chunkQuality < 0.6) {
      issues.push(`Qualidade dos chunks baixa: ${chunkQuality.toFixed(2)}`);
      recommendations.push('Chunks contêm muito lixo técnico ou estão mal segmentados');
    }

    // 3. Análise estrutural
    const structureQuality = this.analyzeStructure(document.content || '');
    if (structureQuality < 0.4) {
      issues.push(`Estrutura do documento pobre: ${structureQuality.toFixed(2)}`);
      recommendations.push('Documento precisa de melhor estruturação em markdown');
    }

    // 4. Detectar problemas específicos
    this.detectSpecificIssues(document, chunks || [], issues, recommendations);

    // 5. Calcular estatísticas
    const stats = this.calculateStats(chunks || [], document.content || '');

    // 6. Qualidade geral
    const overallQuality = (textQuality * 0.4 + chunkQuality * 0.4 + structureQuality * 0.2);

    return {
      documentId,
      overallQuality,
      textQuality,
      structureQuality,
      chunkQuality,
      issues,
      recommendations,
      contentSample: this.getContentSample(document.content || '', chunks || []),
      stats
    };
  }

  private static analyzeTextQuality(text: string): number {
    if (!text || text.length < 10) return 0;

    const totalChars = text.length;
    
    // Count readable characters
    const readableChars = text.match(/[a-zA-ZÀ-ÿ0-9\s.,;:!?()-]/g)?.length || 0;
    const readabilityScore = readableChars / totalChars;

    // Count PDF artifacts
    const artifactPatterns = [
      /%PDF/g, /obj\s*$/g, /endobj/g, /stream/g, /endstream/g,
      /xref/g, /trailer/g, /<<\s*\/[A-Z]/g
    ];
    
    const artifactCount = artifactPatterns.reduce((count, pattern) => {
      return count + (text.match(pattern)?.length || 0);
    }, 0);

    const artifactPenalty = Math.min(artifactCount / 10, 0.8);
    
    return Math.max(0, readabilityScore - artifactPenalty);
  }

  private static analyzeChunkQuality(chunks: any[]): number {
    if (chunks.length === 0) return 0;

    let totalQuality = 0;
    let validChunks = 0;

    for (const chunk of chunks) {
      const content = chunk.content || '';
      if (content.length > 10) {
        const quality = this.analyzeTextQuality(content);
        totalQuality += quality;
        validChunks++;
      }
    }

    return validChunks > 0 ? totalQuality / validChunks : 0;
  }

  private static analyzeStructure(content: string): number {
    if (!content) return 0;

    let score = 0;

    // Check for markdown headers
    const headers = content.match(/^#+\s+.+$/gm);
    if (headers && headers.length > 0) {
      score += 0.4;
    }

    // Check for lists
    const lists = content.match(/^\s*[-*+]\s+.+$/gm);
    if (lists && lists.length > 0) {
      score += 0.2;
    }

    // Check for paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
    if (paragraphs.length > 2) {
      score += 0.3;
    }

    // Check for formatting
    const formatting = content.match(/\*\*[^*]+\*\*|\*[^*]+\*/g);
    if (formatting && formatting.length > 0) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private static detectSpecificIssues(document: any, chunks: any[], issues: string[], recommendations: string[]) {
    // Check for stuck processing
    if (document.status === 'processing') {
      const createdAt = new Date(document.created_at);
      const hoursSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreated > 1) {
        issues.push(`Documento travado em processamento há ${hoursSinceCreated.toFixed(1)} horas`);
        recommendations.push('Reprocessar documento com função de retry');
      }
    }

    // Check for missing chunks
    if (document.status === 'processed' && chunks.length === 0) {
      issues.push('Documento marcado como processado mas sem chunks');
      recommendations.push('Reprocessar documento completamente');
    }

    // Check for duplicate or corrupted chunks
    const contentHashes = new Set();
    let duplicateCount = 0;
    
    for (const chunk of chunks) {
      const hash = this.simpleHash(chunk.content || '');
      if (contentHashes.has(hash)) {
        duplicateCount++;
      }
      contentHashes.add(hash);
    }

    if (duplicateCount > 0) {
      issues.push(`${duplicateCount} chunks duplicados encontrados`);
      recommendations.push('Limpar chunks duplicados e reprocessar');
    }

    // Check for empty or very small chunks
    const smallChunks = chunks.filter(c => (c.content || '').length < 50);
    if (smallChunks.length > chunks.length * 0.3) {
      issues.push(`${smallChunks.length} chunks muito pequenos (< 50 chars)`);
      recommendations.push('Ajustar parâmetros de chunking');
    }
  }

  private static calculateStats(chunks: any[], content: string) {
    const totalChunks = chunks.length;
    const avgChunkSize = totalChunks > 0 
      ? chunks.reduce((sum, c) => sum + (c.content || '').length, 0) / totalChunks 
      : 0;

    const readableChars = content.match(/[a-zA-ZÀ-ÿ0-9\s.,;:!?()-]/g)?.length || 0;
    const readablePercentage = content.length > 0 ? (readableChars / content.length) * 100 : 0;

    const artifactPatterns = [/%PDF/g, /obj\s*$/g, /endobj/g, /stream/g, /endstream/g];
    const artifactCount = artifactPatterns.reduce((count, pattern) => {
      return count + (content.match(pattern)?.length || 0);
    }, 0);

    return {
      totalChunks,
      avgChunkSize,
      readablePercentage,
      artifactCount
    };
  }

  private static getContentSample(content: string, chunks: any[]): string {
    // Get first 500 chars of content or first chunk
    if (content && content.length > 100) {
      return content.substring(0, 500) + '...';
    } else if (chunks.length > 0 && chunks[0].content) {
      return chunks[0].content.substring(0, 500) + '...';
    }
    return 'Nenhum conteúdo disponível';
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente necessárias não encontradas');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, documentId, batchSize = 10 } = await req.json();

    console.log(`[quality-validator] Ação solicitada: ${action}`);

    if (action === 'validate_document') {
      if (!documentId) {
        throw new Error('documentId é obrigatório');
      }

      const report = await DocumentQualityValidator.validateDocument(supabase, documentId);
      
      return new Response(JSON.stringify({
        success: true,
        report
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'validate_batch') {
      // Validar múltiplos documentos
      const { data: documents, error } = await supabase
        .from('knowledge_base')
        .select('id, original_name, status')
        .limit(batchSize);

      if (error) {
        throw new Error(`Erro ao buscar documentos: ${error.message}`);
      }

      const reports = [];
      for (const doc of documents || []) {
        try {
          const report = await DocumentQualityValidator.validateDocument(supabase, doc.id);
          reports.push(report);
        } catch (error) {
          console.error(`[quality-validator] Erro ao validar ${doc.id}:`, error);
          reports.push({
            documentId: doc.id,
            overallQuality: 0,
            textQuality: 0,
            structureQuality: 0,
            chunkQuality: 0,
            issues: [`Erro na validação: ${error.message}`],
            recommendations: ['Verificar documento manualmente'],
            contentSample: 'Erro na análise',
            stats: { totalChunks: 0, avgChunkSize: 0, readablePercentage: 0, artifactCount: 0 }
          });
        }
      }

      // Estatísticas gerais
      const totalDocs = reports.length;
      const lowQualityDocs = reports.filter(r => r.overallQuality < 0.5).length;
      const avgQuality = reports.reduce((sum, r) => sum + r.overallQuality, 0) / totalDocs;

      return new Response(JSON.stringify({
        success: true,
        summary: {
          totalDocuments: totalDocs,
          lowQualityDocuments: lowQualityDocs,
          averageQuality: avgQuality,
          qualityDistribution: {
            excellent: reports.filter(r => r.overallQuality >= 0.8).length,
            good: reports.filter(r => r.overallQuality >= 0.6 && r.overallQuality < 0.8).length,
            fair: reports.filter(r => r.overallQuality >= 0.4 && r.overallQuality < 0.6).length,
            poor: reports.filter(r => r.overallQuality < 0.4).length
          }
        },
        reports
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'cleanup_corrupted') {
      // Identificar e limpar documentos corrompidos
      const { data: badDocs, error } = await supabase
        .from('knowledge_base')
        .select('id, original_name')
        .or('status.eq.error,and(status.eq.processing,created_at.lt.2024-01-01)'); // Very old processing docs

      if (error) {
        throw new Error(`Erro ao buscar documentos corrompidos: ${error.message}`);
      }

      const cleanupResults = [];
      for (const doc of badDocs || []) {
        try {
          // Delete chunks first
          await supabase
            .from('document_chunks')
            .delete()
            .eq('knowledge_base_id', doc.id);

          // Reset document status
          await supabase
            .from('knowledge_base')
            .update({ 
              status: 'pending',
              processed_at: null,
              content: null
            })
            .eq('id', doc.id);

          cleanupResults.push({ id: doc.id, name: doc.original_name, success: true });
        } catch (error) {
          cleanupResults.push({ 
            id: doc.id, 
            name: doc.original_name, 
            success: false, 
            error: error.message 
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Limpeza concluída: ${cleanupResults.filter(r => r.success).length} documentos resetados`,
        results: cleanupResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Ação não reconhecida');

  } catch (error) {
    console.error('[quality-validator] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});