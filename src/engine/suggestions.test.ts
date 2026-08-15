import { describe, expect, it } from 'vitest';
import { newGame } from './state';
import { computePlaySuggestions } from './suggestions';
import { CITIES } from './data/board';

describe('computePlaySuggestions', () => {
  it('returns suggestions for a new game', () => {
    const state = newGame(99, 'easy', 1);
    const suggestions = computePlaySuggestions(state, (city, industry) => ({
      city: CITIES[city].name,
      industry,
    }));
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(6);
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
