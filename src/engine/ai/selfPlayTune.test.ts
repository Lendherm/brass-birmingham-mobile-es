import { describe, expect, it } from 'vitest';
import { BASE_EVAL_WEIGHTS, TUNED_EVAL_WEIGHTS } from './evalWeights';
import { scoreEvalWeights, tuneEvalWeights } from './selfPlayTune';

describe('selfPlayTune', () => {
  const seeds = [1, 2, 3];

  it('scores weights without crashing', () => {
    const score = scoreEvalWeights(seeds, BASE_EVAL_WEIGHTS, 25);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('tuned weights are at least as strong as baseline in self-play', () => {
    const tunedScore = scoreEvalWeights(seeds, TUNED_EVAL_WEIGHTS, 25);
    const baselineScore = scoreEvalWeights(seeds, BASE_EVAL_WEIGHTS, 25);
    expect(tunedScore).toBeGreaterThanOrEqual(baselineScore - 1);
  }, 90_000);

  it('coordinate search completes and reports improvement', () => {
    const result = tuneEvalWeights(seeds, 25);
    expect(result.improved).toBe(true);
    expect(Number.isFinite(result.score)).toBe(true);
  }, 120_000);
});
