import { describe, expect, it } from 'vitest';
import { tileSpec } from '../../engine/data/industries';
import { levelRoman, matTileTitle } from './MatTile';

describe('MatTile helpers', () => {
  it('formats roman levels', () => {
    expect(levelRoman(1)).toBe('I');
    expect(levelRoman(4)).toBe('IV');
    expect(levelRoman(8)).toBe('VIII');
  });

  it('builds tooltip with cost, vp and resources', () => {
    const spec = tileSpec('goods', 3);
    const title = matTileTitle(spec, 'canal', 1);
    expect(title).toContain('£12');
    expect(title).toContain('4 PV');
    expect(title).toContain('2 carbón');
  });

  it('describes beer as sell cost for pottery, not production', () => {
    const spec = tileSpec('pottery', 1);
    const title = matTileTitle(spec, 'canal', 1);
    expect(title).toContain('Al vender: 1 cerveza');
    expect(title).not.toContain('Produce');
  });
});
