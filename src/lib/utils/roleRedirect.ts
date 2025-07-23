// Rotas detectadas automaticamente
const ADMIN_ROUTE = '/admin';
const USER_ROUTE = '/dashboard';

/**
 * Redireciona o usuário baseado no role armazenado no localStorage
 * @param admin - Rota para admin (padrão: /admin)
 * @param user - Rota para usuário comum (padrão: /dashboard)
 */
export const redirectByRole = (admin: string = ADMIN_ROUTE, user: string = USER_ROUTE) => {
  const role = window.localStorage.getItem('role');
  
  if (role === 'admin') {
    window.location.href = admin;
  } else {
    window.location.href = user;
  }
};