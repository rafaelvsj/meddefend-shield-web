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

Deno.test("Admin Dashboard Integration - All Endpoints", async () => {
  console.log("Testing admin dashboard integration...");

  // Test admin-users endpoint
  const usersResponse = await makeRequest("admin-users");
  console.log(`admin-users status: ${usersResponse.status}`);
  
  if (usersResponse.status === 200) {
    const usersData = await usersResponse.json();
    assertEquals(Array.isArray(usersData.users), true, "Should return users array");
    console.log(`✓ admin-users returned ${usersData.users.length} users`);
  }

  // Test admin-billing endpoint  
  const billingResponse = await makeRequest("admin-billing");
  console.log(`admin-billing status: ${billingResponse.status}`);
  
  if (billingResponse.status === 200) {
    const billingData = await billingResponse.json();
    assertEquals(Array.isArray(billingData.plans), true, "Should return plans array");
    assertEquals(Array.isArray(billingData.recentTransactions), true, "Should return transactions array");
    assertEquals(typeof billingData.totalRevenue, "number", "Should return total revenue");
    assertEquals(typeof billingData.totalUsers, "number", "Should return total users");
    console.log(`✓ admin-billing returned ${billingData.plans.length} plans, ${billingData.recentTransactions.length} transactions`);
  }

  // Test admin-ai-logs endpoint
  const logsResponse = await makeRequest("admin-ai-logs");
  console.log(`admin-ai-logs status: ${logsResponse.status}`);
  
  if (logsResponse.status === 200) {
    const logsData = await logsResponse.json();
    assertEquals(typeof logsData.stats, "object", "Should return stats object");
    assertEquals(Array.isArray(logsData.logs), true, "Should return logs array");
    assertEquals(Array.isArray(logsData.auditLogs), true, "Should return audit logs array");
    console.log(`✓ admin-ai-logs returned ${logsData.logs.length} logs, ${logsData.auditLogs.length} audit logs`);
  }

  // Test admin-system-settings endpoint
  const settingsResponse = await makeRequest("admin-system-settings");
  console.log(`admin-system-settings status: ${settingsResponse.status}`);
  
  if (settingsResponse.status === 200) {
    const settingsData = await settingsResponse.json();
    assertEquals(typeof settingsData.settings, "object", "Should return settings object");
    console.log(`✓ admin-system-settings returned ${Object.keys(settingsData.settings).length} settings`);
  }

  console.log("Admin dashboard integration test completed");
});

Deno.test("Admin Dashboard - CORS Support", async () => {
  const endpoints = ["admin-users", "admin-billing", "admin-ai-logs", "admin-system-settings"];
  
  for (const endpoint of endpoints) {
    const response = await makeRequest(endpoint, { method: 'OPTIONS' });
    assertEquals(response.status, 200, `${endpoint} should support CORS`);
    assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*", `${endpoint} should have CORS headers`);
  }
});

Deno.test("Admin Dashboard - Error Handling", async () => {
  const endpoints = ["admin-users", "admin-billing", "admin-ai-logs", "admin-system-settings"];
  
  for (const endpoint of endpoints) {
    // Test without authorization
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    assertEquals(response.status, 401, `${endpoint} should require authorization`);
  }
});