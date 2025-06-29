
import { useState } from 'react';
import { ArrowLeft, FileText, Shield, AlertTriangle, Users, Gavel, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

const TermsOfService = () => {
  const [activeSection, setActiveSection] = useState('definicoes');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const sections = [
    { id: 'definicoes', title: 'Definições', icon: <FileText className="h-4 w-4" /> },
    { id: 'objeto', title: 'Objeto do Contrato', icon: <Shield className="h-4 w-4" /> },
    { id: 'responsabilidades', title: 'Responsabilidades', icon: <Users className="h-4 w-4" /> },
    { id: 'limitacoes', title: 'Limitações', icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'propriedade', title: 'Propriedade Intelectual', icon: <Gavel className="h-4 w-4" /> },
    { id: 'pagamento', title: 'Pagamento', icon: <Clock className="h-4 w-4" /> },
    { id: 'cancelamento', title: 'Cancelamento', icon: <Clock className="h-4 w-4" /> },
    { id: 'conformidade', title: 'Conformidade', icon: <Shield className="h-4 w-4" /> },
    { id: 'disposicoes', title: 'Disposições Gerais', icon: <Gavel className="h-4 w-4" /> },
    { id: 'faq', title: 'FAQ', icon: <FileText className="h-4 w-4" /> }
  ];

  const faqs = [
    {
      question: "A MedDefend substitui meu julgamento médico profissional?",
      answer: "Não. A MedDefend é uma ferramenta auxiliar para documentação. Todas as decisões clínicas permanecem sob sua responsabilidade profissional e não podem ser delegadas à inteligência artificial."
    },
    {
      question: "Como a IA garante conformidade com o CFM?",
      answer: "Nossa IA foi treinada com diretrizes do CFM e literatura médica brasileira. Contudo, você deve sempre revisar e validar toda documentação gerada antes de utilizá-la clinicamente."
    },
    {
      question: "O que acontece com meus dados se eu cancelar?",
      answer: "Seus dados são mantidos conforme nossa Política de Privacidade. Você pode solicitar exportação ou exclusão através de nossa central de privacidade."
    },
    {
      question: "A plataforma tem validade jurídica?",
      answer: "A documentação gerada pela MedDefend tem caráter auxiliar. A validade jurídica depende da qualidade dos dados inseridos e da revisão profissional do médico responsável."
    }
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Header */}
      <header className="bg-transparent backdrop-blur-sm border-b border-gray-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild className="text-gray-300 hover:text-white">
                <a href="/" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </a>
              </Button>
              <Separator orientation="vertical" className="h-6 bg-gray-700" />
              <div className="flex items-center space-x-3">
                <img 
                  src="/lovable-uploads/38d87268-cc87-427b-8e27-bf6629d3ade4.png" 
                  alt="MedDefend Logo" 
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold font-outfit text-white">MedDefend</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Índice</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-200 ${
                          activeSection === section.id
                            ? 'bg-purple-600/20 text-purple-300 border-r-2 border-purple-500'
                            : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                        }`}
                      >
                        {section.icon}
                        <span className="text-sm font-medium">{section.title}</span>
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">Termos de Uso</h1>
                <p className="text-gray-300 text-lg mb-2">
                  Vigência: {new Date().toLocaleDateString('pt-BR')}
                </p>
                <p className="text-gray-400">
                  Última atualização: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* Definições */}
              <section id="definicoes" className="scroll-mt-24">
                <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-white">
                      <FileText className="h-6 w-6 text-blue-400" />
                      <span>1. Definições</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <strong className="text-white">Plataforma:</strong> Sistema MedDefend
                        </div>
                        <div>
                          <strong className="text-white">Usuário:</strong> Médico cadastrado
                        </div>
                        <div>
                          <strong className="text-white">IA:</strong> Inteligência Artificial para documentação
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <strong className="text-white">CFM:</strong> Conselho Federal de Medicina
                        </div>
                        <div>
                          <strong className="text-white">LGPD:</strong> Lei Geral de Proteção de Dados
                        </div>
                        <div>
                          <strong className="text-white">Documentação Defensiva:</strong> Registro clínico juridicamente robusto
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Objeto */}
              <section id="objeto" className="scroll-mt-24">
                <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-white">
                      <Shield className="h-6 w-6 text-green-400" />
                      <span>2. Objeto do Contrato</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 space-y-4">
                    <p>
                      A MedDefend fornece uma plataforma de inteligência artificial para auxiliar médicos na 
                      criação de documentação médica defensiva, incluindo:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Geração automatizada de relatórios médicos</li>
                      <li>Análise preditiva de riscos de litígio</li>
                      <li>Templates conformes às diretrizes do CFM</li>
                      <li>Sistema de backup e segurança de dados</li>
                      <li>Consultoria jurídica especializada (planos específicos)</li>
                    </ul>
                  </CardContent>
                </Card>
              </section>

              {/* Responsabilidades */}
              <section id="responsabilidades" className="scroll-mt-24">
                <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-white">
                      <Users className="h-6 w-6 text-yellow-400" />
                      <span>3. Responsabilidades</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                        <h4 className="text-green-300 font-semibold mb-3">Da MedDefend</h4>
                        <ul className="text-sm space-y-2 text-green-200">
                          <li>• Manter a plataforma funcionando</li>
                          <li>• Proteger dados conforme LGPD</li>
                          <li>• Fornecer suporte técnico</li>
                          <li>• Atualizar algoritmos de IA</li>
                          <li>• Garantir conformidade com CFM</li>
                        </ul>
                      </div>
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                        <h4 className="text-blue-300 font-semibold mb-3">Do Médico Usuário</h4>
                        <ul className="text-sm space-y-2 text-blue-200">
                          <li>• Revisar toda documentação gerada</li>
                          <li>• Manter dados atualizados</li>
                          <li>• Usar conforme ética médica</li>
                          <li>• Não compartilhar credenciais</li>
                          <li>• Validar informações antes do uso</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Limitações */}
              <section id="limitacoes" className="scroll-mt-24">
                <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-white">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                      <span>4. Limitações e Isenções</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 space-y-4">
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                      <h4 className="text-red-300 font-semibold mb-3">⚠️ IMPORTANTE - Ferramenta Auxiliar</h4>
                      <p className="text-red-200 text-sm">
                        A MedDefend é uma <strong>ferramenta auxiliar</strong> e NÃO substitui o julgamento médico profissional. 
                        Todas as decisões clínicas permanecem sob responsabilidade exclusiva do médico.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <p><strong className="text-white">A MedDefend não se responsabiliza por:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Decisões clínicas baseadas na documentação gerada</li>
                        <li>Interpretações médicas incorretas</li>
                        <li>Falhas na conexão com internet</li>
                        <li>Dados inseridos incorretamente pelo usuário</li>
                        <li>Consequências de uso inadequado da plataforma</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Conformidade */}
              <section id="conformidade" className="scroll-mt-24">
                <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-white">
                      <Shield className="h-6 w-6 text-purple-400" />
                      <span>8. Conformidade com CFM e LGPD</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                        <h4 className="text-purple-300 font-semibold mb-3">Conformidade CFM</h4>
                        <ul className="text-sm space-y-2 text-purple-200">
                          <li>• Respeito ao Código de Ética Médica</li>
                          <li>• Diretrizes para prontuário médico</li>
                          <li>• Regulamentações sobre telemedicina</li>
                          <li>• Normas para documentação médica</li>
                        </ul>
                      </div>
                      <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
                        <h4 className="text-indigo-300 font-semibold mb-3">Conformidade LGPD</h4>
                        <ul className="text-sm space-y-2 text-indigo-200">
                          <li>• Tratamento legal de dados pessoais</li>
                          <li>• Consentimento para dados sensíveis</li>
                          <li>• Direitos dos titulares garantidos</li>
                          <li>• Medidas de segurança adequadas</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* FAQ */}
              <section id="faq" className="scroll-mt-24">
                <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-white">
                      <FileText className="h-6 w-6 text-green-400" />
                      <span>10. Perguntas Frequentes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {faqs.map((faq, index) => (
                      <div key={index} className="border border-gray-700 rounded-lg">
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors rounded-lg"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">{faq.question}</span>
                            <span className="text-gray-400">
                              {expandedFaq === index ? '−' : '+'}
                            </span>
                          </div>
                        </button>
                        {expandedFaq === index && (
                          <div className="px-4 pb-4">
                            <p className="text-gray-300 text-sm">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>

              {/* Terms Acceptance */}
              <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={setAcceptedTerms}
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer">
                      Li e aceito os Termos de Uso e compreendo que a MedDefend é uma ferramenta auxiliar 
                      que não substitui meu julgamento médico profissional.
                    </label>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    disabled={!acceptedTerms}
                  >
                    Aceitar e Continuar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
