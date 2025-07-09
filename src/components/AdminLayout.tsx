import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageCircle, 
  Users, 
  CreditCard, 
  FileText, 
  Database, 
  Settings 
} from 'lucide-react';
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
import AdminHome from "@/pages/admin/AdminHome";
import AdminMessages from "@/pages/admin/AdminMessages";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminBilling from "@/pages/admin/AdminBilling";
import AdminTemplates from "@/pages/admin/AdminTemplates";
import AdminLogs from "@/pages/admin/AdminLogs";
import AdminSettings from "@/pages/admin/AdminSettings";

const menuItems = [
  { title: "Home", url: "/admin", icon: Home },
  { 
    title: "Messages", 
    url: "/admin/messages", 
    icon: MessageCircle,
    badge: "3"
  },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Plans & Billing", url: "/admin/billing", icon: CreditCard },
  { title: "Templates", url: "/admin/templates", icon: FileText },
  { title: "AI Logs", url: "/admin/logs", icon: Database },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const AdminLayout = () => {
  const location = useLocation();

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
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-sidebar-border" />
            <h1 className="font-semibold">Admin Panel</h1>
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