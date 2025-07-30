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

Deno.test("Admin Update User Role - Missing authorization", async () => {
  const response = await fetch(`${BASE_URL}/admin-update-user-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: 'test-user-id',
      new_role: 'admin'
    })
  });
  
  assertEquals(response.status, 401, "Should require authorization");
});

Deno.test("Admin Update User Role - Non-admin user", async () => {
  const response = await makeRequest("admin-update-user-role", {
    method: 'POST',
    body: JSON.stringify({
      user_id: 'test-user-id',
      new_role: 'admin'
    })
  });
  
  // Should return 403 for non-admin users (ANON_KEY is not admin)
  assertEquals(response.status === 401 || response.status === 403, true, 
    "Should reject non-admin users");
});

Deno.test("Admin Update User Role - Invalid role", async () => {
  const response = await makeRequest("admin-update-user-role", {
    method: 'POST',
    body: JSON.stringify({
      user_id: 'test-user-id',
      new_role: 'invalid_role'
    })
  });
  
  // Should handle invalid roles gracefully
  assertEquals(response.status >= 400 && response.status < 500, true,
    "Should reject invalid roles");
});

Deno.test("Admin Update User Role - Missing required fields", async () => {
  const response = await makeRequest("admin-update-user-role", {
    method: 'POST',
    body: JSON.stringify({
      user_id: 'test-user-id'
      // missing new_role
    })
  });
  
  assertEquals(response.status >= 400 && response.status < 500, true,
    "Should reject missing required fields");
});

Deno.test("Admin Update User Role - CORS headers", async () => {
  const response = await makeRequest("admin-update-user-role", {
    method: 'OPTIONS'
  });
  
  assertEquals(response.status, 200, "OPTIONS should return 200");
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*",
    "Should have CORS headers");
  assertEquals(response.headers.get("Access-Control-Allow-Headers")?.includes("authorization"), true,
    "Should allow authorization header");
});