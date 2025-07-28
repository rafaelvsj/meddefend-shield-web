-- Função para busca de similaridade usando pgvector
CREATE OR REPLACE FUNCTION search_similar_chunks(
  query_embedding vector(768),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  content text,
  source text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    dc.content,
    kb.original_name as source,
    1 - (dc.embedding <=> query_embedding) as similarity
  FROM document_chunks dc
  JOIN knowledge_base kb ON dc.knowledge_base_id = kb.id
  WHERE 1 - (dc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;