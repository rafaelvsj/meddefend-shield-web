import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'pt-br' | 'en' | 'es';
  default_model: string;
  report_detail_level: 'basico' | 'medio' | 'detalhado';
  auto_save_analyses: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  sound_notifications: boolean;
  notification_frequency: 'daily' | 'weekly' | 'monthly' | 'never';
}

interface UserSettingsContextType {
  settings: UserSettings;
  loading: boolean;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

const defaultSettings: UserSettings = {
  theme: 'light',
  language: 'pt-br',
  default_model: 'cardiologia',
  report_detail_level: 'medio',
  auto_save_analyses: true,
  email_notifications: true,
  push_notifications: true,
  sound_notifications: true,
  notification_frequency: 'weekly',
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserSettings();
    } else {
      setSettings(defaultSettings);
      setLoading(false);
    }
  }, [user]);

  const loadUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          theme,
          language,
          default_model,
          report_detail_level,
          auto_save_analyses,
          email_notifications,
          push_notifications,
          sound_notifications,
          notification_frequency
        `)
        .eq('id', user!.id)
        .single();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setSettings({
          theme: (data.theme as 'light' | 'dark' | 'system') || defaultSettings.theme,
          language: (data.language as 'pt-br' | 'en' | 'es') || defaultSettings.language,
          default_model: data.default_model || defaultSettings.default_model,
          report_detail_level: (data.report_detail_level as 'basico' | 'medio' | 'detalhado') || defaultSettings.report_detail_level,
          auto_save_analyses: data.auto_save_analyses ?? defaultSettings.auto_save_analyses,
          email_notifications: data.email_notifications ?? defaultSettings.email_notifications,
          push_notifications: data.push_notifications ?? defaultSettings.push_notifications,
          sound_notifications: data.sound_notifications ?? defaultSettings.sound_notifications,
          notification_frequency: (data.notification_frequency as 'daily' | 'weekly' | 'monthly' | 'never') || defaultSettings.notification_frequency,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async <K extends keyof UserSettings>(
    key: K, 
    value: UserSettings[K]
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [key]: value })
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Erro ao salvar configuração",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setSettings(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: "Configuração salva",
        description: "Sua preferência foi salva com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a configuração.",
        variant: "destructive",
      });
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(newSettings)
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Erro ao salvar configurações",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setSettings(prev => ({ ...prev, ...newSettings }));
      
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    }
  };

  const value = {
    settings,
    loading,
    updateSetting,
    updateSettings,
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
};