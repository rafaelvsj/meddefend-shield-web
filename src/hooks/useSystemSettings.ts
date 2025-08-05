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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Get current session to ensure we have a valid token
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('admin-system-settings', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });
      
      if (error) throw error;
      
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      setSaving(true);
      
      // Get current session to ensure we have a valid token
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session');
      }

      const { error } = await supabase.functions.invoke('admin-system-settings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: { settings: newSettings }
      });
      
      if (error) throw error;
      
      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
      toast.success('Settings updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
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