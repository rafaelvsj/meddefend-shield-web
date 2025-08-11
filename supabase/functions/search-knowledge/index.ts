import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  content: string;
  source: string;
  similarity_score: number;
}

class KnowledgeSearcher {
  private async generateQueryEmbedding(query: string, model: string): Promise<number[]> {
    const apiKey = Deno.env.get('OPENAI_API_KEY');

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: query,
        encoding_format: 'float'
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || [];
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async searchSimilarContent(query: string, limit: number = 3): Promise<SearchResult[]> {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Load embedding model from pipeline_settings
    const { data: settings } = await supabaseClient
      .from('pipeline_settings')
      .select('setting_key, setting_value');
    const settingsMap = (settings || []).reduce((acc: any, s: any) => {
      acc[s.setting_key] = s.setting_value; return acc;
    }, {});
    const embedProviderRaw = settingsMap.EMBEDDING_PROVIDER || 'openai:text-embedding-3-large';
    const embedModel = embedProviderRaw.includes(':') ? embedProviderRaw.split(':')[1] : embedProviderRaw;

    // Gerar embedding da query
    const queryEmbedding = await this.generateQueryEmbedding(query, embedModel);
    
    // Buscar chunks similares usando pgvector
    const { data: similarChunks } = await supabaseClient.rpc('search_similar_chunks', {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.7,
      match_count: limit
    });

    if (similarChunks && similarChunks.length > 0) {
      return similarChunks.map((chunk: any) => ({
        content: chunk.content,
        source: chunk.source,
        similarity_score: chunk.similarity
      }));
    }

    // Fallback para busca textual se não houver chunks com embeddings
    const { data: documents } = await supabaseClient
      .from('knowledge_base')
      .select('content, original_name')
      .eq('status', 'processed');

    if (!documents) return [];

    const results: SearchResult[] = [];
    
    for (const doc of documents) {
      if (!doc.content) continue;
      
      const paragraphs = doc.content.split('\n\n').filter(p => p.trim().length > 50);
      
      for (const paragraph of paragraphs) {
        const similarity = this.calculateTextSimilarity(query.toLowerCase(), paragraph.toLowerCase());
        
        if (similarity > 0.3) {
          results.push({
            content: paragraph,
            source: doc.original_name,
            similarity_score: similarity
          });
        }
      }
    }

    return results
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);
  }

  private calculateTextSimilarity(query: string, text: string): number {
    const queryWords = query.split(' ').filter(w => w.length > 3);
    const textWords = text.split(' ');
    
    let matches = 0;
    for (const word of queryWords) {
      if (textWords.some(tw => tw.includes(word) || word.includes(tw))) {
        matches++;
      }
    }
    
    return matches / queryWords.length;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 3 } = await req.json();

    if (!query || query.trim().length < 3) {
      return new Response(JSON.stringify({ 
        results: [],
        message: 'Query muito curta para busca'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searcher = new KnowledgeSearcher();
    const results = await searcher.searchSimilarContent(query, limit);

    return new Response(JSON.stringify({ 
      results,
      query,
      total_found: results.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in search-knowledge:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});