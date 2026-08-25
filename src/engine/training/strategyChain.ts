import { describeAction } from '../ai/coach';
import { rankCandidatesForCoach } from '../coachRank';
import { buildWhy } from '../actionExplain';
import { connectedToMarket } from '../connectivity';
import { CITIES, LINKS } from '../data/board';
import { tileSpec } from '../data/industries';
import {
  legalBuilds,
  legalDevelops,
  legalNetworks,
  legalSells,
  scoutAllowed,
  type BuildChoice,
} from '../options';
import { activePlayer, type GameState } from '../state';
import { industria, linkLabel } from '../../i18n/es';
import type { IndustryType } from '../types';
import type { TrainingPlanStep } from './trainingPlan';

const SELLABLE: IndustryType[] = ['cotton', 'goods', 'pottery'];
const SUPPLY: IndustryType[] = ['coal', 'iron', 'brewery'];

function handIndustryGoals(state: GameState): IndustryType[] {
  const player = activePlayer(state);
  const goals = new Set<IndustryType>();
  for (const card of state.players[player].hand) {
    if (card.kind === 'industry') {
      for (const ind of card.industries) goals.add(ind);
    }
    if (card.kind === 'wildIndustry') {
      for (const ind of SELLABLE) goals.add(ind);
    }
  }
  const counts = countByIndustry(state, player);
  if (counts.goods.total === 0) goals.add('goods');
  if (counts.pottery.total === 0 && state.era === 'rail') goals.add('pottery');
  return [...goals];
}

function countByIndustry(state: GameState, player: number): Record<IndustryType, { total: number }> {
  const keys: IndustryType[] = ['cotton', 'goods', 'pottery', 'coal', 'iron', 'brewery'];
  const out = Object.fromEntries(keys.map((k) => [k, { total: 0 }])) as Record<IndustryType, { total: number }>;
  for (const slots of Object.values(state.board)) {
    for (const tile of slots) {
      if (tile?.owner === player) out[tile.industry].total++;
    }
  }
  return out;
}

function bestBuildForIndustry(state: GameState, industry: IndustryType): BuildChoice | null {
  const builds = legalBuilds(state).filter((b) => b.option.industry === industry);
  if (builds.length === 0) return null;
  return builds.sort((a, b) => {
    const sa = tileSpec(a.option.industry, a.option.level);
    const sb = tileSpec(b.option.industry, b.option.level);
    return sb.linkVP + sb.incomeBump + sb.vp * 2 - (sa.linkVP + sa.incomeBump + sa.vp * 2);
  })[0]!;
}

function bestNetworkToward(state: GameState, city: BuildChoice['option']['city']): string | null {
  const nets = legalNetworks(state);
  for (const n of nets) {
    const link = LINKS.find((l) => l.id === n.option.linkIds[0]);
    if (link?.endpoints.includes(city)) {
      return linkLabel(n.option.linkIds[0]);
    }
  }
  return nets[0] ? linkLabel(nets[0].option.linkIds[0]) : null;
}

function needsExploreForGoals(state: GameState, goals: IndustryType[]): boolean {
  if (!scoutAllowed(state)) return false;
  const player = activePlayer(state);
  const hand = state.players[player].hand;
  const ranked = rankCandidatesForCoach(state);
  const scoutScore = ranked.find((c) => c.action.type === 'scout')?.score ?? -999;
  const buildScore = ranked.find((c) => c.action.type === 'build')?.score ?? -999;

  let deadCards = 0;
  hand.forEach((card, cardIdx) => {
    if (card.kind === 'industry') {
      const canUse = legalBuilds(state).some((b) => b.cardIdx === cardIdx);
      if (!canUse) deadCards++;
    }
    if (card.kind === 'location') {
      const canUse =
        legalBuilds(state).some((b) => b.cardIdx === cardIdx) ||
        legalNetworks(state).some((n) => n.cardIdx === cardIdx);
      if (!canUse) deadCards++;
    }
  });

  const missingGoalBuild = goals.some((g) => !legalBuilds(state).some((b) => b.option.industry === g));
  return (deadCards >= 2 || missingGoalBuild) && scoutScore >= buildScore - 12;
}

/** Plan narrativo: explorar → red → construir industria → vender (2–4 pasos). */
export function buildStrategyChain(state: GameState): TrainingPlanStep[] {
  const player = activePlayer(state);
  const goals = handIndustryGoals(state);
  const primaryGoal =
    goals.find((g) => SELLABLE.includes(g)) ??
    goals.find((g) => !SUPPLY.includes(g)) ??
    goals[0] ??
    'goods';

  const steps: TrainingPlanStep[] = [];
  const ranked = rankCandidatesForCoach(state)
    .filter((c) => c.action.type !== 'pass')
    .sort((a, b) => b.score - a.score);
  const bestNow = ranked[0];

  const targetBuild = bestBuildForIndustry(state, primaryGoal);
  const sells = legalSells(state);

  if (needsExploreForGoals(state, goals)) {
    steps.push({
      phase: 'now',
      label: 'Explorar — robar cartas de industria o ubicación',
      pct: 72,
      reason: `Tu mano no encaja bien con ${industria(primaryGoal)}. Descarta 3 cartas débiles y busca carta de ${industria(primaryGoal)} o una ciudad conectada.`,
    });
  } else if (bestNow?.action.type === 'scout') {
    steps.push({
      phase: 'now',
      label: 'Explorar — mejorar mano',
      pct: 68,
      reason: describeAction(state, bestNow.action),
    });
  }

  if (targetBuild && !connectedToMarket(state, targetBuild.option.city)) {
    const linkName = bestNetworkToward(state, targetBuild.option.city);
    if (linkName && legalNetworks(state).length > 0) {
      steps.push({
        phase: steps.length === 0 ? 'now' : 'next',
        label: `Red: ${linkName} hacia ${CITIES[targetBuild.option.city].name}`,
        pct: 75,
        reason: `Sin enlace no puedes construir ${industria(primaryGoal)} en ${CITIES[targetBuild.option.city].name}. Conecta al mercado o a tu red.`,
      });
    }
  }

  if (legalDevelops(state).length > 0 && state.era === 'canal') {
    const dev = ranked.find((c) => c.action.type === 'develop');
    if (dev && dev.score >= (ranked.find((c) => c.action.type === 'build')?.score ?? 0) - 8) {
      steps.push({
        phase: steps.length === 0 ? 'now' : 'next',
        label: describeAction(state, dev.action),
        pct: 70,
        reason: `Desarrollar libera mat para ${industria(primaryGoal)} de nivel alto antes de que termine la era Canal.`,
      });
    }
  }

  if (targetBuild) {
    const spec = tileSpec(targetBuild.option.industry, targetBuild.option.level);
    steps.push({
      phase: steps.length === 0 ? 'now' : steps.length === 1 ? 'next' : 'later',
      label: `Construir ${industria(primaryGoal)} N${targetBuild.option.level} en ${CITIES[targetBuild.option.city].name}`,
      pct: 78,
      reason: buildWhy(targetBuild) + (spec.vp > 0 ? ' Prepara venta con cerveza conectada.' : ''),
    });
  } else if (bestNow?.action.type === 'build') {
    steps.push({
      phase: steps.length === 0 ? 'now' : 'next',
      label: describeAction(state, bestNow.action),
      pct: 74,
      reason: `Objetivo: entrar en ${industria(primaryGoal)} cuando tengas carta y red.`,
    });
  }

  if (sells.length > 0 && SUPPLY.every((s) => countByIndustry(state, player)[s].total >= 1)) {
    const topSell = sells[0]!;
    const tile = state.board[topSell.sale.city][topSell.sale.slot]!;
    steps.push({
      phase: 'later',
      label: `Vender ${industria(tile.industry)} en ${CITIES[topSell.sale.city].name}`,
      pct: 80,
      reason: 'Tras tener red y cerveza, voltear sube ingresos y PV — no te quedes solo en minas.',
    });
  }

  if (steps.length === 0 && bestNow) {
    steps.push({
      phase: 'now',
      label: describeAction(state, bestNow.action),
      pct: 70,
      reason: 'Mejor línea táctica este turno según tablero y mano.',
    });
  }

  const phases: TrainingPlanStep['phase'][] = ['now', 'next', 'later', 'later'];
  return steps.slice(0, 4).map((s, i) => ({ ...s, phase: phases[i] ?? 'later' }));
}
