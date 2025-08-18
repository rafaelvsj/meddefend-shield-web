import { useState, useEffect } from 'react';
import { Check, Crown, Shield, Zap, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
interface PricingSectionProps {
  scrollToSection: (sectionId: string) => void;
}
const PricingSection = ({
  scrollToSection
}: PricingSectionProps) => {
  const [visibleElements, setVisibleElements] = useState(new Set());
  const [isAnnual, setIsAnnual] = useState(true); // Começar com anual selecionado
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Função para criar checkout direto via supabase
  const createCheckout = async (plan: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan }
      });
      if (error) throw error;
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
    }
  };
  
  const subscription = { subscribed: false, subscription_tier: null }; // Placeholder - não usado neste componente

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleElements(prev => new Set([...prev, entry.target.id]));
        }
      });
    }, {
      threshold: 0.1
    });
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  const beneficiosPadrao = ["Assistente de Escrita Defensiva ilimitado", "Checklist Contextual Inteligente", "Biblioteca Completa de Modelos", "Histórico de Documentos", "Suporte por email e Whatsapp", "Backup automático"];
  const handlePlanSelection = (planName: string) => {
    if (planName === "Free") {
      if (!user) {
        navigate('/signup');
      } else {
        navigate('/dashboard');
      }
      return;
    }

    if (planName === "Clínicas") {
      scrollToSection('contato');
      return;
    }

    // Para planos pagos
    if (!user) {
      // Usuário não logado - vai para signup gratuito
      navigate('/signup');
      return;
    }

    // Map plan names to stripe plan IDs
    const planMap: { [key: string]: string } = {
      "Starter": "starter",
      "Professional": "professional", 
      "Ultra": "ultra"
    };

    const stripePlanId = planMap[planName];
    if (stripePlanId && createCheckout) {
      // Usuário logado sem assinatura - vai para checkout (upgrade)
      navigate('/checkout', { 
        state: { selectedPlan: planName }
      });
    }
  };

  const plans = [{
    name: "Free",
    icon: <Shield className="h-8 w-8 text-gray-400" />,
    credits: "10 créditos únicos",
    priceMonthly: "Gratuito",
    priceAnnual: "Gratuito",
    monthlyEquivalent: "Gratuito",
    annualTotal: "",
    description: "Para experimentar nossa plataforma",
    features: ["10 créditos não renováveis", "Assistente de Escrita Defensiva básico", "Acesso limitado aos modelos"],
    popular: false,
    cta: "Começar Grátis",
    isFree: true,
    isActive: subscription.subscribed === false
  }, {
    name: "Starter",
    icon: <Shield className="h-8 w-8 text-blue-400" />,
    credits: "50 créditos/mês",
    priceMonthly: "R$ 49,90",
    priceAnnual: "R$ 449,10",
    monthlyEquivalent: "R$ 37,43",
    annualTotal: "R$ 449,10 cobrados anualmente",
    description: "Ideal para médicos em início de carreira",
    features: ["50 créditos mensais", ...beneficiosPadrao],
    popular: false,
    cta: "Escolher Starter",
    isActive: subscription.subscription_tier === "Starter"
  }, {
    name: "Professional",
    icon: <Crown className="h-8 w-8 text-purple-400" />,
    credits: "150 créditos/mês",
    priceMonthly: "R$ 129,90",
    priceAnnual: "R$ 1.169,10",
    monthlyEquivalent: "R$ 97,43",
    annualTotal: "R$ 1.169,10 cobrados anualmente",
    description: "Para médicos estabelecidos",
    features: ["150 créditos mensais", ...beneficiosPadrao],
    popular: true,
    cta: "Mais Popular",
    isActive: subscription.subscription_tier === "Professional"
  }, {
    name: "Ultra",
    icon: <Zap className="h-8 w-8 text-yellow-400" />,
    credits: "~1.000 créditos/mês",
    priceMonthly: "R$ 349,90",
    priceAnnual: "R$ 3.149,10",
    monthlyEquivalent: "R$ 262,43",
    annualTotal: "R$ 3.149,10 cobrados anualmente",
    description: "Uso intensivo para especialistas",
    features: ["Aproximadamente 1.000 créditos/mês", ...beneficiosPadrao],
    popular: false,
    cta: "Escolher Ultra",
    isActive: subscription.subscription_tier === "Ultra"
  }, {
    name: "Clínicas",
    icon: <Building2 className="h-8 w-8 text-green-400" />,
    credits: "Personalizado",
    priceMonthly: "A partir de R$ 1.490",
    priceAnnual: "Personalizado",
    monthlyEquivalent: "Personalizado",
    annualTotal: "R$ 2/usuário ativo adicional",
    description: "",
    features: [],
    popular: false,
    cta: "Falar Conosco",
    isEnterprise: true,
    isContactOnly: true
  }];
  return <section id="precos" className="py-24 bg-gradient-to-b from-slate-950 via-gray-950 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16" data-animate id="pricing-header">
          <h2 className={`text-section-title text-white mb-6 transition-all duration-1000 ${visibleElements.has('pricing-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Escolha o plano ideal para{' '}
            <span className="text-gradient">sua proteção</span>
          </h2>
          <p className={`text-body text-gray-300 max-w-3xl mx-auto mb-8 transition-all duration-1000 delay-300 ${visibleElements.has('pricing-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Invista na sua segurança jurídica. Proteção completa por menos que uma consulta particular.
          </p>
          
          {/* Toggle de preços */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-full p-1 flex">
              <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-full transition-all duration-300 text-sm font-medium ${!isAnnual ? 'bg-white text-black shadow-lg' : 'text-gray-300 hover:text-white'}`}>
                Mensal
              </button>
              <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-full transition-all duration-300 text-sm font-medium relative ${isAnnual ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-gray-300 hover:text-white'}`}>
                Anual
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  -25%
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 md:grid-cols-3 gap-6 mb-16" data-animate id="pricing-cards">
          {plans.map((plan, index) => <Card key={index} className={`relative bg-gray-900/50 backdrop-blur-sm border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 ${plan.popular ? 'ring-2 ring-purple-500/50 scale-105' : ''} ${plan.isFree ? 'border-gray-600' : ''} ${plan.isActive ? 'ring-2 ring-green-500/50 border-green-500/50' : ''} ${visibleElements.has('pricing-cards') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{
          transitionDelay: `${index * 100}ms`
        }}>
              {plan.popular && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap">
                    Mais Popular
                  </div>
                </div>}
              {plan.isActive && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap">
                    Seu Plano
                  </div>
                </div>}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {plan.icon}
                </div>
                <CardTitle className="text-xl font-bold text-white">{plan.name}</CardTitle>
                
                {!plan.isContactOnly && <div className="mt-4">
                    {plan.isFree ? <div>
                        <span className="text-2xl sm:text-3xl font-bold text-white">Gratuito</span>
                        <p className="text-gray-400 text-sm mt-1">{plan.credits}</p>
                      </div> : plan.isEnterprise ? <div>
                        <span className="text-2xl font-bold text-white">Personalizado</span>
                        <p className="text-gray-400 text-sm mt-1">{plan.annualTotal}</p>
                      </div> : isAnnual ? <div>
                        <span className="text-2xl sm:text-3xl font-bold text-white">{plan.monthlyEquivalent}</span>
                        <span className="text-gray-400 text-base">/mês</span>
                        <p className="text-gray-500 text-xs mt-1">{plan.annualTotal}</p>
                      </div> : <div>
                        <span className="text-2xl sm:text-3xl font-bold text-white">{plan.priceMonthly}</span>
                        <span className="text-gray-400 text-base">/mês</span>
                      </div>}
                  </div>}
                
                {plan.description && <p className="text-gray-300 mt-2 text-sm">{plan.description}</p>}
                {!plan.isFree && !plan.isEnterprise && !plan.isContactOnly && <p className="text-gray-400 text-xs mt-1">{plan.credits}</p>}
              </CardHeader>
              
              <CardContent className="pt-0">
                {plan.features.length > 0 && <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-start text-gray-300 text-sm">
                        <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>)}
                  </ul>}
                
                <Button 
                  className={`w-full py-4 text-sm font-semibold rounded-full transition-all duration-300 hover:scale-105 ${
                    plan.isActive 
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-2xl' 
                      : plan.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-2xl' 
                        : plan.isFree 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 hover:border-gray-500' 
                          : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-gray-500'
                  }`} 
                  onClick={() => handlePlanSelection(plan.name)}
                  disabled={plan.isActive}
                >
                  {!user ? "Começar Gratuitamente" : 
                   plan.isActive ? "Plano Atual" : 
                   subscription?.subscribed ? "Alterar Plano" : "Fazer Upgrade"}
                </Button>
              </CardContent>
            </Card>)}
        </div>

        {/* Regras de uso justo */}
        <div className="text-center mb-8" data-animate id="fair-use">
          <div className={`bg-gray-900/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 max-w-4xl mx-auto transition-all duration-1000 delay-500 ${visibleElements.has('fair-use') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <p className="text-gray-400 text-sm">
              <strong className="text-white">Uso Justo:</strong> Após ~1.000 queries/mês, aplicamos throttling ou cobrança de R$ 0,25 por lote adicional de 100 queries. 
              Cobrança em <strong className="text-white">BRL</strong>. Pagamento via Pix, Cartão, Apple Pay e Google Pay.
            </p>
          </div>
        </div>

        <div className="text-center" data-animate id="pricing-guarantee">
          <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 max-w-4xl mx-auto transition-all duration-1000 delay-700 ${visibleElements.has('pricing-guarantee') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h3 className="text-2xl font-bold text-white mb-4">Garantia de 7 dias</h3>
            <p className="text-gray-300 text-lg">
              Experimente sem riscos. Se não ficar completamente satisfeito, devolvemos 100% do seu investimento.
            </p>
          </div>
        </div>
      </div>
    </section>;
};
export default PricingSection;