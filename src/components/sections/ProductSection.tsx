
import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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

  return (
    <section className="py-24 bg-gradient-to-br from-white via-blue-50 to-indigo-50" data-animate id="produto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${visibleElements.has('produto') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sua Documentação. Fortalecida pela Inteligência Artificial.
          </h2>
          <p className="text-xl text-gray-600">
            A MedDefend não é um prontuário eletrônico. Somos seu assistente de mitigação de risco, uma camada de proteção inteligente que analisa, aprimora e blinda seus registros.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className={`p-6 transition-all duration-1000 delay-200 hover:scale-105 hover:shadow-xl hover:rotate-1 ${visibleElements.has('produto') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <CardContent className="p-0">
              <div className="flex items-center mb-4 group">
                <FileText className="h-8 w-8 text-blue-600 mr-3 transition-all duration-300 group-hover:scale-125 group-hover:text-blue-700" />
                <h3 className="text-xl font-semibold">Assistente de Escrita Defensiva</h3>
              </div>
              <p className="text-gray-600">Nossa IA reescreve suas anotações para serem objetivas, claras e juridicamente seguras, eliminando termos subjetivos.</p>
            </CardContent>
          </Card>

          <Card className={`p-6 transition-all duration-1000 delay-400 hover:scale-105 hover:shadow-xl hover:-rotate-1 ${visibleElements.has('produto') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <CardContent className="p-0">
              <div className="flex items-center mb-4 group">
                <CheckCircle className="h-8 w-8 text-blue-600 mr-3 transition-all duration-300 group-hover:scale-125" />
                <h3 className="text-xl font-semibold">Checklist Inteligente</h3>
              </div>
              <p className="text-gray-600">Gera perguntas contextuais para garantir que nenhuma informação crucial seja esquecida.</p>
            </CardContent>
          </Card>

          <Card className={`p-6 transition-all duration-1000 delay-600 hover:scale-105 hover:shadow-xl hover:rotate-1 ${visibleElements.has('produto') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <CardContent className="p-0">
              <div className="flex items-center mb-4 group">
                <Shield className="h-8 w-8 text-blue-600 mr-3 transition-all duration-300 group-hover:scale-125" />
                <h3 className="text-xl font-semibold">Biblioteca de Modelos</h3>
              </div>
              <p className="text-gray-600">Acesse TCLEs, laudos e relatórios pré-validados por advogados especialistas.</p>
            </CardContent>
          </Card>
        </div>

        <div className={`text-center transition-all duration-1000 delay-800 ${visibleElements.has('produto') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Button onClick={() => scrollToSection('funcionalidades')} className="bg-blue-900 hover:bg-blue-800 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            Conheça as Ferramentas
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
