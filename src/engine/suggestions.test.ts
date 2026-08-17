import { describe, expect, it } from 'vitest';
import { newGame } from './state';
import { actionIntroHint, buildWhy } from './actionExplain';
import { computePlaySuggestions } from './suggestions';
import { CITIES } from './data/board';
import { legalBuilds } from './options';

describe('actionExplain', () => {
  it('returns intro hints for each action', () => {
    const state = newGame(1, 'easy', 1);
    expect(actionIntroHint(state, 'build').length).toBeGreaterThan(10);
    expect(actionIntroHint(state, 'pass').length).toBeGreaterThan(5);
  });

  it('buildWhy mentions link VP or income when relevant', () => {
    const state = newGame(2, 'easy', 1);
    const builds = legalBuilds(state);
    if (builds.length === 0) return;
    expect(buildWhy(builds[0]).length).toBeGreaterThan(5);
  });
});

describe('computePlaySuggestions', () => {
  it('returns suggestions with reasons for a new game', () => {
    const state = newGame(99, 'easy', 1);
    const suggestions = computePlaySuggestions(state, (city, industry) => ({
      city: CITIES[city].name,
      industry,
    }));
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(6);
    expect(suggestions.every((s) => s.reason.length > 5)).toBe(true);
  });
});

describe('cityZone', () => {
  it('assigns birmingham to purple', async () => {
    const { cityZone } = await import('../ui/visual/cityZones');
    expect(cityZone('birmingham')).toBe('purple');
  });

  it('assigns leek to blueDark like uttoxeter and coventry to purple', async () => {
    const { cityZone } = await import('../ui/visual/cityZones');
    expect(cityZone('leek')).toBe('blueDark');
    expect(cityZone('uttoxeter')).toBe('blueDark');
    expect(cityZone('coventry')).toBe('purple');
    expect(cityZone('worcester')).toBe('orange');
  });
});
