import { applyPlayerAction, type PlayerAction } from '../game';
import { cloneRng } from '../rng';
import { type GameState, type PlayerId } from '../state';
import { actionKey } from './actionKey';
import { sampleBeliefState } from './cardBeliefs';
import { rankCandidates } from './evaluate';
import { primaryOpponent } from './beliefs';
import { evaluatePosition } from './positionEval';
import { topActionsForSearch } from './search';

export interface MCTSOptions {
  /** Wall-clock budget; ignored when maxIterations is set explicitly in tests. */
  timeBudgetMs?: number;
  maxIterations?: number;
  topN?: number;
}

interface Arm {
  key: string;
  action: PlayerAction;
  visits: number;
  totalScore: number;
}

function finishTurnGreedy(sim: GameState): void {
  let safety = 0;
  while (sim.actionsLeft > 0 && !sim.gameOver && safety < 4) {
    safety += 1;
    const candidates = rankCandidates(sim);
    if (candidates.length === 0) break;
    applyPlayerAction(sim, [...candidates].sort((a, b) => b.score - a.score)[0].action);
  }
}

function simulateRivalTurn(sim: GameState, opponent: PlayerId): void {
  sim.plannerSim = true;
  let safety = 0;
  while (sim.currentPlayer === opponent && sim.actionsLeft > 0 && !sim.gameOver && safety < 4) {
    safety += 1;
    const candidates = rankCandidates(sim);
    if (candidates.length === 0) break;
    applyPlayerAction(sim, [...candidates].sort((a, b) => b.score - a.score)[0].action);
  }
}

function rolloutAfterAction(sim: GameState, player: PlayerId): number {
  finishTurnGreedy(sim);
  if (sim.gameOver) return evaluatePosition(sim, player);
  const rival = primaryOpponent(sim, player);
  if (sim.currentPlayer === rival && sim.actionsLeft > 0) {
    simulateRivalTurn(sim, rival);
  }
  return evaluatePosition(sim, player);
}

function selectArm(arms: Arm[], iterations: number): Arm {
  let best: Arm | null = null;
  let bestUcb = -Infinity;
  for (const arm of arms) {
    if (arm.visits === 0) return arm;
    const avg = arm.totalScore / arm.visits;
    const ucb = avg + Math.sqrt((2 * Math.log(Math.max(1, iterations))) / arm.visits);
    if (ucb > bestUcb) {
      bestUcb = ucb;
      best = arm;
    }
  }
  return best ?? arms[0];
}

/** MCTS with belief sampling and optional time budget (Torneo / Difícil+). */
export function mctsPickAction(state: GameState, player: PlayerId, options: MCTSOptions = {}): PlayerAction {
  const topN = options.topN ?? 5;
  const deadline =
    options.timeBudgetMs != null && options.maxIterations == null ? Date.now() + options.timeBudgetMs : null;
  const maxIter = options.maxIterations ?? (deadline != null ? 512 : 20);

  const candidates = topActionsForSearch(state, topN);
  if (candidates.length === 0) throw new Error('MCTS: sin acciones legales');
  if (candidates.length === 1) return candidates[0];

  const arms: Arm[] = candidates.map((action) => ({
    key: actionKey(action),
    action,
    visits: 0,
    totalScore: 0,
  }));

  let iterations = 0;
  while (iterations < maxIter && (deadline == null || Date.now() < deadline)) {
    iterations += 1;
    const arm = selectArm(arms, iterations);
    const beliefRng = cloneRng(state.rng);
    beliefRng.state = (beliefRng.state + iterations * 7919) >>> 0;
    const sim = sampleBeliefState(state, player, beliefRng);
    applyPlayerAction(sim, arm.action);
    const score = rolloutAfterAction(sim, player);
    arm.visits += 1;
    arm.totalScore += score;
  }

  const ranked = [...arms].sort((a, b) => {
    if (a.visits === 0 && b.visits === 0) return 0;
    if (a.visits === 0) return 1;
    if (b.visits === 0) return -1;
    return b.totalScore / b.visits - a.totalScore / a.visits;
  });
  return ranked[0].action;
}
