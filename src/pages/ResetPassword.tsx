import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira seu email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        toast({
          title: "Erro ao enviar email",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSent(true);
        toast({
          title: "Email enviado",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader className="space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/login')}
            className="w-fit text-gray-400 hover:text-white p-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao login
          </Button>
          
          <div className="text-center">
            <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-white">
              {sent ? 'Email enviado!' : 'Recuperar senha'}
            </CardTitle>
            <p className="text-gray-400 mt-2">
              {sent 
                ? 'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.'
                : 'Digite seu email para receber instruções de recuperação.'
              }
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar instruções'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Voltar ao login
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="w-full border-slate-600 text-white hover:bg-slate-700"
              >
                Enviar novamente
              </Button>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Link 
              to="/signup" 
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Não tem uma conta? Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;