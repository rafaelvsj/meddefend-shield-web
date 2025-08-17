import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const AdminUsers = () => {
  const { users, loading, error, updatingIds, fetchUsers, updateUserPlan } = useAdminUsers();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePlanChange = async (userId: string, currentPlan: string, newPlan: "free"|"starter"|"pro") => {
    if (currentPlan === newPlan) return;
    
    const result = await updateUserPlan(userId, newPlan);
    if (result.ok) {
      toast({
        title: "Plano atualizado",
        description: `Plano alterado para ${newPlan}.`,
      });
    } else {
      toast({
        title: "Erro ao atualizar plano",
        description: String(result.error ?? "Tente novamente"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Usuários</h2>
        <p className="text-muted-foreground">Gerencie os planos dos usuários (free, starter, pro).</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último acesso</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  <span className="ml-2">Carregando…</span>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-destructive">
                  Erro ao carregar usuários: {error}
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name ?? "-"}</TableCell>
                <TableCell>{user.email ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={user.plan === 'pro' ? 'default' : 'secondary'}>
                    {user.plan ?? "-"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>
                    {user.status ?? "-"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("pt-BR") : "-"}
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={user.plan ?? "free"}
                    onValueChange={(newPlan) => handlePlanChange(user.id, user.plan, newPlan as any)}
                    disabled={!!updatingIds[user.id]}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Selecionar plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminUsers;