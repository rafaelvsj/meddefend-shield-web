/**
 * Universal Pipeline Test Suite
 * Tests all supported formats with the new document-processor-v2 pipeline
 */

import { createClient } from '@supabase/supabase-js';

interface TestResult {
  format: string;
  fileName: string;
  status: 'PASS' | 'FAIL';
  fileId?: string;
  similarity?: number;
  extractionMethod?: string;
  ocrUsed?: boolean;
  chunksCreated?: number;
  error?: string;
  duration?: number;
}

interface TestFile {
  name: string;
  format: string;
  mimeType: string;
  content: string | Uint8Array;
  expectedSimilarity: number;
}

class UniversalPipelineTest {
  private supabase: any;
  private results: TestResult[] = [];

  constructor() {
    const supabaseUrl = 'https://zwgjnynnbxiomtnnvztt.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z2pueW5uYnhpb210bm52enR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzgyMDQsImV4cCI6MjA2NjgxNDIwNH0.Nkn5ppwHtEZVK8qN8kXFvvBDCpKahT-E4SKQASaabkk';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Universal Pipeline Test Suite');
    console.log('==================================================');

    this.results = [];

    // Define test files for all supported formats
    const testFiles: TestFile[] = [
      {
        name: 'test-document.pdf',
        format: 'PDF',
        mimeType: 'application/pdf',
        content: this.createTestPDF(),
        expectedSimilarity: 0.99
      },
      {
        name: 'test-document.docx',
        format: 'DOCX',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        content: this.createTestDOCX(),
        expectedSimilarity: 0.99
      },
      {
        name: 'test-presentation.pptx',
        format: 'PPTX',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        content: this.createTestPPTX(),
        expectedSimilarity: 0.99
      },
      {
        name: 'test-document.txt',
        format: 'TXT',
        mimeType: 'text/plain',
        content: this.createTestTXT(),
        expectedSimilarity: 0.99
      },
      {
        name: 'test-document.html',
        format: 'HTML',
        mimeType: 'text/html',
        content: this.createTestHTML(),
        expectedSimilarity: 0.99
      },
      {
        name: 'test-document.rtf',
        format: 'RTF',
        mimeType: 'application/rtf',
        content: this.createTestRTF(),
        expectedSimilarity: 0.99
      },
      {
        name: 'test-book.epub',
        format: 'EPUB',
        mimeType: 'application/epub+zip',
        content: this.createTestEPUB(),
        expectedSimilarity: 0.99
      }
    ];

    // Run tests for each format
    for (const testFile of testFiles) {
      await this.testFormat(testFile);
    }

    this.printResults();
    return this.results;
  }

  private async testFormat(testFile: TestFile): Promise<void> {
    const startTime = Date.now();
    console.log(`\n📄 Testing ${testFile.format} format: ${testFile.name}`);

    try {
      // 1. Enable universal pipeline
      await this.enableUniversalPipeline();

      // 2. Upload file to storage
      const fileName = `test-${Date.now()}-${testFile.name}`;
      const blob = typeof testFile.content === 'string' 
        ? new Blob([testFile.content], { type: testFile.mimeType })
        : new Blob([testFile.content], { type: testFile.mimeType });

      console.log(`   ⬆️  Uploading to storage: ${fileName}`);
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('knowledge-base')
        .upload(fileName, blob);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // 3. Create knowledge_base record
      console.log(`   📝 Creating knowledge_base record`);
      const { data: kbData, error: kbError } = await this.supabase
        .from('knowledge_base')
        .insert({
          file_name: fileName,
          original_name: testFile.name,
          file_type: testFile.mimeType,
          file_size: blob.size,
          status: 'pending'
        })
        .select()
        .single();

      if (kbError) {
        throw new Error(`KB insert failed: ${kbError.message}`);
      }

      const fileId = kbData.id;
      console.log(`   🆔 File ID: ${fileId}`);

      // 4. Call document-processor-v2
      console.log(`   ⚙️  Calling document-processor-v2`);
      const { data: processData, error: processError } = await this.supabase.functions
        .invoke('document-processor-v2', {
          body: { fileId }
        });

      if (processError) {
        throw new Error(`Processing failed: ${processError.message}`);
      }

      // 5. Wait for processing completion and verify results
      await this.waitForCompletion(fileId);
      
      const { data: finalRecord, error: fetchError } = await this.supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch final record: ${fetchError.message}`);
      }

      // 6. Verify chunks were created
      const { data: chunks, error: chunkError } = await this.supabase
        .from('document_chunks')
        .select('*')
        .eq('knowledge_base_id', fileId);

      if (chunkError) {
        throw new Error(`Failed to fetch chunks: ${chunkError.message}`);
      }

      // 7. Validate results
      const isValid = this.validateResults(finalRecord, chunks || [], testFile);
      
      const duration = Date.now() - startTime;
      
      if (isValid) {
        console.log(`   ✅ PASS - Similarity: ${(finalRecord.similarity_score * 100).toFixed(2)}%`);
        this.results.push({
          format: testFile.format,
          fileName: testFile.name,
          status: 'PASS',
          fileId,
          similarity: finalRecord.similarity_score,
          extractionMethod: finalRecord.extraction_method,
          ocrUsed: finalRecord.ocr_used,
          chunksCreated: chunks?.length || 0,
          duration
        });
      } else {
        throw new Error('Validation failed');
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`   ❌ FAIL - ${error.message}`);
      
      this.results.push({
        format: testFile.format,
        fileName: testFile.name,
        status: 'FAIL',
        error: error.message,
        duration
      });
    }
  }

  private async enableUniversalPipeline(): Promise<void> {
    const { error } = await this.supabase
      .from('pipeline_settings')
      .update({ setting_value: 'true' })
      .eq('setting_key', 'USE_UNIVERSAL_PIPELINE');

    if (error) {
      throw new Error(`Failed to enable universal pipeline: ${error.message}`);
    }
  }

  private async waitForCompletion(fileId: string, maxWaitTime = 60000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const { data, error } = await this.supabase
        .from('knowledge_base')
        .select('status')
        .eq('id', fileId)
        .single();

      if (error) {
        throw new Error(`Failed to check status: ${error.message}`);
      }

      if (data.status === 'processed') {
        console.log(`   ⏱️  Processing completed in ${Date.now() - startTime}ms`);
        return;
      }

      if (data.status === 'error') {
        throw new Error('Processing failed with error status');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Processing timeout');
  }

  private validateResults(record: any, chunks: any[], testFile: TestFile): boolean {
    // Validate status
    if (record.status !== 'processed') {
      console.log(`   ❌ Invalid status: ${record.status}`);
      return false;
    }

    // Validate similarity score
    if (!record.similarity_score || record.similarity_score < testFile.expectedSimilarity) {
      console.log(`   ❌ Low similarity: ${record.similarity_score} < ${testFile.expectedSimilarity}`);
      return false;
    }

    // Validate required fields are filled
    const requiredFields = ['markdown_content', 'extraction_method', 'mime_type'];
    for (const field of requiredFields) {
      if (!record[field]) {
        console.log(`   ❌ Missing field: ${field}`);
        return false;
      }
    }

    // Validate chunks were created
    if (!chunks || chunks.length === 0) {
      console.log(`   ❌ No chunks created`);
      return false;
    }

    // Validate each chunk has embeddings
    for (const chunk of chunks) {
      if (!chunk.embedding || !chunk.content) {
        console.log(`   ❌ Invalid chunk: missing embedding or content`);
        return false;
      }
    }

    return true;
  }

  private createTestPDF(): string {
    return `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 44 >> stream
BT /F1 12 Tf 100 700 Td (Test PDF Document) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
297
%%EOF`;
  }

  private createTestDOCX(): Uint8Array {
    // Simplified DOCX structure (ZIP format)
    const content = 'Test DOCX Document Content for Universal Pipeline Testing';
    return new TextEncoder().encode(content);
  }

  private createTestPPTX(): Uint8Array {
    // Simplified PPTX structure
    const content = 'Test PPTX Presentation Content for Universal Pipeline Testing';
    return new TextEncoder().encode(content);
  }

  private createTestTXT(): string {
    return `Test Document for Universal Pipeline

Introduction
This is a test document to validate the universal pipeline processing.

Section 1: Content Validation
- The pipeline should extract this text
- Convert it to markdown format
- Achieve high similarity score

Section 2: Requirements
1. Similarity score >= 0.99
2. Proper markdown conversion
3. Chunk creation with embeddings

Conclusion
This test validates end-to-end pipeline functionality.`;
  }

  private createTestHTML(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Test HTML Document</title>
</head>
<body>
    <h1>Test Document for Universal Pipeline</h1>
    
    <h2>Introduction</h2>
    <p>This is a test document to validate the universal pipeline processing.</p>
    
    <h2>Section 1: Content Validation</h2>
    <ul>
        <li>The pipeline should extract this text</li>
        <li>Convert it to markdown format</li>
        <li>Achieve high similarity score</li>
    </ul>
    
    <h2>Section 2: Requirements</h2>
    <ol>
        <li>Similarity score >= 0.99</li>
        <li>Proper markdown conversion</li>
        <li>Chunk creation with embeddings</li>
    </ol>
    
    <h2>Conclusion</h2>
    <p>This test validates end-to-end pipeline functionality.</p>
</body>
</html>`;
  }

  private createTestRTF(): string {
    return `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 Test Document for Universal Pipeline

Introduction
This is a test document to validate the universal pipeline processing.

Section 1: Content Validation
- The pipeline should extract this text
- Convert it to markdown format
- Achieve high similarity score

Section 2: Requirements
1. Similarity score >= 0.99
2. Proper markdown conversion
3. Chunk creation with embeddings

Conclusion
This test validates end-to-end pipeline functionality.}`;
  }

  private createTestEPUB(): Uint8Array {
    // Simplified EPUB structure
    const content = 'Test EPUB Content for Universal Pipeline Testing';
    return new TextEncoder().encode(content);
  }

  private printResults(): void {
    console.log('\n📊 Universal Pipeline Test Results');
    console.log('==================================================');
    
    const passed = this.results.filter(r => r.status === 'PASS');
    const failed = this.results.filter(r => r.status === 'FAIL');
    
    console.log(`✅ Passed: ${passed.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📈 Success Rate: ${((passed.length / this.results.length) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    console.log('--------------------------------------------------');
    
    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      const similarity = result.similarity ? `${(result.similarity * 100).toFixed(2)}%` : 'N/A';
      const duration = result.duration ? `${(result.duration / 1000).toFixed(1)}s` : 'N/A';
      
      console.log(`${status} ${result.format.padEnd(6)} | ${similarity.padEnd(8)} | ${duration.padEnd(6)} | ${result.fileName}`);
      
      if (result.status === 'FAIL' && result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });
    
    if (failed.length === 0) {
      console.log('\n🎉 All tests passed! Universal pipeline is ready for production.');
    } else {
      console.log(`\n⚠️  ${failed.length} test(s) failed. Please review before enabling universal pipeline.`);
    }
  }
}

// Export the test function
export async function runUniversalPipelineTests(): Promise<TestResult[]> {
  const tester = new UniversalPipelineTest();
  return await tester.runAllTests();
}

// Run if called directly
if (import.meta.main) {
  (async () => {
    const results = await runUniversalPipelineTests();
    const failedTests = results.filter(r => r.status === 'FAIL');
    Deno.exit(failedTests.length > 0 ? 1 : 0);
  })();
}