import { applyPlayerAction } from '../game';
import { HUMAN, newVsAIGame } from '../state';
import type { PlayerId } from '../types';
import { planAIAction } from './planner';
import type { AIDifficulty } from './types';

export interface SelfPlayOutcome {
  p0vp: number;
  p1vp: number;
  steps: number;
  gameOver: boolean;
}

/** Both seats played by AI (P0 vs P1) for benchmarking. */
export function runSelfPlayMatch(
  seed: number,
  p0Difficulty: AIDifficulty,
  p1Difficulty: AIDifficulty,
  maxSteps = 100,
): SelfPlayOutcome {
  const state = newVsAIGame(seed, p1Difficulty, 1);
  let steps = 0;
  while (!state.gameOver && steps < maxSteps) {
    steps += 1;
    const player = state.currentPlayer as PlayerId;
    const difficulty = player === HUMAN ? p0Difficulty : p1Difficulty;
    state.aiDifficulty = difficulty;
    const action = planAIAction(state, difficulty);
    applyPlayerAction(state, action);
  }
  return {
    p0vp: state.players[HUMAN].vp,
    p1vp: state.players[1].vp,
    steps,
    gameOver: state.gameOver,
  };
}

export type DifficultyStrength = Record<AIDifficulty, number>;

/** Average P0 VP when each difficulty plays vs easy (higher = stronger). */
export function benchmarkDifficultyStrength(seeds: readonly number[], maxSteps = 60): DifficultyStrength {
  const diffs: AIDifficulty[] = ['easy', 'medium', 'hard', 'tournament'];
  const totals: DifficultyStrength = { easy: 0, medium: 0, hard: 0, tournament: 0 };
  for (const d of diffs) {
    for (const seed of seeds) {
      totals[d] += runSelfPlayMatch(seed + d.length * 1000, d, 'easy', maxSteps).p0vp;
    }
    totals[d] /= seeds.length;
  }
  return totals;
}

/** Vs-easy benchmark: coarse ordering (high variance on short self-play samples). */
export function difficultyOrderValid(strength: DifficultyStrength): boolean {
  return (
    strength.medium >= strength.easy - 3 &&
    strength.hard >= strength.medium - 10
  );
}

export interface PairwiseStrength {
  hardVsMedium: number;
  tournamentVsHard: number;
}

/** Average VP margins for adjacent difficulty tiers (self-play). */
export function pairwiseDifficultyStrength(seeds: readonly number[], maxSteps = 40): PairwiseStrength {
  let hardMedium = 0;
  let tournamentHard = 0;
  for (const seed of seeds) {
    const hm = runSelfPlayMatch(seed + 7000, 'hard', 'medium', maxSteps);
    hardMedium += hm.p0vp - hm.p1vp;
    const th = runSelfPlayMatch(seed + 8000, 'tournament', 'hard', maxSteps);
    tournamentHard += th.p0vp - th.p1vp;
  }
  return {
    hardVsMedium: hardMedium / seeds.length,
    tournamentVsHard: tournamentHard / seeds.length,
  };
}

/** Head-to-head margin: hard should not lose badly to medium. */
export function pairwiseOrderValid(pairwise: PairwiseStrength): boolean {
  return pairwise.hardVsMedium >= -2;
}
