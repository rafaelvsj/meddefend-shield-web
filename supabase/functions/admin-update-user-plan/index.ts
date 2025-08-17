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

    // Confirma role admin/owner
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleRow, error: roleErr } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", actorId)
      .maybeSingle();

    if (roleErr) {
      return json(500, { error: "Failed to check admin role", requestId, debug: roleErr.message });
    }
    const isAdmin = roleRow?.role === "admin" || roleRow?.role === "owner";
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

    // 4) Upsert em subscribers (fonte de verdade)
    const subscribed = newPlan !== "free";

    const { data: existing, error: selErr } = await service
      .from("subscribers")
      .select("id, subscription_tier")
      .eq("user_id", userId)
      .maybeSingle();

    const oldPlan: Plan | null = existing?.subscription_tier ?? null;

    const { error: upsertErr } = await service.from("subscribers").upsert(
      {
        user_id: userId,
        email,
        subscription_tier: newPlan,
        subscribed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (upsertErr) {
      return json(500, {
        error: "Failed to upsert subscribers",
        requestId,
        debug: upsertErr.message,
      });
    }

    // 5) Verificar se admin mudou próprio plano (FASE 4)
    const selfUpdated = actorId === userId;
    
    // 6) Resposta clara
    return json(200, {
      success: true,
      userId,
      oldPlan,
      newPlan,
      subscribed,
      selfUpdated,
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