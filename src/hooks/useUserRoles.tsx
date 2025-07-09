import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'user';

interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export const useUserRoles = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    console.log('ROLES DEBUG - useUserRoles effect:', { user: !!user, userId: user?.id });
    if (user) {
      fetchUserRoles();
    } else {
      setUserRoles([]);
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRoles = async () => {
    if (!user) return;

    console.log('ROLES DEBUG - Fetching roles for user:', user.id);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      console.log('ROLES DEBUG - Query result:', { data, error });

      if (error) {
        console.error('Error fetching user roles:', error);
        return;
      }

      const roles = (data as UserRoleData[])?.map(item => item.role) || [];
      console.log('ROLES DEBUG - Parsed roles:', roles);
      setUserRoles(roles);
      setIsAdmin(roles.includes('admin'));
      console.log('ROLES DEBUG - Final state:', { roles, isAdmin: roles.includes('admin') });
    } catch (error) {
      console.error('Error fetching user roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return userRoles.includes(role);
  };

  const checkIsAdmin = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  return {
    userRoles,
    isAdmin,
    loading,
    hasRole,
    checkIsAdmin,
    refreshRoles: fetchUserRoles
  };
};