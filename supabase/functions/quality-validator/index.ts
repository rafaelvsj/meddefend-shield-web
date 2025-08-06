import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QualityReport {
  documentId: string;
  documentName: string;
  overallQuality: number;
  extractionMethod: string | null;
  chunkCount: number;
  corruptedChunks: number;
  qualityIssues: {
    hasPDFArtifacts: boolean;
    lowTextDensity: boolean;
    binaryContent: boolean;
    emptyChunks: boolean;
    suspiciousPatterns: string[];
  };
  statistics: {
    averageChunkSize: number;
    totalCharacters: number;
    readableCharacters: number;
    readabilityRatio: number;
  };
  recommendations: string[];
  sampleContent: {
    firstChunk: string;
    randomChunk: string;
  };
}

class DocumentQualityValidator {
  static async validateDocument(supabase: any, documentId: string): Promise<QualityReport> {
    console.log(`[QualityValidator] Validating document: ${documentId}`);
    
    // Buscar documento
    const { data: document, error: docError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message || 'Unknown error'}`);
    }
    
    // Buscar chunks do documento
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('knowledge_base_id', documentId)
      .order('chunk_index');
    
    if (chunksError) {
      throw new Error(`Failed to fetch chunks: ${chunksError.message}`);
    }
    
    const chunkList = chunks || [];
    console.log(`[QualityValidator] Found ${chunkList.length} chunks for document ${document.original_name}`);
    
    // Analisar qualidade
    const textQuality = this.analyzeTextQuality(chunkList);
    const chunkQuality = this.analyzeChunkQuality(chunkList);
    const structureAnalysis = this.analyzeDocumentStructure(document, chunkList);
    const issueDetection = this.detectSpecificIssues(chunkList);
    const statistics = this.calculateStatistics(chunkList);
    const samples = this.generateContentSamples(chunkList);
    
    // Calcular score geral
    const overallQuality = (
      textQuality * 0.4 +
      chunkQuality * 0.3 +
      structureAnalysis * 0.2 +
      (1 - (issueDetection.severityScore / 10)) * 0.1
    );
    
    const recommendations = this.generateRecommendations(
      overallQuality, 
      issueDetection, 
      statistics
    );
    
    return {
      documentId,
      documentName: document.original_name,
      overallQuality: Math.round(overallQuality * 100) / 100,
      extractionMethod: document.extraction_method,
      chunkCount: chunkList.length,
      corruptedChunks: issueDetection.corruptedCount,
      qualityIssues: {
        hasPDFArtifacts: issueDetection.hasPDFArtifacts,
        lowTextDensity: issueDetection.lowTextDensity,
        binaryContent: issueDetection.binaryContent,
        emptyChunks: issueDetection.emptyChunks,
        suspiciousPatterns: issueDetection.suspiciousPatterns
      },
      statistics,
      recommendations,
      sampleContent: samples
    };
  }
  
  private static analyzeTextQuality(chunks: any[]): number {
    if (chunks.length === 0) return 0;
    
    let totalScore = 0;
    let validChunks = 0;
    
    for (const chunk of chunks) {
      const content = chunk.content || '';
      if (content.length < 10) continue;
      
      // Calcular score de legibilidade
      const readableChars = content.match(/[a-zA-ZÀ-ÿ0-9\s.,;:!?()-]/g)?.length || 0;
      const readabilityScore = readableChars / content.length;
      
      // Penalizar artefatos PDF
      const pdfArtifacts = this.countPDFArtifacts(content);
      const artifactPenalty = Math.min(pdfArtifacts * 0.1, 0.5);
      
      const chunkScore = Math.max(0, readabilityScore - artifactPenalty);
      totalScore += chunkScore;
      validChunks++;
    }
    
    return validChunks > 0 ? totalScore / validChunks : 0;
  }
  
  private static analyzeChunkQuality(chunks: any[]): number {
    if (chunks.length === 0) return 0;
    
    let qualityScore = 1.0;
    
    // Verificar tamanhos dos chunks
    const sizes = chunks.map(c => (c.content || '').length);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const tooSmall = sizes.filter(s => s < 50).length;
    const tooLarge = sizes.filter(s => s > 2000).length;
    
    // Penalizar chunks muito pequenos ou grandes
    qualityScore -= (tooSmall / chunks.length) * 0.3;
    qualityScore -= (tooLarge / chunks.length) * 0.2;
    
    // Verificar continuidade (chunks devem formar texto coerente)
    let continuityScore = 0;
    for (let i = 1; i < chunks.length; i++) {
      const prev = chunks[i-1].content || '';
      const current = chunks[i].content || '';
      
      // Verificar se há sobreposição ou continuidade
      if (this.hasTextContinuity(prev, current)) {
        continuityScore += 1;
      }
    }
    
    const continuityRatio = chunks.length > 1 ? continuityScore / (chunks.length - 1) : 1;
    qualityScore = (qualityScore * 0.7) + (continuityRatio * 0.3);
    
    return Math.max(0, Math.min(1, qualityScore));
  }
  
  private static analyzeDocumentStructure(document: any, chunks: any[]): number {
    let structureScore = 0.5; // Base score
    
    // Verificar se documento tem status processado
    if (document.status === 'processed') structureScore += 0.2;
    
    // Verificar se há conteúdo markdown estruturado
    if (document.markdown_content) {
      const markdown = document.markdown_content;
      if (markdown.includes('#')) structureScore += 0.1; // Headers
      if (markdown.includes('*') || markdown.includes('-')) structureScore += 0.1; // Lists
      if (markdown.length > document.content?.length * 0.8) structureScore += 0.1; // Comprehensive
    }
    
    // Verificar metadata de processamento
    if (document.extraction_method) structureScore += 0.1;
    if (document.quality_score && document.quality_score > 0.7) structureScore += 0.1;
    
    return Math.min(1, structureScore);
  }
  
  private static detectSpecificIssues(chunks: any[]): {
    hasPDFArtifacts: boolean;
    lowTextDensity: boolean;
    binaryContent: boolean;
    emptyChunks: boolean;
    suspiciousPatterns: string[];
    corruptedCount: number;
    severityScore: number;
  } {
    let hasPDFArtifacts = false;
    let lowTextDensity = false;
    let binaryContent = false;
    let emptyChunks = false;
    let corruptedCount = 0;
    let severityScore = 0;
    const suspiciousPatterns: string[] = [];
    
    for (const chunk of chunks) {
      const content = chunk.content || '';
      
      // Verificar chunks vazios
      if (content.length < 10) {
        emptyChunks = true;
        corruptedCount++;
        severityScore += 1;
        continue;
      }
      
      // Verificar artefatos PDF
      const pdfPatterns = [
        /%PDF-/,
        /endobj/,
        /startxref/,
        /stream\s*\n/,
        /<<\s*\/Type/
      ];
      
      for (const pattern of pdfPatterns) {
        if (pattern.test(content)) {
          hasPDFArtifacts = true;
          corruptedCount++;
          severityScore += 3;
          suspiciousPatterns.push(`PDF artifact: ${pattern.source}`);
          break;
        }
      }
      
      // Verificar densidade textual
      const words = content.split(/\s+/).filter(w => /^[a-zA-ZÀ-ÿ]/.test(w));
      const density = words.length / content.length;
      if (density < 0.03) {
        lowTextDensity = true;
        severityScore += 2;
      }
      
      // Verificar conteúdo binário
      const binaryChars = content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g)?.length || 0;
      if (binaryChars / content.length > 0.1) {
        binaryContent = true;
        severityScore += 2;
      }
    }
    
    return {
      hasPDFArtifacts,
      lowTextDensity,
      binaryContent,
      emptyChunks,
      suspiciousPatterns,
      corruptedCount,
      severityScore
    };
  }
  
  private static calculateStatistics(chunks: any[]): {
    averageChunkSize: number;
    totalCharacters: number;
    readableCharacters: number;
    readabilityRatio: number;
  } {
    const sizes = chunks.map(c => (c.content || '').length);
    const totalCharacters = sizes.reduce((a, b) => a + b, 0);
    const averageChunkSize = chunks.length > 0 ? Math.round(totalCharacters / chunks.length) : 0;
    
    let readableCharacters = 0;
    for (const chunk of chunks) {
      const content = chunk.content || '';
      readableCharacters += content.match(/[a-zA-ZÀ-ÿ0-9\s.,;:!?()-]/g)?.length || 0;
    }
    
    const readabilityRatio = totalCharacters > 0 ? readableCharacters / totalCharacters : 0;
    
    return {
      averageChunkSize,
      totalCharacters,
      readableCharacters,
      readabilityRatio: Math.round(readabilityRatio * 100) / 100
    };
  }
  
  private static generateContentSamples(chunks: any[]): {
    firstChunk: string;
    randomChunk: string;
  } {
    const firstChunk = chunks.length > 0 ? 
      (chunks[0].content || '').substring(0, 200) + '...' : 
      'No content';
    
    const randomIndex = Math.floor(Math.random() * chunks.length);
    const randomChunk = chunks.length > 0 ? 
      (chunks[randomIndex]?.content || '').substring(0, 200) + '...' : 
      'No content';
    
    return { firstChunk, randomChunk };
  }
  
  private static generateRecommendations(
    quality: number, 
    issues: any, 
    stats: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (quality < 0.3) {
      recommendations.push('🚨 URGENT: Document needs complete reprocessing');
    } else if (quality < 0.7) {
      recommendations.push('⚠️ Document quality is below standards');
    }
    
    if (issues.hasPDFArtifacts) {
      recommendations.push('🔧 Remove PDF artifacts and reprocess with better extraction');
    }
    
    if (issues.lowTextDensity) {
      recommendations.push('📝 Text density is low - verify source document quality');
    }
    
    if (issues.binaryContent) {
      recommendations.push('🔨 Binary content detected - needs proper text extraction');
    }
    
    if (issues.emptyChunks) {
      recommendations.push('🗑️ Remove empty chunks');
    }
    
    if (stats.averageChunkSize < 100) {
      recommendations.push('📏 Chunks are too small - consider different chunking strategy');
    }
    
    if (stats.readabilityRatio < 0.8) {
      recommendations.push('📖 Low readability - check for encoding issues');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Document quality is acceptable');
    }
    
    return recommendations;
  }
  
  private static countPDFArtifacts(text: string): number {
    const patterns = [/%PDF/, /endobj/, /stream/, /xref/, /trailer/];
    return patterns.reduce((count, pattern) => {
      return count + (text.match(pattern)?.length || 0);
    }, 0);
  }
  
  private static hasTextContinuity(prevText: string, currentText: string): boolean {
    if (!prevText || !currentText) return false;
    
    // Verificar se último palavra do chunk anterior aparece no início do atual
    const lastWords = prevText.trim().split(/\s+/).slice(-3);
    const firstWords = currentText.trim().split(/\s+/).slice(0, 10);
    
    return lastWords.some(word => 
      word.length > 3 && firstWords.some(fw => fw.includes(word))
    );
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
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, documentId, batchSize = 10 } = await req.json();

    console.log(`[quality-validator] Action: ${action}`);

    switch (action) {
      case 'validate_document': {
        if (!documentId) {
          throw new Error('documentId is required for validate_document action');
        }
        
        const report = await DocumentQualityValidator.validateDocument(supabase, documentId);
        
        return new Response(JSON.stringify({ 
          success: true, 
          report 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'validate_batch': {
        console.log(`[quality-validator] Validating batch of ${batchSize} documents`);
        
        // Buscar documentos para validar
        const { data: documents, error: docError } = await supabase
          .from('knowledge_base')
          .select('id, original_name, status')
          .eq('status', 'processed')
          .limit(batchSize);
        
        if (docError) {
          throw new Error(`Failed to fetch documents: ${docError.message}`);
        }
        
        const reports = [];
        let totalQuality = 0;
        
        for (const doc of documents || []) {
          try {
            const report = await DocumentQualityValidator.validateDocument(supabase, doc.id);
            reports.push(report);
            totalQuality += report.overallQuality;
          } catch (error) {
            console.error(`[quality-validator] Error validating ${doc.id}:`, error);
            reports.push({
              documentId: doc.id,
              documentName: doc.original_name,
              overallQuality: 0,
              error: error.message
            });
          }
        }
        
        const summary = {
          totalDocuments: reports.length,
          averageQuality: reports.length > 0 ? totalQuality / reports.length : 0,
          poorQuality: reports.filter(r => r.overallQuality < 0.3).length,
          goodQuality: reports.filter(r => r.overallQuality >= 0.7).length
        };
        
        return new Response(JSON.stringify({ 
          success: true, 
          summary,
          reports 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'cleanup_corrupted': {
        console.log('[quality-validator] Cleaning up corrupted documents');
        
        // Resetar documentos em processing há muito tempo
        const { data: stuckDocs, error: stuckError } = await supabase
          .from('knowledge_base')
          .update({ 
            status: 'error',
            validation_errors: ['Document stuck in processing for > 1 hour']
          })
          .eq('status', 'processing')
          .lt('updated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
          .select();
        
        if (stuckError) {
          console.error('Error resetting stuck documents:', stuckError);
        }
        
        // Deletar chunks corrompidos
        const { data: deletedChunks, error: deleteError } = await supabase
          .from('document_chunks')
          .delete()
          .or('content.ilike.%PDF-%,content.ilike.%stream%,content.ilike.%endobj%')
          .select('knowledge_base_id');
        
        if (deleteError) {
          console.error('Error deleting corrupted chunks:', deleteError);
        }
        
        return new Response(JSON.stringify({ 
          success: true,
          message: `Cleanup completed. Reset ${stuckDocs?.length || 0} stuck documents, deleted ${deletedChunks?.length || 0} corrupted chunks.`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('[quality-validator] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});