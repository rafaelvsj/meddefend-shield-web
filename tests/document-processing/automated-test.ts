#!/usr/bin/env deno run --allow-net --allow-read --allow-write

/**
 * Automated Document Processing Test Suite
 * Tests all supported file formats and validates processing pipeline
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface TestFile {
  name: string;
  path: string;
  expectedMimeType: string;
  minTextLength: number;
  expectedKeywords: string[];
}

const TEST_FILES: TestFile[] = [
  {
    name: "Plain Text",
    path: "./test-files/sample.txt",
    expectedMimeType: "text/plain",
    minTextLength: 200,
    expectedKeywords: ["texto simples", "cefaleia", "tomografia"]
  },
  {
    name: "HTML Document",
    path: "./test-files/sample.html",
    expectedMimeType: "text/html",
    minTextLength: 300,
    expectedKeywords: ["João Silva", "Tomografia", "Normal", "cefaleia"]
  }
];

class DocumentProcessingTester {
  private supabase: any;
  private results: any[] = [];

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadTestFile(testFile: TestFile): Promise<string> {
    console.log(`📁 Uploading ${testFile.name}...`);
    
    try {
      // Read file
      const fileContent = await Deno.readFile(testFile.path);
      const fileName = `test-${Date.now()}-${testFile.name.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('knowledge-base')
        .upload(fileName, fileContent);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create knowledge base entry
      const { data: kbData, error: kbError } = await this.supabase
        .from('knowledge_base')
        .insert({
          file_name: fileName,
          original_name: testFile.name,
          file_type: testFile.expectedMimeType,
          file_size: fileContent.length,
          status: 'pending'
        })
        .select()
        .single();

      if (kbError) {
        throw new Error(`KB entry failed: ${kbError.message}`);
      }

      console.log(`✅ Uploaded ${testFile.name} with ID: ${kbData.id}`);
      return kbData.id;
      
    } catch (error) {
      console.error(`❌ Upload failed for ${testFile.name}:`, error.message);
      throw error;
    }
  }

  async processDocument(fileId: string): Promise<any> {
    console.log(`⚙️ Processing document ${fileId}...`);
    
    try {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/document-processor-v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Processing failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Processing completed for ${fileId}`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Processing failed for ${fileId}:`, error.message);
      throw error;
    }
  }

  async validateResult(fileId: string, testFile: TestFile, processingResult: any): Promise<boolean> {
    console.log(`🔍 Validating results for ${testFile.name}...`);
    
    try {
      // Get processed data
      const { data: kbData, error: kbError } = await this.supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', fileId)
        .single();

      if (kbError) {
        throw new Error(`Failed to fetch KB data: ${kbError.message}`);
      }

      // Get processing logs
      const { data: logs, error: logsError } = await this.supabase
        .from('kb_processing_logs')
        .select('*')
        .eq('file_id', fileId)
        .order('created_at', { ascending: true });

      if (logsError) {
        throw new Error(`Failed to fetch logs: ${logsError.message}`);
      }

      // Validation checks
      const checks = {
        status_processed: kbData.status === 'processed',
        similarity_high: kbData.similarity_score >= 0.99,
        text_length_ok: kbData.content.length >= testFile.minTextLength,
        markdown_exists: !!kbData.markdown_content,
        mime_type_correct: kbData.mime_type === testFile.expectedMimeType,
        keywords_present: testFile.expectedKeywords.every(keyword => 
          kbData.content.toLowerCase().includes(keyword.toLowerCase())
        ),
        embeddings_created: processingResult.chunksCreated > 0,
        no_errors: !kbData.validation_errors || kbData.validation_errors.length === 0
      };

      const passed = Object.values(checks).every(check => check);
      
      this.results.push({
        testFile: testFile.name,
        fileId,
        passed,
        checks,
        logs: logs.length,
        similarityScore: kbData.similarity_score,
        textLength: kbData.content.length,
        markdownLength: kbData.markdown_content?.length || 0,
        extractionMethod: kbData.extraction_method,
        ocrUsed: kbData.ocr_used
      });

      if (passed) {
        console.log(`✅ All validations passed for ${testFile.name}`);
      } else {
        console.log(`❌ Validation failed for ${testFile.name}:`, checks);
      }

      return passed;
      
    } catch (error) {
      console.error(`❌ Validation failed for ${testFile.name}:`, error.message);
      return false;
    }
  }

  async cleanup(fileId: string) {
    try {
      // Delete chunks
      await this.supabase
        .from('document_chunks')
        .delete()
        .eq('knowledge_base_id', fileId);

      // Delete KB entry
      const { data: kbData } = await this.supabase
        .from('knowledge_base')
        .select('file_name')
        .eq('id', fileId)
        .single();

      if (kbData?.file_name) {
        await this.supabase.storage
          .from('knowledge-base')
          .remove([kbData.file_name]);
      }

      await this.supabase
        .from('knowledge_base')
        .delete()
        .eq('id', fileId);

      console.log(`🧹 Cleaned up ${fileId}`);
      
    } catch (error) {
      console.log(`⚠️ Cleanup warning for ${fileId}: ${error.message}`);
    }
  }

  async runTests(): Promise<boolean> {
    console.log("🚀 Starting Document Processing Test Suite\n");
    
    let allPassed = true;
    
    for (const testFile of TEST_FILES) {
      console.log(`\n📋 Testing: ${testFile.name}`);
      console.log("=".repeat(50));
      
      let fileId: string | null = null;
      
      try {
        // Upload
        fileId = await this.uploadTestFile(testFile);
        
        // Process
        const result = await this.processDocument(fileId);
        
        // Validate
        const passed = await this.validateResult(fileId, testFile, result);
        
        if (!passed) {
          allPassed = false;
        }
        
      } catch (error) {
        console.error(`❌ Test failed for ${testFile.name}:`, error.message);
        allPassed = false;
      } finally {
        // Cleanup
        if (fileId) {
          await this.cleanup(fileId);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
    }
    
    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    
    this.results.forEach(result => {
      const status = result.passed ? "✅ PASSED" : "❌ FAILED";
      console.log(`${status} ${result.testFile}`);
      console.log(`   Similarity: ${(result.similarityScore * 100).toFixed(2)}%`);
      console.log(`   Text Length: ${result.textLength} chars`);
      console.log(`   Method: ${result.extractionMethod}`);
      console.log(`   OCR Used: ${result.ocrUsed}`);
      console.log(`   Logs: ${result.logs} entries\n`);
    });
    
    const passedCount = this.results.filter(r => r.passed).length;
    const totalCount = this.results.length;
    
    console.log(`Final Result: ${passedCount}/${totalCount} tests passed`);
    
    if (allPassed) {
      console.log("🎉 ALL TESTS PASSED - PIPELINE IS READY FOR PRODUCTION");
    } else {
      console.log("⚠️ SOME TESTS FAILED - REVIEW REQUIRED");
    }
    
    return allPassed;
  }
}

// Run tests if called directly
if (import.meta.main) {
  const tester = new DocumentProcessingTester();
  const success = await tester.runTests();
  Deno.exit(success ? 0 : 1);
}