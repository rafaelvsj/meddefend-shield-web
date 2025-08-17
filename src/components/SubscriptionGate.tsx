import { ReactNode } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionGateProps {
  children: ReactNode;
  requiredTier?: 'starter' | 'professional' | 'ultra';
  featureName: string;
  description?: string;
}

const tierLevels = {
  starter: 1,
  professional: 2,
  ultra: 3
};

const tierIcons = {
  starter: Lock,
  professional: Crown,
  ultra: Zap
};

const tierColors = {
  starter: 'bg-blue-500',
  professional: 'bg-purple-500', 
  ultra: 'bg-orange-500'
};

export const SubscriptionGate = ({ 
  children, 
  requiredTier = 'starter', 
  featureName,
  description 
}: SubscriptionGateProps) => {
  const { plan, plan_level } = usePlan();
  const navigate = useNavigate();
  const Icon = tierIcons[requiredTier];

  const currentTierLevel = plan_level;
  
  const requiredTierLevel = tierLevels[requiredTier];
  const hasAccess = plan_level >= requiredTierLevel;

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
          <Badge className={`${tierColors[requiredTier]} text-white`}>
            {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-300">
          {description || `Esta funcionalidade requer um plano ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} ou superior.`}
        </p>
        
        {plan_level === 1 ? (
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
              Seu plano atual: <span className="text-white font-medium">{plan}</span>
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