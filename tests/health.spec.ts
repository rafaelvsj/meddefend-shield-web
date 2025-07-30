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

Deno.test("Health Check - Basic availability", async () => {
  const response = await makeRequest('healthz');
  
  assertEquals(response.status, 200);
  
  const data = await response.json();
  assertExists(data.status);
  assertEquals(data.status, 'healthy');
  assertExists(data.checks);
});

Deno.test("Health Check - Database connectivity", async () => {
  const response = await makeRequest('healthz');
  const data = await response.json();
  
  const dbCheck = data.checks.find((check: any) => check.service === 'database');
  assertExists(dbCheck);
  assertEquals(dbCheck.status, 'healthy');
  assertExists(dbCheck.latency_ms);
});

Deno.test("Health Check - Queue system", async () => {
  const response = await makeRequest('healthz');
  const data = await response.json();
  
  const queueCheck = data.checks.find((check: any) => check.service === 'queue');
  assertExists(queueCheck);
  assertEquals(queueCheck.status, 'healthy');
});

Deno.test("Health Check - Cache system", async () => {
  const response = await makeRequest('healthz');
  const data = await response.json();
  
  const cacheCheck = data.checks.find((check: any) => check.service === 'cache');
  assertExists(cacheCheck);
  assertEquals(cacheCheck.status, 'healthy');
});

Deno.test("Health Check - Response time under 5 seconds", async () => {
  const startTime = Date.now();
  const response = await makeRequest('healthz');
  const endTime = Date.now();
  
  assertEquals(response.status, 200);
  
  const responseTime = endTime - startTime;
  if (responseTime > 5000) {
    throw new Error(`Health check took too long: ${responseTime}ms`);
  }
});

Deno.test("Health Check - CORS headers present", async () => {
  const response = await makeRequest('healthz');
  
  assertEquals(response.status, 200);
  assertExists(response.headers.get('Access-Control-Allow-Origin'));
});