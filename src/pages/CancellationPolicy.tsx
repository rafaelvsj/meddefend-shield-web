
import { useState } from 'react';
import { ArrowLeft, Calendar, CreditCard, Download, FileText, RefreshCw, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const CancellationPolicy = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const cancellationTypes = [
    {
      title: "Direito de Arrependimento",
      subtitle: "7 dias - Art. 49 CDC",
      icon: <Calendar className="h-8 w-8 text-green-400" />,
      description: "Cancele sem justificativa nos primeiros 7 dias",
      features: ["Reembolso integral", "Sem questionamentos", "Processo automático", "Dados preservados por 30 dias"]
    },
    {
      title: "Período de Teste",
      subtitle: "Até 30 dias",
      icon: <RefreshCw className="h-8 w-8 text-blue-400" />,
      description: "Teste completo da plataforma",
      features: ["Reembolso proporcional", "Avaliação de satisfação", "Suporte dedicado", "Migração de dados"]
    },
    {
      title: "Assinatura Ativa",
      subtitle: "Após 30 dias",
      icon: <CreditCard className="h-8 w-8 text-yellow-400" />,
      description: "Cancelamento padrão de assinatura",
      features: ["Válido até fim do período", "Sem reembolso", "Download de dados", "Suporte por 90 dias"]
    }
  ];

  const cancellationSteps = [
    { step: 1, title: "Solicitar Cancelamento", description: "Acesse sua conta ou entre em contato" },
    { step: 2, title: "Confirmação", description: "Confirme o cancelamento por email" },
    { step: 3, title: "Processamento", description: "Aguarde até 72h para processamento" },
    { step: 4, title: "Reembolso", description: "Reembolso em até 7 dias úteis (quando aplicável)" }
  ];

  const faqs = [
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim, você pode cancelar sua assinatura a qualquer momento. Durante os primeiros 7 dias, você tem direito ao reembolso integral conforme o Código de Defesa do Consumidor."
    },
    {
      question: "Como funciona o reembolso?",
      answer: "O reembolso integral é garantido nos primeiros 7 dias. Após esse período, o reembolso é proporcional até os primeiros 30 dias. Depois de 30 dias, não há reembolso, mas você mantém acesso até o final do período pago."
    },
    {
      question: "O que acontece com meus dados após o cancelamento?",
      answer: "Seus dados são mantidos por 90 dias para eventual reativação. Após esse período, são anonimizados ou excluídos conforme sua solicitação e nossa Política de Privacidade."
    },
    {
      question: "Posso exportar meus dados antes do cancelamento?",
      answer: "Sim, você pode exportar todos os seus dados a qualquer momento através da área 'Configurações' > 'Exportar Dados'. O arquivo será enviado por email em até 24 horas."
    }
  ];

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
            <Button className="bg-red-600 hover:bg-red-500 text-white">
              Cancelar Minha Assinatura
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Política de Cancelamento e Reembolso
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Transparência total sobre seus direitos de cancelamento e reembolso, 
            seguindo a legislação brasileira de defesa do consumidor.
          </p>
        </div>

        {/* Cancellation Types */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {cancellationTypes.map((type, index) => (
            <Card key={index} className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {type.icon}
                </div>
                <CardTitle className="text-white text-xl">{type.title}</CardTitle>
                <p className="text-gray-400 text-lg font-semibold">{type.subtitle}</p>
                <p className="text-gray-300 text-sm">{type.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {type.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-300 text-sm">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Consumer Rights Highlight */}
        <Card className="bg-green-900/20 border-green-500/30 mb-16">
          <CardContent className="p-8">
            <div className="flex items-center space-x-4 mb-4">
              <Shield className="h-8 w-8 text-green-400" />
              <h2 className="text-2xl font-bold text-green-300">Seus Direitos Garantidos por Lei</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-green-200 font-semibold mb-2">Código de Defesa do Consumidor - Art. 49</h3>
                <p className="text-green-100 text-sm">
                  "O consumidor pode desistir do contrato, no prazo de 7 dias a contar de sua assinatura ou 
                  do ato de recebimento do produto ou serviço, sempre que a contratação de fornecimento de 
                  produtos e serviços ocorrer fora do estabelecimento comercial."
                </p>
              </div>
              <div>
                <h3 className="text-green-200 font-semibold mb-2">Marco Civil da Internet - Art. 7º</h3>
                <p className="text-green-100 text-sm">
                  Garantimos transparência nas informações sobre cancelamento e reembolso, 
                  bem como a portabilidade dos seus dados médicos conforme legislação vigente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Process */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50 mb-16">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-white text-2xl">
              <Clock className="h-6 w-6 text-blue-400" />
              <span>Processo de Cancelamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {cancellationSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 mx-auto">
                    {step.step}
                  </div>
                  <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-300 text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Portability */}
        <Card className="bg-blue-900/20 border-blue-500/30 mb-16">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-white text-2xl">
              <Download className="h-6 w-6 text-blue-400" />
              <span>Portabilidade dos Dados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-4">
            <p>
              Conforme a LGPD, você tem direito à portabilidade dos seus dados. Antes do cancelamento, 
              você pode exportar:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="space-y-2">
                <li className="flex items-center">
                  <FileText className="h-4 w-4 text-blue-400 mr-2" />
                  Todos os documentos gerados
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 text-blue-400 mr-2" />
                  Histórico de consultas
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <FileText className="h-4 w-4 text-blue-400 mr-2" />
                  Relatórios de análise
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 text-blue-400 mr-2" />
                  Configurações personalizadas
                </li>
              </ul>
            </div>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-500">
              Solicitar Exportação de Dados
            </Button>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Perguntas Frequentes</CardTitle>
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
      </div>
    </div>
  );
};

export default CancellationPolicy;
