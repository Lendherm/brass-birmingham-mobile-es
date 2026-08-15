import { describe, expect, it } from 'vitest';
import { HUMAN } from './state';
import { applyPlayerAction } from './game';
import { legalBuilds, legalDevelops, legalNetworks, legalSells } from './options';
import { newTutorialGame, tutorialSegmentState } from './tutorial/segments';
import { INTERACTIVE_TUTORIAL } from './tutorial/steps';

describe('interactive tutorial', () => {
  it('starts intro with three actions', () => {
    const state = newTutorialGame();
    expect(state.mode).toBe('tutorial');
    expect(state.players[HUMAN].hand).toHaveLength(5);
    expect(state.actionsLeft).toBe(3);
  });

  it('intro allows coal in Dudley', () => {
    const state = newTutorialGame();
    const builds = legalBuilds(state);
    expect(builds.some((b) => b.option.city === 'dudley' && b.option.industry === 'coal')).toBe(true);
  });

  it('intro allows birmingham-dudley after mine', () => {
    const state = newTutorialGame();
    const coal = legalBuilds(state).find((b) => b.option.city === 'dudley' && b.option.industry === 'coal')!;
    applyPlayerAction(state, { type: 'build', cardIdx: coal.cardIdx, option: coal.option });
    expect(legalNetworks(state).some((n) => n.option.linkIds[0] === 'birmingham-dudley')).toBe(true);
  });

  it('sell segment has legal sell in Worcester', () => {
    const state = tutorialSegmentState('sell');
    expect(legalSells(state).some((s) => s.sale.city === 'worcester' && s.sale.slot === 0)).toBe(true);
  });

  it('develop segment allows coal develop', () => {
    const state = tutorialSegmentState('develop');
    expect(legalDevelops(state).some((d) => d.industries[0] === 'coal')).toBe(true);
  });

  it('loan segment allows loan with hand', () => {
    const state = tutorialSegmentState('loan');
    expect(state.players[HUMAN].money).toBeLessThan(10);
    expect(state.players[HUMAN].hand.length).toBeGreaterThan(0);
  });

  it('scout segment is rail era with scoutable hand', () => {
    const state = tutorialSegmentState('scout');
    expect(state.era).toBe('rail');
    expect(state.players[HUMAN].hand.length).toBeGreaterThanOrEqual(3);
  });

  it('has 6 chapters and 30+ steps', () => {
    expect(INTERACTIVE_TUTORIAL.length).toBeGreaterThanOrEqual(30);
    expect(new Set(INTERACTIVE_TUTORIAL.map((s) => s.chapter)).size).toBe(6);
  });
});
