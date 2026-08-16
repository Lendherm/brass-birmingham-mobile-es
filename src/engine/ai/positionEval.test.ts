import { describe, expect, it } from 'vitest';
import { HUMAN, newVsAIGame } from '../state';
import { cardsRemainingInGame, deckTempoBonus, evaluatePosition, playerBeerSupply } from './positionEval';

describe('positionEval', () => {
  it('counts remaining cards in game', () => {
    const state = newVsAIGame(1, 'medium', 1);
    expect(cardsRemainingInGame(state)).toBeGreaterThan(10);
  });

  it('evaluates position with finite score', () => {
    const state = newVsAIGame(5, 'hard', 1);
    expect(Number.isFinite(evaluatePosition(state, HUMAN))).toBe(true);
    expect(Number.isFinite(evaluatePosition(state, 1))).toBe(true);
  });

  it('rewards beer supply on breweries', () => {
    const state = newVsAIGame(2, 'medium', 1);
    state.board.walsall[1] = { owner: HUMAN, industry: 'brewery', level: 1, flipped: false, resources: 2 };
    expect(playerBeerSupply(state, HUMAN)).toBeGreaterThan(1);
  });

  it('deck tempo reflects hand size vs average', () => {
    const state = newVsAIGame(3, 'medium', 1);
    state.players[HUMAN].hand = state.players[HUMAN].hand.slice(0, 2);
    state.players[1].hand = state.players[1].hand.slice(0, 6);
    expect(deckTempoBonus(state, HUMAN)).toBeLessThan(0);
  });
});
