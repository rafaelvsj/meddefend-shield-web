import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, UserCheck, UserX, Shield, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: string;
  subscription_tier?: string;
  created_at: string;
}

interface RoleChangeAction {
  type: 'promote' | 'demote' | 'suspend' | 'reactivate';
  label: string;
  newRole: string;
  variant: 'default' | 'destructive';
  icon: any;
}

const AdminUserRoles = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user?: UserWithRole;
    action?: RoleChangeAction;
  }>({ open: false });
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, roleFilter, planFilter, searchQuery]);

  const loadUsers = async () => {
    try {
      // Get profiles with roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          created_at
        `);

      if (profilesError) throw profilesError;

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get subscribers data
      const { data: subscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .select('user_id, subscription_tier');

      if (subscribersError) throw subscribersError;

      // Combine data
      const usersWithRoles = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const subscription = subscribers?.find(s => s.user_id === profile.id);
        
        return {
          ...profile,
          role: userRole?.role || 'user',
          subscription_tier: subscription?.subscription_tier || 'free'
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar usuários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (planFilter !== "all") {
      filtered = filtered.filter(user => user.subscription_tier === planFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const getRoleActions = (currentRole: string): RoleChangeAction[] => {
    const actions: RoleChangeAction[] = [];

    if (currentRole === 'user') {
      actions.push({
        type: 'promote',
        label: 'Promover a Admin',
        newRole: 'admin',
        variant: 'default',
        icon: Shield
      });
      actions.push({
        type: 'suspend',
        label: 'Suspender Conta',
        newRole: 'suspended',
        variant: 'destructive',
        icon: UserX
      });
    } else if (currentRole === 'admin') {
      actions.push({
        type: 'demote',
        label: 'Rebaixar para User',
        newRole: 'user',
        variant: 'default',
        icon: User
      });
    } else if (currentRole === 'suspended') {
      actions.push({
        type: 'reactivate',
        label: 'Reativar Conta',
        newRole: 'user',
        variant: 'default',
        icon: UserCheck
      });
    }

    return actions;
  };

  const handleRoleAction = (user: UserWithRole, action: RoleChangeAction) => {
    setConfirmDialog({
      open: true,
      user,
      action
    });
  };

  const executeRoleChange = async () => {
    if (!confirmDialog.user || !confirmDialog.action) return;

    setActionLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-update-user-role', {
        body: {
          user_id: confirmDialog.user.id,
          new_role: confirmDialog.action.newRole
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Sucesso",
        description: `Papel alterado para ${confirmDialog.action.newRole}`,
      });

      // Refresh users list
      await loadUsers();
      setConfirmDialog({ open: false });

    } catch (error) {
      console.error('Erro ao alterar papel:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar papel do usuário",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'default',
      user: 'secondary',
      suspended: 'destructive'
    } as const;

    return (
      <Badge variant={variants[role as keyof typeof variants] || 'secondary'}>
        {role}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const variants = {
      premium: 'default',
      pro: 'secondary',
      basic: 'outline',
      free: 'outline'
    } as const;

    return (
      <Badge variant={variants[plan as keyof typeof variants] || 'outline'}>
        {plan}
      </Badge>
    );
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Role & Status Manager</h2>
        <p className="text-muted-foreground">
          Gerencie papéis e status dos usuários
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getPlanBadge(user.subscription_tier || 'free')}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {getRoleActions(user.role).map((action) => (
                          <DropdownMenuItem
                            key={action.type}
                            onClick={() => handleRoleAction(user, action)}
                            className={action.variant === 'destructive' ? 'text-destructive' : ''}
                          >
                            <action.icon className="h-4 w-4 mr-2" />
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Alteração</DialogTitle>
            <DialogDescription>
              Você está prestes a alterar o papel do usuário. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {confirmDialog.user && confirmDialog.action && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Usuário:</strong> {confirmDialog.user.full_name || confirmDialog.user.email}</p>
                <p><strong>Papel atual:</strong> {confirmDialog.user.role}</p>
                <p><strong>Novo papel:</strong> {confirmDialog.action.newRole}</p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDialog({ open: false })}
                  disabled={actionLoading}
                >
                  Cancelar
                </Button>
                <Button
                  variant={confirmDialog.action.variant}
                  onClick={executeRoleChange}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserRoles;