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
import { connectedToMarket, hasNoNetwork, playerNetwork } from './connectivity';
import { eraNombre, industria } from './messages';

function industryCardMatches(card: Card, industry: IndustryType): boolean {
  if (card.kind === 'wildIndustry') return true;
  if (card.kind === 'industry') return card.industries.includes(industry);
  return false;
}

function cardMatchesCityIndustry(card: Card, city: CityId, industry: IndustryType): boolean {
  const isFarm = CITIES[city].isFarmBrewery;
  switch (card.kind) {
    case 'location':
      return !isFarm && card.city === city;
    case 'wildLocation':
      return !isFarm;
    case 'industry':
      return industryCardMatches(card, industry) && (!isFarm || industry === 'brewery');
    case 'wildIndustry':
      return !isFarm || industry === 'brewery';
  }
}

/** Industry/wild industry cards require the city to be in your network (except first build). */
function networkOkForIndustryCard(state: GameState, player: number, city: CityId): boolean {
  return hasNoNetwork(state, player) || playerNetwork(state, player).has(city);
}

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
    if (card.kind === 'wildLocation') return 'Carta no válida aquí';
    // Industry / wild industry: distinguish wrong industry vs out of network
    if (!industryCardMatches(card, industry)) return 'Carta de otra industria';
    if (!networkOkForIndustryCard(state, player, city)) return 'Fuera de tu red';
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
      return `La carta no permite ${industria(industry)} aquí. Usa una carta de ${industria(industry)} o un comodín de industria.`;
    case 'Fuera de tu red':
      return `${cityName} no está en tu red. Con carta de industria debes enlazar hasta aquí (acción Red) o usar una carta de ubicación de ${cityName}.`;
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
      return 'Debes usar la casilla dedicada (icono único) antes de la compartida.';
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

export interface BuildReqItem {
  id: string;
  ok: boolean;
  label: string;
}

/**
 * Checklist of what is needed to build an industry in a city/slot.
 * Works with or without a selected card (inspection mode).
 */
export function buildRequirementsChecklist(
  state: GameState,
  city: CityId,
  industry: IndustryType,
  slotIndex: number | null,
  card: Card | null,
): BuildReqItem[] {
  const player = activePlayer(state);
  const cityName = CITIES[city].name;
  const items: BuildReqItem[] = [];

  const slotOk =
    slotIndex === null
      ? CITIES[city].slots.some((s) => s.includes(industry))
      : (CITIES[city].slots[slotIndex]?.includes(industry) ?? false);
  items.push({
    id: 'slot',
    ok: slotOk,
    label: slotOk
      ? `Casilla admite ${industria(industry)}`
      : `${cityName} no tiene casilla de ${industria(industry)}`,
  });

  const level = lowestBuildable(state, player, industry);
  if (level === null) {
    items.push({
      id: 'mat',
      ok: false,
      label: `Sin ficha de ${industria(industry)} en tu mat`,
    });
  } else if (!tileAllowedInEra(industry, level, state.era)) {
    items.push({
      id: 'era',
      ok: false,
      label: `${industria(industry)} N${level} no se coloca en era ${eraNombre(state.era)}`,
    });
  } else {
    const spec = tileSpec(industry, level);
    items.push({
      id: 'mat',
      ok: true,
      label: `Ficha disponible: ${industria(industry)} N${level} (£${spec.cost}${
        spec.costCoal ? ` · ${spec.costCoal} carbón` : ''
      }${spec.costIron ? ` · ${spec.costIron} hierro` : ''})`,
    });
    if (!spec.canDevelop) {
      items.push({
        id: 'develop',
        ok: true,
        label: `Nota: ${industria(industry)} N${level} no se puede Desarrollar — hay que construirla`,
      });
    }
  }

  const inNetwork = networkOkForIndustryCard(state, player, city);
  if (hasNoNetwork(state, player)) {
    items.push({
      id: 'network',
      ok: true,
      label: 'Primera industria: no hace falta red todavía',
    });
  } else {
    items.push({
      id: 'network',
      ok: inNetwork,
      label: inNetwork
        ? `${cityName} está en tu red`
        : `${cityName} fuera de tu red — usa Red para enlazar, o una carta de ubicación de ${cityName}`,
    });
  }

  if (card) {
    const cardOk = cardMatchesCityIndustry(card, city, industry);
    let cardLabel: string;
    if (card.kind === 'location') {
      cardLabel = cardOk
        ? `Carta de ubicación: ${CITIES[card.city].name}`
        : `Tu carta es de ${CITIES[card.city].name}, no de ${cityName}`;
    } else if (card.kind === 'wildLocation') {
      cardLabel = cardOk ? 'Comodín de ubicación' : 'Comodín de ubicación no válido aquí';
    } else if (card.kind === 'industry') {
      cardLabel = cardOk
        ? `Carta de industria: ${card.industries.map(industria).join('/')}`
        : `Tu carta no incluye ${industria(industry)}`;
    } else {
      cardLabel = cardOk ? 'Comodín de industria' : 'Comodín de industria no válido aquí';
    }
    items.push({ id: 'card', ok: cardOk, label: cardLabel });

    if (
      (card.kind === 'industry' || card.kind === 'wildIndustry') &&
      industryCardMatches(card, industry) &&
      !inNetwork &&
      !hasNoNetwork(state, player)
    ) {
      items.push({
        id: 'card-network',
        ok: false,
        label: 'Con carta de industria necesitas red hasta esta ciudad',
      });
    }
  } else {
    items.push({
      id: 'card',
      ok: false,
      label: `Elige Construir + carta: ubicación (${cityName}), ${industria(industry)}, o comodín`,
    });
  }

  if (slotIndex !== null && slotOk && level !== null && tileAllowedInEra(industry, level, state.era)) {
    const eligible = eligibleSlots(state, city, industry);
    if (eligible.length > 0 && !eligible.includes(slotIndex)) {
      items.push({
        id: 'dedicated',
        ok: false,
        label: 'Usa primero la casilla dedicada (un solo icono) antes de la compartida',
      });
    } else if (eligible.includes(slotIndex) || eligible.length === 0) {
      items.push({
        id: 'dedicated',
        ok: true,
        label: 'Casilla elegible ahora',
      });
    }
  }

  if (state.era === 'canal' && level !== null) {
    const free = eligibleSlots(state, city, industry);
    const over = overbuildSlots(state, player, city, industry, level);
    const overIdx = free.length === 0 && over.length > 0 ? over[0] : null;
    const canalBlocked = state.board[city].some((t, i) => t?.owner === player && i !== overIdx);
    items.push({
      id: 'canal',
      ok: !canalBlocked,
      label: canalBlocked
        ? 'Era Canal: ya tienes un edificio en esta ciudad (solo 1)'
        : 'Era Canal: aún puedes construir aquí (máx. 1 tuyo)',
    });
  }

  if (level !== null && tileAllowedInEra(industry, level, state.era)) {
    const spec = tileSpec(industry, level);
    if (spec.costCoal > 0) {
      const coal = planCoal(state, city, spec.costCoal, player);
      items.push({
        id: 'coal',
        ok: !!coal?.ok,
        label: coal?.ok
          ? `Carbón OK (${spec.costCoal}${coal.marketCost ? ` · £${coal.marketCost} mercado` : ''})`
          : `Falta carbón (${spec.costCoal}): enlaza a mina o mercado`,
      });
    }
    if (spec.costIron > 0) {
      const iron = planIron(state, spec.costIron, player);
      items.push({
        id: 'iron',
        ok: !!iron?.ok,
        label: iron?.ok
          ? `Hierro OK (${spec.costIron}${iron.marketCost ? ` · £${iron.marketCost} mercado` : ''})`
          : `Falta hierro (${spec.costIron}): alto horno o mercado`,
      });
    }
    if (isPayingPlayer(state, player)) {
      const coalPlan = spec.costCoal > 0 ? planCoal(state, city, spec.costCoal, player) : null;
      const ironPlan = spec.costIron > 0 ? planIron(state, spec.costIron, player) : null;
      const total = spec.cost + (coalPlan?.marketCost ?? 0) + (ironPlan?.marketCost ?? 0);
      const moneyOk = total <= state.players[player].money;
      items.push({
        id: 'money',
        ok: moneyOk,
        label: moneyOk
          ? `Dinero OK (£${total} / tienes £${state.players[player].money})`
          : `Falta dinero: cuesta ~£${total}, tienes £${state.players[player].money}`,
      });
    }
  }

  return items;
}

/** First failing requirement, or null if all ok (ignoring “elige carta” when no card). */
export function primaryBuildGap(
  state: GameState,
  city: CityId,
  industry: IndustryType,
  slotIndex: number | null,
  card: Card | null,
): string | null {
  if (card) {
    const detailed = buildBlockReason(state, card, city, industry);
    if (detailed) return buildBlockReasonDetailed(state, card, city, industry);
    if (slotIndex !== null && !eligibleSlots(state, city, industry).includes(slotIndex)) {
      return 'Debes usar la casilla dedicada (icono único) antes de la compartida.';
    }
    return null;
  }
  const items = buildRequirementsChecklist(state, city, industry, slotIndex, null);
  const fail = items.find((i) => !i.ok && i.id !== 'card');
  if (fail) return fail.label;
  return items.find((i) => !i.ok)?.label ?? null;
}
