import { describe, expect, it } from 'vitest';
import { newGame } from './state';
import {
  developActionBlockSummary,
  networkBlockReason,
  networkBlockReasonDetailed,
  sellActionBlockSummary,
} from './actionBlockExplain';

import type { IndustryType } from './types';

describe('actionBlockExplain', () => {
  it('explains network not touching player network', () => {
    const state = newGame(1, 'easy', 1);
    state.players[0].money = 50;
    state.board.coventry[0] = { industry: 'cotton', level: 1, owner: 0, resources: 0, flipped: false };
    const linkId = 'birmingham-walsall';
    expect(networkBlockReason(state, linkId)).toBe('No toca tu red');
    expect(networkBlockReasonDetailed(state, linkId).toLowerCase()).toContain('no toca');
  });

  it('summarizes blocked sell when no buildings', () => {
    const state = newGame(2, 'easy', 1);
    expect(sellActionBlockSummary(state)).toContain('industrias');
  });

  it('summarizes empty develop mat', () => {
    const state = newGame(3, 'easy', 1);
    const mat = state.players[0].mat;
    for (const k of Object.keys(mat) as IndustryType[]) {
      mat[k] = [0, 0, 0, 0];
    }
    expect(developActionBlockSummary(state)).toContain('mat');
  });
});
