// supabase/functions/admin-update-user-plan/index.ts
// Objetivo: atualizar o plano (free|starter|pro) garantindo email no upsert (NOT NULL),
// validar admin, auditar e retornar erro útil.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Plan = "free" | "starter" | "pro";

interface Body {
  userId?: string;
  newPlan?: Plan;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    // FASE 0: Diagnóstico imediato - logs dos secrets efetivos
    const supabaseUrl = SUPABASE_URL;
    const hostname = supabaseUrl ? new URL(supabaseUrl).hostname : 'unknown';
    console.log(`[${requestId}] FASE 0 Diagnóstico:`, {
      supabase_hostname: hostname,
      expected_hostname: 'zwgjnynnbxiomtnnvztt.supabase.co',
      hostname_match: hostname === 'zwgjnynnbxiomtnnvztt.supabase.co',
      has_service_key: !!SUPABASE_SERVICE_ROLE_KEY,
      timestamp: new Date().toISOString()
    });
    // 1) Auth do ator (admin)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json(401, { error: "Authorization header required", requestId });
    }

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userRes, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !userRes.user) {
      return json(401, { error: "Invalid token", requestId, debug: userErr?.message });
    }
    const actorId = userRes.user.id;

    // Confirma role admin/owner (tolerante a múltiplos roles)
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: adminRows, error: roleErr } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", actorId)
      .in("role", ["admin"]) // somente admin é necessário
      .limit(1);

    if (roleErr) {
      return json(500, { error: "Failed to check admin role", requestId, debug: roleErr.message });
    }
    const isAdmin = Array.isArray(adminRows) && adminRows.length > 0;
    if (!isAdmin) {
      return json(403, { error: "Admin access required", requestId });
    }

    // 2) Parse body e validação
    const body = (await req.json()) as Body;
    const { userId, newPlan } = body;

    if (!userId || !isUuid(userId)) {
      return json(400, { error: "userId (uuid) is required", requestId });
    }
    if (!newPlan || !["free", "starter", "pro"].includes(newPlan)) {
      return json(400, { error: "newPlan must be one of: free|starter|pro", requestId });
    }

    // 3) Buscar email do usuário alvo (profiles primeiro; fallback auth.users)
    let email: string | null = null;

    const { data: prof, error: profErr } = await service
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) {
      // não retorna; apenas registra
      console.warn("[profiles email lookup error]", { requestId, msg: profErr.message });
    }
    email = prof?.email ?? null;

    if (!email) {
      // Fallback para auth.users via REST (admin)
      const authResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      });
      if (authResp.ok) {
        const authJson = await authResp.json();
        email = authJson?.email ?? null;
      } else {
        console.warn("[auth.fallback email lookup failed]", { requestId, status: authResp.status });
      }
    }

    if (!email) {
      return json(500, {
        error: "User email not found for subscribers upsert (email is NOT NULL).",
        requestId,
      });
    }

    // 4) FASE 2: Prova de escrita via função central set_user_plan
    const { data: existingData, error: existingErr } = await service
      .from("subscribers")
      .select("subscription_tier")
      .eq("user_id", userId)
      .maybeSingle();

    const oldPlan: Plan | null = existingData?.subscription_tier ?? null;

    // Usar função central para escrita com auditoria
    const { data: planResult, error: planError } = await service
      .rpc('set_user_plan', {
        p_source: 'admin',
        p_user_id: userId,
        p_new_plan: newPlan
      });

    if (planError || !planResult?.success) {
      return json(500, {
        error: "Failed to update plan via central function",
        requestId,
        debug: planError?.message || planResult?.error,
      });
    }

    // FASE 2: Verificação forte - confirmar que o banco refletiu a mudança
    const { data: verifyData, error: verifyErr } = await service
      .from("subscribers")
      .select("subscription_tier, subscribed, updated_at")
      .eq("user_id", userId)
      .single();

    if (verifyErr || !verifyData || verifyData.subscription_tier !== newPlan) {
      return json(500, {
        error: "Commit verification failed: DB mismatch after upsert",
        requestId,
        dbEcho: verifyData,
        expectedPlan: newPlan,
        actualPlan: verifyData?.subscription_tier,
      });
    }

    // 5) Verificar se admin mudou próprio plano (FASE 4)
    const selfUpdated = actorId === userId;
    
    // 6) Resposta clara com dbEcho (FASE 2)
    return json(200, {
      success: true,
      userId,
      oldPlan,
      newPlan,
      subscribed: verifyData.subscribed,
      selfUpdated,
      dbEcho: verifyData,  // Prova de que o banco refletiu a mudança
      requestId,
    });
  } catch (e) {
    return json(500, { error: "Unhandled error", requestId, debug: `${e}` });
  }
});

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}