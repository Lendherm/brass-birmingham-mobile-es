import { describe, expect, it } from 'vitest';
import { newVsAIGame } from './state';
import { getLivePlayGuide } from './playGuide';

describe('getLivePlayGuide', () => {
  it('returns a recommended action for a fresh vs AI game', () => {
    const state = newVsAIGame(42, 'medium', 1);
    const guide = getLivePlayGuide(state);
    expect(guide).not.toBeNull();
    expect(guide!.recommendedAction).toBeTruthy();
    expect(guide!.topLine.length).toBeGreaterThan(3);
    expect(guide!.mapGuide.developIndustries).toBeDefined();
  });
});
