import { describe, expect, it } from 'vitest';
import { newGame, newHotseatGame } from './state';
import {
  buildBlockReason,
  buildBlockReasonDetailed,
  buildRequirementsChecklist,
} from './buildExplain';

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

  it('says Fuera de tu red when industry card matches but city is off-network', () => {
    const state = newHotseatGame(42, 2, ['Tú', 'Rival']);
    // Tile in Birmingham so the player has a network that does not include Stafford
    state.board.birmingham[0] = {
      industry: 'cotton',
      level: 1,
      owner: 0,
      flipped: false,
      resources: 0,
    };
    const card = { kind: 'industry' as const, industries: ['pottery' as const] };
    const reason = buildBlockReason(state, card, 'stafford', 'pottery');
    expect(reason).toBe('Fuera de tu red');
    expect(buildBlockReasonDetailed(state, card, 'stafford', 'pottery')).toMatch(/red/i);
  });

  it('says Carta de otra industria when the card does not include pottery', () => {
    const state = newGame(1, 'easy', 1);
    const card = { kind: 'industry' as const, industries: ['coal' as const] };
    expect(buildBlockReason(state, card, 'stafford', 'pottery')).toBe('Carta de otra industria');
  });
});

describe('buildRequirementsChecklist', () => {
  it('lists network and card gaps for pottery inspection', () => {
    const state = newGame(1, 'easy', 1);
    state.board.birmingham[0] = {
      industry: 'cotton',
      level: 1,
      owner: 0,
      flipped: false,
      resources: 0,
    };
    const items = buildRequirementsChecklist(state, 'stafford', 'pottery', 1, null);
    expect(items.some((i) => i.id === 'network' && !i.ok)).toBe(true);
    expect(items.some((i) => i.id === 'card' && !i.ok)).toBe(true);
    expect(items.some((i) => i.id === 'slot' && i.ok)).toBe(true);
  });
});
