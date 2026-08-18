import { describe, expect, it } from 'vitest';
import { buildBlockReasonDetailed } from '../buildExplain';
import { newGame } from '../state';
import { getTrainingHint } from './trainingHints';

describe('getTrainingHint', () => {
  it('explains missing card for build', () => {
    const state = newGame(1, 'easy', 1);
    const hint = getTrainingHint(state, { action: 'build', cardIdx: null, inspectCity: null });
    expect(hint).not.toBeNull();
    expect(hint!.headline.toLowerCase()).toContain('construir');
  });

  it('returns fork hint when idle', () => {
    const state = newGame(7, 'medium', 1);
    state.actionsLeft = 8;
    const hint = getTrainingHint(state, { action: null, cardIdx: null, inspectCity: null });
    expect(hint?.kind === 'fork' || hint?.kind === 'plan').toBe(true);
    expect(hint?.alternatives.length).toBeGreaterThan(0);
    expect(hint?.planSteps?.length).toBeGreaterThan(0);
  });
});

describe('buildBlockReasonDetailed', () => {
  it('expands canal one-building rule', () => {
    const state = newGame(1, 'easy', 1);
    state.era = 'canal';
    state.players[0].money = 100;
    state.board.birmingham[0] = { industry: 'cotton', level: 1, owner: 0, resources: 0, flipped: false };
    const card = { kind: 'location' as const, city: 'birmingham' as const };
    const short = 'Solo 1 edificio por ciudad (era canal)';
    // force path by calling detailed with industry that would hit canal rule
    const detail = buildBlockReasonDetailed(state, card, 'birmingham', 'goods');
    expect(detail === short || detail.includes('era Canal')).toBe(true);
  });
});
