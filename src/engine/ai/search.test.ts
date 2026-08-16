import { describe, expect, it } from 'vitest';
import { newVsAIGame } from '../state';
import { monteCarloActionValue, topActionsForSearch } from './search';
import { rankCandidates } from './evaluate';

describe('search', () => {
  it('lists top actions for search', () => {
    const state = newVsAIGame(5, 'hard', 1);
    state.currentPlayer = 1;
    expect(topActionsForSearch(state).length).toBeGreaterThan(0);
  });

  it('monte carlo value is finite', () => {
    const state = newVsAIGame(8, 'hard', 1);
    state.currentPlayer = 1;
    state.actionsLeft = 2;
    const best = rankCandidates(state).sort((a, b) => b.score - a.score)[0];
    const v = monteCarloActionValue(state, 1, best.action, 1);
    expect(Number.isFinite(v)).toBe(true);
  });
});
