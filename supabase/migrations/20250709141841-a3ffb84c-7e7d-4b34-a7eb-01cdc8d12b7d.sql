-- Adicionar campos de configurações do usuário na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'pt-br' CHECK (language IN ('pt-br', 'en', 'es'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_model text DEFAULT 'cardiologia';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS report_detail_level text DEFAULT 'medio' CHECK (report_detail_level IN ('basico', 'medio', 'detalhado'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auto_save_analyses boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_notifications boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sound_notifications boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_frequency text DEFAULT 'weekly' CHECK (notification_frequency IN ('daily', 'weekly', 'monthly', 'never'));

-- Comentários para documentar os campos
COMMENT ON COLUMN public.profiles.theme IS 'Tema preferido do usuário: light, dark ou system';
COMMENT ON COLUMN public.profiles.language IS 'Idioma da interface';
COMMENT ON COLUMN public.profiles.default_model IS 'Modelo padrão para análises';
COMMENT ON COLUMN public.profiles.report_detail_level IS 'Nível de detalhamento dos relatórios';
COMMENT ON COLUMN public.profiles.auto_save_analyses IS 'Auto-salvar análises realizadas';
COMMENT ON COLUMN public.profiles.email_notifications IS 'Receber notificações por email';
COMMENT ON COLUMN public.profiles.push_notifications IS 'Receber notificações push';
COMMENT ON COLUMN public.profiles.sound_notifications IS 'Reproduzir sons de notificação';
COMMENT ON COLUMN public.profiles.notification_frequency IS 'Frequência de resumos por email';