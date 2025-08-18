import { ReactNode } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { normalizeTier, getTierLevel, TIER_COLORS } from '@/lib/plan-constants';

interface SubscriptionGateProps {
  children: ReactNode;
  requiredTier?: 'starter' | 'pro';
  featureName: string;
  description?: string;
}

const tierIcons = {
  starter: Lock,
  pro: Crown
};

export const SubscriptionGate = ({ 
  children, 
  requiredTier = 'starter', 
  featureName,
  description 
}: SubscriptionGateProps) => {
  const { plan, loading } = usePlan();
  const navigate = useNavigate();
  
  const normalizedCurrentTier = normalizeTier(plan);
  const normalizedRequiredTier = normalizeTier(requiredTier);
  
  const currentTierLevel = getTierLevel(normalizedCurrentTier);
  const requiredTierLevel = getTierLevel(normalizedRequiredTier);
  const hasAccess = currentTierLevel >= requiredTierLevel;
  
  const Icon = tierIcons[normalizedRequiredTier as keyof typeof tierIcons] || Lock;

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <p className="text-gray-300">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-slate-700 rounded-full w-fit">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
        <CardTitle className="text-white flex items-center justify-center gap-2">
          {featureName}
          <Badge className={`${TIER_COLORS[normalizedRequiredTier]} text-white`}>
            {normalizedRequiredTier.charAt(0).toUpperCase() + normalizedRequiredTier.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-300">
          {description || `Esta funcionalidade requer um plano ${normalizedRequiredTier.charAt(0).toUpperCase() + normalizedRequiredTier.slice(1)} ou superior.`}
        </p>
        
        {currentTierLevel === 1 ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              Faça o upgrade para acessar este recurso e muito mais.
            </p>
            <Button 
              onClick={() => navigate('/checkout')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Começar Agora
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              Seu plano atual: <span className="text-white font-medium">{normalizedCurrentTier}</span>
            </p>
            <Button 
              onClick={() => navigate('/checkout')}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Fazer Upgrade
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};