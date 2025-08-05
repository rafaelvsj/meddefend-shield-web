-- 1.1 Garantir que todos usuários tenham role padrão
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'user'::app_role 
FROM profiles p 
LEFT JOIN user_roles ur ON p.id = ur.user_id 
WHERE ur.user_id IS NULL;

-- 1.2 Trigger para garantir role automático em novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN new;
END;
$$;

-- Recriar trigger se necessário
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_role();

-- 1.3 Settings padrão do sistema
INSERT INTO public.llm_settings (setting_key, setting_value, description) VALUES
('system_name', 'MedDefend Admin', 'Nome do sistema'),
('admin_email', 'admin@meddefend.com', 'Email do administrador'),
('maintenance_mode', 'false', 'Modo manutenção'),
('auto_retry_analyses', 'true', 'Retry automático'),
('max_retry_attempts', '3', 'Tentativas máximas'),
('request_timeout', '30', 'Timeout em segundos'),
('require_2fa', 'false', 'Exigir 2FA'),
('session_timeout', 'true', 'Timeout de sessão'),
('session_duration', '8', 'Duração em horas')
ON CONFLICT (setting_key) DO NOTHING;

-- 1.4 Corrigir subscribers órfãos
UPDATE public.subscribers 
SET subscription_tier = 'free' 
WHERE subscription_tier IS NULL;