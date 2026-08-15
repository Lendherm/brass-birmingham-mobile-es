import { describe, expect, it } from 'vitest';
import { newGame } from './state';
import { LINK_SUPPLY, playerLinksRemaining } from './links';
import { applyNetworkSingle } from './actions';

describe('link supply', () => {
  it('starts with full supply per player count', () => {
    const state = newGame(1, 'easy', 1);
    expect(LINK_SUPPLY[2]).toBe(10);
    expect(playerLinksRemaining(state, 0)).toBe(10);
    expect(playerLinksRemaining(state, 1)).toBe(10);
  });

  it('decrements when a link is placed', () => {
    const state = newGame(42, 'easy', 1);
    applyNetworkSingle(state, 0, {
      linkIds: ['birmingham-dudley'],
      moneyCost: 3,
      coalPlans: [],
      beerSource: null,
      totalCost: 3,
    });
    expect(state.players[0].linksPlaced).toBe(1);
    expect(playerLinksRemaining(state, 0)).toBe(9);
  });
});
