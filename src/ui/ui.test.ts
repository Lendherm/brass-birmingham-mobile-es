import { describe, expect, it } from 'vitest';
import { LAYOUT } from '../engine/data/layout';
import { INTERACTIVE_TUTORIAL } from '../engine/tutorial/steps';
import { tutorialBoardView } from './tutorialBoardView';
import { cardMeta } from './Card';

describe('tutorialBoardView', () => {
  it('fits full board on intro steps', () => {
    const intro = INTERACTIVE_TUTORIAL.find((s) => s.id === 'sell-intro');
    expect(tutorialBoardView(intro)).toBeNull();
  });

  it('centers on Worcester for sell step', () => {
    const sell = INTERACTIVE_TUTORIAL.find((s) => s.id === 'apply-sell');
    const view = tutorialBoardView(sell);
    expect(view).toEqual({ x: LAYOUT.worcester.x, y: LAYOUT.worcester.y, scale: 1.05 });
  });

  it('centers on Dudley for build step', () => {
    const build = INTERACTIVE_TUTORIAL.find((s) => s.id === 'build-coal');
    const view = tutorialBoardView(build);
    expect(view).toEqual({ x: LAYOUT.dudley.x, y: LAYOUT.dudley.y, scale: 1 });
  });
});

describe('cardMeta', () => {
  it('labels location cards in Spanish', () => {
    const meta = cardMeta({ kind: 'location', city: 'worcester' });
    expect(meta.title).toBe('Worcester');
    expect(meta.subtitle).toBe('Naranja');
  });

  it('labels industry cards in Spanish', () => {
    const meta = cardMeta({ kind: 'industry', industries: ['coal'] });
    expect(meta.subtitle).toBe('Industria');
    expect(meta.title).toContain('carbón');
  });
});
