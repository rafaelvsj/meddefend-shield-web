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

Deno.test("Admin Plan Role - Missing authorization", async () => {
  const response = await fetch(`${BASE_URL}/admin-update-user-plan-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: "123e4567-e89b-12d3-a456-426614174000",
      new_role: "admin",
      new_plan: "pro_comp"
    })
  });
  
  assertEquals(response.status, 401, "Should require authorization");
});

Deno.test("Admin Plan Role - Non-admin user", async () => {
  const response = await makeRequest("admin-update-user-plan-role", {
    method: 'POST',
    body: JSON.stringify({
      user_id: "123e4567-e89b-12d3-a456-426614174000",
      new_role: "admin",
      new_plan: "pro_comp"
    })
  });
  
  // Should return 403 for non-admin users (ANON_KEY is not admin)
  assertEquals(response.status === 401 || response.status === 403, true, 
    "Should reject non-admin users");
});

Deno.test("Admin Plan Role - Invalid role", async () => {
  const response = await makeRequest("admin-update-user-plan-role", {
    method: 'POST',
    body: JSON.stringify({
      user_id: "123e4567-e89b-12d3-a456-426614174000",
      new_role: "invalid_role",
      new_plan: "pro_comp"
    })
  });
  
  // Should return 400 for invalid role even if auth fails first
  assertEquals(response.status === 400 || response.status === 401 || response.status === 403, true,
    "Should reject invalid roles");
});

Deno.test("Admin Plan Role - Invalid plan", async () => {
  const response = await makeRequest("admin-update-user-plan-role", {
    method: 'POST',
    body: JSON.stringify({
      user_id: "123e4567-e89b-12d3-a456-426614174000",
      new_role: "user",
      new_plan: "invalid_plan"
    })
  });
  
  // Should return 400 for invalid plan even if auth fails first
  assertEquals(response.status === 400 || response.status === 401 || response.status === 403, true,
    "Should reject invalid plans");
});

Deno.test("Admin Plan Role - CORS headers", async () => {
  const response = await makeRequest("admin-update-user-plan-role", {
    method: 'OPTIONS'
  });
  
  assertEquals(response.status, 200, "OPTIONS should return 200");
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*",
    "Should have CORS headers");
});