import { describe, expect, it } from 'vitest';
import { newVsAIGame } from '../state';
import { planAIAction, simulateOpponentTurn } from './planner';

describe('planner rival lookahead', () => {
  it('simulates opponent turn without crashing', () => {
    const state = newVsAIGame(42, 'hard', 1);
    state.currentPlayer = 1;
    state.actionsLeft = 2;
    const before = state.turn;
    simulateOpponentTurn(state, 1);
    expect(state.gameOver).toBe(false);
    expect(state.turn).toBeGreaterThanOrEqual(before);
  });

  it('hard difficulty plans legal action with two actions left', () => {
    const state = newVsAIGame(1, 'hard', 1);
    state.currentPlayer = 1;
    state.actionsLeft = 2;
    expect(state.players[1].hand.length).toBeGreaterThan(0);
    const action = planAIAction(state, 'hard');
    expect(action.type).toBeTruthy();
  });
});
