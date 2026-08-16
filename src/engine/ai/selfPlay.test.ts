import { describe, expect, it } from 'vitest';
import {
  benchmarkDifficultyStrength,
  difficultyOrderValid,
  pairwiseDifficultyStrength,
  pairwiseOrderValid,
  runSelfPlayMatch,
} from './selfPlay';

describe('selfPlay', () => {
  it('runs a short AI vs AI match without crashing', () => {
    const outcome = runSelfPlayMatch(42, 'medium', 'easy', 25);
    expect(outcome.steps).toBeGreaterThan(0);
    expect(outcome.p0vp).toBeGreaterThanOrEqual(0);
    expect(outcome.p1vp).toBeGreaterThanOrEqual(0);
  });

  it('benchmark produces finite strength scores', () => {
    const strength = benchmarkDifficultyStrength([1, 2, 3, 4], 35);
    expect(strength.easy).toBeGreaterThanOrEqual(0);
    expect(strength.tournament).toBeGreaterThanOrEqual(0);
    expect(difficultyOrderValid(strength)).toBe(true);
  }, 60_000);

  it('pairwise hard tier stays ahead of medium with tuned weights', () => {
    const pairwise = pairwiseDifficultyStrength([1, 2, 3], 25);
    expect(Number.isFinite(pairwise.hardVsMedium)).toBe(true);
    expect(Number.isFinite(pairwise.tournamentVsHard)).toBe(true);
    expect(pairwiseOrderValid(pairwise)).toBe(true);
  }, 90_000);
});
