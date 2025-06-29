
import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const FeaturesSection = () => {
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
    <section id="funcionalidades" className="py-20 bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900" data-animate>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${visibleElements.has('funcionalidades') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-section-title text-white mb-4">
            Ferramentas Inteligentes para uma Prática Mais Segura
          </h2>
          <p className="text-body-large text-gray-300">
            Conheça os pilares da MedDefend, projetados para se integrarem perfeitamente à sua rotina e fortalecer cada registro que você cria.
          </p>
        </div>

        {/* Funcionalidade 1 */}
        <div className={`mb-16 transition-all duration-1000 delay-200 ${visibleElements.has('funcionalidades') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="text-subsection-title text-white mb-6">1. Assistente de Escrita Defensiva</h3>
          <p className="text-body text-gray-300 mb-8">
            Transforme anotações em documentos robustos. Cole seu texto e nossa IA identifica ambiguidades, sugerindo em segundos uma versão aprimorada e juridicamente mais segura.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 border-l-4 border-red-400 hover:scale-105 transition-all duration-300 hover:shadow-xl bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <h4 className="font-semibold text-red-400 mb-3">Texto Original (Subjetivo)</h4>
                <p className="text-gray-300 italic">"Paciente parece ansioso e pouco colaborativo."</p>
              </CardContent>
            </Card>

            <Card className="p-6 border-l-4 border-green-500 hover:scale-105 transition-all duration-300 hover:shadow-xl bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <h4 className="font-semibold text-green-400 mb-3">Texto Aprimorado (Objetivo)</h4>
                <p className="text-gray-300">"Paciente relata dificuldade para dormir, apresenta taquicardia (FC 110 bpm) e verbaliza preocupação com o resultado do exame. Recusou a primeira tentativa de aferição de pressão arterial, mas consentiu na segunda."</p>
              </CardContent>
            </Card>
          </div>

          <Card className="p-6 bg-purple-900/20 border border-purple-500/30 hover:bg-purple-900/30 transition-all duration-300">
            <CardContent className="p-0">
              <h4 className="font-semibold text-purple-300 mb-3">Exemplo de Uso:</h4>
              <div className="space-y-2 text-gray-300">
                <p><span className="font-medium text-white">Inserir texto original:</span> Paciente agitado, não responde bem.</p>
                <p><span className="font-medium text-white">MedDefend sugere:</span> "Paciente apresenta-se com fala rápida e movimentos inquietos dos membros. Responde a perguntas com monossílabos e desvia o contato visual. Sinais vitais estáveis."</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funcionalidade 2 */}
        <div className={`mb-16 transition-all duration-1000 delay-400 ${visibleElements.has('funcionalidades') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="text-subsection-title text-white mb-6">2. Checklist Contextual Inteligente</h3>
          <p className="text-body text-gray-300 mb-8">
            Nunca mais esqueça um detalhe importante. Com base no contexto clínico (ex: "alta pós-cirúrgica"), a MedDefend gera uma lista de verificação para garantir que todos os pontos críticos da documentação foram cobertos.
          </p>

          <Card className="p-6 hover:scale-105 transition-all duration-300 hover:shadow-xl bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <h4 className="font-semibold text-white mb-4">Checklist para 'Pós-operatório de apendicectomia'</h4>
              <div className="space-y-3">
                <div className="flex items-start group">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 transition-all duration-300 group-hover:scale-125" />
                  <p className="text-gray-300">O consentimento informado pré-operatório foi devidamente registrado?</p>
                </div>
                <div className="flex items-start group">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 transition-all duration-300 group-hover:scale-125" />
                  <p className="text-gray-300">Foram documentadas as orientações de alta para o paciente e/ou acompanhante (repouso, medicação, sinais de alerta)?</p>
                </div>
                <div className="flex items-start group">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 transition-all duration-300 group-hover:scale-125" />
                  <p className="text-gray-300">Há registro da checagem de alergias antes da administração de antibióticos?</p>
                </div>
                <div className="flex items-start group">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 transition-all duration-300 group-hover:scale-125" />
                  <p className="text-gray-300">A evolução descreve o estado da ferida operatória e a ausência de sinais flogísticos?</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funcionalidade 3 */}
        <div className={`transition-all duration-1000 delay-600 ${visibleElements.has('funcionalidades') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="text-subsection-title text-white mb-6">3. Biblioteca de Modelos Juridicamente Validados</h3>
          <p className="text-body text-gray-300 mb-8">
            Economize tempo e ganhe segurança. Acesse um acervo completo de documentos essenciais, elaborados e revisados por advogados especialistas, prontos para usar e adaptar.
          </p>

          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-full text-sm font-medium hover:bg-blue-600/30 transition-colors duration-300 cursor-pointer hover:scale-105">TCLEs para Procedimentos</span>
            <span className="px-4 py-2 bg-green-600/20 text-green-300 border border-green-500/30 rounded-full text-sm font-medium hover:bg-green-600/30 transition-colors duration-300 cursor-pointer hover:scale-105">Modelos de Atestados</span>
            <span className="px-4 py-2 bg-orange-600/20 text-orange-300 border border-orange-500/30 rounded-full text-sm font-medium hover:bg-orange-600/30 transition-colors duration-300 cursor-pointer hover:scale-105">Relatórios Médicos</span>
            <span className="px-4 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-full text-sm font-medium hover:bg-purple-600/30 transition-colors duration-300 cursor-pointer hover:scale-105">Laudos Periciais</span>
            <span className="px-4 py-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-full text-sm font-medium hover:bg-indigo-600/30 transition-colors duration-300 cursor-pointer hover:scale-105">Pareceres</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
