import {
  BASE_EVAL_WEIGHTS,
  resetEvalWeights,
  setEvalWeights,
  type EvalWeights,
} from './evalWeights';
import { runSelfPlayMatch } from './selfPlay';

const TUNE_KEYS: (keyof EvalWeights)[] = [
  'vp',
  'income',
  'networkCity',
  'beer',
  'rivalVp',
  'tempoHand',
  'flippedVp',
];

/** Average VP margin (P0 − P1) for hard vs medium with given weights. */
export function scoreEvalWeights(
  seeds: readonly number[],
  weights: EvalWeights,
  maxSteps = 40,
): number {
  setEvalWeights(weights);
  let total = 0;
  for (const seed of seeds) {
    const outcome = runSelfPlayMatch(seed + 5000, 'hard', 'medium', maxSteps);
    total += outcome.p0vp - outcome.p1vp;
  }
  resetEvalWeights();
  return total / seeds.length;
}

export interface TuneResult {
  weights: EvalWeights;
  score: number;
  baselineScore: number;
  improved: boolean;
}

/** Lightweight coordinate search for evaluator weights (offline / tests). */
export function tuneEvalWeights(
  seeds: readonly number[] = [1, 2, 3, 4, 5, 6],
  maxSteps = 40,
  options: { rounds?: number; factors?: readonly number[] } = {},
): TuneResult {
  resetEvalWeights();
  let best = { ...BASE_EVAL_WEIGHTS };
  let bestScore = scoreEvalWeights(seeds, best, maxSteps);
  const baselineScore = bestScore;
  const rounds = options.rounds ?? 2;
  const factors = options.factors ?? [0.92, 1.08];

  for (let round = 0; round < rounds; round++) {
    for (const key of TUNE_KEYS) {
      for (const factor of factors) {
        const candidate = { ...best, [key]: best[key] * factor };
        const score = scoreEvalWeights(seeds, candidate, maxSteps);
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
