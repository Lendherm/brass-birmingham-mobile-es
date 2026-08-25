import type { CityId } from './types';
import { CITIES } from './data/board';
import { tileSpec } from './data/industries';
import {
  buildWhy,
  developWhy,
  networkWhy,
  sellWhyFromState,
  type ActionKind,
} from './actionExplain';
import { describeAction } from './ai/coach';
import { rankCandidatesForCoach } from './coachRank';
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
  reason: string;
  actionKind: ActionKind;
  recommended?: boolean;
}

const ACTION_LABEL: Record<ActionKind, string> = {
  build: 'Construir',
  network: 'Red',
  sell: 'Vender',
  develop: 'Desarrollar',
  loan: 'Préstamo',
  scout: 'Explorar',
  pass: 'Pasar',
};

function buildSuggestion(b: BuildChoice, labels: { city: string; industry: string }): PlaySuggestion {
  const { option } = b;
  const spec = tileSpec(option.industry, option.level);
  const sellable = spec.vp > 0;
  return {
    id: `build-${option.city}-${option.industry}-${option.level}`,
    priority: spec.linkVP * 2 + spec.incomeBump + (sellable ? 6 : 0) + (spec.producesBeer ? 2 : 0),
    action: 'Construir',
    actionKind: 'build',
    detail: `${labels.city}: ${labels.industry} N${option.level} — £${option.totalCost}`,
    reason: sellable
      ? `${buildWhy(b)} Industria volteable: prepara ventas con cerveza.`
      : buildWhy(b),
  };
}

function priorityFromRank(score: number, best: number, worst: number): number {
  const range = Math.max(8, best - worst);
  return Math.round(40 + ((score - worst) / range) * 55);
}

/** Rule-based hints aligned with rankCandidates (no external AI). */
export function computePlaySuggestions(
  state: GameState,
  labelFn: (city: CityId, industry: BuildChoice['option']['industry']) => { city: string; industry: string },
  refreshSeed = 0,
): PlaySuggestion[] {
  if (state.gameOver) return [];
  const player = activePlayer(state);
  const money = state.players[player].money;
  const out: PlaySuggestion[] = [];

  const ranked = rankCandidatesForCoach(state)
    .filter((c) => c.action.type !== 'pass')
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const bestScore = best?.score ?? 0;
  const worstScore = ranked[ranked.length - 1]?.score ?? bestScore - 12;
  const bestType = best?.action.type as ActionKind | undefined;

  const seenTypes = new Set<string>();
  for (const candidate of ranked) {
    const kind = candidate.action.type as ActionKind;
    if (kind === 'pass' || seenTypes.has(kind)) continue;
    seenTypes.add(kind);
    const priority = priorityFromRank(candidate.score, bestScore, worstScore);
    const label = ACTION_LABEL[kind];
    let detail = describeAction(state, candidate.action);
    let reason = '';

    switch (kind) {
      case 'build': {
        const action = candidate.action;
        if (action.type !== 'build') break;
        const b = legalBuilds(state).find(
          (x) =>
            x.option.city === action.option.city &&
            x.option.industry === action.option.industry &&
            x.option.level === action.option.level,
        );
        if (b) {
          const labels = labelFn(b.option.city, b.option.industry);
          const s = buildSuggestion(b, labels);
          detail = s.detail;
          reason = s.reason;
          if (b.option.totalCost > money) {
            detail += ' (necesitas más dinero o recursos)';
            reason = 'Buena jugada estratégica, pero te faltan recursos o dinero.';
          }
        }
        break;
      }
      case 'network': {
        if (candidate.action.type !== 'network') break;
        const n = legalNetworks(state).find((x) => x.cardIdx === candidate.action.cardIdx);
        if (n) reason = networkWhy(n);
        break;
      }
      case 'sell': {
        if (candidate.action.type !== 'sell') break;
        const sale = candidate.action.sales[0]?.sale;
        if (sale) {
          const s = legalSells(state).find(
            (x) => x.sale.city === sale.city && x.sale.slot === sale.slot,
          );
          if (s) reason = sellWhyFromState(state, s);
        }
        break;
      }
      case 'develop': {
        if (candidate.action.type !== 'develop') break;
        const ind = candidate.action.industries[0];
        if (ind) {
          const labels = labelFn('birmingham', ind);
          reason = developWhy(state, ind, labels.industry);
          detail = labels.industry;
        }
        break;
      }
      case 'scout':
        reason =
          'Mejora la mano si no tienes cartas útiles. Descarta 3 cartas débiles y roba 3 nuevas — busca manufacturas, cerámica o la ciudad que necesitas.';
        detail = 'Descarta 3 cartas y roba 3 nuevas del mazo.';
        break;
      case 'loan':
        reason = 'Te falta efectivo; el préstamo baja ingresos 3 espacios.';
        detail = `Tienes £${money}. Un préstamo da +£30.`;
        break;
      default:
        break;
    }

    out.push({
      id: `rank-${kind}`,
      priority,
      action: label,
      actionKind: kind,
      detail,
      reason: reason || `Opción sólida según el evaluador (${Math.round(priority)}%).`,
      recommended: kind === bestType,
    });
    if (out.length >= 5) break;
  }

  if (canLoan(state) && money < 20 && !seenTypes.has('loan')) {
    out.push({
      id: 'loan-fallback',
      priority: 35,
      action: 'Préstamo',
      actionKind: 'loan',
      detail: `Tienes £${money}. Un préstamo da +£30.`,
      reason: 'Considera préstamo si ninguna construcción/enlace es asequible.',
    });
  }

  const develops = legalDevelops(state);
  if (develops.length > 2 && !seenTypes.has('develop')) {
    const ind = develops[0].industries[0];
    const labels = labelFn('birmingham', ind);
    out.push({
      id: 'develop-extra',
      priority: 28,
      action: 'Desarrollar',
      actionKind: 'develop',
      detail: `+${develops.length - 1} industrias más en mat`,
      reason: developWhy(state, ind, labels.industry),
    });
  }

  if (scoutAllowed(state) && !seenTypes.has('scout')) {
    out.push({
      id: 'scout-fallback',
      priority: 18,
      action: 'Explorar',
      actionKind: 'scout',
      detail: 'Descarta 3 cartas y roba 3 nuevas del mazo.',
      reason: 'Si tu mano no encaja con manufacturas, cerámica o fundiciones, explora.',
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
