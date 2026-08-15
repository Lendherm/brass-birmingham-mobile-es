import { describe, expect, it } from 'vitest';
import { humanCardsInPlay, setupModeCards } from './gameModes';

describe('gameModes', () => {
  it('human Mautoma cards in play match 2p deal (8 + 3)', () => {
    expect(humanCardsInPlay(2, 'canal')).toBe(11);
    expect(humanCardsInPlay(4, 'canal')).toBe(13);
  });

  it('setup cards reflect player count deck sizes', () => {
    const two = setupModeCards(2);
    expect(two[0].deck).toContain('19');
    expect(two[1].deck).toContain('40');

    const four = setupModeCards(4);
    expect(four[0].deck).toContain('37');
    expect(four[1].deck).toContain('64');
    expect(four[1].rounds).toContain('8');
  });
});
