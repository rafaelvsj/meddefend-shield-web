
import { useState } from 'react';
import { Shield, Menu, X, CheckCircle, Clock, Users, TrendingDown, ArrowRight, Mail, FileText, Zap, Heart } from 'lucide-react';
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Aqui seria a integração com o backend
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
      <header className="bg-blue-900 text-white shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-300" />
              <span className="text-2xl font-bold">MedDefend</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button onClick={() => scrollToSection('home')} className="hover:text-blue-300 transition-colors">Início</button>
              <button onClick={() => scrollToSection('sobre')} className="hover:text-blue-300 transition-colors">Sobre</button>
              <button onClick={() => scrollToSection('funcionalidades')} className="hover:text-blue-300 transition-colors">Funcionalidades</button>
              <button onClick={() => scrollToSection('precos')} className="hover:text-blue-300 transition-colors">Preços</button>
              <button onClick={() => scrollToSection('contato')} className="hover:text-blue-300 transition-colors">Contato</button>
              <a href="/dashboard_usuario.html" className="hover:text-blue-300 transition-colors">Login</a>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:block">
              <Button asChild className="bg-blue-700 hover:bg-blue-600">
                <a href="/checkout.html">Acessar Plataforma</a>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-blue-800 border-t border-blue-700">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button onClick={() => scrollToSection('home')} className="block px-3 py-2 hover:bg-blue-700 rounded-md w-full text-left">Início</button>
                <button onClick={() => scrollToSection('sobre')} className="block px-3 py-2 hover:bg-blue-700 rounded-md w-full text-left">Sobre</button>
                <button onClick={() => scrollToSection('funcionalidades')} className="block px-3 py-2 hover:bg-blue-700 rounded-md w-full text-left">Funcionalidades</button>
                <button onClick={() => scrollToSection('precos')} className="block px-3 py-2 hover:bg-blue-700 rounded-md w-full text-left">Preços</button>
                <button onClick={() => scrollToSection('contato')} className="block px-3 py-2 hover:bg-blue-700 rounded-md w-full text-left">Contato</button>
                <a href="/dashboard_usuario.html" className="block px-3 py-2 hover:bg-blue-700 rounded-md">Login</a>
                <Button asChild className="w-full mt-2 bg-blue-700 hover:bg-blue-600">
                  <a href="/checkout.html">Acessar Plataforma</a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Mais processos judiciais do que médicos no Brasil. Sua prática clínica está protegida?
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              A MedDefend é a primeira plataforma com inteligência artificial que transforma sua documentação médica em uma sólida defesa jurídica. Reduza o risco de litígios e dedique seu tempo ao que realmente importa: seus pacientes.
            </p>
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg">
              <a href="/checkout.html">Experimente Gratuitamente por 3 Dias</a>
            </Button>
            <p className="text-sm text-gray-500 mt-4">Acesso completo. Cancele quando quiser.</p>
          </div>
        </div>
      </section>

      {/* Estatísticas Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              A Epidemia Silenciosa que Ameaça a Medicina
            </h2>
            <p className="text-xl text-gray-600">
              A realidade da prática médica no Brasil mudou. A judicialização não é mais um risco distante, é uma estatística alarmante.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center p-8 border-l-4 border-blue-500">
              <CardContent className="p-0">
                <div className="text-4xl font-bold text-blue-900 mb-2">+573 mil</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Processos na Saúde</div>
                <p className="text-gray-600">O número já supera o total de médicos ativos no país. É mais de 1 processo por médico.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-l-4 border-blue-500">
              <CardContent className="p-0">
                <div className="text-4xl font-bold text-blue-900 mb-2">198%</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Aumento de Litígios</div>
                <p className="text-gray-600">Crescimento exponencial na última década, gerando um ambiente de constante insegurança.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-l-4 border-blue-500">
              <CardContent className="p-0">
                <div className="text-4xl font-bold text-blue-900 mb-2">747 Dias</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Tempo Médio de Conclusão</div>
                <p className="text-gray-600">Anos de desgaste financeiro e emocional para os profissionais envolvidos.</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-blue-50 p-8 rounded-lg text-center">
            <blockquote className="text-xl text-gray-800 font-medium italic">
              "A principal vulnerabilidade não está no seu ato clínico, mas na forma como ele é documentado. Ambiguidade e omissões em prontuários são o principal combustível para processos judiciais."
            </blockquote>
          </div>
        </div>
      </section>

      {/* Produto Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sua Documentação. Fortalecida pela Inteligência Artificial.
            </h2>
            <p className="text-xl text-gray-600">
              A MedDefend não é um prontuário eletrônico. Somos seu assistente de mitigação de risco, uma camada de proteção inteligente que analisa, aprimora e blinda seus registros.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <FileText className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold">Assistente de Escrita Defensiva</h3>
                </div>
                <p className="text-gray-600">Nossa IA reescreve suas anotações para serem objetivas, claras e juridicamente seguras, eliminando termos subjetivos.</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold">Checklist Inteligente</h3>
                </div>
                <p className="text-gray-600">Gera perguntas contextuais para garantir que nenhuma informação crucial seja esquecida.</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <Shield className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold">Biblioteca de Modelos</h3>
                </div>
                <p className="text-gray-600">Acesse TCLEs, laudos e relatórios pré-validados por advogados especialistas.</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button onClick={() => scrollToSection('funcionalidades')} className="bg-blue-900 hover:bg-blue-800">
              Conheça as Ferramentas
            </Button>
          </div>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
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
            <Card className="p-6 border-l-4 border-green-500">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <Shield className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold">Segurança em Primeiro Lugar</h3>
                </div>
                <p className="text-gray-600">Conformidade com a LGPD e as mais rigorosas práticas de proteção de dados.</p>
              </CardContent>
            </Card>

            <Card className="p-6 border-l-4 border-blue-500">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <Heart className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold">Ética e Respeito</h3>
                </div>
                <p className="text-gray-600">Ferramentas em conformidade com as normas do CFM e respeito à autonomia profissional.</p>
              </CardContent>
            </Card>

            <Card className="p-6 border-l-4 border-purple-500">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <Zap className="h-8 w-8 text-purple-600 mr-3" />
                  <h3 className="text-xl font-semibold">Inovação com Propósito</h3>
                </div>
                <p className="text-gray-600">IA de ponta como um meio para resolver desafios reais e urgentes da medicina.</p>
              </CardContent>
            </Card>

            <Card className="p-6 border-l-4 border-orange-500">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <Users className="h-8 w-8 text-orange-600 mr-3" />
                  <h3 className="text-xl font-semibold">Confiança e Transparência</h3>
                </div>
                <p className="text-gray-600">Relações baseadas na clareza e precisão, na tecnologia e no nosso negócio.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Funcionalidades Section */}
      <section id="funcionalidades" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ferramentas Inteligentes para uma Prática Mais Segura
            </h2>
            <p className="text-xl text-gray-600">
              Conheça os pilares da MedDefend, projetados para se integrarem perfeitamente à sua rotina e fortalecer cada registro que você cria.
            </p>
          </div>

          {/* Funcionalidade 1 */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">1. Assistente de Escrita Defensiva</h3>
            <p className="text-lg text-gray-600 mb-8">
              Transforme anotações em documentos robustos. Cole seu texto e nossa IA identifica ambiguidades, sugerindo em segundos uma versão aprimorada e juridicamente mais segura.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 border-l-4 border-red-400">
                <CardContent className="p-0">
                  <h4 className="font-semibold text-red-700 mb-3">Texto Original (Subjetivo)</h4>
                  <p className="text-gray-600 italic">"Paciente parece ansioso e pouco colaborativo."</p>
                </CardContent>
              </Card>

              <Card className="p-6 border-l-4 border-green-500">
                <CardContent className="p-0">
                  <h4 className="font-semibold text-green-700 mb-3">Texto Aprimorado (Objetivo)</h4>
                  <p className="text-gray-600">"Paciente relata dificuldade para dormir, apresenta taquicardia (FC 110 bpm) e verbaliza preocupação com o resultado do exame. Recusou a primeira tentativa de aferição de pressão arterial, mas consentiu na segunda."</p>
                </CardContent>
              </Card>
            </div>

            <Card className="p-6 bg-blue-50 border border-blue-200">
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
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">2. Checklist Contextual Inteligente</h3>
            <p className="text-lg text-gray-600 mb-8">
              Nunca mais esqueça um detalhe importante. Com base no contexto clínico (ex: "alta pós-cirúrgica"), a MedDefend gera uma lista de verificação para garantir que todos os pontos críticos da documentação foram cobertos.
            </p>

            <Card className="p-6">
              <CardContent className="p-0">
                <h4 className="font-semibold text-gray-900 mb-4">Checklist para 'Pós-operatório de apendicectomia'</h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <p className="text-gray-700">O consentimento informado pré-operatório foi devidamente registrado?</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <p className="text-gray-700">Foram documentadas as orientações de alta para o paciente e/ou acompanhante (repouso, medicação, sinais de alerta)?</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <p className="text-gray-700">Há registro da checagem de alergias antes da administração de antibióticos?</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <p className="text-gray-700">A evolução descreve o estado da ferida operatória e a ausência de sinais flogísticos?</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funcionalidade 3 */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">3. Biblioteca de Modelos Juridicamente Validados</h3>
            <p className="text-lg text-gray-600 mb-8">
              Economize tempo e ganhe segurança. Acesse um acervo completo de documentos essenciais, elaborados e revisados por advogados especialistas, prontos para usar e adaptar.
            </p>

            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">TCLEs para Procedimentos</span>
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">Modelos de Atestados</span>
              <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">Relatórios Médicos</span>
              <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">Laudos Periciais</span>
              <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">Pareceres</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Mais que um Software: Uma Apólice de Tranquilidade
            </h2>
            <p className="text-xl text-gray-600">
              Adotar a MedDefend é um investimento direto na longevidade e na segurança da sua carreira.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Máxima Segurança Jurídica</h3>
                <p className="text-gray-600">Crie uma barreira de proteção documental que minimiza brechas para litígios.</p>
              </CardContent>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Otimização do Seu Tempo</h3>
                <p className="text-gray-600">Automatize a parte mais crítica e demorada da documentação.</p>
              </CardContent>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <TrendingDown className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Risco Ativamente Mitigado</h3>
                <p className="text-gray-600">Atue na causa-raiz dos processos: a falha documental.</p>
              </CardContent>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <Heart className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Paz de Espírito</h3>
                <p className="text-gray-600">Trabalhe com a confiança de que sua prática está documentada da forma mais segura.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Preços Section */}
      <section id="precos" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Escolha o Plano Ideal para Sua Segurança
            </h2>
            <p className="text-xl text-gray-600">
              Acesso flexível e transparente, pensado para a realidade de cada médico.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Plano Gratuito */}
            <Card className="p-8 text-center">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Plano Gratuito</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">R$ 0</div>
                <p className="text-gray-600 mb-6">Para conhecer o básico</p>
                <div className="mb-6">
                  <p className="text-gray-700 mb-2">5 créditos iniciais</p>
                  <p className="text-sm text-gray-600">Use o Assistente de Escrita Defensiva e entenda o valor da plataforma sem compromisso.</p>
                </div>
                <Button variant="outline" className="w-full border-orange-500 text-orange-600 hover:bg-orange-50" asChild>
                  <a href="/dashboard_usuario.html">Comece a Usar</a>
                </Button>
              </CardContent>
            </Card>

            {/* Plano Profissional */}
            <Card className="p-8 text-center relative border-2 border-green-500">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">POPULAR</span>
              </div>
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">MedDefend Profissional</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">R$ 99 <span className="text-lg text-gray-600">/mês</span></div>
                <p className="text-gray-600 mb-2">Proteção Integral e Teste Gratuito</p>
                <p className="text-sm text-gray-500 mb-6">Após 3 dias de teste gratuito</p>
                <div className="text-left mb-6 space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-gray-700">Assistente de Escrita Ilimitado</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-gray-700">Checklist Contextual Inteligente</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-gray-700">Biblioteca Completa de Modelos</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-gray-700">Histórico de Documentos</span>
                  </div>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                  <a href="/checkout.html">Iniciar Teste de 3 Dias</a>
                </Button>
              </CardContent>
            </Card>

            {/* Plano Clínicas */}
            <Card className="p-8 text-center">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">MedDefend Clínicas</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">Sob Consulta</div>
                <p className="text-gray-600 mb-2">Para equipes</p>
                <p className="text-sm text-gray-500 mb-6">Para múltiplos usuários</p>
                <div className="mb-6">
                  <p className="text-gray-700">Recursos do plano Profissional, gestão de equipe e relatórios de conformidade.</p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => scrollToSection('contato')}>
                  Fale Conosco
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contato Section */}
      <section id="contato" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vamos Conversar?
            </h2>
            <p className="text-xl text-gray-600">
              Nossa equipe está pronta para tirar suas dúvidas, agendar uma demonstração ou discutir parcerias estratégicas.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Formulário */}
            <div>
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
                    className="mt-1"
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
                    className="mt-1"
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
                    className="mt-1"
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
                    className="mt-1"
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
                    className="mt-1"
                  />
                </div>

                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">
                  Enviar e Ir para Checkout
                </Button>
              </form>
            </div>

            {/* Informações de Contato */}
            <div className="space-y-8">
              <Card className="p-6">
                <CardContent className="p-0">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Suporte e Dúvidas Gerais</h4>
                  <p className="text-gray-600 mb-4">
                    Para perguntas sobre a plataforma, planos ou suporte técnico, preencha o formulário ou envie um e-mail para:
                  </p>
                  <a href="mailto:suporte@meddefend.com.br" className="text-blue-600 hover:text-blue-800 font-medium">
                    suporte@meddefend.com.br
                  </a>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardContent className="p-0">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Parcerias Estratégicas</h4>
                  <p className="text-gray-600 mb-4">
                    Representa uma associação médica, seguradora ou instituição de saúde? Entre em contato para explorarmos oportunidades.
                  </p>
                  <a href="mailto:parcerias@meddefend.com.br" className="text-blue-600 hover:text-blue-800 font-medium">
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
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-8 w-8 text-blue-300" />
                <span className="text-2xl font-bold">MedDefend</span>
              </div>
              <p className="text-blue-200">Protegendo quem cuida.</p>
            </div>

            {/* Navegação */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Navegação</h4>
              <div className="space-y-2">
                <button onClick={() => scrollToSection('home')} className="block text-blue-200 hover:text-white transition-colors">Início</button>
                <button onClick={() => scrollToSection('sobre')} className="block text-blue-200 hover:text-white transition-colors">Sobre</button>
                <button onClick={() => scrollToSection('funcionalidades')} className="block text-blue-200 hover:text-white transition-colors">Funcionalidades</button>
                <button onClick={() => scrollToSection('precos')} className="block text-blue-200 hover:text-white transition-colors">Preços</button>
                <button onClick={() => scrollToSection('contato')} className="block text-blue-200 hover:text-white transition-colors">Contato</button>
              </div>
            </div>

            {/* Contato */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Contato</h4>
              <div className="space-y-2">
                <a href="mailto:suporte@meddefend.com.br" className="block text-blue-200 hover:text-white transition-colors">
                  suporte@meddefend.com.br
                </a>
                <a href="mailto:parcerias@meddefend.com.br" className="block text-blue-200 hover:text-white transition-colors">
                  parcerias@meddefend.com.br
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-200 text-sm">© 2025 MedDefend. Todos os direitos reservados.</p>
            <a href="/dashboard_admin.html" className="text-blue-200 hover:text-white text-sm transition-colors mt-4 md:mt-0">
              Admin
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
