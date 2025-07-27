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
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);

  const checkSubscription = useCallback(async () => {
    // Evitar chamadas muito frequentes (cache de 30 segundos)
    const now = Date.now();
    if (now - lastCheckTime < 30000) {
      console.log('[useSubscription] Skipping check - too frequent');
      return;
    }

    if (!user) {
      console.log('[useSubscription] No user found, skipping check');
      setSubscription({ subscribed: false });
      return;
    }
    
    console.log('[useSubscription] Starting subscription check for user:', user.id);
    setLoading(true);
    setLastCheckTime(now);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      console.log('[useSubscription] Response:', { data, error });
      
      if (error && error.message) {
        console.error('[useSubscription] Error:', error);
        // Só mostrar toast para erros genuínos, não para falhas de autenticação
        if (!error.message.includes('authentication') && 
            !error.message.includes('Authorization') &&
            !error.message.includes('JWT')) {
          toast({
            title: "Erro ao verificar assinatura",
            description: "Não foi possível verificar o status da sua assinatura.",
            variant: "destructive",
          });
        }
        // Em caso de erro, manter estado como não subscrito
        setSubscription({ subscribed: false });
        return;
      }
      
      // Sempre definir um estado válido
      const subscriptionData = data || { subscribed: false };
      setSubscription(subscriptionData);
      console.log('[useSubscription] Subscription updated:', subscriptionData);
      
    } catch (error) {
      console.error('[useSubscription] Error checking subscription:', error);
      // Em caso de erro, manter estado como não subscrito
      setSubscription({ subscribed: false });
      
      // Só mostrar toast se não for erro de autenticação
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('authentication') && 
          !errorMessage.includes('Authorization') &&
          !errorMessage.includes('JWT')) {
        toast({
          title: "Erro ao verificar assinatura",
          description: "Não foi possível verificar o status da sua assinatura.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast, lastCheckTime]);

  const createCheckout = useCallback(async (plan: string) => {
    console.log('[useSubscription] Creating checkout for plan:', plan, 'user:', user?.id);
    
    // Para checkout sem usuário logado, vamos permitir a criação da sessão
    if (!user) {
      console.log('[useSubscription] No user logged in, proceeding with guest checkout');
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan }
      });
      
      console.log('[useSubscription] Checkout response:', { data, error });
      
      if (error) {
        console.error('[useSubscription] Checkout error:', error);
        toast({
          title: "Erro no checkout",
          description: `Não foi possível iniciar o processo de pagamento: ${error?.message || 'Erro desconhecido'}`,
          variant: "destructive",
        });
        return;
      }
      
      if (!data?.url) {
        console.error('[useSubscription] No checkout URL received');
        toast({
          title: "Erro no checkout",
          description: "Não foi possível obter a URL do checkout.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('[useSubscription] Opening checkout URL:', data.url);
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      // Mostrar feedback de sucesso
      toast({
        title: "Redirecionando para o pagamento",
        description: "Uma nova aba foi aberta com o checkout do Stripe.",
      });
      
    } catch (error) {
      console.error('[useSubscription] Error creating checkout:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Erro no checkout",
        description: `Não foi possível iniciar o processo de pagamento: ${errorMessage}`,
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

  // Check subscription on mount and when user changes, but with intelligence
  useEffect(() => {
    if (user) {
      // Aguardar um pouco após login para evitar problemas de timing
      const timer = setTimeout(() => {
        checkSubscription();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setSubscription({ subscribed: false });
      setLastCheckTime(0);
    }
  }, [user]); // Removido checkSubscription da dependência para evitar loops

  return {
    subscription,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};