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

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const { data: billingData, error } = await supabase.functions.invoke('admin-billing');
      
      if (error) throw error;
      
      setData(billingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  return { data, loading, error, refetch: fetchBillingData };
};