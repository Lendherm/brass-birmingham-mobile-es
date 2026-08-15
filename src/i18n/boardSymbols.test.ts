import { describe, expect, it } from 'vitest';
import { CITIES } from '../engine/data/board';
import { newGame } from '../engine/state';
import { linkVPDetail, placedTileResourceDetail } from '../i18n/boardSymbols';

describe('boardSymbols', () => {
  it('explains link VP bonus in plain Spanish', () => {
    expect(linkVPDetail(2)).toContain('+2 PV de enlace');
    expect(linkVPDetail(2)).toContain('vía tuya conectada');
  });

  it('describes coal on a built mine', () => {
    expect(placedTileResourceDetail('coal', 2)).toContain('2 carbón');
    expect(placedTileResourceDetail('coal', 0)).toBeNull();
  });
});

describe('city slot guide integration', () => {
  it('Kidderminster has cotton+coal slots in board data', () => {
    expect(CITIES.kidderminster.slots).toEqual([['cotton', 'coal'], ['cotton']]);
  });

  it('new game leaves Kidderminster slots empty', () => {
    const state = newGame(1, 'easy', 1);
    expect(state.board.kidderminster.every((slot) => slot === null)).toBe(true);
  });
});
