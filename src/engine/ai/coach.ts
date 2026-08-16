import { CITIES, LINKS } from '../data/board';
import { tileSpec } from '../data/industries';
import { connectedToMarket } from '../connectivity';
import type { PlayerAction } from '../game';
import { eraNombre, industria } from '../messages';
import { activePlayer, cityName, HUMAN, type GameState } from '../state';
import type { PlayerId } from '../types';
import { actionsMatch, actionKey } from './actionKey';
import { rankCandidates, topCandidates } from './evaluate';
import { beliefHintForHuman } from './beliefs';
import { planAIAction } from './planner';
import type { ScoredAction } from './types';

export type CoachVerdict = 'excellent' | 'good' | 'ok' | 'mistake';

export interface CoachFeedback {
  /** Turn when feedback was generated */
  turn: number;
  actionsLeftBefore: number;
  yourAction: PlayerAction;
  bestAction: PlayerAction;
  yourLabel: string;
  bestLabel: string;
  yourScore: number;
  bestScore: number;
  delta: number;
  verdict: CoachVerdict;
  summary: string;
  yourReasons: string[];
  bestReasons: string[];
  alternatives: { label: string; score: number }[];
  beliefHint?: string | null;
  /** 0–100 how clearly the coach prefers the best line over alternatives. */
  confidence: number;
}

function actionTypeLabel(type: PlayerAction['type']): string {
  const map: Record<PlayerAction['type'], string> = {
    build: 'Construir',
    network: 'Red',
    sell: 'Vender',
    develop: 'Desarrollar',
    loan: 'Préstamo',
    scout: 'Explorar',
    pass: 'Pasar',
  };
  return map[type];
}

export function describeAction(state: GameState, action: PlayerAction): string {
  switch (action.type) {
    case 'build': {
      const { city, industry, level, totalCost } = action.option;
      return `${actionTypeLabel(action.type)}: ${industria(industry)} N${level} en ${CITIES[city].name} (£${totalCost})`;
    }
    case 'network': {
      const id = action.option.linkIds[0];
      const link = LINKS.find((l) => l.id === id);
      const ends = link ? link.endpoints.map((e) => cityName(e)).join(' ↔ ') : id;
      return `${actionTypeLabel(action.type)}: ${ends} (£${action.option.totalCost})`;
    }
    case 'sell': {
      const sale = action.sales[0]?.sale;
      if (!sale) return actionTypeLabel(action.type);
      const tile = state.board[sale.city][sale.slot];
      const name = tile ? `${industria(tile.industry)} N${tile.level}` : 'edificio';
      const bonus = sale.merchantIdx != null ? ' · comerciante' : '';
      return `${actionTypeLabel(action.type)}: ${name} en ${CITIES[sale.city].name}${bonus}`;
    }
    case 'develop':
      return `${actionTypeLabel(action.type)}: ${action.industries.map((i) => industria(i)).join(', ')}`;
    case 'loan':
      return `${actionTypeLabel(action.type)} (+£30, baja ingresos)`;
    case 'scout':
      return `${actionTypeLabel(action.type)} (descartar 3, robar 2)`;
    case 'pass':
      return `${actionTypeLabel(action.type)}`;
  }
}

function reasonsForAction(state: GameState, scored: ScoredAction, player: PlayerId): string[] {
  const reasons: string[] = [];
  const action = scored.action;

  if (action.type === 'build') {
    const { option } = action;
    const spec = tileSpec(option.industry, option.level);
    if (spec.vp > 0) reasons.push(`${spec.vp} PV al voltear la ficha.`);
    if (spec.producesCoal) reasons.push('Producción de carbón para futuras construcciones.');
    if (spec.producesBeer) reasons.push('Cerveza para ventas propias o rivales.');
    if (spec.producesIron) reasons.push('Hierro disponible sin necesidad de enlace.');
    if (state.era === 'canal' && spec.eras.length === 1) {
      reasons.push(`Solo válida en era ${eraNombre('canal')}: prioridad antes del cambio.`);
    }
    if (option.overbuild) reasons.push('Overbuild para subir nivel o bloquear casilla.');
    if (connectedToMarket(state, option.city) && (spec.producesCoal || spec.producesIron)) {
      reasons.push('Conectada al mercado: ingresos por recursos al mercado.');
    }
    if (option.coalPlan && option.coalPlan.fromMarket === 0 && option.coalPlan.takes.length > 0) {
      reasons.push('Usa carbón de mina en red (más barato que mercado).');
    }
  }

  if (action.type === 'sell') {
    const sale = action.sales[0]?.sale;
    if (sale) {
      const tile = state.board[sale.city][sale.slot]!;
      const spec = tileSpec(tile.industry, tile.level);
      reasons.push(`${spec.vp} PV e ingresos al voltear.`);
      if (sale.merchantIdx != null) reasons.push('Bonificación extra por cerveza del comerciante.');
    }
  }

  if (action.type === 'network') {
    const link = LINKS.find((l) => l.id === action.option.linkIds[0]);
    if (link) reasons.push('Mejora red para construir, vender y puntuar enlaces al fin de era.');
    if (state.era === 'canal') reasons.push('En era Canal los enlaces no puntuados desaparecen: colócalos a tiempo.');
  }

  if (action.type === 'develop') {
    reasons.push('Retira fichas bajas del mat para acceder a niveles más rentables.');
  }

  if (action.type === 'loan') {
    reasons.push('Liquidez para no perder el tempo de una jugada fuerte.');
  }

  if (action.type === 'scout') {
    reasons.push('Mejora la mano cuando pocas cartas sirven para el plan.');
  }

  if (action.type === 'pass') {
    if (player === HUMAN) reasons.push('Conservas cartas, pero cedes tempo y presión en el tablero.');
    else reasons.push('Sin jugada rentable en este momento.');
  }

  if (reasons.length === 0) reasons.push('Jugada legal con valor táctico moderado.');
  return reasons.slice(0, 4);
}

function verdictFor(delta: number, your: ScoredAction | undefined, best: ScoredAction): CoachVerdict {
  if (your && actionsMatch(your.action, best.action)) return 'excellent';
  if (delta <= 2) return 'excellent';
  if (delta <= 6) return 'good';
  if (delta <= 12) return 'ok';
  if (your?.action.type === 'pass' && best.action.type !== 'pass' && best.score > 5) return 'mistake';
  return 'mistake';
}

function summaryFor(verdict: CoachVerdict, delta: number, best: ScoredAction): string {
  switch (verdict) {
    case 'excellent':
      return 'Excelente: coincidiste con la mejor línea del entrenador.';
    case 'good':
      return 'Buena jugada: muy cerca de lo óptimo para este turno.';
    case 'ok':
      return `Aceptable, pero la IA ve ~${Math.round(delta)} puntos más de valor en otra línea.`;
    case 'mistake':
      if (best.action.type === 'sell') return 'Oportunidad: una venta fuerte habría sido preferible.';
      if (best.action.type === 'build') return 'Considera construir: el tablero premia industria ahora.';
      if (best.action.type === 'network') return 'Un enlace habría desbloqueado más opciones esta era.';
      return 'Revisa el plan: había jugadas con mejor balance PV / tempo / recursos.';
  }
}

function computeCoachConfidence(ranked: ScoredAction[], best: ScoredAction): number {
  const sorted = [...ranked].sort((a, b) => b.score - a.score);
  const second = sorted.find((c) => !actionsMatch(c.action, best.action));
  const gap = Math.max(0, best.score - (second?.score ?? best.score - 10));
  const gapScore = Math.min(45, gap * 4);
  const valueScore = best.score >= 18 ? 18 : best.score >= 10 ? 12 : best.score >= 5 ? 6 : 0;
  return Math.min(100, Math.max(30, Math.round(32 + gapScore + valueScore)));
}

/** Compare human move (before applying) with coach / AI best line. */
export function compareCoachMove(state: GameState, humanAction: PlayerAction): CoachFeedback {
  const player = activePlayer(state);
  const ranked = rankCandidates(state);
  const bestScored =
    ranked.filter((c) => c.action.type !== 'pass').sort((a, b) => b.score - a.score)[0] ??
    ranked.sort((a, b) => b.score - a.score)[0];

  const planned = planAIAction(state, state.aiDifficulty ?? 'medium');
  const plannedScored = ranked.find((c) => actionsMatch(c.action, planned));
  const best = plannedScored && plannedScored.score >= bestScored.score - 1 ? plannedScored : bestScored;

  const key = actionKey(humanAction);
  const yours = ranked.find((c) => actionKey(c.action) === key);
  const yourScore = yours?.score ?? -20;
  const bestScore = best.score;
  const delta = Math.max(0, bestScore - yourScore);
  const verdict = verdictFor(delta, yours, best);

  const alts = topCandidates(
    ranked.filter((c) => !yours || actionKey(c.action) !== key),
    3,
  ).map((c) => ({ label: describeAction(state, c.action), score: c.score }));

  return {
    turn: state.turn,
    actionsLeftBefore: state.actionsLeft,
    yourAction: humanAction,
    bestAction: best.action,
    yourLabel: describeAction(state, humanAction),
    bestLabel: describeAction(state, best.action),
    yourScore: yourScore,
    bestScore: bestScore,
    delta,
    verdict,
    summary: summaryFor(verdict, delta, best),
    yourReasons: yours ? reasonsForAction(state, yours, player) : ['Jugada fuera del top evaluado.'],
    bestReasons: reasonsForAction(state, best, player),
    alternatives: alts,
    beliefHint: beliefHintForHuman(state),
    confidence: computeCoachConfidence(ranked, best),
  };
}

export function shouldCoachHuman(state: GameState): boolean {
  return state.mode === 'vsAI' && state.currentPlayer === HUMAN && !state.gameOver;
}
