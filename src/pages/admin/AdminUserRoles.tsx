import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Users, Search, Shield, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: string;
  plan: string;
  is_comp: boolean;
  created_at: string;
}

interface RoleChangeAction {
  type: 'role' | 'plan';
  label: string;
  value: string;
  variant: 'default' | 'destructive' | 'secondary';
}

const AdminUserRoles = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user?: UserWithRole;
    action?: RoleChangeAction;
    newRole?: string;
    newPlan?: string;
  }>({ open: false });

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get users with their roles and subscription info
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-users');

      if (usersError) {
        console.error('Error loading users:', usersError);
        toast.error('Failed to load users');
        return;
      }

      const formattedUsers = usersData.users.map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.name || 'Unknown',
        role: user.role || 'user',
        plan: user.plan,
        is_comp: user.plan?.includes('comp') || false,
        created_at: user.createdAt
      }));

      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, planFilter]);

  const filterUsers = () => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (planFilter !== 'all') {
      if (planFilter === 'comp') {
        filtered = filtered.filter(user => user.is_comp);
      } else {
        filtered = filtered.filter(user => user.plan === planFilter);
      }
    }

    setFilteredUsers(filtered);
  };

  const getRoleActions = (currentRole: string): RoleChangeAction[] => {
    const actions: RoleChangeAction[] = [];
    
    if (currentRole !== 'admin') {
      actions.push({
        type: 'role',
        label: 'Promote to Admin',
        value: 'admin',
        variant: 'default'
      });
    }
    
    if (currentRole !== 'user') {
      actions.push({
        type: 'role',
        label: 'Set as User',
        value: 'user',
        variant: 'secondary'
      });
    }
    
    if (currentRole !== 'suspended') {
      actions.push({
        type: 'role',
        label: 'Suspend User',
        value: 'suspended',
        variant: 'destructive'
      });
    }

    return actions;
  };

  const getPlanActions = (currentPlan: string, isComp: boolean): RoleChangeAction[] => {
    const actions: RoleChangeAction[] = [];
    
    if (!isComp) {
      actions.push({
        type: 'plan',
        label: 'Grant Basic Comp',
        value: 'basic_comp',
        variant: 'default'
      });
      actions.push({
        type: 'plan',
        label: 'Grant Pro Comp',
        value: 'pro_comp',
        variant: 'default'
      });
      actions.push({
        type: 'plan',
        label: 'Grant Premium Comp',
        value: 'premium_comp',
        variant: 'default'
      });
    } else if (currentPlan !== 'free') {
      actions.push({
        type: 'plan',
        label: 'Remove Comp Plan',
        value: 'free',
        variant: 'destructive'
      });
    }

    return actions;
  };

  const handleRoleAction = (user: UserWithRole, action: RoleChangeAction) => {
    setConfirmDialog({
      open: true,
      user,
      action,
      newRole: action.type === 'role' ? action.value : user.role,
      newPlan: action.type === 'plan' ? action.value : user.plan
    });
  };

  const executeRoleChange = async () => {
    if (!confirmDialog.user || !confirmDialog.newRole || !confirmDialog.newPlan) return;

    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user-plan-role', {
        body: {
          user_id: confirmDialog.user.id,
          new_role: confirmDialog.newRole,
          new_plan: confirmDialog.newPlan
        }
      });

      if (error) {
        console.error('Error updating user:', error);
        toast.error('Failed to update user');
        return;
      }

      toast.success('User updated successfully');
      setConfirmDialog({ open: false });
      loadUsers(); // Reload users to reflect changes
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="flex items-center gap-1"><Shield className="h-3 w-3" />Admin</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const getPlanBadge = (plan: string, isComp: boolean) => {
    if (isComp) {
      return <Badge variant="default" className="flex items-center gap-1"><Crown className="h-3 w-3" />{plan.replace('_comp', '')} Comp</Badge>;
    }
    
    switch (plan) {
      case 'premium':
        return <Badge variant="default">Premium</Badge>;
      case 'pro':
        return <Badge variant="secondary">Pro</Badge>;
      case 'basic':
        return <Badge variant="secondary">Basic</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8" />
          User Role Management
        </h2>
        <p className="text-muted-foreground">
          Manage user roles and comp plans
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Promote users, grant comp plans, and manage access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="comp">Comp Plans</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getPlanBadge(user.plan, user.is_comp)}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {getRoleActions(user.role).map((action, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant={action.variant}
                          onClick={() => handleRoleAction(user, action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                      {getPlanActions(user.plan, user.is_comp).map((action, index) => (
                        <Button
                          key={`plan-${index}`}
                          size="sm"
                          variant={action.variant}
                          onClick={() => handleRoleAction(user, action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Changes</DialogTitle>
            <DialogDescription>
              Are you sure you want to make these changes to the user account?
            </DialogDescription>
          </DialogHeader>
          {confirmDialog.user && (
            <div className="space-y-4">
              <div>
                <strong>User:</strong> {confirmDialog.user.full_name} ({confirmDialog.user.email})
              </div>
              <div>
                <strong>Current Role:</strong> {getRoleBadge(confirmDialog.user.role)}
                {confirmDialog.newRole !== confirmDialog.user.role && (
                  <>
                    <span className="mx-2">→</span>
                    {getRoleBadge(confirmDialog.newRole!)}
                  </>
                )}
              </div>
              <div>
                <strong>Current Plan:</strong> {getPlanBadge(confirmDialog.user.plan, confirmDialog.user.is_comp)}
                {confirmDialog.newPlan !== confirmDialog.user.plan && (
                  <>
                    <span className="mx-2">→</span>
                    {getPlanBadge(confirmDialog.newPlan!, confirmDialog.newPlan!.includes('_comp'))}
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={executeRoleChange}>
              Confirm Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserRoles;