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
import { connectedToMarket } from './connectivity';
import { eraNombre, industria } from './messages';

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

/** Longer explanation for training mode / overlays (Spanish). */
export function buildBlockReasonDetailed(
  state: GameState,
  card: Card | null,
  city: CityId,
  industry: IndustryType,
): string {
  const short = buildBlockReason(state, card, city, industry);
  if (!short) return 'Construcción legal con esta carta.';

  const player = activePlayer(state);
  const cityName = CITIES[city].name;

  switch (short) {
    case 'Elige una carta':
      return 'Primero elige una carta de tu mano; la acción Construir exige gastar una carta válida.';
    case 'Carta de otra ubicación':
      return `Tu carta obliga a otra ciudad, no ${cityName}. Cambia de carta o toca la ciudad que indica la carta.`;
    case 'Carta de otra industria':
      return `La carta no permite ${industria(industry)} aquí. Usa una carta de esa industria o una comodín.`;
    case 'Carta no válida aquí':
      return 'Esta carta no autoriza construir en esa casilla. Revisa ubicación e industria.';
    case 'Industria no permitida':
      return `${cityName} no tiene casilla para ${industria(industry)}.`;
    case 'Sin fichas en tu mat':
      return `No te queda ${industria(industry)} en tu mat (no es solo dinero). Desarrolla o vende para liberar niveles superiores.`;
    case 'No en esta era':
      return `Ese nivel de ${industria(industry)} no se puede colocar en la era ${eraNombre(state.era)}.`;
    case 'Casillas ocupadas':
      return `Casillas llenas en ${cityName}. Solo puedes reconstruir (overbuild) si tienes nivel superior en el mat.`;
    case 'Solo 1 edificio por ciudad (era canal)':
      return `En era Canal solo 1 edificio tuyo por ciudad, aunque tengas £ y red. Reconstruye encima o elige otra ciudad.`;
    case 'Usa primero las casillas dedicadas':
      return 'Debes usar la casilla dedicada (icono grande) antes de la genérica.';
    case 'Carbón insuficiente': {
      const level = lowestBuildable(state, player, industry);
      const spec = level ? tileSpec(industry, level) : null;
      if (!spec) return short;
      const coal = planCoal(state, city, spec.costCoal, player);
      if (!coal.ok && !connectedToMarket(state, city)) {
        return `Falta carbón: ${cityName} no alcanza minas ni mercado. Construye/enlaza hacia una mina o comerciante.`;
      }
      if (!coal.ok) return `Falta carbón en red y el mercado no cubre el coste (necesitas ${spec.costCoal}).`;
      return `Falta carbón alcanzable (${spec.costCoal} cubos). Enlaza a una mina activa o al mercado.`;
    }
    case 'Hierro insuficiente': {
      const level = lowestBuildable(state, player, industry);
      const spec = level ? tileSpec(industry, level) : null;
      const need = spec?.costIron ?? 1;
      const iron = planIron(state, need, player);
      if (!iron.ok) return `Falta hierro (${need} cubos): no hay altos hornos con cubos ni mercado disponible.`;
      return `Falta hierro alcanzable (${need}). Espera producción en mapa o compra al mercado si está vacío el tablero.`;
    }
    case 'Dinero insuficiente': {
      const level = lowestBuildable(state, player, industry);
      if (!level) return short;
      const spec = tileSpec(industry, level);
      const coalPlan = spec.costCoal > 0 ? planCoal(state, city, spec.costCoal, player) : null;
      const ironPlan = spec.costIron > 0 ? planIron(state, spec.costIron, player) : null;
      const total = spec.cost + (coalPlan?.marketCost ?? 0) + (ironPlan?.marketCost ?? 0);
      return `Coste total ~£${total} (ficha + mercado) y tienes £${state.players[player].money}. Préstamo o venta pueden financiarlo.`;
    }
    default:
      return short;
  }
}
