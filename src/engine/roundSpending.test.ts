import { describe, expect, it } from 'vitest';
import { newHotseatGame, nextRoundTurnOrder, roundSpending, spendMoney } from './state';

describe('roundSpending', () => {
  it('tracks pounds spent per player in hotseat', () => {
    const state = newHotseatGame(1, 3, ['A', 'B', 'C']);
    spendMoney(state, 0, 5);
    spendMoney(state, 1, 12);
    expect(roundSpending(state, 0)).toBe(5);
    expect(roundSpending(state, 1)).toBe(12);
    expect(roundSpending(state, 2)).toBe(0);
  });

  it('orders next round by lowest spend, tie keeps prior order', () => {
    const state = newHotseatGame(2, 3, ['A', 'B', 'C']);
    state.turnOrder = [2, 0, 1];
    spendMoney(state, 0, 8);
    spendMoney(state, 1, 8);
    spendMoney(state, 2, 3);

    expect(nextRoundTurnOrder(state)).toEqual([2, 0, 1]);
  });

  it('puts lowest spender first when amounts differ', () => {
    const state = newHotseatGame(3, 3, ['A', 'B', 'C']);
    spendMoney(state, 0, 15);
    spendMoney(state, 1, 4);
    spendMoney(state, 2, 9);

    expect(nextRoundTurnOrder(state)).toEqual([1, 2, 0]);
  });
});
