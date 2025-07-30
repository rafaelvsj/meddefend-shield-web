import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const BASE_URL = Deno.env.get('SUPABASE_URL') || 'https://zwgjnynnbxiomtnnvztt.supabase.co';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z2pueW5uYnhpb210bm52enR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzgyMDQsImV4cCI6MjA2NjgxNDIwNH0.Nkn5ppwHtEZVK8qN8kXFvvBDCpKahT-E4SKQASaabkk';

async function makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${BASE_URL}/functions/v1/${endpoint}`;
  
  const defaultHeaders = {
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
    'apikey': ANON_KEY
  };

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  });
}

Deno.test("External API - Process Document endpoint", async () => {
  const response = await makeRequest('process-document', {
    method: 'POST',
    body: JSON.stringify({
      action: 'test',
      fileId: 'test-file-id'
    })
  });
  
  // Should handle invalid requests gracefully
  assertEquals(response.status >= 400 && response.status < 500, true);
});

Deno.test("External API - Cache endpoint", async () => {
  const response = await makeRequest('cache', {
    method: 'POST',
    body: JSON.stringify({
      action: 'get',
      key: 'test-key'
    })
  });
  
  assertEquals(response.status, 200);
  const data = await response.json();
  assertExists(data);
});

Deno.test("External API - Notifications endpoint", async () => {
  const response = await makeRequest('notifications', {
    method: 'POST',
    body: JSON.stringify({
      action: 'send',
      userId: 'test-user',
      type: 'test',
      title: 'Test Notification',
      message: 'Test message'
    })
  });
  
  // Should handle without authentication
  assertEquals(response.status >= 400 && response.status < 500, true);
});

Deno.test("External API - Worker endpoint (admin only)", async () => {
  const response = await makeRequest('worker', {
    method: 'POST',
    body: JSON.stringify({
      action: 'stats'
    })
  });
  
  // Should require authentication
  assertEquals(response.status, 401);
});

Deno.test("External API - Metrics endpoint (admin only)", async () => {
  const response = await makeRequest('metrics');
  
  // Should require authentication or metrics disabled
  assertEquals(response.status === 401 || response.status === 503, true);
});

Deno.test("External API - Key rotation endpoint (admin only)", async () => {
  const response = await makeRequest('key-rotation');
  
  // Should require admin authentication
  assertEquals(response.status, 401);
});

Deno.test("External API - Backup endpoint (admin only)", async () => {
  const response = await makeRequest('backup', {
    method: 'POST',
    body: JSON.stringify({
      action: 'status'
    })
  });
  
  // Should require admin authentication
  assertEquals(response.status, 401);
});

Deno.test("External API - CORS headers on all endpoints", async () => {
  const endpoints = ['healthz', 'cache', 'notifications', 'worker'];
  
  for (const endpoint of endpoints) {
    const response = await makeRequest(endpoint, { method: 'OPTIONS' });
    
    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
    assertExists(response.headers.get('Access-Control-Allow-Headers'));
  }
});

Deno.test("External API - Rate limiting and security headers", async () => {
  const response = await makeRequest('healthz');
  
  assertEquals(response.status, 200);
  
  // Should have CORS headers
  assertExists(response.headers.get('Access-Control-Allow-Origin'));
  
  // Should not expose sensitive headers
  assertEquals(response.headers.get('X-Powered-By'), null);
  assertEquals(response.headers.get('Server'), null);
});