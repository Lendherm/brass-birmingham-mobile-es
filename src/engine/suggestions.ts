import type { CityId } from './types';
import { CITIES } from './data/board';
import { tileSpec } from './data/industries';
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

export interface PlaySuggestion {
  id: string;
  priority: number;
  action: string;
  detail: string;
}

function buildSuggestion(b: BuildChoice, labels: { city: string; industry: string }): PlaySuggestion {
  const { option } = b;
  const spec = tileSpec(option.industry, option.level);
  return {
    id: `build-${option.city}-${option.industry}-${option.level}`,
    priority: spec.linkVP * 2 + spec.incomeBump + (spec.vp > 0 ? 1 : 0),
    action: 'Construir',
    detail: `${labels.city}: ${labels.industry} N${option.level} — £${option.totalCost}`,
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
      detail: `Tienes £${money}. Un préstamo da +£30 (baja ingresos 3 espacios).`,
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
      s.priority -= 20;
    }
    out.push(s);
  }

  const networks = legalNetworks(state);
  for (const n of networks.slice(0, 2)) {
    const cost = n.option.totalCost;
    out.push({
      id: `net-${n.option.linkIds[0]}`,
      priority: 30 - (cost > money ? 15 : 0),
      action: 'Red',
      detail: `Enlace — £${cost}${cost > money ? ' (falta dinero)' : ''}`,
    });
  }

  const sells = legalSells(state);
  if (sells.length > 0) {
    out.push({
      id: 'sell',
      priority: 25,
      action: 'Vender',
      detail: `${sells.length} venta${sells.length === 1 ? '' : 's'} posible${sells.length === 1 ? '' : 's'} esta ronda.`,
    });
  }

  const develops = legalDevelops(state);
  if (develops.length > 0) {
    out.push({
      id: 'develop',
      priority: 20,
      action: 'Desarrollar',
      detail: `Puedes desarrollar ${develops.length} tipo${develops.length === 1 ? '' : 's'} de industria.`,
    });
  }

  if (scoutAllowed(state)) {
    out.push({
      id: 'scout',
      priority: 10,
      action: 'Explorar',
      detail: 'Descarta 3 cartas y roba 3 nuevas del mazo.',
    });
  }

  if (out.length === 0) {
    out.push({
      id: 'pass',
      priority: 0,
      action: 'Pasar',
      detail: 'No hay jugadas obvias; considera pasar.',
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
