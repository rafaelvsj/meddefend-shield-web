#!/usr/bin/env ts-node

/**
 * Migration script to move legacy Knowledge Base entries to the new universal pipeline schema
 * This script safely migrates existing documents to use the new columns while preserving data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zwgjnynnbxiomtnnvztt.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface LegacyKBEntry {
  id: string;
  file_name: string;
  original_name: string;
  file_type: string;
  content: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

async function migrateLegacyEntries() {
  console.log('🚀 Starting Knowledge Base migration to universal pipeline...');
  
  try {
    // 1. Get all legacy entries that need migration (missing new columns)
    const { data: legacyEntries, error: fetchError } = await supabase
      .from('knowledge_base')
      .select('*')
      .is('mime_type', null)
      .eq('status', 'processed');

    if (fetchError) {
      throw new Error(`Failed to fetch legacy entries: ${fetchError.message}`);
    }

    if (!legacyEntries || legacyEntries.length === 0) {
      console.log('✅ No legacy entries found that need migration.');
      return;
    }

    console.log(`📊 Found ${legacyEntries.length} legacy entries to migrate`);

    // 2. Process each entry
    let successCount = 0;
    let errorCount = 0;

    for (const entry of legacyEntries) {
      try {
        console.log(`📄 Migrating: ${entry.original_name} (${entry.id})`);

        // Determine MIME type from file extension
        const mimeType = getMimeTypeFromFileName(entry.original_name);
        
        // For legacy entries, assume they were extracted using the old method
        const extractionMethod = entry.file_type === 'pdf' ? 'pdfplumber-legacy' : 'textract-legacy';
        
        // Set markdown content to existing content (legacy didn't have markdown conversion)
        const markdownContent = convertTextToBasicMarkdown(entry.content || '');

        // Update the entry with new schema fields
        const { error: updateError } = await supabase
          .from('knowledge_base')
          .update({
            mime_type: mimeType,
            extraction_method: extractionMethod,
            ocr_used: false, // Legacy pipeline didn't track OCR usage
            similarity_score: 1.0, // Assume legacy extractions were good
            markdown_content: markdownContent,
            processing_logs: {
              migration: {
                migrated_at: new Date().toISOString(),
                original_extraction_method: 'legacy-pipeline',
                migration_version: '1.0'
              }
            }
          })
          .eq('id', entry.id);

        if (updateError) {
          throw new Error(`Failed to update entry: ${updateError.message}`);
        }

        // 3. Generate embeddings for migrated content if missing chunks
        const { data: existingChunks } = await supabase
          .from('document_chunks')
          .select('id')
          .eq('knowledge_base_id', entry.id);

        if (!existingChunks || existingChunks.length === 0) {
          await generateChunksForMigratedEntry(entry.id, markdownContent);
        }

        successCount++;
        console.log(`✅ Successfully migrated: ${entry.original_name}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to migrate ${entry.original_name}:`, error);
        
        // Log error to database
        await supabase
          .from('knowledge_base')
          .update({
            processing_logs: {
              migration_error: {
                error_at: new Date().toISOString(),
                error_message: error instanceof Error ? error.message : 'Unknown error',
                migration_version: '1.0'
              }
            }
          })
          .eq('id', entry.id);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount} entries`);
    console.log(`❌ Failed migrations: ${errorCount} entries`);
    console.log(`📊 Total processed: ${successCount + errorCount} entries`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt': 'application/vnd.ms-powerpoint',
    'rtf': 'application/rtf',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'epub': 'application/epub+zip',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg'
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}

function convertTextToBasicMarkdown(text: string): string {
  if (!text || text.trim().length === 0) {
    return '';
  }

  // Basic conversion to markdown format
  let markdown = text;
  
  // Convert line breaks to proper markdown format
  markdown = markdown.replace(/\n\s*\n/g, '\n\n');
  
  // Try to identify headers (lines that end with : or are in ALL CAPS)
  markdown = markdown.replace(/^([A-Z][A-Z\s]{3,}):?\s*$/gm, '## $1');
  
  // Try to identify list items (lines starting with -, *, numbers)
  markdown = markdown.replace(/^(\s*)([-*]|\d+\.)\s+/gm, '$1- ');

  return markdown.trim();
}

async function generateChunksForMigratedEntry(knowledgeBaseId: string, content: string) {
  if (!content || content.trim().length === 0) {
    return;
  }

  const chunkSize = 1000;
  const overlap = 200;
  
  const chunks: string[] = [];
  let start = 0;

  while (start < content.length) {
    const end = Math.min(start + chunkSize, content.length);
    chunks.push(content.slice(start, end));
    start = end - overlap;
    if (start >= content.length) break;
  }

  // Generate embeddings for chunks using Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.warn('⚠️  GEMINI_API_KEY not found, skipping embedding generation');
    return;
  }

  const chunksWithEmbeddings = await Promise.all(chunks.map(async (chunk, index) => {
    try {
      const embeddingResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          model: 'models/embedding-001',
          content: { parts: [{ text: chunk }] }
        })
      });

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.embedding?.values || [];

      return {
        knowledge_base_id: knowledgeBaseId,
        content: chunk,
        embedding: `[${embedding.join(',')}]`,
        chunk_index: index,
        chunk_size: chunk.length,
        metadata: { 
          migration_timestamp: new Date().toISOString(),
          source: 'legacy-migration'
        }
      };
    } catch (error) {
      console.warn(`⚠️  Failed to generate embedding for chunk ${index}:`, error);
      return {
        knowledge_base_id: knowledgeBaseId,
        content: chunk,
        embedding: null,
        chunk_index: index,
        chunk_size: chunk.length,
        metadata: { 
          migration_timestamp: new Date().toISOString(),
          source: 'legacy-migration',
          embedding_error: 'Failed to generate'
        }
      };
    }
  }));

  // Save chunks to database
  const { error: chunksError } = await supabase
    .from('document_chunks')
    .insert(chunksWithEmbeddings);

  if (chunksError) {
    console.warn(`⚠️  Failed to save chunks for ${knowledgeBaseId}:`, chunksError);
  } else {
    console.log(`📦 Generated ${chunks.length} chunks for migrated entry`);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateLegacyEntries()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateLegacyEntries };