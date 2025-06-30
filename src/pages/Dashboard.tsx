
import { useState } from 'react';
import { Search, Bell, Settings, User, LogOut, FileText, History, Bookmark, BarChart3 } from 'lucide-react';
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

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    // Simulação de análise
    setTimeout(() => {
      setAnalysisResult({
        original: inputText,
        suggestion: inputText.replace(/paciente/, 'pessoa assistida').replace(/doença/, 'condição médica'),
        changes: [
          { type: 'modified', original: 'paciente', suggestion: 'pessoa assistida', position: 0 },
          { type: 'modified', original: 'doença', suggestion: 'condição médica', position: 1 }
        ]
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/6efd3d4d-8293-4655-ae74-c39d2bc96998.png" 
              alt="MedDefend Logo" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-gray-900">MedDefend</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('analise')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'analise' 
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Análise de Texto</span>
          </button>

          <button
            onClick={() => setActiveTab('modelos')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'modelos' 
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Bookmark className="h-5 w-5" />
            <span>Modelos</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'historico' 
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History className="h-5 w-5" />
            <span>Histórico</span>
          </button>

          <button
            onClick={() => setActiveTab('relatorios')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'relatorios' 
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span>Relatórios</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <Settings className="h-5 w-5" />
            <span>Configurações</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                {activeTab === 'analise' && 'Análise de Texto Médico'}
                {activeTab === 'modelos' && 'Biblioteca de Modelos'}
                {activeTab === 'historico' && 'Histórico de Análises'}
                {activeTab === 'relatorios' && 'Relatórios e Métricas'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 w-64"
                />
              </div>
              
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>

              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src="#" />
                  <AvatarFallback>DR</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">Dr. Roberto</p>
                  <p className="text-xs text-gray-500">Plano Premium</p>
                </div>
                <Button variant="ghost" size="icon">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 bg-white">
          {activeTab === 'analise' && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Input Area */}
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Insira o texto médico para análise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Cole aqui o texto médico que deseja analisar para verificação de linguagem neutra e adequação profissional..."
                    className="min-h-[200px] resize-none bg-white border-gray-300 text-gray-900"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {inputText.length} caracteres
                    </p>
                    <Button 
                      onClick={handleAnalyze}
                      disabled={!inputText.trim() || isAnalyzing}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isAnalyzing ? 'Analisando...' : 'Analisar Texto'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Results */}
              {analysisResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Original Text */}
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-red-700">Texto Original</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-gray-900 leading-relaxed">
                          {analysisResult.original}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Suggested Text */}
                  <Card className="bg-white border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-green-700">Sugestão Melhorada</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-gray-900 leading-relaxed">
                          {analysisResult.suggestion}
                        </p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <h4 className="font-semibold text-gray-900">Alterações Sugeridas:</h4>
                        {analysisResult.changes.map((change, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div>
                              <span className="line-through text-red-600 mr-2">
                                {change.original}
                              </span>
                              <span className="text-green-600 font-medium">
                                {change.suggestion}
                              </span>
                            </div>
                            <div className="space-x-2">
                              <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                                Aceitar
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
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

          {activeTab === 'modelos' && (
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Biblioteca de Modelos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Funcionalidade de modelos será implementada em breve.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'historico' && (
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Histórico de Análises</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Histórico será implementado em breve.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'relatorios' && (
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Relatórios e Métricas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Relatórios serão implementados em breve.</p>
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
