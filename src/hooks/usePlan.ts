// FASE 3: Hook unificado para leitura do plano

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { normalizeTier } from '@/lib/plan-constants';

interface PlanData {
  plan: string;
  plan_level: number;
  subscribed: boolean;
  is_comp: boolean;
  updated_at: string | null;
  session_version?: number;
}

export const usePlan = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [planData, setPlanData] = useState<PlanData>({
    plan: 'free',
    plan_level: 1,
    subscribed: false,
    is_comp: false,
    updated_at: null,
    session_version: 0
  });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);

  const getPlan = useCallback(async () => {
    if (!user) {
      console.log('[usePlan] No user found, resetting to free plan');
      setPlanData({
        plan: 'free',
        plan_level: 1,
        subscribed: false,
        is_comp: false,
        updated_at: null
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('[usePlan] Fetching plan for user:', user.id);
      
      const { data, error } = await supabase.functions.invoke('get-my-plan');
      
      if (error) {
        console.error('[usePlan] Error fetching plan:', error);
        // Only show toast for genuine errors, not auth issues
        if (!error.message?.includes('authentication') && 
            !error.message?.includes('Authorization')) {
          toast({
            title: "Erro ao carregar plano",
            description: "Não foi possível carregar os dados do seu plano.",
            variant: "destructive",
          });
        }
        // Fallback to free plan
        setPlanData({
          plan: 'free',
          plan_level: 1,
          subscribed: false,
          is_comp: false,
          updated_at: null
        });
        return;
      }

      // Update plan data with normalization
      const normalizedPlan = normalizeTier(data.plan);
      const newPlanData = {
        plan: normalizedPlan,
        plan_level: data.plan_level || 1,
        subscribed: data.subscribed || false,
        is_comp: data.is_comp || false,
        updated_at: data.updated_at || null,
        session_version: data.session_version || 0
      };
      
      setPlanData(newPlanData);
      console.info('[plan] get-my-plan', { 
        plan: normalizedPlan, 
        session_version: newPlanData.session_version, 
        at: new Date().toISOString() 
      });
      
    } catch (error) {
      console.error('[usePlan] Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Only show toast for non-auth errors
      if (!errorMessage.includes('authentication') && 
          !errorMessage.includes('Authorization')) {
        toast({
          title: "Erro ao carregar plano",
          description: "Não foi possível carregar os dados do seu plano.",
          variant: "destructive",
        });
      }
      
      // Fallback to free plan
      setPlanData({
        plan: 'free',
        plan_level: 1,
        subscribed: false,
        is_comp: false,
        updated_at: null,
        session_version: 0
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const forceRefreshPlan = useCallback(() => {
    console.log('[usePlan] Force refresh requested');
    return getPlan();
  }, [getPlan]);

  // Helper to check if user has a specific plan level
  const hasMinimumPlan = useCallback((requiredLevel: number) => {
    return planData.plan_level >= requiredLevel;
  }, [planData.plan_level]);

  // Helper to get plan tier levels
  const getPlanLevel = useCallback((tier: string) => {
    const levels = { 'free': 1, 'starter': 2, 'pro': 3 };
    return levels[tier as keyof typeof levels] || 1;
  }, []);

  // Auto-fetch on mount e revalidations
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      if (user) {
        getPlan();
        lastUserIdRef.current = user.id;
      }
      return;
    }

    // Detectar mudança de usuário
    if (user?.id !== lastUserIdRef.current) {
      lastUserIdRef.current = user?.id || null;
      if (user) {
        getPlan();
      } else {
        // User logged out - reset to free
        setPlanData({
          plan: 'free',
          plan_level: 1,
          subscribed: false,
          is_comp: false,
          updated_at: null,
          session_version: 0
        });
      }
    }
  }, [user, mounted, getPlan]);

  // Revalidar no foco da janela
  useEffect(() => {
    const handleFocus = () => {
      if (user && mounted) {
        getPlan();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && user && mounted) {
        getPlan();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, mounted, getPlan]);

  return {
    ...planData,
    loading,
    getPlan,
    forceRefreshPlan,
    hasMinimumPlan,
    getPlanLevel,
  };
};