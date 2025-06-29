
import { useState, useEffect } from 'react';
import { ArrowLeft, Cookie, Settings, Shield, BarChart3, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const CookiePolicy = () => {
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false
  });

  const cookieTypes = [
    {
      id: 'necessary',
      title: 'Cookies Necessários',
      icon: <Shield className="h-6 w-6 text-green-400" />,
      description: 'Essenciais para o funcionamento da plataforma',
      examples: ['Sessão de login', 'Preferências de idioma', 'Carrinho de compras'],
      canDisable: false,
      impact: 'Sem estes cookies, a plataforma não funcionará adequadamente.'
    },
    {
      id: 'functional',
      title: 'Cookies Funcionais',
      icon: <Settings className="h-6 w-6 text-blue-400" />,
      description: 'Melhoram a experiência do usuário',
      examples: ['Lembrança de preferências', 'Configurações de interface', 'Formulários preenchidos'],
      canDisable: true,
      impact: 'Você perderá personalizações e precisará reconfigurar preferências.'
    },
    {
      id: 'analytics',
      title: 'Cookies de Análise',
      icon: <BarChart3 className="h-6 w-6 text-yellow-400" />,
      description: 'Coletam informações sobre como você usa o site',
      examples: ['Google Analytics', 'Mapas de calor', 'Tempo de sessão'],
      canDisable: true,
      impact: 'Não conseguiremos melhorar a plataforma baseado no uso real.'
    },
    {
      id: 'marketing',
      title: 'Cookies de Marketing',
      icon: <Users className="h-6 w-6 text-purple-400" />,
      description: 'Usado para publicidade direcionada',
      examples: ['Facebook Pixel', 'Google Ads', 'Remarketing'],
      canDisable: true,
      impact: 'Você pode ver anúncios menos relevantes em outros sites.'
    }
  ];

  const handleSettingChange = (cookieType: string, enabled: boolean) => {
    if (cookieType === 'necessary') return; // Cannot disable necessary cookies
    
    setCookieSettings(prev => ({
      ...prev,
      [cookieType]: enabled
    }));
  };

  const savePreferences = () => {
    localStorage.setItem('cookiePreferences', JSON.stringify(cookieSettings));
    // Here you would typically also update your analytics/marketing scripts
    console.log('Cookie preferences saved:', cookieSettings);
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    setCookieSettings(allAccepted);
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
  };

  const acceptOnlyNecessary = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    setCookieSettings(onlyNecessary);
    localStorage.setItem('cookiePreferences', JSON.stringify(onlyNecessary));
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
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Cookie className="h-16 w-16 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Política de Cookies</h1>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Entenda como usamos cookies para melhorar sua experiência médica na plataforma MedDefend
          </p>
        </div>

        {/* What are Cookies */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50 mb-12">
          <CardHeader>
            <CardTitle className="text-white text-2xl">O que são Cookies?</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-4">
            <p>
              Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita nosso site. 
              Eles nos ajudam a lembrar suas preferências e melhorar sua experiência como médico usuário da MedDefend.
            </p>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold mb-2">Por que usamos cookies na área médica?</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Manter sua sessão médica segura</li>
                <li>• Lembrar suas especialidades e preferências</li>
                <li>• Personalizar templates de documentação</li>
                <li>• Melhorar nossa IA com padrões de uso médico</li>
                <li>• Garantir conformidade com diretrizes do CFM</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Types */}
        <div className="space-y-8 mb-12">
          <h2 className="text-3xl font-bold text-white text-center">Tipos de Cookies que Utilizamos</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {cookieTypes.map((cookie) => (
              <Card key={cookie.id} className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {cookie.icon}
                      <CardTitle className="text-white">{cookie.title}</CardTitle>
                    </div>
                    <Switch
                      checked={cookieSettings[cookie.id as keyof typeof cookieSettings]}
                      onCheckedChange={(checked) => handleSettingChange(cookie.id, checked)}
                      disabled={!cookie.canDisable}
                    />
                  </div>
                  <p className="text-gray-300">{cookie.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">Exemplos:</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      {cookie.examples.map((example, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {cookie.canDisable && (
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <h4 className="text-yellow-300 font-medium text-sm mb-1">Impacto se desabilitado:</h4>
                      <p className="text-gray-400 text-sm">{cookie.impact}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cookie Preferences */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50 mb-12">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-white text-2xl">
              <Eye className="h-6 w-6 text-green-400" />
              <span>Central de Preferências</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-green-300 font-semibold mb-2">Configuração Atual</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(cookieSettings).map(([key, value]) => {
                  const cookie = cookieTypes.find(c => c.id === key);
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-green-200 text-sm">{cookie?.title}</span>
                      <span className={`text-sm px-2 py-1 rounded ${value ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                        {value ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={acceptAll}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white"
              >
                Aceitar Todos os Cookies
              </Button>
              <Button 
                onClick={acceptOnlyNecessary}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
              >
                Apenas Necessários
              </Button>
              <Button 
                onClick={savePreferences}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white"
              >
                Salvar Preferências
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Table */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Cookies Detalhados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-white">Nome</th>
                    <th className="text-left py-3 px-4 text-white">Categoria</th>
                    <th className="text-left py-3 px-4 text-white">Finalidade</th>
                    <th className="text-left py-3 px-4 text-white">Duração</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">meddefend_session</td>
                    <td className="py-3 px-4">Necessário</td>
                    <td className="py-3 px-4">Autenticação médica</td>
                    <td className="py-3 px-4">Sessão</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">preferences</td>
                    <td className="py-3 px-4">Funcional</td>
                    <td className="py-3 px-4">Configurações do usuário</td>
                    <td className="py-3 px-4">1 ano</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">_ga</td>
                    <td className="py-3 px-4">Análise</td>
                    <td className="py-3 px-4">Google Analytics</td>
                    <td className="py-3 px-4">2 anos</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">_fbp</td>
                    <td className="py-3 px-4">Marketing</td>
                    <td className="py-3 px-4">Facebook Pixel</td>
                    <td className="py-3 px-4">3 meses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CookiePolicy;
