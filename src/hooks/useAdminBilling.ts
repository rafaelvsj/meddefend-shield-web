import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Plan {
  name: string;
  price: string;
  users: number;
  revenue: string;
}

interface Transaction {
  id: string;
  user: string;
  plan: string;
  amount: string;
  status: string;
  date: string;
}

interface BillingData {
  plans: Plan[];
  recentTransactions: Transaction[];
  totalRevenue: number;
  totalUsers: number;
}

export const useAdminBilling = () => {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current session to ensure we have a valid token
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session - please login again');
      }

      const { data: billingData, error } = await supabase.functions.invoke('admin-billing', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });
      
      if (error) {
        // If it's a 403 and we haven't retried, try refreshing session
        if (error.message?.includes('403') && retryCount === 0) {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError) {
            return fetchBillingData(1); // Retry once with refreshed token
          }
        }
        throw new Error(error.message || 'Failed to load billing data');
      }
      
      setData(billingData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch billing data';
      setError(errorMessage);
      console.error('Admin billing fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  return { data, loading, error, refetch: fetchBillingData };
};