import { describe, expect, it } from 'vitest';
import { canalEraWarning, estimateTurnsUntilEraEnd, level1TilesForPlayer } from './canalEraWarnings';
import { newGame } from './state';

describe('canalEraWarnings', () => {
  it('finds level 1 tiles for human', () => {
    const state = newGame(1, 'easy');
    state.board.dudley[0] = {
      owner: 0,
      industry: 'coal',
      level: 1,
      flipped: false,
      resources: 4,
    };
    expect(level1TilesForPlayer(state)).toHaveLength(1);
    expect(level1TilesForPlayer(state)[0].cityId).toBe('dudley');
  });

  it('returns warning when level 1 on board in canal era', () => {
    const state = newGame(1, 'easy');
    state.board.wolverhampton[0] = {
      owner: 0,
      industry: 'cotton',
      level: 1,
      flipped: false,
      resources: 0,
    };
    const w = canalEraWarning(state);
    expect(w).not.toBeNull();
    expect(w!.level1Tiles).toHaveLength(1);
  });

  it('marks urgent when few turns left and level 1 present', () => {
    const state = newGame(1, 'easy');
    state.drawPile = [];
    state.players[0].hand = [{ kind: 'location', city: 'birmingham' }];
    state.actionsLeft = 1;
    state.board.stoke[0] = {
      owner: 0,
      industry: 'goods',
      level: 1,
      flipped: false,
      resources: 0,
    };
    expect(estimateTurnsUntilEraEnd(state)).toBeLessThanOrEqual(2);
    expect(canalEraWarning(state)?.urgent).toBe(true);
  });

  it('returns null in rail era', () => {
    const state = newGame(1, 'easy');
    state.era = 'rail';
    state.board.dudley[0] = {
      owner: 0,
      industry: 'coal',
      level: 1,
      flipped: false,
      resources: 4,
    };
    expect(canalEraWarning(state)).toBeNull();
  });
});
