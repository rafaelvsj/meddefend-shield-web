import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePlan } from '@/hooks/usePlan';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { forceRefreshPlan } = usePlan();
  const { toast } = useToast();
  
  // Função para verificar subscription direto
  const checkSubscription = async () => {
    try {
      await supabase.functions.invoke('check-subscription');
    } catch (error) {
      console.error('Erro ao verificar subscription:', error);
    }
  };

  useEffect(() => {
    // Atualizar status da assinatura após pagamento bem-sucedido
    const updateSubscription = async () => {
      try {
        await checkSubscription();
        // Force refresh plan data to reflect changes immediately
        await forceRefreshPlan();
        toast({
          title: "Pagamento confirmado!",
          description: "Sua assinatura foi ativada com sucesso.",
        });
      } catch (error) {
        console.error('Erro ao atualizar status da assinatura:', error);
      }
    };

    updateSubscription();
  }, [checkSubscription, forceRefreshPlan, toast]);

  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-white">
            Pagamento realizado com sucesso!
          </CardTitle>
          <p className="text-gray-400 mt-2">
            Sua assinatura foi ativada e você já pode acessar todos os recursos premium.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {sessionId && (
            <div className="bg-slate-700/50 p-3 rounded-lg">
              <p className="text-sm text-gray-400">ID da transação:</p>
              <p className="text-xs text-gray-300 font-mono break-all">{sessionId}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={async () => {
                await forceRefreshPlan();
                navigate('/dashboard');
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Ir para o Dashboard
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full border-slate-600 text-white hover:bg-slate-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </div>
          
          <div className="text-center pt-4 border-t border-slate-700">
            <p className="text-sm text-gray-400">
              Obrigado por escolher a MedDefend! 🚀
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;