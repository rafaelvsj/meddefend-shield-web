import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  user_id: string
  new_role: 'admin' | 'user' | 'suspended'
  new_plan: 'free' | 'basic_comp' | 'pro_comp' | 'premium_comp'
}

interface UpdateResponse {
  status: string
  previous_role?: string
  new_role: string
  previous_plan?: string
  new_plan: string
  user_id: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin role
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Get admin user from JWT
    const jwt = authHeader.replace('Bearer ', '')
    const { data: adminUser, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !adminUser.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: adminUser.user.id, _role: 'admin' })

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: corsHeaders }
      )
    }

    // Parse request body
    const body: RequestBody = await req.json()
    const { user_id, new_role, new_plan } = body

    // Validate input
    if (!user_id || !new_role || !new_plan) {
      return new Response(
        JSON.stringify({ error: 'user_id, new_role and new_plan are required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (!['admin', 'user', 'suspended'].includes(new_role)) {
      return new Response(
        JSON.stringify({ error: 'new_role must be: admin, user, or suspended' }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (!['free', 'basic_comp', 'pro_comp', 'premium_comp'].includes(new_plan)) {
      return new Response(
        JSON.stringify({ error: 'new_plan must be: free, basic_comp, pro_comp, or premium_comp' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Get current role
    const { data: currentRoles, error: getCurrentRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .single()

    const previous_role = currentRoles?.role || 'user'

    // Get current plan
    const { data: currentSubscriber, error: getCurrentPlanError } = await supabase
      .from('subscribers')
      .select('subscription_tier, is_comp')
      .eq('user_id', user_id)
      .single()

    const previous_plan = currentSubscriber?.is_comp 
      ? `${currentSubscriber.subscription_tier}_comp` 
      : currentSubscriber?.subscription_tier || 'free'

    // Update role in user_roles table
    const { error: upsertRoleError } = await supabase
      .from('user_roles')
      .upsert({ 
        user_id: user_id, 
        role: new_role 
      }, { 
        onConflict: 'user_id,role' 
      })

    if (upsertRoleError) {
      console.error('Error updating user role:', upsertRoleError)
      return new Response(
        JSON.stringify({ error: 'Failed to update role' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Update plan in subscribers table
    if (new_plan === 'free') {
      // Set to free plan
      const { error: updateSubError } = await supabase
        .from('subscribers')
        .upsert({ 
          user_id: user_id,
          subscription_tier: 'free',
          is_comp: false,
          subscribed: false,
          updated_at: new Date().toISOString()
        })

      if (updateSubError) {
        console.error('Error updating subscription to free:', updateSubError)
        return new Response(
          JSON.stringify({ error: 'Failed to update plan' }),
          { status: 500, headers: corsHeaders }
        )
      }
    } else {
      // Set to comp plan
      const planTier = new_plan.replace('_comp', '')
      const { error: updateSubError } = await supabase
        .from('subscribers')
        .upsert({ 
          user_id: user_id,
          subscription_tier: planTier,
          is_comp: true,
          subscribed: true,
          subscription_end: null, // No end date for comp plans
          updated_at: new Date().toISOString()
        })

      if (updateSubError) {
        console.error('Error updating subscription to comp:', updateSubError)
        return new Response(
          JSON.stringify({ error: 'Failed to update plan' }),
          { status: 500, headers: corsHeaders }
        )
      }
    }

    // Log the changes
    console.log('User role and plan updated', {
      admin_id: adminUser.user.id,
      target_user_id: user_id,
      previous_role,
      new_role,
      previous_plan,
      new_plan,
      timestamp: new Date().toISOString()
    })

    const response: UpdateResponse = {
      status: 'ok',
      previous_role,
      new_role,
      previous_plan,
      new_plan,
      user_id
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in admin-update-user-plan-role:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})