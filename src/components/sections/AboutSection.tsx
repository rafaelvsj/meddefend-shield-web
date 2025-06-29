
import { useState, useEffect } from 'react';
import { Shield, Heart, Zap, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AboutSection = () => {
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
    <section id="sobre" className="py-20 bg-gradient-to-br from-slate-800 via-gray-900 to-slate-800" data-animate>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${visibleElements.has('sobre') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-section-title text-white mb-6">
            Nossa Missão: Devolver a Segurança a Quem Cuida
          </h2>
          <div className="max-w-4xl mx-auto text-body text-gray-300 leading-relaxed">
            <p className="mb-6">
              A MedDefend nasceu da união entre tecnologia e direito médico, com um propósito claro: empoderar profissionais de saúde. Em um cenário de crescente vulnerabilidade jurídica, percebemos que a melhor defesa começa muito antes de um processo existir. Ela começa com uma documentação impecável.
            </p>
            <p>
              Nossa visão é ser a principal aliada da classe médica brasileira na prevenção de litígios, construindo um ecossistema onde a confiança e a transparência documental fortalecem a relação médico-paciente. Não substituímos seu julgamento clínico; nós o protegemos.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className={`p-6 border-l-4 border-green-500 bg-slate-800/50 border-slate-700 transition-all duration-1000 delay-200 hover:scale-105 hover:shadow-lg ${visibleElements.has('sobre') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <CardContent className="p-0">
              <div className="flex items-center mb-4 group">
                <Shield className="h-8 w-8 text-green-400 mr-3 transition-all duration-300 group-hover:scale-125" />
                <h3 className="text-subsection-title text-white">Segurança em Primeiro Lugar</h3>
              </div>
              <p className="text-gray-300">Conformidade com a LGPD e as mais rigorosas práticas de proteção de dados.</p>
            </CardContent>
          </Card>

          <Card className={`p-6 border-l-4 border-blue-500 bg-slate-800/50 border-slate-700 transition-all duration-1000 delay-400 hover:scale-105 hover:shadow-lg ${visibleElements.has('sobre') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <CardContent className="p-0">
              <div className="flex items-center mb-4 group">
                <Heart className="h-8 w-8 text-blue-400 mr-3 transition-all duration-300 group-hover:scale-125" />
                <h3 className="text-subsection-title text-white">Ética e Respeito</h3>
              </div>
              <p className="text-gray-300">Ferramentas em conformidade com as normas do CFM e respeito à autonomia profissional.</p>
            </CardContent>
          </Card>

          <Card className={`p-6 border-l-4 border-purple-500 bg-slate-800/50 border-slate-700 transition-all duration-1000 delay-600 hover:scale-105 hover:shadow-lg ${visibleElements.has('sobre') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <CardContent className="p-0">
              <div className="flex items-center mb-4 group">
                <Zap className="h-8 w-8 text-purple-400 mr-3 transition-all duration-300 group-hover:scale-125" />
                <h3 className="text-subsection-title text-white">Inovação com Propósito</h3>
              </div>
              <p className="text-gray-300">IA de ponta como um meio para resolver desafios reais e urgentes da medicina.</p>
            </CardContent>
          </Card>

          <Card className={`p-6 border-l-4 border-orange-500 bg-slate-800/50 border-slate-700 transition-all duration-1000 delay-800 hover:scale-105 hover:shadow-lg ${visibleElements.has('sobre') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <CardContent className="p-0">
              <div className="flex items-center mb-4 group">
                <Users className="h-8 w-8 text-orange-400 mr-3 transition-all duration-300 group-hover:scale-125" />
                <h3 className="text-subsection-title text-white">Confiança e Transparência</h3>
              </div>
              <p className="text-gray-300">Relações baseadas na clareza e precisão, na tecnologia e no nosso negócio.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
