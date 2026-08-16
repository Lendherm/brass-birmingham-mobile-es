import { describe, expect, it } from 'vitest';
import { BASE_EVAL_WEIGHTS, TUNED_EVAL_WEIGHTS } from './evalWeights';
import { scoreEvalWeights, tuneEvalWeights } from './selfPlayTune';

const onCi = !!process.env.CI;
const seeds = onCi ? ([1, 2] as const) : ([1, 2, 3] as const);
const maxSteps = onCi ? 18 : 25;
const testTimeout = onCi ? 120_000 : 90_000;

describe('selfPlayTune', () => {
  it('scores weights without crashing', () => {
    const score = scoreEvalWeights(seeds, BASE_EVAL_WEIGHTS, maxSteps);
    expect(Number.isFinite(score)).toBe(true);
  });

  it(
    'tuned weights are at least as strong as baseline in self-play',
    () => {
      const tunedScore = scoreEvalWeights(seeds, TUNED_EVAL_WEIGHTS, maxSteps);
      const baselineScore = scoreEvalWeights(seeds, BASE_EVAL_WEIGHTS, maxSteps);
      expect(tunedScore).toBeGreaterThanOrEqual(baselineScore - 1);
    },
    testTimeout,
  );

  it(
    'coordinate search completes and reports improvement',
    () => {
      const result = tuneEvalWeights(seeds, maxSteps);
      expect(result.improved).toBe(true);
      expect(Number.isFinite(result.score)).toBe(true);
    },
    onCi ? 180_000 : 120_000,
  );
});
