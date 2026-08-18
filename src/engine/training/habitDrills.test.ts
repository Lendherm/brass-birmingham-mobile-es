import { describe, expect, it } from 'vitest';
import { drillOfferForPattern, HABIT_DRILL_MAP } from './habitDrills';

describe('habitDrills', () => {
  it('maps network streak to network-timing', () => {
    expect(HABIT_DRILL_MAP['network-streak']).toBe('network-timing');
    const offer = drillOfferForPattern('network-streak');
    expect(offer.scenarioId).toBe('network-timing');
    expect(offer.buttonLabel).toContain('Practicar');
  });
});
