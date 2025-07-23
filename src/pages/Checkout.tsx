import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft, Shield, Clock, Users } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    especialidade: '',
    crm: '',
    plano: 'premium'
  });

  const planos = {
    basic: {
      name: 'Básico',
      price: 'R$ 97',
      period: '/mês',
      features: [
        'Análise de até 50 documentos/mês',
        'Modelos básicos de documentação',
        'Suporte via email',
        'Relatórios simples'
      ],
      recommended: false
    },
    premium: {
      name: 'Premium',
      price: 'R$ 197',
      period: '/mês',
      features: [
        'Análise ilimitada de documentos',
        'Todos os modelos de documentação',
        'Suporte prioritário 24/7',
        'Relatórios detalhados com insights',
        'Checklist personalizado',
        'Histórico completo'
      ],
      recommended: true
    },
    enterprise: {
      name: 'Enterprise',
      price: 'R$ 497',
      period: '/mês',
      features: [
        'Tudo do Premium',
        'API personalizada',
        'Integração com sistemas hospitalares',
        'Treinamento personalizado',
        'Gestor de conta dedicado',
        'Relatórios customizados'
      ],
      recommended: false
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui será implementada a integração com o sistema de pagamento
    console.log('Dados do checkout:', formData);
    // Por enquanto, redireciona para o login para acessar a plataforma
    navigate('/login');
  };

  const selectedPlan = planos[formData.plano as keyof typeof planos];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold text-white">MedDefend - Checkout</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Finalize sua assinatura</CardTitle>
                <p className="text-gray-300">
                  Preencha seus dados para começar a proteger sua prática médica
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Seleção de Plano */}
                  <div>
                    <Label className="text-gray-300 text-base font-medium">Escolha seu plano</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                      {Object.entries(planos).map(([key, plano]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, plano: key }))}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            formData.plano === key
                              ? 'border-purple-500 bg-purple-500/10 text-white'
                              : 'border-slate-600 bg-slate-700/50 text-gray-300 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{plano.name}</div>
                              <div className="text-sm opacity-80">{plano.price}{plano.period}</div>
                            </div>
                            {plano.recommended && (
                              <Badge className="bg-green-500 text-white text-xs">
                                Recomendado
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dados Pessoais */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome" className="text-gray-300">Nome completo *</Label>
                        <Input
                          id="nome"
                          name="nome"
                          type="text"
                          required
                          value={formData.nome}
                          onChange={handleInputChange}
                          className="mt-1 bg-slate-700 border-slate-600 text-white focus:border-purple-400"
                          placeholder="Dr. João Silva"
                        />
                      </div>
                      <div>
                        <Label htmlFor="crm" className="text-gray-300">CRM *</Label>
                        <Input
                          id="crm"
                          name="crm"
                          type="text"
                          required
                          value={formData.crm}
                          onChange={handleInputChange}
                          className="mt-1 bg-slate-700 border-slate-600 text-white focus:border-purple-400"
                          placeholder="123456/SP"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-gray-300">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 bg-slate-700 border-slate-600 text-white focus:border-purple-400"
                        placeholder="joao@exemplo.com"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telefone" className="text-gray-300">Telefone *</Label>
                        <Input
                          id="telefone"
                          name="telefone"
                          type="tel"
                          required
                          value={formData.telefone}
                          onChange={handleInputChange}
                          className="mt-1 bg-slate-700 border-slate-600 text-white focus:border-purple-400"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div>
                        <Label htmlFor="especialidade" className="text-gray-300">Especialidade</Label>
                        <Input
                          id="especialidade"
                          name="especialidade"
                          type="text"
                          value={formData.especialidade}
                          onChange={handleInputChange}
                          className="mt-1 bg-slate-700 border-slate-600 text-white focus:border-purple-400"
                          placeholder="Cardiologia"
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-medium"
                  >
                    Finalizar Assinatura - {selectedPlan.price}{selectedPlan.period}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Plano */}
          <div>
            <Card className="bg-slate-800/50 border-slate-700 sticky top-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Plano {selectedPlan.name}</CardTitle>
                  {selectedPlan.recommended && (
                    <Badge className="bg-green-500 text-white">Recomendado</Badge>
                  )}
                </div>
                <div className="text-3xl font-bold text-white">
                  {selectedPlan.price}
                  <span className="text-lg font-normal text-gray-300">{selectedPlan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-white font-medium mb-3">Recursos inclusos:</h4>
                  <ul className="space-y-2">
                    {selectedPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-slate-600">
                  <h4 className="text-white font-medium mb-3">Garantias:</h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-300">
                      <Shield className="w-5 h-5 text-blue-500 mr-2" />
                      <span>Garantia de 30 dias</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Clock className="w-5 h-5 text-purple-500 mr-2" />
                      <span>Cancele quando quiser</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Users className="w-5 h-5 text-green-500 mr-2" />
                      <span>Suporte especializado</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-600">
                  <p className="text-sm text-gray-400">
                    * Este é um preview da página de checkout. O sistema de pagamento será implementado em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;