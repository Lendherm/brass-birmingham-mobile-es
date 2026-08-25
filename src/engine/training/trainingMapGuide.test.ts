import { describe, expect, it } from 'vitest';
import { newGame } from '../state';
import { buildTrainingMapGuide, mapGuideForAction, mergeMapHighlights } from './trainingMapGuide';
import { legalBuilds } from '../options';

describe('buildTrainingMapGuide', () => {
  it('returns build slot and camera for best build', () => {
    const state = newGame(5, 'medium', 1);
    state.actionsLeft = 8;
    const guide = buildTrainingMapGuide(state);
    expect(guide).not.toBeNull();
    expect(guide!.viewTarget).not.toBeNull();
  });
});

describe('mapGuideForAction', () => {
  it('highlights network link', () => {
    const state = newGame(2, 'easy', 1);
    state.actionsLeft = 8;
    const build = legalBuilds(state)[0];
    if (!build) return;
    const guide = mapGuideForAction(state, { type: 'build', cardIdx: build.cardIdx, option: build.option });
    expect(guide.buildSlots).toEqual([`${build.option.city}:${build.option.slot}`]);
    expect(guide.cities).toContain(build.option.city);
  });
});

describe('mergeMapHighlights', () => {
  it('marks pro slots separately from flow highlights', () => {
    const merged = mergeMapHighlights(new Set(['birmingham']), new Set(['birmingham:0']), new Set(), {
      linkIds: [],
      buildSlots: ['coventry:1'],
      cities: ['coventry'],
      developIndustries: [],
      viewTarget: null,
    });
    expect(merged.cities.has('coventry')).toBe(true);
    expect(merged.slots.has('coventry:1')).toBe(true);
    expect(merged.proSlots.has('coventry:1')).toBe(true);
    expect(merged.proSlots.has('birmingham:0')).toBe(false);
  });
});
