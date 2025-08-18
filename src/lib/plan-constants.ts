// FASE 3: Constants e normalização de tiers para consistência UI/Backend

export const CANONICAL_TIERS = ['free', 'starter', 'pro'] as const;

export const TIER_ALIASES: Record<string, string> = {
  'professional': 'pro',
  'ultra': 'pro'
};

export const PLAN_LEVELS: Record<string, number> = {
  'free': 1,
  'starter': 2, 
  'pro': 3
};

export const TIER_ICONS = {
  'free': 'Lock',
  'starter': 'Lock',
  'pro': 'Crown'
};

export const TIER_COLORS = {
  'free': 'bg-gray-500',
  'starter': 'bg-blue-500',
  'pro': 'bg-purple-500'
};

/**
 * Normaliza tier para formato canônico
 * - Aplica lowercase
 * - Mapeia aliases (professional -> pro, ultra -> pro)
 * - Valida se está na lista de tiers canônicos
 * - Fallback para 'free' se inválido
 */
export function normalizeTier(tier?: string | null): string {
  if (!tier) return 'free';
  
  const lowercased = tier.toLowerCase();
  const aliased = TIER_ALIASES[lowercased] || lowercased;
  
  return CANONICAL_TIERS.includes(aliased as any) ? aliased : 'free';
}

/**
 * Retorna o nível numérico do tier normalizado
 */
export function getTierLevel(tier?: string | null): number {
  const normalized = normalizeTier(tier);
  return PLAN_LEVELS[normalized] || 1;
}

/**
 * Verifica se o tier atual atende o nível mínimo requerido
 */
export function hasMinimumTier(currentTier?: string | null, requiredLevel: number = 1): boolean {
  return getTierLevel(currentTier) >= requiredLevel;
}