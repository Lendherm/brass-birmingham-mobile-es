import {
  BASE_EVAL_WEIGHTS,
  resetEvalWeights,
  setEvalWeights,
  type EvalWeights,
} from './evalWeights';
import { runSelfPlayMatch } from './selfPlay';
import type { AIDifficulty } from './types';

const TUNE_KEYS: (keyof EvalWeights)[] = [
  'vp',
  'income',
  'networkCity',
  'beer',
  'rivalVp',
  'tempoHand',
  'flippedVp',
];

/** Average VP margin (P0 − P1) for a difficulty pairing with given weights. */
export function scoreEvalWeightsMatch(
  seeds: readonly number[],
  weights: EvalWeights,
  p0Difficulty: AIDifficulty,
  p1Difficulty: AIDifficulty,
  maxSteps = 40,
): number {
  setEvalWeights(weights);
  let total = 0;
  for (const seed of seeds) {
    const salt = p0Difficulty.length * 100 + p1Difficulty.length * 10;
    const outcome = runSelfPlayMatch(seed + 5000 + salt, p0Difficulty, p1Difficulty, maxSteps);
    total += outcome.p0vp - outcome.p1vp;
  }
  resetEvalWeights();
  return total / seeds.length;
}

/** Back-compat: hard vs medium margin. */
export function scoreEvalWeights(
  seeds: readonly number[],
  weights: EvalWeights,
  maxSteps = 40,
): number {
  return scoreEvalWeightsMatch(seeds, weights, 'hard', 'medium', maxSteps);
}

/** Weighted margin: hard>medium and tournament>hard. */
export function scoreEvalWeightsComposite(
  seeds: readonly number[],
  weights: EvalWeights,
  maxSteps = 40,
): number {
  const hardMedium = scoreEvalWeightsMatch(seeds, weights, 'hard', 'medium', maxSteps);
  const tournamentHard = scoreEvalWeightsMatch(seeds, weights, 'tournament', 'hard', maxSteps);
  return hardMedium * 0.55 + tournamentHard * 0.45;
}

export interface TuneResult {
  weights: EvalWeights;
  score: number;
  baselineScore: number;
  improved: boolean;
  hardMediumScore: number;
  tournamentHardScore: number;
}

/** Lightweight coordinate search for evaluator weights (offline / tests). */
export function tuneEvalWeights(
  seeds: readonly number[] = [1, 2, 3, 4, 5, 6],
  maxSteps = 40,
  options: { rounds?: number; factors?: readonly number[] } = {},
): TuneResult {
  resetEvalWeights();
  let best = { ...BASE_EVAL_WEIGHTS };
  let bestScore = scoreEvalWeightsComposite(seeds, best, maxSteps);
  const baselineScore = bestScore;
  const rounds = options.rounds ?? 2;
  const factors = options.factors ?? [0.92, 1.08];

  for (let round = 0; round < rounds; round++) {
    for (const key of TUNE_KEYS) {
      for (const factor of factors) {
        const candidate = { ...best, [key]: best[key] * factor };
        const score = scoreEvalWeightsComposite(seeds, candidate, maxSteps);
        if (score > bestScore) {
          best = candidate;
          bestScore = score;
        }
      }
    }
  }

  resetEvalWeights();
  return {
    weights: best,
    score: bestScore,
    baselineScore,
    improved: bestScore >= baselineScore,
    hardMediumScore: scoreEvalWeightsMatch(seeds, best, 'hard', 'medium', maxSteps),
    tournamentHardScore: scoreEvalWeightsMatch(seeds, best, 'tournament', 'hard', maxSteps),
  };
}

/** Round weights for stable constants export. */
export function roundEvalWeights(weights: EvalWeights): EvalWeights {
  const rounded = { ...weights };
  for (const key of Object.keys(rounded) as (keyof EvalWeights)[]) {
    rounded[key] = Math.round(rounded[key] * 100) / 100;
  }
  return rounded;
}

export function formatEvalWeights(weights: EvalWeights): string {
  return JSON.stringify(roundEvalWeights(weights), null, 2);
}
