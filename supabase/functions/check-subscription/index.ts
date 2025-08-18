import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Function started", { method: req.method, url: req.url });

  try {
    // Environment check
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    logStep("Environment check", { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasServiceKey: !!supabaseServiceKey,
      hasStripeKey: !!stripeKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    if (!stripeKey) {
      logStep("No Stripe key - returning unsubscribed state");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!stripeKey.startsWith("sk_")) {
      logStep("Invalid Stripe key format", { keyStart: stripeKey.substring(0, 3) });
      throw new Error("STRIPE_SECRET_KEY deve ser uma chave secreta (sk_), não pública (pk_)");
    }
    
    logStep("Stripe key verified", { keyType: stripeKey.substring(0, 7) + "..." });

    // Use the service role key to perform writes (upsert) in Supabase
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    );

    logStep("Supabase client created");

    // Check if user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header - returning unsubscribed state");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("Authentication failed, returning unsubscribed state", { error: userError.message });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const user = userData.user;
    if (!user?.email) {
      logStep("No user or email found - returning unsubscribed state");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    logStep("Stripe client initialized");

    // Search for customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    logStep("Customer search completed", { found: customers.data.length > 0 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating to free plan");
      
      // Usar set_user_plan
      await supabaseClient.rpc('set_user_plan', {
        p_source: 'stripe-webhook',
        p_user_id: user.id,
        p_new_plan: 'free',
        p_reason: 'No Stripe customer found'
      });
      
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;

    logStep("Subscription check completed", { hasActiveSub, count: subscriptions.data.length });

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      if (amount <= 5000) {
        subscriptionTier = "starter";
      } else if (amount <= 15000) {
        subscriptionTier = "professional";
      } else {
        subscriptionTier = "ultra";
      }
      logStep("Determined subscription tier", { priceId, amount, subscriptionTier });
    } else {
      logStep("No active subscription found");
    }

    // Usar set_user_plan ao invés de upsert direto
    const { data: planResult, error: planError } = await supabaseClient.rpc('set_user_plan', {
      p_source: 'stripe-webhook',
      p_user_id: user.id,
      p_new_plan: subscriptionTier || 'free',
      p_reason: `Stripe sync: ${hasActiveSub ? 'active subscription' : 'no active subscription'}`
    });

    logStep("Database update completed", { 
      success: !planError, 
      error: planError?.message,
      planResult,
      subscribed: hasActiveSub, 
      subscriptionTier 
    });

    const response = {
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    };

    logStep("Function completed successfully", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage, stack: error?.stack });
    
    // Return a safe response instead of error
    return new Response(JSON.stringify({ 
      subscribed: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Changed from 500 to 200 to prevent frontend errors
    });
  }
});