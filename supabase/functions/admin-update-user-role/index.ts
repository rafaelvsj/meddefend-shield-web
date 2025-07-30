import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
import { logger } from '../_shared/logger.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  user_id: string
  new_role: 'admin' | 'user' | 'suspended'
}

interface UpdateRoleResponse {
  status: string
  previous_role?: string
  new_role: string
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
      logger.warn('Missing authorization header', { endpoint: 'admin-update-user-role' })
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Get admin user from JWT
    const jwt = authHeader.replace('Bearer ', '')
    const { data: adminUser, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !adminUser.user) {
      logger.warn('Invalid JWT token', { endpoint: 'admin-update-user-role', error: authError })
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: adminUser.user.id, _role: 'admin' })

    if (roleError || !isAdmin) {
      logger.warn('Non-admin user attempting role change', {
        admin_id: adminUser.user.id,
        endpoint: 'admin-update-user-role'
      })
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: corsHeaders }
      )
    }

    // Parse request body
    const body: RequestBody = await req.json()
    const { user_id, new_role } = body

    // Validate input
    if (!user_id || !new_role) {
      return new Response(
        JSON.stringify({ error: 'user_id and new_role are required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (!['admin', 'user', 'suspended'].includes(new_role)) {
      return new Response(
        JSON.stringify({ error: 'new_role must be: admin, user, or suspended' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Get current role
    const { data: currentRoles, error: getCurrentError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .single()

    if (getCurrentError && getCurrentError.code !== 'PGRST116') { // PGRST116 = not found
      logger.error('Error getting current role', {
        error: getCurrentError,
        user_id,
        admin_id: adminUser.user.id
      })
      return new Response(
        JSON.stringify({ error: 'Failed to get current role' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const previous_role = currentRoles?.role || 'user'

    // Update role in user_roles table
    const { error: upsertError } = await supabase
      .from('user_roles')
      .upsert({ 
        user_id: user_id, 
        role: new_role 
      }, { 
        onConflict: 'user_id,role' 
      })

    if (upsertError) {
      logger.error('Error updating user role', {
        error: upsertError,
        user_id,
        new_role,
        admin_id: adminUser.user.id
      })
      return new Response(
        JSON.stringify({ error: 'Failed to update role' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // If suspended, update profile status
    if (new_role === 'suspended') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user_id)

      if (profileError) {
        logger.warn('Failed to update profile for suspended user', {
          error: profileError,
          user_id,
          admin_id: adminUser.user.id
        })
      }
    }

    // Log the role change
    logger.info('User role updated', {
      admin_id: adminUser.user.id,
      target_user_id: user_id,
      previous_role,
      new_role,
      timestamp: new Date().toISOString()
    })

    const response: UpdateRoleResponse = {
      status: 'ok',
      previous_role,
      new_role,
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
    logger.error('Unexpected error in admin-update-user-role', { error })
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})