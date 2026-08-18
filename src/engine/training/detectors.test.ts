import { describe, expect, it } from 'vitest';
import { newGame } from '../state';
import { detectPlayPattern } from './detectors';

describe('detectPlayPattern', () => {
  it('returns null on empty early board', () => {
    const state = newGame(1, 'easy', 1);
    expect(detectPlayPattern(state, 0)).toBeNull();
  });

  it('detects coal-brewery-cotton loop', () => {
    const state = newGame(42, 'medium', 1);
    const p = 0;
    state.board.birmingham[0] = { industry: 'coal', level: 1, owner: p, resources: 2, flipped: false };
    state.board.walsall[0] = { industry: 'brewery', level: 1, owner: p, resources: 0, flipped: false };
    state.board.coventry[0] = { industry: 'cotton', level: 1, owner: p, resources: 0, flipped: false };
    state.board.stoke[0] = { industry: 'cotton', level: 1, owner: p, resources: 0, flipped: false };
    const pattern = detectPlayPattern(state, p);
    expect(pattern?.id).toBe('coal-brewery-loop');
  });
});
