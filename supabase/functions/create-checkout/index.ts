import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT ${timestamp}] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started", { url: req.url, method: req.method });

    // Enhanced Stripe key validation
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    logStep("Checking Stripe key", { keyExists: !!stripeKey });
    
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not found in environment");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    
    if (!stripeKey.startsWith("sk_")) {
      logStep("ERROR: Invalid Stripe key format", { keyPrefix: stripeKey.substring(0, 3) });
      throw new Error("STRIPE_SECRET_KEY deve ser uma chave secreta (sk_), não pública (pk_)");
    }
    
    logStep("Stripe key verified", { 
      keyType: stripeKey.substring(0, 7) + "...",
      keyLength: stripeKey.length,
      environment: stripeKey.includes("test") ? "test" : "live"
    });

    // Create a Supabase client using the anon key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    logStep("Supabase client created");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Extracting token from header");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("User authentication failed", { error: userError.message });
      throw new Error(`Authentication error: ${userError.message}`);
    }
    const user = userData.user;
    if (!user?.email) {
      logStep("No user or email found");
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Enhanced request body parsing with error handling
    logStep("Reading request body");
    const body = await req.text();
    logStep("Raw request body received", { bodyLength: body.length, body: body.substring(0, 200) });
    
    if (!body) {
      logStep("ERROR: Empty request body");
      throw new Error("No request body provided");
    }
    
    let parsed;
    try {
      parsed = JSON.parse(body);
      logStep("JSON parsed successfully", { parsed });
    } catch (parseError) {
      logStep("ERROR: JSON parse failed", { error: parseError.message, body });
      throw new Error(`Invalid JSON in request body: ${parseError.message}`);
    }
    
    const { plan } = parsed;
    if (!plan) {
      logStep("ERROR: No plan specified in request");
      throw new Error("Plan is required in request body");
    }
    
    logStep("Plan received and validated", { plan, fullBody: parsed });

    // Initialize Stripe with enhanced error handling
    logStep("Initializing Stripe client");
    let stripe;
    try {
      stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
      logStep("Stripe client initialized successfully");
    } catch (stripeError) {
      logStep("ERROR: Failed to initialize Stripe", { error: stripeError.message });
      throw new Error(`Failed to initialize Stripe: ${stripeError.message}`);
    }
    
    // Check if customer already exists with enhanced logging
    logStep("Checking for existing Stripe customer", { userEmail: user.email });
    let customers, customerId;
    try {
      customers = await stripe.customers.list({ email: user.email, limit: 1 });
      logStep("Customer lookup completed", { customersFound: customers.data.length });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer", { customerId, customerEmail: customers.data[0].email });
      } else {
        logStep("No existing customer found, will create during checkout");
      }
    } catch (customerError) {
      logStep("ERROR: Failed to lookup customer", { error: customerError.message });
      throw new Error(`Failed to lookup customer: ${customerError.message}`);
    }

    // Define plan pricing
    const plans = {
      starter: { price: 4990, name: "Starter Plan" }, // R$ 49,90
      professional: { price: 12990, name: "Professional Plan" }, // R$ 129,90
      ultra: { price: 34990, name: "Ultra Plan" } // R$ 349,90
    };

    const selectedPlan = plans[plan as keyof typeof plans];
    if (!selectedPlan) {
      logStep("ERROR: Invalid plan selected", { plan, availablePlans: Object.keys(plans) });
      throw new Error(`Invalid plan selected: ${plan}. Available plans: ${Object.keys(plans).join(', ')}`);
    }

    logStep("Creating checkout session", { selectedPlan, userEmail: user.email, customerId });

    let session;
    try {
      session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { 
              name: selectedPlan.name,
              description: `Assinatura mensal do plano ${selectedPlan.name}`
            },
            unit_amount: selectedPlan.price,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
        mode: "subscription",
        success_url: `${req.headers.get("origin")}/dashboard?payment=success`,
        cancel_url: `${req.headers.get("origin")}/checkout?payment=canceled`,
      });
      
      logStep("Checkout session created successfully", { 
        sessionId: session.id, 
        url: session.url,
        mode: session.mode,
        customer: session.customer
      });
    } catch (sessionError) {
      logStep("ERROR: Failed to create checkout session", { 
        error: sessionError.message,
        selectedPlan,
        userEmail: user.email
      });
      throw new Error(`Failed to create checkout session: ${sessionError.message}`);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logStep("CRITICAL ERROR in create-checkout", { 
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString(),
      details: "Check server logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});