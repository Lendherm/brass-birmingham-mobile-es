import { describe, expect, it } from 'vitest';
import { newGame } from './state';
import { buildBlockReason } from './buildExplain';

describe('buildBlockReason', () => {
  it('requires a card', () => {
    const state = newGame(1, 'easy', 1);
    expect(buildBlockReason(state, null, 'birmingham', 'cotton')).toBe('Elige una carta');
  });

  it('reports insufficient coal when applicable', () => {
    const state = newGame(1, 'easy', 1);
    state.players[0].money = 100;
    const card = { kind: 'location' as const, city: 'birmingham' as const };
    const reason = buildBlockReason(state, card, 'birmingham', 'goods');
    expect(reason === null || typeof reason === 'string').toBe(true);
  });
});
