import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

const BASE_URL = "https://zwgjnynnbxiomtnnvztt.supabase.co/functions/v1";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z2pueW5uYnhpb210bm52enR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzgyMDQsImV4cCI6MjA2NjgxNDIwNH0.Nkn5ppwHtEZVK8qN8kXFvvBDCpKahT-E4SKQASaabkk";

async function makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  return await fetch(`${BASE_URL}/${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
}

Deno.test("Admin Users - Missing authorization", async () => {
  const response = await fetch(`${BASE_URL}/admin-users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  assertEquals(response.status, 401, "Should require authorization");
});

Deno.test("Admin Users - Non-admin user", async () => {
  const response = await makeRequest("admin-users", {
    method: 'GET'
  });
  
  // Should return 403 for non-admin users (ANON_KEY is not admin)
  assertEquals(response.status === 401 || response.status === 403, true, 
    "Should reject non-admin users");
});

Deno.test("Admin Users - CORS headers", async () => {
  const response = await makeRequest("admin-users", {
    method: 'OPTIONS'
  });
  
  assertEquals(response.status, 200, "OPTIONS should return 200");
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*",
    "Should have CORS headers");
});