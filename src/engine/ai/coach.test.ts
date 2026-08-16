import { describe, expect, it } from 'vitest';
import { legalBuilds } from '../options';
import { HUMAN, newVsAIGame } from '../state';
import { compareCoachMove, describeAction, shouldCoachHuman } from './coach';
import { rankCandidates } from './evaluate';

describe('training coach', () => {
  it('activates only for human turns in vs AI', () => {
    const state = newVsAIGame(1, 'medium', 1);
    expect(shouldCoachHuman(state)).toBe(true);
    state.currentPlayer = 1;
    expect(shouldCoachHuman(state)).toBe(false);
  });

  it('rates matching the best line as excellent', () => {
    const state = newVsAIGame(50, 'hard', 1);
    state.currentPlayer = HUMAN;
    const ranked = rankCandidates(state).sort((a, b) => b.score - a.score);
    const best = ranked.find((c) => c.action.type !== 'pass') ?? ranked[0];
    const feedback = compareCoachMove(state, best.action);
    expect(feedback.verdict).toBe('excellent');
    expect(feedback.delta).toBeLessThanOrEqual(2);
  });

  it('flags passing when strong builds exist', () => {
    const state = newVsAIGame(88, 'hard', 1);
    state.currentPlayer = HUMAN;
    const builds = legalBuilds(state);
    if (builds.length === 0) return;
    const feedback = compareCoachMove(state, { type: 'pass', cardIdx: 0 });
    expect(['ok', 'mistake']).toContain(feedback.verdict);
    expect(feedback.bestReasons.length).toBeGreaterThan(0);
    expect(feedback.yourLabel).toContain('Pasar');
  });

  it('describes actions in Spanish', () => {
    const state = newVsAIGame(3, 'medium', 1);
    state.currentPlayer = HUMAN;
    const builds = legalBuilds(state);
    if (builds.length === 0) return;
    const label = describeAction(state, {
      type: 'build',
      cardIdx: builds[0].cardIdx,
      option: builds[0].option,
    });
    expect(label).toMatch(/Construir:/);
    expect(label).toMatch(/£/);
  });

  it('includes alternative lines in feedback', () => {
    const state = newVsAIGame(12, 'medium', 1);
    state.currentPlayer = HUMAN;
    const ranked = rankCandidates(state);
    if (ranked.length < 2) return;
    const feedback = compareCoachMove(state, { type: 'pass', cardIdx: 0 });
    expect(feedback.alternatives.length).toBeGreaterThan(0);
    expect(feedback.summary.length).toBeGreaterThan(10);
  });

  it('reports coach confidence between 30 and 100', () => {
    const state = newVsAIGame(12, 'medium', 1);
    state.currentPlayer = HUMAN;
    const feedback = compareCoachMove(state, { type: 'pass', cardIdx: 0 });
    expect(feedback.confidence).toBeGreaterThanOrEqual(30);
    expect(feedback.confidence).toBeLessThanOrEqual(100);
  });
});
