import { useState } from 'react';
import { Search, Bell, Settings, User, LogOut, FileText, History, Bookmark, BarChart3, Folder, FolderOpen, FileCheck, ClipboardList, Shield, AlertTriangle, Activity, Stethoscope, Bed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Dashboard = () => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeTab, setActiveTab] = useState('analise');
  const [openFolder, setOpenFolder] = useState(null);

  // Modelos organizados por categoria
  const modelCategories = [
    {
      id: 'evolucao-medica',
      title: 'Evolução Médica',
      icon: Stethoscope,
      color: 'blue',
      models: [
        { name: 'Evolução Clínica Geral', description: 'Modelo padrão para evolução médica diária' },
        { name: 'Evolução Pós-Operatória', description: 'Acompanhamento após procedimentos cirúrgicos' },
        { name: 'Evolução UTI', description: 'Evolução específica para pacientes em terapia intensiva' }
      ]
    },
    {
      id: 'relatorios-procedimentos',
      title: 'Relatórios de Procedimentos',
      icon: ClipboardList,
      color: 'green',
      models: [
        { name: 'Relatório Cirúrgico', description: 'Descrição detalhada de procedimento cirúrgico' },
        { name: 'Relatório de Biópsia', description: 'Modelo para relatório de biópsia' },
        { name: 'Relatório de Endoscopia', description: 'Modelo para procedimentos endoscópicos' }
      ]
    },
    {
      id: 'tcle',
      title: 'TCLE',
      icon: FileCheck,
      color: 'purple',
      models: [
        { name: 'TCLE Cirurgia Geral', description: 'Termo de consentimento para cirurgias' },
        { name: 'TCLE Anestesia', description: 'Consentimento específico para anestesia' },
        { name: 'TCLE Procedimentos Invasivos', description: 'Termo para procedimentos de risco' }
      ]
    },
    {
      id: 'evento-adverso-cirurgia',
      title: 'Evento Adverso - Cirurgia',
      icon: AlertTriangle,
      color: 'red',
      models: [
        { name: 'Complicação Intraoperatória', description: 'Registro de eventos durante cirurgia' },
        { name: 'Sangramento Cirúrgico', description: 'Documentação de episódios hemorrágicos' },
        { name: 'Infecção Sítio Cirúrgico', description: 'Registro de infecções pós-operatórias' }
      ]
    },
    {
      id: 'evento-adverso-enfermaria',
      title: 'Evento Adverso - Enfermaria',
      icon: Activity,
      color: 'orange',
      models: [
        { name: 'Queda de Paciente', description: 'Registro e análise de quedas' },
        { name: 'Erro de Medicação', description: 'Documentação de erros medicamentosos' },
        { name: 'Lesão por Pressão', description: 'Registro de úlceras por pressão' }
      ]
    },
    {
      id: 'evento-adverso-uti',
      title: 'Evento Adverso - UTI',
      icon: Bed,
      color: 'cyan',
      models: [
        { name: 'Extubação Acidental', description: 'Registro de extubação não programada' },
        { name: 'Infecção Associada à Assistência', description: 'IRAS em ambiente de terapia intensiva' },
        { name: 'Falha de Equipamento', description: 'Documentação de falhas em equipamentos críticos' }
      ]
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-medical-blue-50 border-medical-blue-200 text-medical-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      cyan: 'bg-cyan-50 border-cyan-200 text-cyan-800'
    };
    return colorMap[color] || colorMap.blue;
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    // Simulação de análise
    setTimeout(() => {
      setAnalysisResult({
        original: inputText,
        suggestion: inputText.replace(/paciente/, 'pessoa assistida').replace(/doença/, 'condição médica'),
        changes: [{
          type: 'modified',
          original: 'paciente',
          suggestion: 'pessoa assistida',
          position: 0
        }, {
          type: 'modified',
          original: 'doença',
          suggestion: 'condição médica',
          position: 1
        }]
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white font-inter flex flex-col lg:flex-row">
      {/* Sidebar - Mobile-first design */}
      <div className="w-full lg:w-64 bg-medical-slate-50 border-b lg:border-b-0 lg:border-r border-medical-slate-200 flex flex-col">
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-center lg:justify-start space-x-3">
            <img src="/lovable-uploads/6efd3d4d-8293-4655-ae74-c39d2bc96998.png" alt="MedDefend Logo" className="h-6 lg:h-8 w-6 lg:w-8" />
            <span className="text-lg lg:text-xl font-semibold text-medical-slate-800">MedDefend</span>
          </div>
        </div>

        <nav className="flex-1 px-2 lg:px-4 space-y-1 lg:space-y-2 pb-4 lg:pb-0">
          <button onClick={() => setActiveTab('analise')} className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-sm lg:text-base transition-colors ${activeTab === 'analise' ? 'bg-medical-blue-100 text-medical-blue-800 border-l-0 lg:border-l-4 border-medical-blue-600' : 'text-medical-slate-600 hover:bg-medical-slate-100'}`} aria-label="Análise de Texto" role="tab" aria-selected={activeTab === 'analise'}>
            <FileText className="h-4 lg:h-5 w-4 lg:w-5" />
            <span className="hidden lg:block">Análise de Texto</span>
          </button>

          <button onClick={() => setActiveTab('modelos')} className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-sm lg:text-base transition-colors ${activeTab === 'modelos' ? 'bg-medical-blue-100 text-medical-blue-800 border-l-0 lg:border-l-4 border-medical-blue-600' : 'text-medical-slate-600 hover:bg-medical-slate-100'}`} aria-label="Modelos" role="tab" aria-selected={activeTab === 'modelos'}>
            <Bookmark className="h-4 lg:h-5 w-4 lg:w-5" />
            <span className="hidden lg:block">Modelos</span>
          </button>

          <button onClick={() => setActiveTab('historico')} className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-sm lg:text-base transition-colors ${activeTab === 'historico' ? 'bg-medical-blue-100 text-medical-blue-800 border-l-0 lg:border-l-4 border-medical-blue-600' : 'text-medical-slate-600 hover:bg-medical-slate-100'}`} aria-label="Histórico" role="tab" aria-selected={activeTab === 'historico'}>
            <History className="h-4 lg:h-5 w-4 lg:w-5" />
            <span className="hidden lg:block">Histórico</span>
          </button>

          <button onClick={() => setActiveTab('relatorios')} className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-sm lg:text-base transition-colors ${activeTab === 'relatorios' ? 'bg-medical-blue-100 text-medical-blue-800 border-l-0 lg:border-l-4 border-medical-blue-600' : 'text-medical-slate-600 hover:bg-medical-slate-100'}`} aria-label="Relatórios" role="tab" aria-selected={activeTab === 'relatorios'}>
            <BarChart3 className="h-4 lg:h-5 w-4 lg:w-5" />
            <span className="hidden lg:block">Relatórios</span>
          </button>
        </nav>

        <div className="hidden lg:block p-4 border-t border-medical-slate-200">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-medical-slate-600 hover:bg-medical-slate-100 transition-colors" aria-label="Configurações">
            <Settings className="h-5 w-5" />
            <span>Configurações</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-medical-slate-200 px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <h1 className="text-lg lg:text-2xl font-semibold text-medical-slate-800" id="main-heading">
                {activeTab === 'analise' && 'Análise de Texto Médico'}
                {activeTab === 'modelos' && 'Biblioteca de Modelos'}
                {activeTab === 'historico' && 'Histórico de Análises'}
                {activeTab === 'relatorios' && 'Relatórios e Métricas'}
              </h1>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4">
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-medical-slate-400" />
                <Input type="text" placeholder="Buscar..." className="pl-10 w-48 lg:w-64 border-medical-slate-300 focus:border-medical-blue-500" aria-label="Campo de busca" />
              </div>
              
              <Button variant="ghost" size="icon" aria-label="Notificações">
                <Bell className="h-4 lg:h-5 w-4 lg:w-5" />
              </Button>

              <div className="flex items-center space-x-2 lg:space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="#" alt="Avatar do usuário" />
                  <AvatarFallback className="bg-medical-blue-100 text-medical-blue-800 text-sm">DR</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-medical-slate-800">Dr. Roberto</p>
                  <p className="text-xs text-medical-slate-500">Plano Premium</p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Sair">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-6 bg-white" role="main" aria-labelledby="main-heading">
          {/* Analise Tab */}
          {activeTab === 'analise' && (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
                {/* Column 1: Input Area */}
                <div className="xl:col-span-2">
                  <Card className="bg-white border border-medical-slate-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-medical-slate-800 text-lg lg:text-xl text-center">Insira aqui sua solicitação ou texto para análise</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea 
                        value={inputText} 
                        onChange={(e) => setInputText(e.target.value)} 
                        placeholder="Cole aqui o texto médico que deseja analisar para verificação de linguagem neutra e adequação profissional..." 
                        className="min-h-[200px] resize-none bg-white border-medical-slate-300 text-medical-slate-800 focus:border-medical-blue-500" 
                        aria-label="Campo de entrada de texto médico" 
                      />
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <p className="text-sm text-medical-slate-500">
                          {inputText.length} caracteres
                        </p>
                        <Button 
                          onClick={handleAnalyze} 
                          disabled={!inputText.trim() || isAnalyzing} 
                          className="bg-medical-blue-600 hover:bg-medical-blue-700 text-white font-medium" 
                          aria-label={isAnalyzing ? 'Analisando texto' : 'Analisar texto médico'}
                        >
                          {isAnalyzing ? 'Analisando...' : 'Analisar Texto'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Column 2: Analysis Results */}
                {analysisResult && (
                  <div className="xl:col-span-1 space-y-4 lg:space-y-6">
                    {/* Original Text */}
                    <Card className="bg-white border border-medical-slate-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-red-700 text-base lg:text-lg">Texto Original</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="p-3 lg:p-4 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-medical-slate-800 text-sm lg:text-base leading-relaxed">
                            {analysisResult.original}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Suggested Text */}
                    <Card className="bg-white border border-medical-slate-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-green-700 text-base lg:text-lg">Sugestão Melhorada</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="p-3 lg:p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-medical-slate-800 text-sm lg:text-base leading-relaxed">
                            {analysisResult.suggestion}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Changes Section - Full width below */}
              {analysisResult && (
                <div className="mt-4 lg:mt-6">
                  <Card className="bg-white border border-medical-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-medical-slate-800 text-lg">Alterações Sugeridas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysisResult.changes.map((change, index) => (
                          <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 lg:p-4 bg-yellow-50 rounded-lg border border-yellow-200 gap-3">
                            <div className="flex-1">
                              <span className="line-through text-red-600 mr-2 text-sm lg:text-base">
                                {change.original}
                              </span>
                              <span className="text-green-600 font-medium text-sm lg:text-base">
                                {change.suggestion}
                              </span>
                            </div>
                            <div className="flex space-x-2 w-full sm:w-auto">
                              <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 flex-1 sm:flex-none" aria-label={`Aceitar alteração de ${change.original} para ${change.suggestion}`}>
                                Aceitar
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 flex-1 sm:flex-none" aria-label={`Rejeitar alteração de ${change.original} para ${change.suggestion}`}>
                                Rejeitar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Modelos Tab */}
          {activeTab === 'modelos' && (
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <p className="text-medical-slate-600 text-center">
                  Selecione uma categoria de modelo para visualizar os templates disponíveis
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {modelCategories.map((category) => {
                  const IconComponent = category.icon;
                  const isOpen = openFolder === category.id;
                  
                  return (
                    <Card key={category.id} className="bg-white border border-medical-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getColorClasses(category.color)}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-medical-slate-800 text-lg">{category.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => setOpenFolder(isOpen ? null : category.id)}
                          variant="outline"
                          className="w-full mb-3 text-medical-slate-800 bg-medical-blue-50 border-medical-blue-200 hover:bg-medical-blue-100"
                        >
                          {isOpen ? (
                            <>
                              <FolderOpen className="h-4 w-4 mr-2" />
                              Ocultar Modelos
                            </>
                          ) : (
                            <>
                              <Folder className="h-4 w-4 mr-2" />
                              Ver Modelos ({category.models.length})
                            </>
                          )}
                        </Button>
                        
                        {isOpen && (
                          <div className="space-y-2 animate-fade-in">
                            {category.models.map((model, index) => (
                              <div key={index} className="p-3 bg-medical-blue-50 rounded-lg border border-medical-blue-200 hover:bg-medical-blue-100 transition-colors cursor-pointer">
                                <h4 className="font-medium text-medical-slate-800 text-sm mb-1">{model.name}</h4>
                                <p className="text-xs text-medical-slate-700">{model.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other tabs remain the same structure but with responsive improvements */}
          {activeTab === 'historico' && (
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white border border-medical-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-medical-slate-800">Histórico de Análises</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-medical-slate-600">Histórico será implementado em breve.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'relatorios' && (
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white border border-medical-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-medical-slate-800">Relatórios e Métricas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-medical-slate-600">Relatórios serão implementados em breve.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
