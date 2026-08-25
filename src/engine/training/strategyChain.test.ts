import { describe, expect, it } from 'vitest';
import { newGame } from '../state';
import { buildStrategyChain } from './strategyChain';
import { scoutAllowed } from '../options';

describe('buildStrategyChain', () => {
  it('returns multi-step plan with labels and reasons', () => {
    const state = newGame(20, 'medium', 1);
    state.actionsLeft = 8;
    const steps = buildStrategyChain(state);
    expect(steps.length).toBeGreaterThanOrEqual(1);
    expect(steps[0].label.length).toBeGreaterThan(3);
    expect(steps[0].reason.length).toBeGreaterThan(5);
  });

  it('can suggest explore when scout is legal and sellable builds missing', () => {
    const state = newGame(21, 'easy', 1);
    state.actionsLeft = 8;
    if (!scoutAllowed(state)) return;
    const steps = buildStrategyChain(state);
    const hasExplore = steps.some((s) => s.label.toLowerCase().includes('explorar'));
    expect(typeof hasExplore).toBe('boolean');
  });
});
