import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface KnowledgeBaseEntry {
  id: string;
  file_name: string;
  original_name: string;
  file_type: string;
  status: string;
  file_size: number;
  created_at: string;
  processed_at: string | null;
  created_by: string;
}

interface KnowledgeBaseStats {
  totalFiles: number;
  processedFiles: number;
  pendingFiles: number;
  errorFiles: number;
  successRate: string;
}

interface KnowledgeBaseData {
  stats?: KnowledgeBaseStats;
  logs?: KnowledgeBaseEntry[];
}

export const useAdminLogs = () => {
  const [data, setData] = useState<{ stats: any; logs: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current session to ensure we have a valid token
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session - please login again');
      }

      console.log('🔍 Invoking admin-kb-logs function...');
      
      // Get both stats and logs
      const [statsResult, logsResult] = await Promise.all([
        supabase.functions.invoke('admin-kb-logs', {
          headers: { Authorization: `Bearer ${session.session.access_token}` },
          body: JSON.stringify({ action: 'stats' })
        }),
        supabase.functions.invoke('admin-kb-logs', {
          headers: { Authorization: `Bearer ${session.session.access_token}` },
          body: JSON.stringify({ action: 'logs' })
        })
      ]);
      
      console.log('📊 admin-kb-logs response:', { statsResult, logsResult });
      
      if (statsResult.error || logsResult.error) {
        const error = statsResult.error || logsResult.error;
        // If it's a 403 and we haven't retried, try refreshing session
        if (error.message?.includes('403') && retryCount === 0) {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError) {
            return fetchLogs(1); // Retry once with refreshed token
          }
        }
        throw new Error(error.message || 'Failed to load logs');
      }
      
      setData({
        stats: statsResult.data || {},
        logs: logsResult.data || []
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logs';
      setError(errorMessage);
      console.error('Admin logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return { data, loading, error, refetch: fetchLogs };
};