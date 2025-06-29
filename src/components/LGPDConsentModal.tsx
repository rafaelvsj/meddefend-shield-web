
import { useState } from 'react';
import { Shield, FileText, Users, BarChart3, Lock, Eye, Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface LGPDConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (consents: Record<string, boolean>) => void;
}

const LGPDConsentModal = ({ isOpen, onClose, onAccept }: LGPDConsentModalProps) => {
  const [consents, setConsents] = useState({
    essential: true,
    functionality: false,
    analytics: false,
    marketing: false
  });
  const [showDetails, setShowDetails] = useState(false);

  const dataTypes = [
    {
      icon: <Users className="h-5 w-5 text-blue-400" />,
      title: "Dados Profissionais",
      description: "CRM, especialidade, dados de contato",
      required: true
    },
    {
      icon: <FileText className="h-5 w-5 text-green-400" />,
      title: "Documentação Médica",
      description: "Prontuários e relatórios (anonimizados para IA)",
      required: true
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-yellow-400" />,
      title: "Dados de Uso",
      description: "Como você utiliza a plataforma",
      required: false
    },
    {
      icon: <Eye className="h-5 w-5 text-purple-400" />,
      title: "Preferências",
      description: "Configurações e personalização",
      required: false
    }
  ];

  const rights = [
    "Acesso aos seus dados",
    "Correção de informações",
    "Portabilidade dos dados",
    "Eliminação quando solicitado",
    "Revogação do consentimento",
    "Informações sobre compartilhamento"
  ];

  const handleConsentChange = (type: string, value: boolean) => {
    if (type === 'essential') return; // Essential cannot be changed
    setConsents(prev => ({ ...prev, [type]: value }));
  };

  const handleAcceptAll = () => {
    const allConsents = {
      essential: true,
      functionality: true,
      analytics: true,
      marketing: true
    };
    setConsents(allConsents);
    onAccept(allConsents);
  };

  const handleCustomize = () => {
    onAccept(consents);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-2xl">
            <Shield className="h-8 w-8 text-green-400" />
            <span>Proteção dos Seus Dados</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Introduction */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-gray-300">
              A MedDefend respeita sua privacidade e cumpre integralmente a <strong className="text-white">LGPD</strong>. 
              Como médico, você tem controle total sobre seus dados e os dados dos seus pacientes.
            </p>
          </div>

          {/* Data Types */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Dados que coletamos</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {dataTypes.map((data, index) => (
                <div key={index} className="flex items-start space-x-3 bg-gray-800/30 rounded-lg p-4">
                  {data.icon}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-white">{data.title}</h4>
                      {data.required && (
                        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">Obrigatório</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{data.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sensitive Data Warning */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Lock className="h-5 w-5 text-red-400" />
              <h4 className="font-semibold text-red-300">Dados Sensíveis de Saúde</h4>
            </div>
            <p className="text-red-200 text-sm">
              Informações médicas são tratadas com <strong>máxima segurança</strong>. 
              São anonimizadas para treinamento da IA e criptografadas em repouso e trânsito.
            </p>
          </div>

          {/* Medical Purpose */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-blue-300 mb-2">Finalidade Médica Específica</h4>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• Gerar documentação médica defensiva</li>
              <li>• Análise preditiva de riscos de litígio</li>
              <li>• Melhoria contínua dos algoritmos de IA</li>
              <li>• Conformidade com diretrizes do CFM</li>
            </ul>
          </div>

          {/* Consent Options */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Suas escolhas de consentimento</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 bg-gray-800/30 rounded-lg p-4">
                <Checkbox 
                  checked={consents.essential} 
                  disabled
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-white">Dados Essenciais</h4>
                  <p className="text-sm text-gray-300">Necessários para funcionamento da plataforma</p>
                  <span className="text-xs text-gray-400">Obrigatório para uso do serviço</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-gray-800/30 rounded-lg p-4">
                <Checkbox 
                  checked={consents.functionality} 
                  onCheckedChange={(checked) => handleConsentChange('functionality', checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-white">Funcionalidades Avançadas</h4>
                  <p className="text-sm text-gray-300">Personalização, templates customizados, analytics pessoais</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-gray-800/30 rounded-lg p-4">
                <Checkbox 
                  checked={consents.analytics} 
                  onCheckedChange={(checked) => handleConsentChange('analytics', checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-white">Análises e Melhorias</h4>
                  <p className="text-sm text-gray-300">Dados agregados para melhorar a plataforma</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-gray-800/30 rounded-lg p-4">
                <Checkbox 
                  checked={consents.marketing} 
                  onCheckedChange={(checked) => handleConsentChange('marketing', checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-white">Comunicação Personalizada</h4>
                  <p className="text-sm text-gray-300">Atualizações médicas relevantes, webinars especializados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Your Rights */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Seus direitos garantidos pela LGPD</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {rights.map((right, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>{right}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleAcceptAll}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
            >
              Aceitar Todos
            </Button>
            <Button 
              onClick={handleCustomize}
              variant="outline" 
              className="flex-1 border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
            >
              Personalizar
            </Button>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <a href="/privacy-policy" className="hover:text-white transition-colors">
              Política de Privacidade Completa
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
              Termos de Uso
            </a>
            <a href="/cookies" className="hover:text-white transition-colors">
              Política de Cookies
            </a>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Ao continuar, você confirma ter lido e compreendido como protegemos seus dados e os dados dos seus pacientes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LGPDConsentModal;
