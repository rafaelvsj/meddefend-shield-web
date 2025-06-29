
import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const LLMDangerSection = () => {
  const [visibleElements, setVisibleElements] = useState(new Set());
  const [counters, setCounters] = useState({
    processesVsDoctors: 0,
    claudeSonnet: 0,
    claudeOpus: 0,
    gpt4: 0,
    gpt4o: 0,
    gemini: 0,
    meddefend: 0
  });

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

  useEffect(() => {
    if (visibleElements.has('llm-danger')) {
      const animateCounter = (target: number, setter: (value: number) => void, duration: number = 2000) => {
        let start = 0;
        const startTime = performance.now();
        
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const current = Math.floor(progress * target);
          setter(current);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        requestAnimationFrame(animate);
      };

      animateCounter(573750, (val) => setCounters(prev => ({ ...prev, processesVsDoctors: val })));
      animateCounter(163, (val) => setCounters(prev => ({ ...prev, claudeSonnet: val / 10 })));
      animateCounter(101, (val) => setCounters(prev => ({ ...prev, claudeOpus: val / 10 })));
      animateCounter(18, (val) => setCounters(prev => ({ ...prev, gpt4: val / 10 })));
      animateCounter(15, (val) => setCounters(prev => ({ ...prev, gpt4o: val / 10 })));
      animateCounter(7, (val) => setCounters(prev => ({ ...prev, gemini: val / 10 })));
      animateCounter(1, (val) => setCounters(prev => ({ ...prev, meddefend: val / 10 })));
    }
  }, [visibleElements]);

  return (
    <section className="py-24 bg-gradient-to-br from-slate-100 via-red-50 to-orange-50" data-animate id="llm-danger">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Warning Header */}
        <div className={`text-center mb-20 transition-all duration-1000 ${visibleElements.has('llm-danger') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center justify-center mb-8">
            <AlertTriangle className="h-16 w-16 text-red-600 mr-6" />
            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Por Que LLMs Genéricas São Perigosas Na Medicina?
            </h2>
            <AlertTriangle className="h-16 w-16 text-red-600 ml-6" />
          </div>
          <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-light">
            🚨 O Perigo Silencioso das LLMs Genéricas em Documentação Médica
          </p>
        </div>

        {/* Scenario Description */}
        <div className={`bg-white p-8 rounded-lg mb-16 border-l-4 border-red-600 shadow-lg transition-all duration-1000 delay-200 ${visibleElements.has('llm-danger') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <p className="text-lg leading-relaxed mb-4 text-gray-800">
            <strong className="text-red-600">Imagine:</strong> Um médico utiliza Claude para redigir um relatório. A IA gera texto fluente, mas contém uma <span className="text-red-600 font-bold">alucinação</span> - afirma que o paciente 'não apresenta alergias' quando ele tem alergia grave à penicilina.
          </p>
          <p className="text-lg leading-relaxed text-gray-800">
            Meses depois, outro médico prescreve penicilina baseado nessa documentação. <span className="text-red-600 font-bold">Resultado: choque anafilático e processo milionário.</span>
          </p>
        </div>

        {/* Hallucination Rates Table */}
        <div className={`mb-16 transition-all duration-1000 delay-300 ${visibleElements.has('llm-danger') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">Taxa de Alucinação por Modelo (Vectara 2025)</h3>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-lg">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Modelo</th>
                  <th className="px-6 py-4 text-center font-semibold">Taxa de Alucinação</th>
                  <th className="px-6 py-4 text-center font-semibold">Risco</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-4 font-medium text-gray-900">Claude 3 Sonnet</td>
                  <td className="px-6 py-4 text-center text-2xl font-bold text-red-600">{counters.claudeSonnet.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Muito Alto</span></td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-4 font-medium text-gray-900">Claude 3 Opus</td>
                  <td className="px-6 py-4 text-center text-2xl font-bold text-red-600">{counters.claudeOpus.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">Alto</span></td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-4 font-medium text-gray-900">GPT-4</td>
                  <td className="px-6 py-4 text-center text-2xl font-bold text-yellow-600">{counters.gpt4.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Moderado</span></td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-4 font-medium text-gray-900">GPT-4o</td>
                  <td className="px-6 py-4 text-center text-2xl font-bold text-yellow-600">{counters.gpt4o.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Moderado</span></td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-4 font-medium text-gray-900">Gemini 2.0 Flash</td>
                  <td className="px-6 py-4 text-center text-2xl font-bold text-blue-600">{counters.gemini.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Baixo</span></td>
                </tr>
                <tr className="bg-green-50 border-b border-green-200">
                  <td className="px-6 py-4 font-bold text-green-800">MedDefend</td>
                  <td className="px-6 py-4 text-center text-2xl font-bold text-green-600">&lt;{counters.meddefend.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-bold">Mínimo</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Brazilian Reality Statistics */}
        <div className={`mb-16 transition-all duration-1000 delay-500 ${visibleElements.has('llm-danger') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">Realidade Brasileira (CFM/CNJ 2024)</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-blue-50 border-blue-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-900 mb-2">{counters.processesVsDoctors.toLocaleString()}</div>
                <div className="text-sm text-blue-700">processos vs 562.206 médicos</div>
                <p className="text-xs text-blue-600 mt-2">Mais processos que médicos!</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-900 mb-2">198%</div>
                <div className="text-sm text-blue-700">crescimento em processos</div>
                <p className="text-xs text-blue-600 mt-2">(2013-2022)</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-900 mb-2">R$ 500 mil</div>
                <div className="text-sm text-blue-700">indenizações máximas</div>
                <p className="text-xs text-blue-600 mt-2">por erros médicos (STJ)</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Real Cases */}
        <div className={`mb-16 transition-all duration-1000 delay-600 ${visibleElements.has('llm-danger') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">Casos Reais Internacionais</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border-red-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-red-600 mb-2">US$ 216,8 mi</div>
                <p className="text-gray-700">EUA 2023 - Documentação inadequada de AVC</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-red-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-red-600 mb-2">US$ 101 mi</div>
                <p className="text-gray-700">EUA 2022 - Registros médicos inadequados</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comparison Section */}
        <div className={`mb-16 transition-all duration-1000 delay-700 ${visibleElements.has('llm-danger') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">A Diferença que Pode Salvar Sua Carreira</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {/* LLM Genérica */}
            <Card className="bg-red-50 border-red-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                  <h4 className="text-xl font-bold text-red-700">LLM Genérica (Risco Alto)</h4>
                </div>
                <div className="bg-white p-4 rounded border-l-2 border-red-400 mb-4">
                  <p className="text-gray-800 italic">
                    "Paciente com dor abdominal. Exame normal. Liberado."
                  </p>
                </div>
                <div className="text-sm text-red-700">
                  ❌ Vago e subjetivo<br/>
                  ❌ Sem detalhes importantes<br/>
                  ❌ Vulnerável juridicamente
                </div>
              </CardContent>
            </Card>

            {/* MedDefend */}
            <Card className="bg-green-50 border-green-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <h4 className="text-xl font-bold text-green-700">MedDefend (Proteção)</h4>
                </div>
                <div className="bg-white p-4 rounded border-l-2 border-green-400 mb-4">
                  <p className="text-gray-800 text-sm">
                    "Paciente masculino, 45 anos, dor em FID há 6h, intensidade 7/10. Exame: abdome flácido, McBurney negativo, Blumberg negativo. Alvarado 3/10 - baixa probabilidade apendicite. Orientado retorno se piora/febre. Paciente compreendeu conduta."
                  </p>
                </div>
                <div className="text-sm text-green-700">
                  ✅ Objetivo e detalhado<br/>
                  ✅ Protocolo médico seguido<br/>
                  ✅ Juridicamente defensável
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sources */}
        <div className={`mb-16 bg-gray-100 p-6 rounded-lg transition-all duration-1000 delay-800 ${visibleElements.has('llm-danger') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <h4 className="text-lg font-bold text-gray-900 mb-4">Fontes das Informações:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Vectara Hallucination Leaderboard (github.com/vectara/hallucination-leaderboard)</li>
            <li>• Conselho Federal de Medicina + CNJ (via APM, 2024)</li>
            <li>• ChartRequest Medical Malpractice Database</li>
          </ul>
        </div>

        {/* Urgency CTA */}
        <div className={`text-center transition-all duration-1000 delay-900 ${visibleElements.has('llm-danger') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="bg-white p-8 rounded-lg border-2 border-blue-200 shadow-lg">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Pare de Arriscar Sua Carreira com IA Genérica
            </h3>
            <p className="text-lg text-gray-700 mb-6">
              A pergunta não é <strong>SE</strong> você será processado, mas <strong>QUANDO</strong>
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <a href="/checkout.html">
                🛡️ Proteja-se Agora - Teste Grátis por 3 Dias
              </a>
            </Button>
            <p className="text-sm text-gray-600 mt-4">Não deixe sua documentação se tornar sua maior vulnerabilidade</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LLMDangerSection;
