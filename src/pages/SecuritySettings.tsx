import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Key, Smartphone, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SecuritySettings = () => {
  const navigate = useNavigate();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            <h1 className="text-2xl font-bold">Segurança e Privacidade</h1>
            <p className="text-muted-foreground">Gerencie a segurança da sua conta e configurações de privacidade</p>
          </div>

          {/* Status de Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Status de Segurança
              </CardTitle>
              <CardDescription>Visão geral da segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Email verificado</span>
                  </div>
                  <Badge variant="secondary">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Autenticação em 2 fatores</span>
                  </div>
                  <Badge variant="outline">Inativo</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Senha forte</span>
                  </div>
                  <Badge variant="secondary">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Sessões seguras</span>
                  </div>
                  <Badge variant="secondary">Ativo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alterar Senha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Alterar Senha
              </CardTitle>
              <CardDescription>Mantenha sua conta segura com uma senha forte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha atual</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Digite sua senha atual"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button>Alterar Senha</Button>
            </CardContent>
          </Card>

          {/* Autenticação em 2 Fatores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Autenticação em Dois Fatores (2FA)
              </CardTitle>
              <CardDescription>Adicione uma camada extra de segurança à sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Ativar 2FA</Label>
                  <p className="text-sm text-muted-foreground">
                    Usar aplicativo autenticador para gerar códigos de verificação
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Recomendação de Segurança</p>
                    <p className="text-sm text-muted-foreground">
                      Ative a autenticação em dois fatores para proteger sua conta contra acessos não autorizados.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessões Ativas */}
          <Card>
            <CardHeader>
              <CardTitle>Sessões Ativas</CardTitle>
              <CardDescription>Gerencie onde você está conectado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Sessão atual</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Chrome • São Paulo, SP • Agora
                    </p>
                  </div>
                  <Badge variant="secondary">Atual</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <span className="font-medium">iPhone Safari</span>
                    <p className="text-sm text-muted-foreground">
                      Mobile Safari • São Paulo, SP • 2 horas atrás
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Encerrar
                  </Button>
                </div>
              </div>
              
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  Encerrar todas as outras sessões
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Privacidade */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Privacidade</CardTitle>
              <CardDescription>Controle como seus dados são utilizados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Análise de uso</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir coleta de dados anônimos para melhorar o serviço
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Cookies de marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir cookies para personalização de conteúdo
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;