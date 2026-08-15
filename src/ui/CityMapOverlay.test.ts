import { describe, expect, it } from 'vitest';
import { newGame } from '../engine/state';
import { cityBuildOptions, cityBuildSections } from '../ui/CityMapOverlay';

describe('cityBuildOptions', () => {
  it('lists 5 industry previews for empty Birmingham (shared slot = cotton + goods)', () => {
    const state = newGame(1, 'easy', 1);
    const options = cityBuildOptions(state, 'birmingham', [], null, false);

    expect(options).toHaveLength(5);
    expect(options.map((o) => `${o.slotIndex}:${o.industry}`)).toEqual([
      '0:cotton',
      '0:goods',
      '1:goods',
      '2:iron',
      '3:goods',
    ]);
  });
});

describe('cityBuildSections', () => {
  it('groups Birmingham into 4 quadrants with 2 mats in the shared slot', () => {
    const state = newGame(1, 'easy', 1);
    const sections = cityBuildSections(state, 'birmingham', [], null, false);

    expect(sections).toHaveLength(4);
    expect(sections[0].slotIndex).toBe(0);
    expect(sections[0].options).toHaveLength(2);
    expect(sections[0].options.map((o) => o.industry)).toEqual(['cotton', 'goods']);
    expect(sections.slice(1).every((s) => s.options.length === 1)).toBe(true);
  });
});
