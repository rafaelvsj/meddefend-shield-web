import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  MessageCircle, 
  Users, 
  CreditCard, 
  FileText, 
  Database, 
  Settings,
  LogOut
} from 'lucide-react';
import { messagesApi } from '@/lib/api/messages';
import MobileShell from '@/pages/admin/mobile/MobileShell';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminHome from "@/pages/admin/AdminHome";
import AdminMessages from "@/pages/admin/AdminMessages";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminBilling from "@/pages/admin/AdminBilling";
import AdminTemplates from "@/pages/admin/AdminTemplates";
import AdminLogs from "@/pages/admin/AdminLogs";
import AdminSettings from "@/pages/admin/AdminSettings";

const AdminLayout = () => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const menuItems = [
    { title: "Home", url: "/admin", icon: Home },
    { 
      title: "Messages", 
      url: "/admin/messages", 
      icon: MessageCircle,
      badge: unreadCount > 0 ? unreadCount.toString() : undefined
    },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Plans & Billing", url: "/admin/billing", icon: CreditCard },
    { title: "Templates", url: "/admin/templates", icon: FileText },
    { title: "AI Logs", url: "/admin/logs", icon: Database },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ];

  // Verificação de redirecionamento automático
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        // Verificar se o usuário é admin diretamente
        const { data: isAdmin } = await supabase.rpc('is_admin');
        if (!isAdmin) {
          window.location.href = '/dashboard';
        }
      } catch (error) {
        console.error('Erro ao verificar role:', error);
        // Em caso de erro, redirecionar para dashboard
        window.location.href = '/dashboard';
      }
    };
    
    checkAndRedirect();
  }, []);

  useEffect(() => {
    // Carregar contagem inicial
    const loadUnreadCount = async () => {
      try {
        const count = await messagesApi.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Erro ao carregar contagem de mensagens:', error);
      }
    };

    loadUnreadCount();

    // Configurar listener para novas mensagens
    const newMessageChannel = messagesApi.subscribeToMessages(() => {
      setUnreadCount(prev => prev + 1);
    });

    // Configurar listener para atualizações (quando marcar como lida)
    const updateChannel = messagesApi.subscribeToUpdates((updatedMessage) => {
      if (updatedMessage.status === 'read') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });

    return () => {
      newMessageChannel.unsubscribe();
      updateChannel.unsubscribe();
    };
  }, []);

  // Detectar mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Se for mobile, renderizar a interface mobile
  if (isMobile) {
    return <MobileShell />;
  }

  // Desktop layout (mantido inalterado)

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">AD</span>
              </div>
              <span className="font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                Admin
              </span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        isActive={location.pathname === item.url}
                      >
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-sidebar-border" />
              <h1 className="font-semibold">Admin Panel</h1>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </Button>
          </header>
          
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<AdminHome />} />
              <Route path="/messages" element={<AdminMessages />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/billing" element={<AdminBilling />} />
              <Route path="/templates" element={<AdminTemplates />} />
              <Route path="/logs" element={<AdminLogs />} />
              <Route path="/settings" element={<AdminSettings />} />
            </Routes>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;