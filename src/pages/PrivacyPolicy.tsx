
import { useState } from 'react';
import { ArrowLeft, Shield, User, FileText, Share2, UserCheck, Lock, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState('identificacao');

  const sections = [
    { id: 'identificacao', title: 'Identificação da Empresa', icon: <User className="h-4 w-4" /> },
    { id: 'dados', title: 'Dados Coletados e Finalidades', icon: <FileText className="h-4 w-4" /> },
    { id: 'base-legal', title: 'Base Legal', icon: <Shield className="h-4 w-4" /> },
    { id: 'compartilhamento', title: 'Compartilhamento', icon: <Share2 className="h-4 w-4" /> },
    { id: 'direitos', title: 'Direitos do Titular', icon: <UserCheck className="h-4 w-4" /> },
    { id: 'seguranca', title: 'Segurança', icon: <Lock className="h-4 w-4" /> },
    { id: 'retencao', title: 'Retenção', icon: <Clock className="h-4 w-4" /> },
    { id: 'contato', title: 'Contato DPO', icon: <Mail className="h-4 w-4" /> }
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
                <h1 className="text-4xl font-bold text-white mb-4">
                  Política de Privacidade e Proteção de Dados
                </h1>
                <p className="text-gray-300 text-lg">
                  Última atualização: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* Sections */}
              <div className="space-y-12">
                {/* Identificação da Empresa */}
                <section id="identificacao" className="scroll-mt-24">
                  <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3 text-white">
                        <User className="h-6 w-6 text-purple-400" />
                        <span>1. Identificação da Empresa</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-300 space-y-4">
                      <p>
                        <strong className="text-white">Razão Social:</strong> MedDefend Tecnologia em Saúde Ltda.<br />
                        <strong className="text-white">CNPJ:</strong> XX.XXX.XXX/0001-XX<br />
                        <strong className="text-white">Endereço:</strong> [Endereço completo]<br />
                        <strong className="text-white">E-mail:</strong> privacidade@meddefend.com.br<br />
                        <strong className="text-white">Telefone:</strong> (11) XXXX-XXXX
                      </p>
                      <p>
                        A MedDefend é uma healthtech especializada em inteligência artificial para documentação médica defensiva, 
                        comprometida com a proteção de dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
                      </p>
                    </CardContent>
                  </Card>
                </section>

                {/* Dados Coletados */}
                <section id="dados" className="scroll-mt-24">
                  <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3 text-white">
                        <FileText className="h-6 w-6 text-blue-400" />
                        <span>2. Dados Coletados e Finalidades</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-300 space-y-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">2.1 Dados Pessoais do Médico</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Nome completo, CRM, especialidade médica</li>
                          <li>E-mail, telefone, endereço profissional</li>
                          <li>Dados de pagamento e faturamento</li>
                          <li>Dados de uso da plataforma (logs, sessões)</li>
                        </ul>
                        <p className="mt-3 text-sm">
                          <strong>Finalidade:</strong> Cadastro, autenticação, prestação do serviço, cobrança (Art. 7º, V da LGPD)
                        </p>
                      </div>
                      
                      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                        <h4 className="text-red-300 font-semibold mb-3">2.2 Dados Sensíveis de Saúde</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4 text-red-200">
                          <li>Informações de prontuários médicos</li>
                          <li>Dados clínicos de pacientes (anonimizados para IA)</li>
                          <li>Documentação médica gerada na plataforma</li>
                        </ul>
                        <p className="mt-3 text-sm text-red-200">
                          <strong>Finalidade:</strong> Geração de documentação defensiva por IA, análise preditiva de riscos<br />
                          <strong>Base Legal:</strong> Consentimento específico (Art. 11, II, 'a' da LGPD)
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Base Legal */}
                <section id="base-legal" className="scroll-mt-24">
                  <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3 text-white">
                        <Shield className="h-6 w-6 text-green-400" />
                        <span>3. Base Legal para Tratamento</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-300 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <h4 className="text-white font-semibold mb-2">Dados Pessoais</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Execução de contrato (Art. 7º, V)</li>
                            <li>• Legítimo interesse (Art. 7º, IX)</li>
                            <li>• Cumprimento de obrigação legal (Art. 7º, II)</li>
                          </ul>
                        </div>
                        <div className="bg-red-900/20 rounded-lg p-4">
                          <h4 className="text-red-300 font-semibold mb-2">Dados Sensíveis</h4>
                          <ul className="text-sm space-y-1 text-red-200">
                            <li>• Consentimento específico (Art. 11, II, 'a')</li>
                            <li>• Proteção da vida (Art. 11, II, 'd')</li>
                            <li>• Exercício regular de direitos (Art. 11, II, 'f')</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Continue with other sections... */}
                <section id="direitos" className="scroll-mt-24">
                  <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3 text-white">
                        <UserCheck className="h-6 w-6 text-yellow-400" />
                        <span>5. Direitos do Titular dos Dados</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-300 space-y-4">
                      <p>Conforme Art. 18 da LGPD, você tem direito a:</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          'Confirmação da existência de tratamento',
                          'Acesso aos dados',
                          'Correção de dados incompletos/inexatos',
                          'Anonimização, bloqueio ou eliminação',
                          'Portabilidade dos dados',
                          'Eliminação dos dados',
                          'Informações sobre compartilhamento',
                          'Revogação do consentimento'
                        ].map((right, index) => (
                          <div key={index} className="flex items-start space-x-2 bg-gray-800/50 rounded-lg p-3">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm">{right}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mt-6">
                        <h4 className="text-purple-300 font-semibold mb-2">Como Exercer Seus Direitos</h4>
                        <p className="text-purple-200 text-sm">
                          Entre em contato através do e-mail <strong>dpo@meddefend.com.br</strong> ou 
                          pela central de privacidade em sua conta. Responderemos em até 15 dias.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Contact DPO */}
                <section id="contato" className="scroll-mt-24">
                  <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3 text-white">
                        <Mail className="h-6 w-6 text-blue-400" />
                        <span>8. Contato do Encarregado (DPO)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-300 space-y-4">
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                        <div className="text-center">
                          <h3 className="text-white font-semibold text-lg mb-4">
                            Dr. [Nome do DPO]
                          </h3>
                          <div className="space-y-2 text-blue-200">
                            <p><strong>E-mail:</strong> dpo@meddefend.com.br</p>
                            <p><strong>Telefone:</strong> (11) XXXX-XXXX</p>
                            <p><strong>Horário:</strong> Segunda a Sexta, 9h às 18h</p>
                          </div>
                          <Button className="mt-4 bg-blue-600 hover:bg-blue-500 text-white">
                            Entrar em Contato
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">
                        Para dúvidas, solicitações ou reclamações sobre tratamento de dados pessoais, 
                        nosso DPO está disponível para orientá-lo sobre seus direitos e nossa política de privacidade.
                      </p>
                    </CardContent>
                  </Card>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
