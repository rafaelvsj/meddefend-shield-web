import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, Zap, TrendingDown, DollarSign, Activity } from "lucide-react";
import { statsApi, AdminStats } from "@/lib/api/stats";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAdminBilling } from "@/hooks/useAdminBilling";
import AdminTestPanel from "@/components/AdminTestPanel";

const AdminHome = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { users, loading: usersLoading } = useAdminUsers();
  const { data: billingData, loading: billingLoading } = useAdminBilling();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await statsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    loading: cardLoading,
    description = "Últimas 24h"
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    loading: boolean;
    description?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {cardLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral das métricas do sistema e testes de funcionalidade
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Usuários"
          value={usersLoading ? "Loading..." : users.length.toString()}
          icon={Users}
          loading={usersLoading}
          description="Usuários registrados"
        />
        
        <StatCard
          title="Receita Total"
          value={billingLoading ? "Loading..." : `$${billingData?.totalRevenue || 0}`}
          icon={DollarSign}
          loading={billingLoading}
          description="Receita mensal"
        />
        
        <StatCard
          title="Assinaturas Ativas"
          value={usersLoading ? "Loading..." : (users.filter(u => u.status === 'Active').length).toString()}
          icon={Activity}
          loading={usersLoading}
          description="Atualmente ativas"
        />
        
        <StatCard
          title="Tokens IA (24h)"
          value={stats?.iaTokens24h?.toLocaleString() ?? 0}
          icon={Zap}
          loading={loading}
          description="Últimas 24h"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usersLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))
              ) : (
                users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Último acesso: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("pt-BR") : "Nunca"}
                      </p>
                    </div>
                    <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                      {user.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tempo de Resposta da API</span>
                <Badge variant="default">Bom</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Performance do Banco</span>
                <Badge variant="default">Excelente</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Taxa de Erro</span>
                <Badge variant="default">Baixa</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Uptime</span>
                <Badge variant="default">99.9%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Panel for debugging */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Teste de Funções Admin</h3>
        <AdminTestPanel />
      </div>
    </div>
  );
};

export default AdminHome;