-- Atribuir papel de admin ao usuário existente
DO $$
DECLARE
    existing_user_id uuid;
BEGIN
    -- Buscar o ID do usuário existente
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = 'admin@meddefend.tech';
    
    IF existing_user_id IS NOT NULL THEN
        -- Verificar se já tem perfil na tabela profiles
        INSERT INTO public.profiles (
            id,
            email,
            full_name
        ) VALUES (
            existing_user_id,
            'admin@meddefend.tech',
            'Administrador'
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Atribuir papel de admin (se ainda não tiver)
        INSERT INTO public.user_roles (
            user_id,
            role
        ) VALUES (
            existing_user_id,
            'admin'
        ) ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Confirmar o email do usuário para permitir login
        UPDATE auth.users 
        SET email_confirmed_at = NOW(),
            email_change_confirm_status = 0
        WHERE id = existing_user_id
        AND email_confirmed_at IS NULL;
        
        RAISE NOTICE 'Papel de admin atribuído ao usuário ID: %', existing_user_id;
    ELSE
        RAISE EXCEPTION 'Usuário com email admin@meddefend.tech não encontrado';
    END IF;
    
END $$;