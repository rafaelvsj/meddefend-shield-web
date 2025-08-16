import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Secure authentication hook that validates user permissions server-side
 * NEVER stores sensitive data in localStorage or client-side storage
 */
export const useSecureAuth = () => {
  const { user, session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    if (!user || !session) {
      setIsAdmin(false);
      setPermissionsLoading(false);
      return;
    }

    validateUserPermissions();
  }, [user, session]);

  const validateUserPermissions = async () => {
    if (!user || !session) return;

    setPermissionsLoading(true);
    try {
      // Server-side role validation using RPC
      const { data: isAdminResult, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Error validating admin permissions:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!isAdminResult);
      }
    } catch (error) {
      console.error('Permission validation failed:', error);
      setIsAdmin(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  /**
   * Check if user has specific role - always validates server-side
   */
  const hasRole = async (role: 'admin' | 'user'): Promise<boolean> => {
    if (!user || !session) return false;

    try {
      const { data: hasRoleResult, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: role
      });

      if (error) {
        console.error(`Error checking role ${role}:`, error);
        return false;
      }

      return !!hasRoleResult;
    } catch (error) {
      console.error(`Role validation failed for ${role}:`, error);
      return false;
    }
  };

  /**
   * Refresh permissions - useful after role changes
   */
  const refreshPermissions = () => {
    if (user && session) {
      validateUserPermissions();
    }
  };

  return {
    user,
    session,
    isAdmin,
    loading: authLoading || permissionsLoading,
    hasRole,
    refreshPermissions,
    isAuthenticated: !!user && !!session
  };
};