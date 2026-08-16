import { applyPlayerAction, type PlayerAction } from '../game';
import { nextFloat, nextInt } from '../rng';
import type { GameState } from '../state';
import { bestActionScore, rankCandidates, topCandidates } from './evaluate';
import type { AIDifficulty } from './types';

function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

/** Plan the best single action, or pair of actions when two remain this turn. */
export function planAIAction(state: GameState, difficulty: AIDifficulty): PlayerAction {
  const candidates = rankCandidates(state);
  if (candidates.length === 0) throw new Error('La IA no tiene acciones legales');

  if (state.actionsLeft <= 1 || difficulty === 'easy') {
    return pickByDifficulty(state, candidates, difficulty);
  }

  const firstOptions = topCandidates(candidates, difficulty === 'hard' ? 6 : 4);
  let best: { action: PlayerAction; score: number } | null = null;

  for (const first of firstOptions) {
    const sim = cloneState(state);
    applyPlayerAction(sim, first.action);
    if (sim.gameOver || sim.actionsLeft === 0) {
      const score = first.score;
      if (!best || score > best.score) best = { action: first.action, score };
      continue;
    }
    const secondCandidates = rankCandidates(sim);
    const secondBest = bestActionScore(secondCandidates);
    const pairScore = first.score + secondBest * 0.9;
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
