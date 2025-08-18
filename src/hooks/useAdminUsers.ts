import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  role: string;
  status: string;
  lastLogin: string;
  createdAt: string;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});

  const fetchUsers = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current session to ensure we have a valid token
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session - please login again');
      }

      console.log('🔍 Invoking admin-users function...');
      const { data, error } = await supabase.functions.invoke('admin-users', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });
      
      console.log('📊 admin-users response:', { data, error });
      
      if (error) {
        // If it's a 403 and we haven't retried, try refreshing session
        if (error.message?.includes('403') && retryCount === 0) {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError) {
            return fetchUsers(1); // Retry once with refreshed token
          }
        }
        throw new Error(error.message || 'Failed to load users');
      }
      
      setUsers(data.users || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuários';
      setError(errorMessage);
      console.error('Admin users fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserPlan = useCallback(async (userId: string, newPlan: "free"|"starter"|"pro") => {
    setUpdatingIds((s) => ({ ...s, [userId]: true }));
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session');
      }

      console.log('🔄 Calling RPC admin_update_user_plan...', { userId, newPlan });
      const { data, error } = await supabase.rpc('admin_update_user_plan', {
        p_user_id: userId,
        p_new_plan: newPlan,
        p_reason: 'admin panel'
      });

      if (error) {
        console.error('❌ RPC error:', error);
        throw new Error(error.message || 'Falha ao atualizar plano');
      }
      
      console.log('✅ RPC success:', data);
      if (!(data as any)?.ok) {
        throw new Error('RPC returned failure status');
      }

      // Refetch users to reflect changes
      await fetchUsers();
      
      return { ok: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao atualizar plano';
      console.error('❌ Update error:', errorMessage);
      return { ok: false, error: errorMessage };
    } finally {
      setUpdatingIds((s) => ({ ...s, [userId]: false }));
    }
  }, [fetchUsers]);

  return { users, loading, error, updatingIds, fetchUsers, updateUserPlan };
};