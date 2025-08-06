import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";

async function makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = "https://zwgjnynnbxiomtnnvztt.supabase.co";
  const url = `${baseUrl}${endpoint}`;
  
  return await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z2pueW5uYnhpb210bm52enR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzgyMDQsImV4cCI6MjA2NjgxNDIwNH0.Nkn5ppwHtEZVK8qN8kXFvvBDCpKahT-E4SKQASaabkk`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

Deno.test("Knowledge Base Logs API", async () => {
  const response = await makeRequest("/functions/v1/admin-kb-logs");
  
  // Should return 403 for non-admin users with anon key
  assertEquals(response.status, 403, "Should reject non-admin access");
  
  const data = await response.json();
  assertExists(data.error, "Should return error message for non-admin");
});

Deno.test("Knowledge Base Stats API", async () => {
  const response = await makeRequest("/functions/v1/admin-kb-logs?action=stats");
  
  // Should return 403 for non-admin users
  assertEquals(response.status, 403, "Should reject non-admin access");
  
  console.log("✅ KB Logs API tests pass - admin access properly protected");
});