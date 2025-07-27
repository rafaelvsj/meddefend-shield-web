import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, Edit, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LLMSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const AdminLLMSettings = () => {
  const [settings, setSettings] = useState<LLMSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSetting, setEditingSetting] = useState<LLMSetting | null>(null);
  const [newSetting, setNewSetting] = useState({
    setting_key: '',
    setting_value: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('llm_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações LLM",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async (settingData: any, isEdit = false) => {
    setSaving(true);
    try {
      if (isEdit && editingSetting) {
        const { error } = await supabase
          .from('llm_settings')
          .update({
            setting_value: settingData.setting_value,
            description: settingData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSetting.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('llm_settings')
          .insert({
            setting_key: settingData.setting_key,
            setting_value: settingData.setting_value,
            description: settingData.description
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: isEdit ? "Configuração atualizada" : "Configuração criada",
      });

      setEditingSetting(null);
      setNewSetting({ setting_key: '', setting_value: '', description: '' });
      loadSettings();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configuração",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSetting = async (id: string) => {
    try {
      const { error } = await supabase
        .from('llm_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração removida",
      });

      loadSettings();
    } catch (error) {
      console.error('Erro ao deletar configuração:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover configuração",
        variant: "destructive",
      });
    }
  };

  const getSettingValueDisplay = (value: string) => {
    // Tentar parsear como JSON para exibir de forma mais legível
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object') {
        return JSON.stringify(parsed, null, 2);
      }
    } catch (e) {
      // Se não for JSON válido, retornar como string
    }
    return value;
  };

  const getSettingBadge = (key: string) => {
    if (key.includes('api') || key.includes('key')) {
      return <Badge variant="destructive">Sensível</Badge>;
    }
    if (key.includes('model') || key.includes('prompt')) {
      return <Badge variant="default">Core</Badge>;
    }
    return <Badge variant="secondary">Config</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações LLM</h2>
          <p className="text-muted-foreground">
            Gerencie configurações dos modelos de linguagem
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Configuração
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Configuração</DialogTitle>
              <DialogDescription>
                Adicione uma nova configuração para o sistema LLM
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-key">Chave da Configuração</Label>
                <Input
                  id="new-key"
                  value={newSetting.setting_key}
                  onChange={(e) => setNewSetting({...newSetting, setting_key: e.target.value})}
                  placeholder="ex: openai_api_key"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-value">Valor</Label>
                <Textarea
                  id="new-value"
                  value={newSetting.setting_value}
                  onChange={(e) => setNewSetting({...newSetting, setting_value: e.target.value})}
                  placeholder="Valor da configuração"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-description">Descrição</Label>
                <Input
                  id="new-description"
                  value={newSetting.description}
                  onChange={(e) => setNewSetting({...newSetting, description: e.target.value})}
                  placeholder="Descrição da configuração"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => handleSaveSetting(newSetting, false)}
                  disabled={!newSetting.setting_key || !newSetting.setting_value || saving}
                >
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Configurações</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurações Core</CardTitle>
            <Badge variant="default">Core</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settings.filter(s => s.setting_key.includes('model') || s.setting_key.includes('prompt')).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurações Sensíveis</CardTitle>
            <Badge variant="destructive">Sensível</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settings.filter(s => s.setting_key.includes('api') || s.setting_key.includes('key')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações Ativas</CardTitle>
          <CardDescription>
            Lista de todas as configurações do sistema LLM
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chave</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">{setting.setting_key}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">
                        {setting.setting_key.includes('key') || setting.setting_key.includes('password') 
                          ? '••••••••' 
                          : getSettingValueDisplay(setting.setting_value)
                        }
                      </div>
                    </TableCell>
                    <TableCell>{getSettingBadge(setting.setting_key)}</TableCell>
                    <TableCell>{setting.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingSetting(setting)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Configuração</DialogTitle>
                              <DialogDescription>
                                Modifique a configuração {setting.setting_key}
                              </DialogDescription>
                            </DialogHeader>
                            {editingSetting && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Chave da Configuração</Label>
                                  <Input
                                    value={editingSetting.setting_key}
                                    disabled
                                    className="bg-muted"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="edit-value">Valor</Label>
                                  <Textarea
                                    id="edit-value"
                                    value={editingSetting.setting_value}
                                    onChange={(e) => setEditingSetting({
                                      ...editingSetting, 
                                      setting_value: e.target.value
                                    })}
                                    rows={3}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="edit-description">Descrição</Label>
                                  <Input
                                    id="edit-description"
                                    value={editingSetting.description || ''}
                                    onChange={(e) => setEditingSetting({
                                      ...editingSetting, 
                                      description: e.target.value
                                    })}
                                  />
                                </div>
                                
                                <div className="flex justify-end gap-2">
                                  <Button
                                    onClick={() => handleSaveSetting(editingSetting, true)}
                                    disabled={saving}
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    {saving ? "Salvando..." : "Salvar"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSetting(setting.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLLMSettings;