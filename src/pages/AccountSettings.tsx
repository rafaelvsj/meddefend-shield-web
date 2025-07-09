import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useTheme } from 'next-themes';

const AccountSettings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, loading } = useUserSettings();
  const { setTheme } = useTheme();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(localSettings);
    setTheme(localSettings.theme);
  };

  const updateLocalSetting = <K extends keyof typeof localSettings>(
    key: K, 
    value: typeof localSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div>Carregando...</div>;
  };

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
            <h1 className="text-2xl font-bold">Configurações da Conta</h1>
            <p className="text-muted-foreground">Gerencie suas preferências e configurações da conta</p>
          </div>

          {/* Preferências Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Preferências Gerais</CardTitle>
              <CardDescription>Configure suas preferências básicas da aplicação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Tema escuro</Label>
                  <p className="text-sm text-muted-foreground">Ativar modo escuro na interface</p>
                </div>
                <Switch 
                  checked={localSettings.theme === 'dark'} 
                  onCheckedChange={(checked) => {
                    const newTheme = checked ? 'dark' : 'light';
                    updateLocalSetting('theme', newTheme);
                    setTheme(newTheme);
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações por email</Label>
                  <p className="text-sm text-muted-foreground">Receber notificações importantes por email</p>
                </div>
                <Switch 
                  checked={localSettings.email_notifications} 
                  onCheckedChange={(checked) => updateLocalSetting('email_notifications', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Idioma da interface</Label>
                <Select value={localSettings.language} onValueChange={(value: 'pt-br' | 'en' | 'es') => updateLocalSetting('language', value)}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Análise */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Análise</CardTitle>
              <CardDescription>Personalize o comportamento das análises médicas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Nível de detalhamento dos relatórios</Label>
                <Select defaultValue="medio">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="detalhado">Detalhado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-salvar análises</Label>
                  <p className="text-sm text-muted-foreground">Salvar automaticamente as análises realizadas</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Confirmação antes de excluir</Label>
                  <p className="text-sm text-muted-foreground">Solicitar confirmação ao excluir análises</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Zona de Perigo */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
              <CardDescription>Ações irreversíveis relacionadas à sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                <div>
                  <h3 className="font-medium">Excluir conta</h3>
                  <p className="text-sm text-muted-foreground">
                    Exclui permanentemente sua conta e todos os dados associados
                  </p>
                </div>
                <Button variant="destructive">
                  Excluir Conta
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Botão de salvar */}
          <div className="flex justify-end">
            <Button className="flex items-center gap-2" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;