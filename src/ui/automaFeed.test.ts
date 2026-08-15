import { describe, expect, it } from 'vitest';
import { classifyGameLog } from '../engine/gameHistory';
import { newGame } from '../engine/state';
import { computeEraScoreBreakdown } from '../engine/scoring';

describe('computeEraScoreBreakdown', () => {
  it('returns zero totals on empty board', () => {
    const state = newGame(1, 'easy', 1);
    const { linkVp, industryVp } = computeEraScoreBreakdown(state);
    expect(linkVp.every((v) => v === 0)).toBe(true);
    expect(industryVp.every((v) => v === 0)).toBe(true);
  });
});

describe('classifyGameLog', () => {
  it('extracts automa log lines with player id', () => {
    const state = newGame(2, 'easy', 1);
    const automaName = state.playerNames[1];
    state.log.push(`${automaName} construyó un enlace de canal: belper-derby.`);
    const line = classifyGameLog(state).find((l) => l.text.includes('belper-derby'));
    expect(line?.playerId).toBe(1);
  });
});
