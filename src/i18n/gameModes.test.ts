import { describe, expect, it } from 'vitest';
import { humanCardsInPlay, setupModeCards } from './gameModes';

describe('gameModes', () => {
  it('human Mautoma cards in play match 2p deal (8 + 3)', () => {
    expect(humanCardsInPlay(2, 'canal')).toBe(11);
    expect(humanCardsInPlay(4, 'canal')).toBe(13);
  });

  it('setup cards reflect player count deck sizes', () => {
    const two = setupModeCards(2);
    expect(two.find((c) => c.id === 'vsAI')!.deck).toContain('40');
    expect(two.find((c) => c.id === 'solo')!.deck).toContain('19');
    expect(two.find((c) => c.id === 'hotseat')!.deck).toContain('40');

    const four = setupModeCards(4);
    expect(four.find((c) => c.id === 'solo')!.deck).toContain('37');
    expect(four.find((c) => c.id === 'hotseat')!.deck).toContain('64');
    expect(four.find((c) => c.id === 'hotseat')!.rounds).toContain('8');
  });
});
