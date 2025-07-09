import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail, Book, Video, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpSupport = () => {
  const navigate = useNavigate();
  const [supportForm, setSupportForm] = useState({
    subject: '',
    category: '',
    message: '',
    priority: 'medium'
  });

  const handleInputChange = (field: string, value: string) => {
    setSupportForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Ajuda e Suporte</h1>
            <p className="text-muted-foreground">Encontre respostas ou entre em contato conosco</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Sidebar com opções de contato */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Formas de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Chat ao Vivo</div>
                      <div className="text-sm text-muted-foreground">Resposta imediata</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">suporte@plataforma.com</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Telefone</div>
                      <div className="text-sm text-muted-foreground">(11) 3333-4444</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Análises de Texto</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Operacional
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Modelos IA</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Operacional
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Manutenção
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conteúdo principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recursos de Ajuda */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Book className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">Documentação</h3>
                    <p className="text-sm text-muted-foreground">
                      Guias detalhados e tutoriais
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Video className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">Vídeo Tutoriais</h3>
                    <p className="text-sm text-muted-foreground">
                      Aprenda através de vídeos
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">Comunidade</h3>
                    <p className="text-sm text-muted-foreground">
                      Fórum de usuários
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <HelpCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">FAQ</h3>
                    <p className="text-sm text-muted-foreground">
                      Perguntas frequentes
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* FAQ */}
              <Card>
                <CardHeader>
                  <CardTitle>Perguntas Frequentes</CardTitle>
                  <CardDescription>Respostas para as dúvidas mais comuns</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Como funciona a análise de texto médico?</AccordionTrigger>
                      <AccordionContent>
                        Nossa plataforma utiliza inteligência artificial avançada para analisar textos médicos, 
                        identificando padrões, inconsistências e fornecendo insights baseados em modelos 
                        treinados com dados médicos especializados.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Quais tipos de documentos posso analisar?</AccordionTrigger>
                      <AccordionContent>
                        Você pode analisar prontuários médicos, relatórios de exames, prescrições, 
                        laudos e outros documentos médicos em formato de texto.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Os dados são seguros e privados?</AccordionTrigger>
                      <AccordionContent>
                        Sim, todos os dados são criptografados e processados seguindo rigorosos padrões 
                        de segurança LGPD e HIPAA. Não armazenamos informações pessoais dos pacientes.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-4">
                      <AccordionTrigger>Como posso melhorar a precisão das análises?</AccordionTrigger>
                      <AccordionContent>
                        Para melhores resultados, use textos claros e bem formatados, escolha o modelo 
                        adequado para sua especialidade e revise as configurações de análise.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-5">
                      <AccordionTrigger>Existe um limite de análises por mês?</AccordionTrigger>
                      <AccordionContent>
                        Os limites dependem do seu plano de assinatura. O plano básico inclui 100 análises 
                        por mês, enquanto planos premium oferecem análises ilimitadas.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Formulário de Contato */}
              <Card>
                <CardHeader>
                  <CardTitle>Enviar Solicitação de Suporte</CardTitle>
                  <CardDescription>Não encontrou a resposta? Entre em contato conosco</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto</Label>
                      <Input
                        id="subject"
                        value={supportForm.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="Descreva brevemente sua dúvida"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <select
                        className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                        value={supportForm.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                      >
                        <option value="">Selecione uma categoria</option>
                        <option value="technical">Problema Técnico</option>
                        <option value="billing">Faturamento</option>
                        <option value="feature">Solicitação de Recurso</option>
                        <option value="general">Pergunta Geral</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea
                      id="message"
                      value={supportForm.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Descreva sua dúvida ou problema em detalhes..."
                      rows={6}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">
                      Cancelar
                    </Button>
                    <Button>
                      Enviar Solicitação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;