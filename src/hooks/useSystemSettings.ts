import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemSettings {
  system_name: string;
  admin_email: string;
  maintenance_mode: string;
  auto_retry_analyses: string;
  max_retry_attempts: string;
  request_timeout: string;
  require_2fa: string;
  session_timeout: string;
  session_duration: string;
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current session to ensure we have a valid token
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session - please login again');
      }

      const { data, error } = await supabase.functions.invoke('admin-system-settings', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });
      
      if (error) {
        // If it's a 403 and we haven't retried, try refreshing session
        if (error.message?.includes('403') && retryCount === 0) {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError) {
            return fetchSettings(1); // Retry once with refreshed token
          }
        }
        throw new Error(error.message || 'Failed to load settings');
      }
      
      setSettings(data.settings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(errorMessage);
      console.error('System settings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      setSaving(true);
      setError(null);
      
      // Get current session to ensure we have a valid token
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session - please login again');
      }

      const { error } = await supabase.functions.invoke('admin-system-settings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: { settings: newSettings }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to update settings');
      }
      
      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
      toast.success('Settings updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      console.error('Settings update error:', err);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { 
    settings, 
    loading, 
    saving, 
    error, 
    updateSettings, 
    refetch: fetchSettings 
  };
};