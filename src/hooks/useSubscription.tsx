import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string | null;
  subscription_end?: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData>({ subscribed: false });
  const [loading, setLoading] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      console.log('[useSubscription] No user found, skipping check');
      return;
    }
    
    console.log('[useSubscription] Starting subscription check for user:', user.id);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      console.log('[useSubscription] Response:', { data, error });
      
      if (error) {
        console.error('[useSubscription] Error:', error);
        throw error;
      }
      
      setSubscription(data);
      console.log('[useSubscription] Subscription updated:', data);
    } catch (error) {
      console.error('[useSubscription] Error checking subscription:', error);
      // Só mostrar toast se não for erro de autenticação
      if (!error?.message?.includes('authentication') && !error?.message?.includes('Authorization')) {
        toast({
          title: "Erro ao verificar assinatura",
          description: "Não foi possível verificar o status da sua assinatura.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createCheckout = useCallback(async (plan: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa fazer login para assinar um plano.",
        variant: "destructive",
      });
      return;
    }

    console.log('[useSubscription] Creating checkout for plan:', plan, 'user:', user.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan }
      });
      
      console.log('[useSubscription] Checkout response:', { data, error });
      
      if (error) {
        console.error('[useSubscription] Checkout error:', error);
        throw error;
      }
      
      if (!data?.url) {
        throw new Error('No checkout URL received');
      }
      
      console.log('[useSubscription] Opening checkout URL:', data.url);
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('[useSubscription] Error creating checkout:', error);
      toast({
        title: "Erro no checkout",
        description: `Não foi possível iniciar o processo de pagamento: ${error?.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const openCustomerPortal = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      // Open customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erro no portal do cliente",
        description: "Não foi possível abrir o portal de gerenciamento.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Check subscription on mount and when user changes
  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setSubscription({ subscribed: false });
    }
  }, [user, checkSubscription]);

  return {
    subscription,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};