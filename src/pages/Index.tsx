import { useState, useEffect, useRef } from 'react';
import { Shield, Menu, X, CheckCircle, Clock, Users, TrendingDown, ArrowRight, Mail, FileText, Zap, Heart, AlertTriangle, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    processes: 0,
    growth: 0,
    days: 0,
    processesVsDoctors: 0,
    gpt35Hallucination: 0,
    gpt4Hallucination: 0,
    bardHallucination: 0,
    severeHallucinations: 0
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

  // Counter animations
  useEffect(() => {
    if (visibleElements.has('statistics')) {
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

      animateCounter(573, (val) => setCounters(prev => ({ ...prev, processes: val })));
      animateCounter(198, (val) => setCounters(prev => ({ ...prev, growth: val })));
      animateCounter(747, (val) => setCounters(prev => ({ ...prev, days: val })));
    }

    // New counters for LLM danger section
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
      animateCounter(396, (val) => setCounters(prev => ({ ...prev, gpt35Hallucination: val / 10 })));
      animateCounter(286, (val) => setCounters(prev => ({ ...prev, gpt4Hallucination: val / 10 })));
      animateCounter(914, (val) => setCounters(prev => ({ ...prev, bardHallucination: val / 10 })));
      animateCounter(44, (val) => setCounters(prev => ({ ...prev, severeHallucinations: val })));
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
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg fixed w-full top-0 z-50 transition-all duration-300 hover:shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 group">
              <img 
                src="/lovable-uploads/bdba2116-5b5a-4dd6-b6e8-5eb4cd0eb9bb.png" 
                alt="MedDefend Logo" 
                className="h-10 w-10 transition-transform duration-300 group-hover:scale-110"
              />
              <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-blue-300">MedDefend</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#home" className="text-white hover:text-blue-200 transition-colors duration-300">Início</a>
              <a href="#sobre" className="text-white hover:text-blue-200 transition-colors duration-300">Sobre</a>
              <a href="#funcionalidades" className="text-white hover:text-blue-200 transition-colors duration-300">Funcionalidades</a>
              <a href="#precos" className="text-white hover:text-blue-200 transition-colors duration-300">Preços</a>
              <a href="#contato" className="text-white hover:text-blue-200 transition-colors duration-300">Contato</a>
              <a href="/login" className="text-white hover:text-blue-200 transition-colors duration-300">Login</a>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:block">
              <Button asChild className="bg-blue-700 hover:bg-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <a href="/checkout.html">Acessar Plataforma</a>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden transition-transform duration-300 hover:scale-110"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-blue-800 border-t border-blue-700 animate-fade-in">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button onClick={() => scrollToSection('home')} className="block px-3 py-2 hover:bg-blue-700 rounded-md w-full text-left transition-all duration-300 hover:scale-105">Início</button>
                <button onClick={() => scrollToSection('sobre')} className="block px-3 py-2 hover:bg-blue-700 rounded-md w-full text-left transition-all duration-300 hover:scale-105">Sobre</button>
                <button onClick={() => scrollToSection('funcionalidades')} className="block px-3 py-2 hover:bg-blue-700 rounded-md w-full text-left transition-all duration-300 hover:scale-105">Funcionalidades</button>
                <button onClick={() => scrollToSection('precos')} className="block px-3 py-2 hover:bg-blue-700 rounded-md w-full text-left transition-all duration-300 hover:scale-105">Preços</button>
                <button onClick={() => scrollToSection('contato')} className="block px-3 py-2 hover:bg-blue-700 rounded-md w-full text-left transition-all duration-300 hover:scale-105">Contato</button>
                <a href="/login" className="block px-3 py-2 hover:bg-blue-700 rounded-md transition-all duration-300 hover:scale-105">Login</a>
                <Button asChild className="w-full mt-2 bg-blue-700 hover:bg-blue-600 transition-all duration-300 hover:scale-105">
                  <a href="/checkout.html">Acessar Plataforma</a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-16 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto" data-animate id="hero-content">
            <h1 className={`text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight transition-all duration-1000 ${visibleElements.has('hero-content') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              Mais processos judiciais do que médicos no Brasil. Sua prática clínica está protegida?
            </h1>
            <p className={`text-xl text-gray-600 mb-8 leading-relaxed transition-all duration-1000 delay-300 ${visibleElements.has('hero-content') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              A MedDefend é a primeira plataforma com inteligência artificial que transforma sua documentação médica em uma sólida defesa jurídica. Reduza o risco de litígios e dedique seu tempo ao que realmente importa: seus pacientes.
            </p>
            <div className={`transition-all duration-1000 delay-500 ${visibleElements.has('hero-content') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <a href="/checkout.html">Experimente Gratuitamente por 3 Dias</a>
              </Button>
            </div>
            <p className={`text-sm text-gray-500 mt-4 transition-all duration-1000 delay-700 ${visibleElements.has('hero-content') ? 'opacity-100' : 'opacity-0'}`}>Acesso completo. Cancele quando quiser.</p>
          </div>
        </div>
      </section>

      {/* Estatísticas Section */}
      <section className="py-20 bg-white" data-animate id="statistics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-1000 ${visibleElements.has('statistics') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              A Epidemia Silenciosa que Ameaça a Medicina
            </h2>
            <p className="text-xl text-gray-600">
              A realidade da prática médica no Brasil mudou. A judicialização não é mais um risco distante, é uma estatística alarmante.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className={`text-center p-8 border-l-4 border-blue-500 transition-all duration-1000 delay-200 hover:scale-105 hover:shadow-xl ${visibleElements.has('statistics') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <CardContent className="p-0">
                <div className="text-4xl font-bold text-blue-900 mb-2">+{counters.processes} mil</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Processos na Saúde</div>
                <p className="text-gray-600">O número já supera o total de médicos ativos no país. É mais de 1 processo por médico.</p>
              </CardContent>
            </Card>

            <Card className={`text-center p-8 border-l-4 border-blue-500 transition-all duration-1000 delay-400 hover:scale-105 hover:shadow-xl ${visibleElements.has('statistics') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <CardContent className="p-0">
                <div className="text-4xl font-bold text-blue-900 mb-2">{counters.growth}%</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Aumento de Litígios</div>
                <p className="text-gray-600">Crescimento exponencial na última década, gerando um ambiente de constante insegurança.</p>
              </CardContent>
            </Card>

            <Card className={`text-center p-8 border-l-4 border-blue-500 transition-all duration-1000 delay-600 hover:scale-105 hover:shadow-xl ${visibleElements.has('statistics') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <CardContent className="p-0">
                <div className="text-4xl font-bold text-blue-900 mb-2">{counters.days} Dias</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Tempo Médio de Conclusão</div>
                <p className="text-gray-600">Anos de desgaste financeiro e emocional para os profissionais envolvidos.</p>
              </CardContent>
            </Card>
          </div>

          <div className={`bg-blue-50 p-8 rounded-lg text-center transition-all duration-1000 delay-800 hover:bg-blue-100 ${visibleElements.has('statistics') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <blockquote className="text-xl text-gray-800 font-medium italic">
              "A principal vulnerabilidade não está no seu ato clínico, mas na forma como ele é documentado. Ambiguidade e omissões em prontuários são o principal combustível para processos judiciais."
            </blockquote>
          </div>
        </div>
      </section>

      {/* LLM Danger Section - Updated with blue theme */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white overflow-hidden" data-animate id="llm-danger">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Warning Header */}
          <div className={`text-center mb-16 transition-all duration-1000 ${visibleElements.has('llm-danger') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center justify-center mb-6">
              <AlertTriangle className="h-12 w-12 text-orange-300 mr-4" />
              <h2 className="text-4xl md:text-5xl font-bold">
                Por Que LLMs Genéricas São Perigosas Na Medicina?
              </h2>
              <AlertTriangle className="h-12 w-12 text-orange-300 ml-4" />
            </div>
            <p className="text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              O Perigo Silencioso das LLMs em Documentação Médica
            </p>
          </div>

          {/* Scenario Description */}
          <div className={`bg-blue-950/70 p-8 rounded-lg mb-16 border-l-4 border-orange-400 transition-all duration-1000 delay-200 ${visibleElements.has('llm-danger') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <p className="text-lg leading-relaxed mb-4">
              <strong className="text-orange-300">Imagine este cenário:</strong> Um médico utiliza ChatGPT para redigir um relatório médico. A IA gera um texto fluente e aparentemente técnico, mas contém uma <span className="text-orange-300 font-bold">alucinação crítica</span> - afirma que o paciente 'não apresenta histórico de alergias' quando, na verdade, ele possui alergia grave à penicilina.
            </p>
            <p className="text-lg leading-relaxed">
              Seis meses depois, em uma emergência, outro médico prescreve penicilina baseado nessa documentação. O resultado? <span className="text-orange-300 font-bold">Choque anafilático, UTI, e um processo de R$ 2 milhões.</span>
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className={`bg-blue-800/80 border-orange-400 text-center p-6 transition-all duration-1000 delay-300 hover:scale-105 hover:bg-blue-800 ${visibleElements.has('llm-danger') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <CardContent className="p-0">
                <BarChart2 className="h-8 w-8 text-orange-300 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-100 mb-1">{counters.processesVsDoctors.toLocaleString()}</div>
                <div className="text-sm text-blue-200">Processos vs 562.206 Médicos</div>
                <p className="text-xs text-orange-300 mt-2">Mais processos que médicos!</p>
              </CardContent>
            </Card>

            <Card className={`bg-blue-800/80 border-orange-400 text-center p-6 transition-all duration-1000 delay-400 hover:scale-105 hover:bg-blue-800 ${visibleElements.has('llm-danger') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <CardContent className="p-0">
                <AlertTriangle className="h-8 w-8 text-orange-300 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-100 mb-1">{counters.gpt35Hallucination.toFixed(1)}%</div>
                <div className="text-sm text-blue-200">Taxa de Alucinação GPT-3.5</div>
                <p className="text-xs text-orange-300 mt-2">4 em cada 10 respostas!</p>
              </CardContent>
            </Card>

            <Card className={`bg-blue-800/80 border-orange-400 text-center p-6 transition-all duration-1000 delay-500 hover:scale-105 hover:bg-blue-800 ${visibleElements.has('llm-danger') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <CardContent className="p-0">
                <AlertTriangle className="h-8 w-8 text-orange-300 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-100 mb-1">{counters.bardHallucination.toFixed(1)}%</div>
                <div className="text-sm text-blue-200">Taxa de Alucinação Bard</div>
                <p className="text-xs text-orange-300 mt-2">9 em cada 10 respostas!</p>
              </CardContent>
            </Card>

            <Card className={`bg-blue-800/80 border-orange-400 text-center p-6 transition-all duration-1000 delay-600 hover:scale-105 hover:bg-blue-800 ${visibleElements.has('llm-danger') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <CardContent className="p-0">
                <AlertTriangle className="h-8 w-8 text-orange-300 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-100 mb-1">{counters.severeHallucinations}%</div>
                <div className="text-sm text-blue-200">Alucinações Graves</div>
                <p className="text-xs text-orange-300 mt-2">Potencialmente fatais</p>
              </CardContent>
            </Card>
          </div>

          {/* Real Cases */}
          <div className={`mb-16 transition-all duration-1000 delay-700 ${visibleElements.has('llm-danger') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h3 className="text-2xl font-bold text-center mb-8 text-blue-100">Casos Reais de Processos por Documentação Inadequada</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-blue-950/60 border-orange-400 p-6 hover:scale-105 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="text-2xl font-bold text-orange-300 mb-2">US$ 216.8 mi</div>
                  <p className="text-blue-100 text-sm">Hospital Johns Hopkins - Falha na documentação de procedimento</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-950/60 border-orange-400 p-6 hover:scale-105 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="text-2xl font-bold text-orange-300 mb-2">US$ 101 mi</div>
                  <p className="text-blue-100 text-sm">Mayo Clinic - Erro de registro em prontuário eletrônico</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-950/60 border-orange-400 p-6 hover:scale-105 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="text-2xl font-bold text-orange-300 mb-2">R$ 500 mil</div>
                  <p className="text-blue-100 text-sm">Hospital Sírio-Libanês - Documentação incompleta de cirurgia</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Comparison Section */}
          <div className={`mb-16 transition-all duration-1000 delay-800 ${visibleElements.has('llm-danger') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h3 className="text-2xl font-bold text-center mb-8 text-blue-100">A Diferença que Pode Salvar Sua Carreira</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {/* LLM Comum */}
              <Card className="bg-blue-800/50 border-orange-400 p-6 hover:scale-105 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-orange-400 mr-3" />
                    <h4 className="text-xl font-bold text-orange-300">Com LLM Comum</h4>
                  </div>
                  <div className="bg-blue-950/50 p-4 rounded border-l-2 border-orange-400">
                    <p className="text-blue-100 italic">
                      "Paciente apresentou dor abdominal. Realizado exame clínico. Prescrito analgésico."
                    </p>
                  </div>
                  <div className="mt-4 text-sm text-blue-200">
                    ❌ Vago e subjetivo<br/>
                    ❌ Sem detalhes importantes<br/>
                    ❌ Vulnerável juridicamente
                  </div>
                </CardContent>
              </Card>

              {/* MedDefend */}
              <Card className="bg-green-900/50 border-green-400 p-6 hover:scale-105 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <Shield className="h-6 w-6 text-green-400 mr-3" />
                    <h4 className="text-xl font-bold text-green-300">Com MedDefend</h4>
                  </div>
                  <div className="bg-blue-950/50 p-4 rounded border-l-2 border-green-400">
                    <p className="text-green-100 text-sm">
                      "Paciente relata dor abdominal iniciada há 6 horas, localizada em fossa ilíaca direita, intensidade 7/10 na escala numérica. Ao exame físico: abdome flácido, doloroso à palpação profunda em ponto de McBurney, sem sinais de irritação peritoneal. Descartada apendicite aguda através dos critérios de Alvarado (escore: 3/10). Sinal de Blumberg negativo. Orientado retorno em caso de piora do quadro ou surgimento de febre. Paciente compreendeu e concordou com conduta proposta."
                    </p>
                  </div>
                  <div className="mt-4 text-sm text-green-200">
                    ✅ Objetivo e detalhado<br/>
                    ✅ Protocolo médico seguido<br/>
                    ✅ Juridicamente defensável
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Urgency CTA */}
          <div className={`text-center transition-all duration-1000 delay-1000 ${visibleElements.has('llm-danger') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="bg-blue-950/70 p-8 rounded-lg border border-orange-400">
              <h3 className="text-3xl font-bold text-blue-100 mb-4">
                Você Confiaria Sua Defesa Jurídica a uma IA que 'Alucina' 3 em cada 10 Vezes?
              </h3>
              <p className="text-lg text-blue-200 mb-6">
                A pergunta não é <strong>SE</strong> você será processado, mas <strong>QUANDO</strong>
              </p>
              <Button 
                asChild 
                size="lg" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-orange-400"
              >
                <a href="/checkout.html">
                  🛡️ PROTEJA SUA CARREIRA AGORA - TESTE GRÁTIS
                </a>
              </Button>
              <p className="text-sm text-orange-300 mt-4">Não deixe sua documentação se tornar sua maior vulnerabilidade</p>
            </div>
          </div>
        </div>
      </section>

      {/* Produto Section */}
      <section className="py-20 bg-gray-50" data-animate id="produto">
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
                  <CheckCircle className="h-8 w-8 text-blue-600 mr-3 transition-all duration-300 group-hover:scale-125 group-hover:text-blue-700" />
                  <h3 className="text-xl font-semibold">Checklist Inteligente</h3>
                </div>
                <p className="text-gray-600">Gera perguntas contextuais para garantir que nenhuma informação crucial seja esquecida.</p>
              </CardContent>
            </Card>

            <Card className={`p-6 transition-all duration-1000 delay-600 hover:scale-105 hover:shadow-xl hover:rotate-1 ${visibleElements.has('produto') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <CardContent className="p-0">
                <div className="flex items-center mb-4 group">
                  <Shield className="h-8 w-8 text-blue-600 mr-3 transition-all duration-300 group-hover:scale-125 group-hover:text-blue-700" />
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
      <section id="sobre" className="py-20 bg-white" data-animate>
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
      <section id="funcionalidades" className="py-20 bg-gray-50" data-animate>
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

      {/* Benefícios Section */}
      <section className="py-20 bg-white" data-animate id="beneficios">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-1000 ${visibleElements.has('beneficios') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Mais que um Software: Uma Apólice de Tranquilidade
            </h2>
            <p className="text-xl text-gray-600">
              Adotar a MedDefend é um investimento direto na longevidade e na segurança da sua carreira.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className={`p-8 text-center transition-all duration-1000 delay-200 hover:scale-105 hover:shadow-xl ${visibleElements.has('beneficios') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <CardContent className="p-0">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4 transition-all duration-300 hover:scale-125" />
                <h3 className="text-xl font-semibold mb-3">Máxima Segurança Jurídica</h3>
                <p className="text-gray-600">Crie uma barreira de proteção documental que minimiza brechas para litígios.</p>
              </CardContent>
            </Card>

            <Card className={`p-8 text-center relative border-2 border-green-500 transition-all duration-1000 delay-400 hover:scale-105 hover:shadow-xl ${visibleElements.has('beneficios') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium animate-pulse">POPULAR</span>
              </div>
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">MedDefend Profissional</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">R$ 99 <span className="text-lg text-gray-600">/mês</span></div>
                <p className="text-gray-600 mb-2">Proteção Integral e Teste Gratuito</p>
                <p className="text-sm text-gray-500 mb-6">Após 3 dias de teste gratuito</p>
                <div className="text-left mb-6 space-y-2">
                  <div className="flex items-center group">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 transition-all duration-300 group-hover:scale-125" />
                    <span className="text-gray-700">Assistente de Escrita Ilimitado</span>
                  </div>
                  <div className="flex items-center group">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 transition-all duration-300 group-hover:scale-125" />
                    <span className="text-gray-700">Checklist Contextual Inteligente</span>
                  </div>
                  <div className="flex items-center group">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 transition-all duration-300 group-hover:scale-125" />
                    <span className="text-gray-700">Biblioteca Completa de Modelos</span>
                  </div>
                  <div className="flex items-center group">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 transition-all duration-300 group-hover:scale-125" />
                    <span className="text-gray-700">Histórico de Documentos</span>
                  </div>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700 transition-all duration-300 hover:scale-105 hover:shadow-lg" asChild>
                  <a href="/checkout.html">Iniciar Teste de 3 Dias</a>
                </Button>
              </CardContent>
            </Card>

            <Card className={`p-8 text-center transition-all duration-1000 delay-600 hover:scale-105 hover:shadow-xl ${visibleElements.has('beneficios') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">MedDefend Clínicas</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">Sob Consulta</div>
                <p className="text-gray-600 mb-2">Para equipes</p>
                <p className="text-sm text-gray-500 mb-6">Para múltiplos usuários</p>
                <div className="mb-6">
                  <p className="text-gray-700">Recursos do plano Profissional, gestão de equipe e relatórios de conformidade.</p>
                </div>
                <Button variant="outline" className="w-full transition-all duration-300 hover:scale-105" onClick={() => scrollToSection('contato')}>
                  Fale Conosco
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Preços Section */}
      <section id="precos" className="py-20 bg-gray-50" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-1000 ${visibleElements.has('precos') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Escolha o Plano Ideal para Sua Segurança
            </h2>
            <p className="text-xl text-gray-600">
              Acesso flexível e transparente, pensado para a realidade de cada médico.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Plano Gratuito */}
            <Card className={`p-8 text-center transition-all duration-1000 delay-200 hover:scale-105 hover:shadow-xl ${visibleElements.has('precos') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Plano Gratuito</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">R$ 0</div>
                <p className="text-gray-600 mb-6">Para conhecer o básico</p>
                <div className="mb-6">
                  <p className="text-gray-700 mb-2">5 créditos iniciais</p>
                  <p className="text-sm text-gray-600">Use o Assistente de Escrita Defensiva e entenda o valor da plataforma sem compromisso.</p>
                </div>
                <Button variant="outline" className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 transition-all duration-300 hover:scale-105" asChild>
                  <a href="/dashboard_usuario.html">Comece a Usar</a>
                </Button>
              </CardContent>
            </Card>

            {/* Plano Profissional */}
            <Card className={`p-8 text-center relative border-2 border-green-500 transition-all duration-1000 delay-400 hover:scale-105 hover:shadow-xl ${visibleElements.has('precos') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium animate-pulse">POPULAR</span>
              </div>
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">MedDefend Profissional</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">R$ 99 <span className="text-lg text-gray-600">/mês</span></div>
                <p className="text-gray-600 mb-2">Proteção Integral e Teste Gratuito</p>
                <p className="text-sm text-gray-500 mb-6">Após 3 dias de teste gratuito</p>
                <div className="text-left mb-6 space-y-2">
                  <div className="flex items-center group">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 transition-all duration-300 group-hover:scale-125" />
                    <span className="text-gray-700">Assistente de Escrita Ilimitado</span>
                  </div>
                  <div className="flex items-center group">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 transition-all duration-300 group-hover:scale-125" />
                    <span className="text-gray-700">Checklist Contextual Inteligente</span>
                  </div>
                  <div className="flex items-center group">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 transition-all duration-300 group-hover:scale-125" />
                    <span className="text-gray-700">Biblioteca Completa de Modelos</span>
                  </div>
                  <div className="flex items-center group">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 transition-all duration-300 group-hover:scale-125" />
                    <span className="text-gray-700">Histórico de Documentos</span>
                  </div>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700 transition-all duration-300 hover:scale-105 hover:shadow-lg" asChild>
                  <a href="/checkout.html">Iniciar Teste de 3 Dias</a>
                </Button>
              </CardContent>
            </Card>

            {/* Plano Clínicas */}
            <Card className={`p-8 text-center transition-all duration-1000 delay-600 hover:scale-105 hover:shadow-xl ${visibleElements.has('precos') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">MedDefend Clínicas</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">Sob Consulta</div>
                <p className="text-gray-600 mb-2">Para equipes</p>
                <p className="text-sm text-gray-500 mb-6">Para múltiplos usuários</p>
                <div className="mb-6">
                  <p className="text-gray-700">Recursos do plano Profissional, gestão de equipe e relatórios de conformidade.</p>
                </div>
                <Button variant="outline" className="w-full transition-all duration-300 hover:scale-105" onClick={() => scrollToSection('contato')}>
                  Fale Conosco
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contato Section */}
      <section id="contato" className="py-20 bg-white" data-animate>
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
      <footer className="bg-blue-900 text-white py-16">
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
