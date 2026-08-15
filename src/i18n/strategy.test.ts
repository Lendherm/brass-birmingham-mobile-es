import { describe, expect, it } from 'vitest';
import { STRATEGY_CHAPTERS, STRATEGY_QUICK_TIPS } from './strategy';

describe('strategy guide content', () => {
  it('has 11 strategy chapters', () => {
    expect(STRATEGY_CHAPTERS).toHaveLength(11);
    expect(STRATEGY_CHAPTERS.map((c) => c.id)).toContain('win');
    expect(STRATEGY_CHAPTERS.map((c) => c.id)).toContain('automa');
  });

  it('each chapter has sections with content', () => {
    for (const ch of STRATEGY_CHAPTERS) {
      expect(ch.title.length).toBeGreaterThan(2);
      expect(ch.sections.length).toBeGreaterThanOrEqual(3);
      for (const sec of ch.sections) {
        expect(sec.body.length).toBeGreaterThan(20);
      }
    }
  });

  it('has quick tips', () => {
    expect(STRATEGY_QUICK_TIPS.length).toBeGreaterThanOrEqual(4);
  });
});
