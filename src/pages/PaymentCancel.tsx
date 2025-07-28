import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, CreditCard, Home } from 'lucide-react';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-white">
            Pagamento cancelado
          </CardTitle>
          <p className="text-gray-400 mt-2">
            Sua transação foi cancelada. Nenhum valor foi cobrado.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg">
            <p className="text-sm text-orange-200">
              💡 <strong>Dica:</strong> Você pode tentar novamente a qualquer momento. 
              Se encontrou algum problema, nossa equipe está aqui para ajudar!
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full border-slate-600 text-white hover:bg-slate-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => navigate('/help-support')}
              className="w-full text-gray-400 hover:text-white"
            >
              Precisa de ajuda?
            </Button>
          </div>
          
          <div className="text-center pt-4 border-t border-slate-700">
            <p className="text-sm text-gray-400">
              Ainda interessado? Nossos planos continuam disponíveis! 💪
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;