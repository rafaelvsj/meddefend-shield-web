-- Cleanup orphan and unprocessed records safely
-- 1) Delete logs for KB rows with NULL similarity_score
DELETE FROM kb_processing_logs
WHERE file_id IN (
  SELECT id FROM knowledge_base WHERE similarity_score IS NULL
);

-- 2) Delete chunks for KB rows with NULL similarity_score
DELETE FROM document_chunks
WHERE knowledge_base_id IN (
  SELECT id FROM knowledge_base WHERE similarity_score IS NULL
);

-- 3) Delete KB rows with NULL similarity_score (unprocessed/corrupted)
DELETE FROM knowledge_base
WHERE similarity_score IS NULL;

-- 4) Extra safety: remove any orphan chunks/logs whose parent KB no longer exists
DELETE FROM document_chunks dc
WHERE NOT EXISTS (
  SELECT 1 FROM knowledge_base kb WHERE kb.id = dc.knowledge_base_id
);

DELETE FROM kb_processing_logs l
WHERE NOT EXISTS (
  SELECT 1 FROM knowledge_base kb WHERE kb.id = l.file_id
);