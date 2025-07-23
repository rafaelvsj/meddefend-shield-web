import { supabase } from "@/integrations/supabase/client";

// Rotas detectadas automaticamente
const ADMIN_ROUTE = '/admin';
const USER_ROUTE = '/dashboard';

/**
 * Redireciona o usuário baseado no role consultado diretamente no banco
 * @param admin - Rota para admin (padrão: /admin)
 * @param user - Rota para usuário comum (padrão: /dashboard)
 */
export const redirectByRole = async (admin: string = ADMIN_ROUTE, user: string = USER_ROUTE) => {
  try {
    // Verificar se o usuário é admin diretamente no banco
    const { data: isAdmin } = await supabase.rpc('is_admin');
    
    if (isAdmin) {
      window.location.href = admin;
    } else {
      window.location.href = user;
    }
  } catch (error) {
    console.error('Erro ao verificar role:', error);
    // Em caso de erro, redirecionar para dashboard por segurança
    window.location.href = user;
  }
};