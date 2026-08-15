import type { CityId, IndustryType } from './types';
import { CITIES } from './data/board';
import { tileSpec } from './data/industries';
import { activePlayer, type Card, type GameState } from './state';
import {
  buildOption,
  cardAllowsBuild,
  eligibleSlots,
  lowestBuildable,
  overbuildSlots,
  tileAllowedInEra,
} from './actions';
import { planCoal, planIron } from './resources';
import { isPayingPlayer } from './state';

/** Why a build is blocked (Spanish, PC-style). Null = would be legal with this card. */
export function buildBlockReason(
  state: GameState,
  card: Card | null,
  city: CityId,
  industry: IndustryType,
): string | null {
  if (!card) return 'Elige una carta';
  const player = activePlayer(state);
  if (!cardAllowsBuild(state, player, card, city, industry)) {
    if (card.kind === 'location') return 'Carta de otra ubicación';
    if (card.kind === 'industry') return 'Carta de otra industria';
    return 'Carta no válida aquí';
  }
  if (!CITIES[city].slots.some((s) => s.includes(industry))) return 'Industria no permitida';

  const level = lowestBuildable(state, player, industry);
  if (level === null) return 'Sin fichas en tu mat';
  if (!tileAllowedInEra(industry, level, state.era)) return 'No en esta era';

  const spec = tileSpec(industry, level);
  let slot: number | null = null;
  let overbuild = false;
  const free = eligibleSlots(state, city, industry);
  if (free.length > 0) slot = free[0];
  else {
    const over = overbuildSlots(state, player, city, industry, level);
    if (over.length > 0) {
      slot = over[0];
      overbuild = true;
    }
  }
  if (slot === null) return 'Casillas ocupadas';
  if (state.era === 'canal') {
    const overIdx = overbuild ? slot : null;
    const blocked = state.board[city].some((t, i) => t?.owner === player && i !== overIdx);
    if (blocked) return 'Solo 1 edificio por ciudad (era canal)';
  }

  if (spec.costCoal > 0) {
    const coal = planCoal(state, city, spec.costCoal, player);
    if (!coal?.ok) return 'Carbón insuficiente';
  }
  if (spec.costIron > 0) {
    const iron = planIron(state, spec.costIron, player);
    if (!iron?.ok) return 'Hierro insuficiente';
  }

  const coalPlan = spec.costCoal > 0 ? planCoal(state, city, spec.costCoal, player) : null;
  const ironPlan = spec.costIron > 0 ? planIron(state, spec.costIron, player) : null;
  const totalCost = spec.cost + (coalPlan?.marketCost ?? 0) + (ironPlan?.marketCost ?? 0);
  if (isPayingPlayer(state, player) && totalCost > state.players[player].money) {
    return 'Dinero insuficiente';
  }

  return buildOption(state, player, city, industry) ? null : 'No se puede construir';
}
