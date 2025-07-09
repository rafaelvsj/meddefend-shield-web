import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MessageCircle, Zap, TrendingDown } from "lucide-react";
import { statsApi, AdminStats } from "@/lib/api/stats";

const AdminHome = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

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
    loading: cardLoading 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    loading: boolean; 
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
              Últimas 24h
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
          Visão geral das métricas do sistema
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Novos Usuários (24h)"
          value={stats?.newUsers24h ?? 0}
          icon={Users}
          loading={loading}
        />
        
        <StatCard
          title="Mensagens (não lidas)"
          value={stats?.unreadMessages ?? 0}
          icon={MessageCircle}
          loading={loading}
        />
        
        <StatCard
          title="Tokens IA (24h)"
          value={stats?.iaTokens24h.toLocaleString() ?? 0}
          icon={Zap}
          loading={loading}
        />
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn (30d)</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.churn30d}%</div>
                <p className="text-xs text-muted-foreground">
                  Últimos 30 dias
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHome;