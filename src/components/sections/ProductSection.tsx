
import { useState, useEffect } from 'react';
import { Shield, Brain, FileText, BarChart3, Users, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProductSectionProps {
  scrollToSection: (sectionId: string) => void;
}

const ProductSection = ({ scrollToSection }: ProductSectionProps) => {
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

  const features = [
    {
      icon: <Brain className="h-12 w-12 text-purple-400" />,
      title: "IA Especializada em Medicina",
      description: "Nossa inteligência artificial foi treinada especificamente com literatura médica e jurisprudência brasileira para gerar documentação defensiva precisa."
    },
    {
      icon: <FileText className="h-12 w-12 text-blue-400" />,
      title: "Documentação Automatizada",
      description: "Transforme suas consultas em relatórios detalhados e juridicamente sólidos em segundos, seguindo as melhores práticas médicas."
    },
    {
      icon: <Shield className="h-12 w-12 text-green-400" />,
      title: "Proteção Legal Ativa",
      description: "Cada documento gerado inclui elementos defensivos que fortalecem sua posição em eventuais questionamentos ou processos."
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-yellow-400" />,
      title: "Analytics Preditivos",
      description: "Identifique padrões de risco em sua prática e receba alertas proativos sobre situações que podem gerar litígios."
    },
    {
      icon: <Users className="h-12 w-12 text-pink-400" />,
      title: "Colaboração Segura",
      description: "Compartilhe informações com sua equipe médica mantendo total conformidade com LGPD e sigilo médico."
    },
    {
      icon: <Lock className="h-12 w-12 text-red-400" />,
      title: "Segurança Máxima",
      description: "Criptografia end-to-end, backup automático e infraestrutura em nuvem certificada para proteger dados sensíveis."
    }
  ];

  return (
    <section id="produto" className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16" data-animate id="product-header">
          <h2 className={`text-section-title text-white mb-6 transition-all duration-1000 ${visibleElements.has('product-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Sua documentação médica.{' '}
            <span className="text-gradient">Fortalecida por inteligência artificial.</span>
          </h2>
          <p className={`text-body text-gray-300 max-w-3xl mx-auto transition-all duration-1000 delay-300 ${visibleElements.has('product-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            A MedDefend combina expertise médica com tecnologia de ponta para criar a documentação mais robusta 
            e defensiva do mercado brasileiro.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16" data-animate id="product-features">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`bg-gray-900/50 backdrop-blur-sm border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 ${visibleElements.has('product-features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-8 text-center">
                <div className="mb-6 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center" data-animate id="product-cta">
          <div className={`transition-all duration-1000 delay-500 ${visibleElements.has('product-cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Button 
              onClick={() => scrollToSection('precos')}
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-10 py-6 text-lg transition-all duration-300 hover:scale-105 shadow-2xl border-0 rounded-full font-semibold"
            >
              Conheça Nossos Planos
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
