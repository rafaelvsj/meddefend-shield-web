-- Criar usuário administrador diretamente
DO $$
DECLARE
    admin_user_id uuid;
    encrypted_password text;
BEGIN
    -- Gerar ID único para o usuário
    admin_user_id := gen_random_uuid();
    
    -- Criar hash da senha usando a função do Supabase
    encrypted_password := crypt('Rsf1992*', gen_salt('bf'));
    
    -- Inserir usuário na tabela auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        admin_user_id,
        'authenticated',
        'authenticated',
        'admin@meddefend.tech',
        encrypted_password,
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Administrador"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
    
    -- Inserir entrada na tabela profiles (se necessário)
    INSERT INTO public.profiles (
        id,
        email,
        full_name
    ) VALUES (
        admin_user_id,
        'admin@meddefend.tech',
        'Administrador'
    );
    
    -- Atribuir papel de admin
    INSERT INTO public.user_roles (
        user_id,
        role
    ) VALUES (
        admin_user_id,
        'admin'
    );
    
    -- Mostrar o ID do usuário criado
    RAISE NOTICE 'Usuário administrador criado com ID: %', admin_user_id;
    
END $$;