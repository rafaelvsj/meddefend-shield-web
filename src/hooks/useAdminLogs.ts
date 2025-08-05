import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  model: string;
  status: string;
  duration: string;
}

interface LogStats {
  totalRequests: number;
  successRate: string;
  avgResponse: string;
  activeModels: number;
}

interface LogsData {
  stats: LogStats;
  logs: LogEntry[];
  auditLogs: any[];
}

export const useAdminLogs = () => {
  const [data, setData] = useState<LogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Get current session to ensure we have a valid token
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session');
      }

      const { data: logsData, error } = await supabase.functions.invoke('admin-ai-logs', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });
      
      if (error) throw error;
      
      setData(logsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return { data, loading, error, refetch: fetchLogs };
};