
import { useState, useEffect } from 'react';
import { Check, Crown, Shield, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PricingSectionProps {
  scrollToSection: (sectionId: string) => void;
}

const PricingSection = ({ scrollToSection }: PricingSectionProps) => {
  const [visibleElements, setVisibleElements] = useState(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const plans = [
    {
      name: "Essencial",
      icon: <Shield className="h-8 w-8 text-blue-400" />,
      price: "R$ 297",
      period: "/mês",
      description: "Perfeito para médicos em início de carreira",
      features: [
        "Até 200 documentos/mês",
        "IA básica para documentação",
        "Templates padrão CFM",
        "Suporte por email",
        "Backup automático",
        "Conformidade LGPD"
      ],
      popular: false,
      cta: "Começar Teste Grátis"
    },
    {
      name: "Professional",
      icon: <Crown className="h-8 w-8 text-purple-400" />,
      price: "R$ 497",
      period: "/mês",
      description: "Ideal para médicos estabelecidos",
      features: [
        "Documentos ilimitados",
        "IA avançada + análise preditiva",
        "Templates personalizáveis",
        "Suporte prioritário 24/7",
        "Analytics de risco",
        "Integração com sistemas",
        "Consultoria jurídica mensal",
        "Relatórios de conformidade"
      ],
      popular: true,
      cta: "Mais Popular"
    },
    {
      name: "Enterprise",
      icon: <Zap className="h-8 w-8 text-yellow-400" />,
      price: "R$ 897",
      period: "/mês",
      description: "Para clínicas e hospitais",
      features: [
        "Multi-usuários ilimitados",
        "IA personalizada por especialidade",
        "API dedicada",
        "Gerente de conta dedicado",
        "Treinamento presencial",
        "Auditoria de segurança",
        "SLA 99.9% uptime",
        "Consultoria jurídica ilimitada"
      ],
      popular: false,
      cta: "Falar com Vendas"
    }
  ];

  return (
    <section id="precos" className="py-24 bg-gradient-to-b from-slate-950 via-gray-950 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16" data-animate id="pricing-header">
          <h2 className={`text-section-title text-white mb-6 transition-all duration-1000 ${visibleElements.has('pricing-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Escolha o plano ideal para{' '}
            <span className="text-gradient">sua proteção</span>
          </h2>
          <p className={`text-body text-gray-300 max-w-3xl mx-auto transition-all duration-1000 delay-300 ${visibleElements.has('pricing-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Investimento menor que uma consulta particular por dia. Proteção maior que qualquer seguro.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16" data-animate id="pricing-cards">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative bg-gray-900/50 backdrop-blur-sm border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 ${
                plan.popular ? 'ring-2 ring-purple-500/50 scale-105' : ''
              } ${visibleElements.has('pricing-cards') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Mais Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 text-lg">{plan.period}</span>
                </div>
                <p className="text-gray-300 mt-2">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="pt-4">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-300">
                      <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full py-6 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-2xl' 
                      : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => scrollToSection('contato')}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center" data-animate id="pricing-guarantee">
          <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 max-w-4xl mx-auto transition-all duration-1000 delay-700 ${visibleElements.has('pricing-guarantee') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h3 className="text-2xl font-bold text-white mb-4">Garantia de 30 dias</h3>
            <p className="text-gray-300 text-lg">
              Experimente sem riscos. Se não ficar completamente satisfeito, devolvemos 100% do seu investimento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
