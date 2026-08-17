import { describe, expect, it } from 'vitest';
import { newVsAIGame } from './state';
import { legalNetworks } from './options';
import { networkWhy } from './actionExplain';
import { computePlaySuggestions } from './suggestions';
import { CITIES } from './data/board';
import { industria } from '../i18n/es';

describe('networkWhy safety', () => {
  it('handles merchant endpoints (e.g. Birmingham–Oxford) without crashing', () => {
    const state = newVsAIGame(42, 'medium', 1);
    const nets = legalNetworks(state);
    expect(nets.some((n) => n.option.linkIds[0] === 'birmingham-oxford')).toBe(true);
    for (const n of nets) {
      expect(() => networkWhy(n)).not.toThrow();
      expect(networkWhy(n).length).toBeGreaterThan(5);
    }
    expect(() =>
      computePlaySuggestions(state, (city, industry) => ({
        city: CITIES[city].name,
        industry: industria(industry),
      })),
    ).not.toThrow();
  });
});
