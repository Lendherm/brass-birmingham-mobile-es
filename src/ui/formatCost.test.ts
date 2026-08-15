import { describe, expect, it } from 'vitest';
import { formatBuildCost, formatNetworkCost } from './formatCost';

describe('formatCost', () => {
  it('formats money-only build cost', () => {
    expect(
      formatBuildCost({ moneyCost: 12, coalPlan: null, ironPlan: null, totalCost: 12 }),
    ).toBe('£12');
  });

  it('formats build cost with coal and market surcharge', () => {
    expect(
      formatBuildCost({
        moneyCost: 16,
        coalPlan: { takes: [], fromMarket: 1, marketCost: 4, ok: true },
        ironPlan: null,
        totalCost: 20,
      }),
    ).toBe('£16 + 1◆(£4) = £20');
  });

  it('formats network cost with coal', () => {
    expect(
      formatNetworkCost({
        moneyCost: 5,
        coalPlans: [{ takes: [{ city: 'birmingham', slot: 0, count: 1 }], fromMarket: 0, marketCost: 0, ok: true }],
        totalCost: 5,
      }),
    ).toBe('£5 + 1◆');
  });
});
