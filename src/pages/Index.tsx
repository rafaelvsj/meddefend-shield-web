import { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Users, TrendingDown, Mail, FileText, Zap, Heart, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Import new components
import Header from '@/components/sections/Header';
import HeroSection from '@/components/sections/HeroSection';
import StatisticsSection from '@/components/sections/StatisticsSection';
import PricingSection from '@/components/sections/PricingSection';

const Index = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    especialidade: '',
    mensagem: ''
  });

  // Animation states
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

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
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
    elements.forEach(el => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  // Counter animations for LLM danger section
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    window.location.href = '/checkout.html';
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header scrollToSection={scrollToSection} />
      <HeroSection />
      <StatisticsSection />

      {/* LLM Danger Section - keeping existing content with updated styling */}
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
                    <Shield className="h-6 w-6 text-green-600 mr-3" />
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

      {/* Produto Section */}
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

      {/* Sobre Section */}
      <section id="sobre" className="py-24 bg-gradient-to-br from-slate-50 to-white" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-1000 ${visibleElements.has('sobre') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Nossa Missão: Devolver a Segurança a Quem Cuida
            </h2>
            <div className="max-w-4xl mx-auto text-lg text-gray-600 leading-relaxed">
              <p className="mb-6">
                A MedDefend nasceu da união entre tecnologia e direito médico, com um propósito claro: empoderar profissionais de saúde. Em um cenário de crescente vulnerabilidade jurídica, percebemos que a melhor defesa começa muito antes de um processo existir. Ela começa com uma documentação impecável.
              </p>
              <p>
                Nossa visão é ser a principal aliada da classe médica brasileira na prevenção de litígios, construindo um ecossistema onde a confiança e a transparência documental fortalecem a relação médico-paciente. Não substituímos seu julgamento clínico; nós o protegemos.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className={`p-6 border-l-4 border-green-500 transition-all duration-1000 delay-200 hover:scale-105 hover:shadow-lg ${visibleElements.has('sobre') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <CardContent className="p-0">
                <div className="flex items-center mb-4 group">
                  <Shield className="h-8 w-8 text-green-600 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <h3 className="text-xl font-semibold">Segurança em Primeiro Lugar</h3>
                </div>
                <p className="text-gray-600">Conformidade com a LGPD e as mais rigorosas práticas de proteção de dados.</p>
              </CardContent>
            </Card>

            <Card className={`p-6 border-l-4 border-blue-500 transition-all duration-1000 delay-400 hover:scale-105 hover:shadow-lg ${visibleElements.has('sobre') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <CardContent className="p-0">
                <div className="flex items-center mb-4 group">
                  <Heart className="h-8 w-8 text-blue-600 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <h3 className="text-xl font-semibold">Ética e Respeito</h3>
                </div>
                <p className="text-gray-600">Ferramentas em conformidade com as normas do CFM e respeito à autonomia profissional.</p>
              </CardContent>
            </Card>

            <Card className={`p-6 border-l-4 border-purple-500 transition-all duration-1000 delay-600 hover:scale-105 hover:shadow-lg ${visibleElements.has('sobre') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <CardContent className="p-0">
                <div className="flex items-center mb-4 group">
                  <Zap className="h-8 w-8 text-purple-600 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <h3 className="text-xl font-semibold">Inovação com Propósito</h3>
                </div>
                <p className="text-gray-600">IA de ponta como um meio para resolver desafios reais e urgentes da medicina.</p>
              </CardContent>
            </Card>

            <Card className={`p-6 border-l-4 border-orange-500 transition-all duration-1000 delay-800 hover:scale-105 hover:shadow-lg ${visibleElements.has('sobre') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <CardContent className="p-0">
                <div className="flex items-center mb-4 group">
                  <Users className="h-8 w-8 text-orange-600 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <h3 className="text-xl font-semibold">Confiança e Transparência</h3>
                </div>
                <p className="text-gray-600">Relações baseadas na clareza e precisão, na tecnologia e no nosso negócio.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Funcionalidades Section */}
      <section id="funcionalidades" className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-1000 ${visibleElements.has('funcionalidades') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ferramentas Inteligentes para uma Prática Mais Segura
            </h2>
            <p className="text-xl text-gray-600">
              Conheça os pilares da MedDefend, projetados para se integrarem perfeitamente à sua rotina e fortalecer cada registro que você cria.
            </p>
          </div>

          {/* Funcionalidade 1 */}
          <div className={`mb-16 transition-all duration-1000 delay-200 ${visibleElements.has('funcionalidades') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">1. Assistente de Escrita Defensiva</h3>
            <p className="text-lg text-gray-600 mb-8">
              Transforme anotações em documentos robustos. Cole seu texto e nossa IA identifica ambiguidades, sugerindo em segundos uma versão aprimorada e juridicamente mais segura.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 border-l-4 border-red-400 hover:scale-105 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-0">
                  <h4 className="font-semibold text-red-700 mb-3">Texto Original (Subjetivo)</h4>
                  <p className="text-gray-600 italic">"Paciente parece ansioso e pouco colaborativo."</p>
                </CardContent>
              </Card>

              <Card className="p-6 border-l-4 border-green-500 hover:scale-105 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-0">
                  <h4 className="font-semibold text-green-700 mb-3">Texto Aprimorado (Objetivo)</h4>
                  <p className="text-gray-600">"Paciente relata dificuldade para dormir, apresenta taquicardia (FC 110 bpm) e verbaliza preocupação com o resultado do exame. Recusou a primeira tentativa de aferição de pressão arterial, mas consentiu na segunda."</p>
                </CardContent>
              </Card>
            </div>

            <Card className="p-6 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all duration-300">
              <CardContent className="p-0">
                <h4 className="font-semibold text-blue-900 mb-3">Exemplo de Uso:</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Inserir texto original:</span> Paciente agitado, não responde bem.</p>
                  <p><span className="font-medium">MedDefend sugere:</span> "Paciente apresenta-se com fala rápida e movimentos inquietos dos membros. Responde a perguntas com monossílabos e desvia o contato visual. Sinais vitais estáveis."</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funcionalidade 2 */}
          <div className={`mb-16 transition-all duration-1000 delay-400 ${visibleElements.has('funcionalidades') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">2. Checklist Contextual Inteligente</h3>
            <p className="text-lg text-gray-600 mb-8">
              Nunca mais esqueça um detalhe importante. Com base no contexto clínico (ex: "alta pós-cirúrgica"), a MedDefend gera uma lista de verificação para garantir que todos os pontos críticos da documentação foram cobertos.
            </p>

            <Card className="p-6 hover:scale-105 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-0">
                <h4 className="font-semibold text-gray-900 mb-4">Checklist para 'Pós-operatório de apendicectomia'</h4>
                <div className="space-y-3">
                  <div className="flex items-start group">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 transition-all duration-300 group-hover:scale-125" />
                    <p className="text-gray-700">O consentimento informado pré-operatório foi devidamente registrado?</p>
                  </div>
                  <div className="flex items-start group">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 transition-all duration-300 group-hover:scale-125" />
                    <p className="text-gray-700">Foram documentadas as orientações de alta para o paciente e/ou acompanhante (repouso, medicação, sinais de alerta)?</p>
                  </div>
                  <div className="flex items-start group">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 transition-all duration-300 group-hover:scale-125" />
                    <p className="text-gray-700">Há registro da checagem de alergias antes da administração de antibióticos?</p>
                  </div>
                  <div className="flex items-start group">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 transition-all duration-300 group-hover:scale-125" />
                    <p className="text-gray-700">A evolução descreve o estado da ferida operatória e a ausência de sinais flogísticos?</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funcionalidade 3 */}
          <div className={`transition-all duration-1000 delay-600 ${visibleElements.has('funcionalidades') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">3. Biblioteca de Modelos Juridicamente Validados</h3>
            <p className="text-lg text-gray-600 mb-8">
              Economize tempo e ganhe segurança. Acesse um acervo completo de documentos essenciais, elaborados e revisados por advogados especialistas, prontos para usar e adaptar.
            </p>

            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors duration-300 cursor-pointer hover:scale-105">TCLEs para Procedimentos</span>
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium hover:bg-green-200 transition-colors duration-300 cursor-pointer hover:scale-105">Modelos de Atestados</span>
              <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors duration-300 cursor-pointer hover:scale-105">Relatórios Médicos</span>
              <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors duration-300 cursor-pointer hover:scale-105">Laudos Periciais</span>
              <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors duration-300 cursor-pointer hover:scale-105">Pareceres</span>
            </div>
          </div>
        </div>
      </section>

      <PricingSection scrollToSection={scrollToSection} />

      {/* Contato Section */}
      <section id="contato" className="py-24 bg-gradient-to-br from-white to-slate-50" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-1000 ${visibleElements.has('contato') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vamos Conversar?
            </h2>
            <p className="text-xl text-gray-600">
              Nossa equipe está pronta para tirar suas dúvidas, agendar uma demonstração ou discutir parcerias estratégicas.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Formulário */}
            <div className={`transition-all duration-1000 delay-200 ${visibleElements.has('contato') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Envie sua mensagem</h3>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    name="nome"
                    type="text"
                    required
                    value={formData.nome}
                    onChange={handleFormChange}
                    className="mt-1 transition-all duration-300 focus:scale-105"
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleFormChange}
                    className="mt-1 transition-all duration-300 focus:scale-105"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={handleFormChange}
                    className="mt-1 transition-all duration-300 focus:scale-105"
                  />
                </div>

                <div>
                  <Label htmlFor="especialidade">Especialidade Médica</Label>
                  <Input
                    id="especialidade"
                    name="especialidade"
                    type="text"
                    value={formData.especialidade}
                    onChange={handleFormChange}
                    className="mt-1 transition-all duration-300 focus:scale-105"
                  />
                </div>

                <div>
                  <Label htmlFor="mensagem">Mensagem</Label>
                  <Textarea
                    id="mensagem"
                    name="mensagem"
                    rows={4}
                    value={formData.mensagem}
                    onChange={handleFormChange}
                    className="mt-1 transition-all duration-300 focus:scale-105"
                  />
                </div>

                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  Enviar e Ir para Checkout
                </Button>
              </form>
            </div>

            {/* Informações de Contato */}
            <div className={`space-y-8 transition-all duration-1000 delay-400 ${visibleElements.has('contato') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <Card className="p-6 hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-0">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Suporte e Dúvidas Gerais</h4>
                  <p className="text-gray-600 mb-4">
                    Para perguntas sobre a plataforma, planos ou suporte técnico, preencha o formulário ou envie um e-mail para:
                  </p>
                  <a href="mailto:suporte@meddefend.com.br" className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300 hover:underline">
                    suporte@meddefend.com.br
                  </a>
                </CardContent>
              </Card>

              <Card className="p-6 hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-0">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Parcerias Estratégicas</h4>
                  <p className="text-gray-600 mb-4">
                    Representa uma associação médica, seguradora ou instituição de saúde? Entre em contato para explorarmos oportunidades.
                  </p>
                  <a href="mailto:parcerias@meddefend.com.br" className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300 hover:underline">
                    parcerias@meddefend.com.br
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Logo e Tagline */}
            <div>
              <div className="flex items-center space-x-3 mb-4 group">
                <img 
                  src="/lovable-uploads/bdba2116-5b5a-4dd6-b6e8-5eb4cd0eb9bb.png" 
                  alt="MedDefend Logo" 
                  className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
                />
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-blue-300">MedDefend</span>
              </div>
              <p className="text-blue-200">Protegendo quem cuida.</p>
            </div>

            {/* Navegação */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Navegação</h4>
              <div className="space-y-2">
                <a href="#home" className="block text-blue-200 hover:text-white transition-colors duration-300">Início</a>
                <a href="#sobre" className="block text-blue-200 hover:text-white transition-colors duration-300">Sobre</a>
                <a href="#funcionalidades" className="block text-blue-200 hover:text-white transition-colors duration-300">Funcionalidades</a>
                <a href="#precos" className="block text-blue-200 hover:text-white transition-colors duration-300">Preços</a>
                <a href="#contato" className="block text-blue-200 hover:text-white transition-colors duration-300">Contato</a>
                <a href="/login" className="block text-blue-200 hover:text-white transition-colors duration-300">Login</a>
              </div>
            </div>

            {/* Contato */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Contato</h4>
              <div className="space-y-2">
                <a href="mailto:suporte@meddefend.com.br" className="block text-blue-200 hover:text-white transition-colors duration-300 hover:translate-x-2">
                  suporte@meddefend.com.br
                </a>
                <a href="mailto:parcerias@meddefend.com.br" className="block text-blue-200 hover:text-white transition-colors duration-300 hover:translate-x-2">
                  parcerias@meddefend.com.br
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-200 text-sm">© 2025 MedDefend. Todos os direitos reservados.</p>
            <a href="/dashboard_admin.html" className="text-blue-200 hover:text-white text-sm transition-all duration-300 mt-4 md:mt-0 hover:scale-105">
              Admin
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
