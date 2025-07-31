import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

const BASE_URL = "https://zwgjnynnbxiomtnnvztt.supabase.co/functions/v1";

Deno.test("Health Check - /healthz endpoint", async () => {
  const response = await fetch(`${BASE_URL}/healthz`);
  
  assertEquals(response.status, 200, "Health check should return 200");
  
  const body = await response.text();
  assertEquals(body.includes("ok") || body.includes("healthy") || body === "OK", true,
    "Health check should return positive status");
});

Deno.test("Health Check - /metrics endpoint", async () => {
  const response = await fetch(`${BASE_URL}/metrics`);
  
  assertEquals(response.status, 200, "Metrics endpoint should return 200");
});