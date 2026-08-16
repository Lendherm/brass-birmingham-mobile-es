import { applyPlayerAction, type PlayerAction } from '../game';
import { nextFloat, nextInt } from '../rng';
import { HUMAN, activePlayer, type GameState, type PlayerId } from '../state';
import { bestActionScore, rankCandidates, topCandidates } from './evaluate';
import { evaluatePosition } from './positionEval';
import { enhanceHardScore } from './search';
import type { AIDifficulty } from './types';

function cloneState(state: GameState): GameState {
  const sim = structuredClone(state);
  sim.plannerSim = true;
  return sim;
}

const RIVAL_DIFFICULTY: AIDifficulty = 'medium';

function opponentOf(player: PlayerId): PlayerId {
  return player === HUMAN ? 1 : HUMAN;
}

/** Simulate one opponent turn (up to 2 actions) using heuristic choices. */
export function simulateOpponentTurn(state: GameState, opponent: PlayerId, maxActions = 4): void {
  state.plannerSim = true;
  let safety = 0;
  while (state.currentPlayer === opponent && state.actionsLeft > 0 && !state.gameOver && safety < maxActions) {
    safety += 1;
    const candidates = rankCandidates(state);
    if (candidates.length === 0) break;
    applyPlayerAction(state, pickByDifficulty(state, candidates, RIVAL_DIFFICULTY));
  }
}

/** Finish the active player's remaining actions in simulation (greedy). */
function finishCurrentTurn(sim: GameState): void {
  let safety = 0;
  while (sim.actionsLeft > 0 && !sim.gameOver && safety < 4) {
    safety += 1;
    const candidates = rankCandidates(sim);
    if (candidates.length === 0) break;
    const best = [...candidates].sort((a, b) => b.score - a.score)[0];
    applyPlayerAction(sim, best.action);
  }
}

/** Score after completing our turn and simulating the next opponent response. */
export function scoreWithRivalLookahead(state: GameState, player: PlayerId, pairScore: number): number {
  const sim = cloneState(state);
  simulateOpponentTurn(sim, opponentOf(player));
  if (sim.gameOver) return pairScore;
  const pos = evaluatePosition(sim, player);
  return pairScore * 0.55 + pos * 0.45;
}

/** Plan the best single action, or pair of actions when two remain this turn. */
export function planAIAction(state: GameState, difficulty: AIDifficulty): PlayerAction {
  const candidates = rankCandidates(state);
  if (candidates.length === 0) throw new Error('La IA no tiene acciones legales');

  if (state.actionsLeft <= 1 || difficulty === 'easy') {
    return pickByDifficulty(state, candidates, difficulty);
  }

  const player = activePlayer(state);
  const firstOptions = topCandidates(candidates, difficulty === 'hard' ? 4 : 4);
  let best: { action: PlayerAction; score: number } | null = null;

  for (const first of firstOptions) {
    const sim = cloneState(state);
    applyPlayerAction(sim, first.action);
    if (sim.gameOver) {
      if (!best || first.score > best.score) best = { action: first.action, score: first.score };
      continue;
    }

    const secondCandidates = rankCandidates(sim);
    const secondBest = bestActionScore(secondCandidates);
    let pairScore = first.score + secondBest * 0.9;

    if (difficulty === 'hard' && !sim.gameOver && sim.actionsLeft > 0) {
      const lookahead = cloneState(sim);
      finishCurrentTurn(lookahead);
      if (!lookahead.gameOver && lookahead.currentPlayer !== player) {
        pairScore = scoreWithRivalLookahead(lookahead, player, pairScore);
      }
      pairScore = enhanceHardScore(state, player, first.action, pairScore);
    }

    if (!best || pairScore > best.score) best = { action: first.action, score: pairScore };
  }

  return best?.action ?? pickByDifficulty(state, candidates, difficulty);
}

export function pickByDifficulty(
  state: GameState,
  candidates: ReturnType<typeof rankCandidates>,
  difficulty: AIDifficulty,
): PlayerAction {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  if (sorted.length === 0) throw new Error('La IA no tiene acciones legales');

  if (difficulty === 'easy') {
    if (nextFloat(state.rng) < 0.3) return sorted[nextInt(state.rng, sorted.length)].action;
    const top = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
    return top[nextInt(state.rng, top.length)].action;
  }

  if (difficulty === 'hard') {
    const best = sorted[0].score;
    const tier = sorted.filter((c) => c.score >= best - 3 && c.action.type !== 'pass');
    const pool = tier.length > 0 ? tier : sorted.slice(0, 1);
    if (pool.length === 1) return pool[0].action;
    return pool[nextInt(state.rng, pool.length)].action;
  }

  return sorted[0].action;
}
