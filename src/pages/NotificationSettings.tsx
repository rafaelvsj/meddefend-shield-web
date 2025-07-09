import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Bell, Mail, Smartphone, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationSettings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-4xl">
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
            <h1 className="text-2xl font-bold">Configurações de Notificações</h1>
            <p className="text-muted-foreground">Personalize como e quando você recebe notificações</p>
          </div>

          {/* Notificações por Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notificações por Email
              </CardTitle>
              <CardDescription>Configure quais notificações você deseja receber por email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Análises concluídas</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber email quando uma análise for finalizada
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Atualizações de modelos</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações sobre novos modelos ou atualizações
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Manutenções programadas</Label>
                  <p className="text-sm text-muted-foreground">
                    Avisos sobre manutenções e indisponibilidades
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Newsletter semanal</Label>
                  <p className="text-sm text-muted-foreground">
                    Resumo semanal das suas atividades e novidades
                  </p>
                </div>
                <Switch />
              </div>

              <div className="space-y-2">
                <Label>Frequência de resumos</Label>
                <Select defaultValue="weekly">
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="never">Nunca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notificações Push */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações Push
              </CardTitle>
              <CardDescription>Configure as notificações em tempo real no navegador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Ativar notificações push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações no navegador mesmo quando a aba estiver fechada
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Análises em andamento</Label>
                  <p className="text-sm text-muted-foreground">
                    Atualizações sobre o progresso das análises
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Alertas de erro</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações imediatas sobre falhas ou problemas
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Notificações Mobile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Notificações Mobile
              </CardTitle>
              <CardDescription>Configure notificações para dispositivos móveis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">SMS para alertas críticos</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber SMS apenas para situações críticas
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">WhatsApp Business</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações via WhatsApp para análises importantes
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Som */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Sons e Alertas
              </CardTitle>
              <CardDescription>Personalize os sons das notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Sons de notificação</Label>
                  <p className="text-sm text-muted-foreground">
                    Reproduzir som quando receber notificações
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Tom de notificação</Label>
                <Select defaultValue="default">
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Padrão</SelectItem>
                    <SelectItem value="bell">Sino</SelectItem>
                    <SelectItem value="chime">Carrilhão</SelectItem>
                    <SelectItem value="ping">Ping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Modo não perturbe</Label>
                  <p className="text-sm text-muted-foreground">
                    Silenciar todas as notificações durante horários específicos
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Teste de Notificações */}
          <Card>
            <CardHeader>
              <CardTitle>Teste de Notificações</CardTitle>
              <CardDescription>Teste suas configurações de notificação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button variant="outline">
                  Testar Email
                </Button>
                <Button variant="outline">
                  Testar Push
                </Button>
                <Button variant="outline">
                  Testar Som
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Botão de salvar */}
          <div className="flex justify-end">
            <Button>
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;