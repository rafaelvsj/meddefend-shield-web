import { useState, useEffect } from 'react';
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

  const fetchUsers = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current session to ensure we have a valid token
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session - please login again');
      }

      const { data, error } = await supabase.functions.invoke('admin-users', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });
      
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error('Admin users fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refetch: fetchUsers };
};