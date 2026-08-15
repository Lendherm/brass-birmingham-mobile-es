import type { CoalPlan, IronPlan } from '../engine/resources';

function formatResourcePlan(
  plan: CoalPlan | IronPlan | null,
  glyph: string,
): string {
  if (!plan) return '';
  const parts: string[] = [];
  const fromTiles = plan.takes.reduce((s, t) => s + t.count, 0);
  if (fromTiles > 0) parts.push(`${fromTiles}${glyph}`);
  if (plan.fromMarket > 0) {
    parts.push(plan.marketCost > 0 ? `${plan.fromMarket}${glyph}(£${plan.marketCost})` : `${plan.fromMarket}${glyph}`);
  }
  return parts.join('+');
}

export function formatBuildCost(option: {
  moneyCost: number;
  coalPlan: CoalPlan | null;
  ironPlan: IronPlan | null;
  totalCost: number;
}): string {
  const parts = [`£${option.moneyCost}`];
  const coal = formatResourcePlan(option.coalPlan, '◆');
  const iron = formatResourcePlan(option.ironPlan, '■');
  if (coal) parts.push(coal);
  if (iron) parts.push(iron);
  const marketExtra = (option.coalPlan?.marketCost ?? 0) + (option.ironPlan?.marketCost ?? 0);
  const base = parts.join(' + ');
  if (marketExtra > 0 || coal || iron) return `${base} = £${option.totalCost}`;
  return base;
}

export function formatNetworkCost(option: {
  moneyCost: number;
  coalPlans: CoalPlan[];
  totalCost: number;
}): string {
  const parts = [`£${option.moneyCost}`];
  const coalTotal = option.coalPlans.reduce((s, p) => s + p.takes.reduce((a, t) => a + t.count, 0) + p.fromMarket, 0);
  const coalMarket = option.coalPlans.reduce((s, p) => s + p.marketCost, 0);
  if (coalTotal > 0) {
    parts.push(coalMarket > 0 ? `${coalTotal}◆(£${coalMarket})` : `${coalTotal}◆`);
  }
  if (option.totalCost > option.moneyCost) return `${parts.join(' + ')} = £${option.totalCost}`;
  return parts.join(' + ');
}
