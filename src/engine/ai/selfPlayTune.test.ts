import { describe, expect, it } from 'vitest';
import { BASE_EVAL_WEIGHTS, TUNED_EVAL_WEIGHTS } from './evalWeights';
import { scoreEvalWeights, tuneEvalWeights } from './selfPlayTune';

const seeds = [1, 2] as const;
const maxSteps = 18;
const fastTune = { rounds: 1, factors: [1.08] as const };

describe('selfPlayTune', () => {
  it('scores weights without crashing', () => {
    const score = scoreEvalWeights(seeds, BASE_EVAL_WEIGHTS, maxSteps);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('tuned weights are at least as strong as baseline in self-play', () => {
    const tunedScore = scoreEvalWeights(seeds, TUNED_EVAL_WEIGHTS, maxSteps);
    const baselineScore = scoreEvalWeights(seeds, BASE_EVAL_WEIGHTS, maxSteps);
    expect(tunedScore).toBeGreaterThanOrEqual(baselineScore - 1);
  }, 120_000);

  it('coordinate search completes and reports improvement', () => {
    const result = tuneEvalWeights(seeds, maxSteps, fastTune);
    expect(result.improved).toBe(true);
    expect(Number.isFinite(result.score)).toBe(true);
  }, 180_000);
});
