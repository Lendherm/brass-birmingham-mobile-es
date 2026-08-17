import type { CityId, MerchantId } from './types';
import { CITIES, LINKS, MERCHANTS } from './data/board';
import { tileSpec } from './data/industries';
import {
  buildWhy,
  developWhy,
  networkWhy,
  sellWhyFromState,
  type ActionKind,
} from './actionExplain';
import {
  canLoan,
  legalBuilds,
  legalDevelops,
  legalNetworks,
  legalSells,
  scoutAllowed,
  type BuildChoice,
} from './options';
import { activePlayer, type GameState } from './state';

function locationLabel(id: string): string {
  if (id in CITIES) return CITIES[id as CityId].name;
  if (id in MERCHANTS) return MERCHANTS[id as MerchantId].name;
  return id;
}

export interface PlaySuggestion {
  id: string;
  priority: number;
  action: string;
  detail: string;
  reason: string;
  actionKind: ActionKind;
}

function buildSuggestion(b: BuildChoice, labels: { city: string; industry: string }): PlaySuggestion {
  const { option } = b;
  const spec = tileSpec(option.industry, option.level);
  return {
    id: `build-${option.city}-${option.industry}-${option.level}`,
    priority: spec.linkVP * 2 + spec.incomeBump + (spec.vp > 0 ? 1 : 0),
    action: 'Construir',
    actionKind: 'build',
    detail: `${labels.city}: ${labels.industry} N${option.level} — £${option.totalCost}`,
    reason: buildWhy(b),
  };
}

/** Rule-based hints from legal moves (no external AI). */
export function computePlaySuggestions(
  state: GameState,
  labelFn: (city: CityId, industry: BuildChoice['option']['industry']) => { city: string; industry: string },
  refreshSeed = 0,
): PlaySuggestion[] {
  if (state.gameOver) return [];
  const player = activePlayer(state);
  const money = state.players[player].money;
  const out: PlaySuggestion[] = [];

  if (canLoan(state) && money < 20) {
    out.push({
      id: 'loan',
      priority: 50,
      action: 'Préstamo',
      actionKind: 'loan',
      detail: `Tienes £${money}. Un préstamo da +£30.`,
      reason: 'Te falta efectivo para construir o enlazar; el préstamo baja ingresos 3 espacios.',
    });
  }

  const builds = legalBuilds(state);
  const affordable = builds.filter((b) => b.option.totalCost <= money);
  const buildPool = affordable.length > 0 ? affordable : builds;
  const topBuilds = [...buildPool]
    .sort((a, b) => {
      const pa = buildSuggestion(a, labelFn(a.option.city, a.option.industry)).priority;
      const pb = buildSuggestion(b, labelFn(b.option.city, b.option.industry)).priority;
      return pb - pa;
    })
    .slice(0, 3);
  for (const b of topBuilds) {
    const labels = labelFn(b.option.city, b.option.industry);
    const s = buildSuggestion(b, labels);
    if (!affordable.includes(b)) {
      s.detail += ' (necesitas más dinero o recursos)';
      s.reason = 'Buena jugada, pero te faltan recursos o dinero.';
      s.priority -= 20;
    }
    out.push(s);
  }

  const networks = legalNetworks(state);
  for (const n of networks.slice(0, 2)) {
    const cost = n.option.totalCost;
    const link = LINKS.find((l) => l.id === n.option.linkIds[0]);
    const linkName = link ? link.endpoints.map(locationLabel).join('–') : 'Enlace';
    out.push({
      id: `net-${n.option.linkIds[0]}`,
      priority: 30 - (cost > money ? 15 : 0),
      action: 'Red',
      actionKind: 'network',
      detail: `${linkName} — £${cost}${cost > money ? ' (falta dinero)' : ''}`,
      reason: networkWhy(n),
    });
  }

  const sells = legalSells(state);
  for (const s of sells.slice(0, 2)) {
    const tile = state.board[s.sale.city][s.sale.slot]!;
    const labels = labelFn(s.sale.city, tile.industry);
    out.push({
      id: `sell-${s.sale.city}-${s.sale.slot}`,
      priority: 25,
      action: 'Vender',
      actionKind: 'sell',
      detail: `${labels.city}: ${labels.industry} N${tile.level}`,
      reason: sellWhyFromState(state, s),
    });
  }
  if (sells.length > 2) {
    out.push({
      id: 'sell-more',
      priority: 22,
      action: 'Vender',
      actionKind: 'sell',
      detail: `+${sells.length - 2} venta${sells.length - 2 === 1 ? '' : 's'} más posible${sells.length - 2 === 1 ? '' : 's'}.`,
      reason: 'Varias industrias conectadas a comerciantes pueden voltearse esta ronda.',
    });
  }

  const develops = legalDevelops(state);
  for (const d of develops.slice(0, 2)) {
    const ind = d.industries[0];
    const labels = labelFn('birmingham', ind);
    out.push({
      id: `develop-${ind}`,
      priority: 20,
      action: 'Desarrollar',
      actionKind: 'develop',
      detail: labels.industry,
      reason: developWhy(state, ind, labels.industry),
    });
  }

  if (scoutAllowed(state)) {
    out.push({
      id: 'scout',
      priority: 10,
      action: 'Explorar',
      actionKind: 'scout',
      detail: 'Descarta 3 cartas y roba 3 nuevas del mazo.',
      reason: 'Mejora la mano si no tienes cartas útiles para construir o enlazar.',
    });
  }

  if (out.length === 0) {
    out.push({
      id: 'pass',
      priority: 0,
      action: 'Pasar',
      actionKind: 'pass',
      detail: 'No hay jugadas obvias; considera pasar.',
      reason: 'Descarta una carta y conserva recursos para el siguiente turno.',
    });
  }

  const sorted = out.sort((a, b) => b.priority - a.priority);
  if (refreshSeed > 0 && sorted.length > 1) {
    const offset = refreshSeed % sorted.length;
    return [...sorted.slice(offset), ...sorted.slice(0, offset)].slice(0, 6);
  }
  return sorted.slice(0, 6);
}

export function cityInspectLines(state: GameState, cityId: CityId, industryLabel: (i: string) => string): string[] {
  const city = CITIES[cityId];
  const slots = state.board[cityId];
  return city.slots.map((allowed, i) => {
    const tile = slots[i];
    if (tile) {
      return `Casilla ${i + 1}: ${industryLabel(tile.industry)} N${tile.level}${tile.flipped ? ' (puntuada)' : ''}`;
    }
    return `Casilla ${i + 1}: vacía — ${allowed.map((a) => industryLabel(a)).join(', ')}`;
  });
}
