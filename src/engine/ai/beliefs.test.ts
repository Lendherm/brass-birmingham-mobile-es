import { describe, expect, it } from 'vitest';
import { HUMAN, newVsAIGame } from '../state';
import { beliefHintForHuman, opponentFlexibility, primaryOpponent } from './beliefs';

describe('beliefs', () => {
  it('identifies AI rival in vsAI', () => {
    const state = newVsAIGame(1, 'medium', 1);
    expect(primaryOpponent(state, HUMAN)).toBe(1);
  });

  it('flexibility increases with larger rival hand', () => {
    const state = newVsAIGame(2, 'medium', 1);
    state.players[1].hand = [...state.players[1].hand, ...state.players[HUMAN].hand.slice(0, 3)];
    state.players[HUMAN].hand = state.players[HUMAN].hand.slice(3);
    expect(opponentFlexibility(state, 1)).toBeGreaterThan(0.3);
  });

  it('returns hint near endgame low deck', () => {
    const state = newVsAIGame(3, 'medium', 1);
    state.drawPile = [];
    state.players[0].hand = state.players[0].hand.slice(0, 2);
    state.players[1].hand = state.players[1].hand.slice(0, 2);
    state.currentPlayer = HUMAN;
    expect(beliefHintForHuman(state)).toMatch(/Pocas cartas/);
  });
});
