import { describe, expect, it } from 'vitest';
import { newGame } from '../engine/state';
import { computeEraScoreBreakdown } from '../engine/scoring';
import { automaFeedLines } from './AutomaFeed';

describe('computeEraScoreBreakdown', () => {
  it('returns zero totals on empty board', () => {
    const state = newGame(1, 'easy', 1);
    const { linkVp, industryVp } = computeEraScoreBreakdown(state);
    expect(linkVp.every((v) => v === 0)).toBe(true);
    expect(industryVp.every((v) => v === 0)).toBe(true);
  });
});

describe('automaFeedLines', () => {
  it('extracts automa log lines', () => {
    const state = newGame(2, 'easy', 1);
    const automaName = state.playerNames[1];
    state.log.push(`${automaName} construyó un enlace de canal: belper-derby.`);
    expect(automaFeedLines(state).some((l) => l.includes('belper-derby'))).toBe(true);
  });
});
