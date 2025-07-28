import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

const ServerError = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-white">
            Erro interno do servidor
          </CardTitle>
          <p className="text-gray-400 mt-2">
            Algo deu errado em nossos servidores. Nossa equipe foi notificada.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
            <p className="text-sm text-red-200">
              <strong>Erro 500:</strong> Problema interno do servidor. 
              Tente novamente em alguns minutos ou entre em contato conosco.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleRefresh}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
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
              Reportar problema
            </Button>
          </div>
          
          <div className="text-center pt-4 border-t border-slate-700">
            <p className="text-sm text-gray-400">
              Código do erro: 500 | {new Date().toISOString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerError;