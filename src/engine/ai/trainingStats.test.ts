import { describe, expect, it, beforeEach } from 'vitest';
import type { CoachFeedback } from './coach';
import { loadCareerStats, summarizeSession, updateCareerAfterGame, winRate } from './trainingStats';

const CAREER_KEY = 'bbsolo-training-career-v1';

beforeEach(() => {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  };
  localStorage.removeItem(CAREER_KEY);
});

function mockFeedback(verdict: CoachFeedback['verdict'], delta = 5): CoachFeedback {
  return {
    turn: 1,
    actionsLeftBefore: 2,
    yourAction: { type: 'pass', cardIdx: 0 },
    bestAction: { type: 'build', cardIdx: 0, option: {} as never },
    yourLabel: 'Pasar',
    bestLabel: 'Construir',
    yourScore: 0,
    bestScore: delta,
    delta,
    verdict,
    summary: verdict === 'mistake' ? 'Revisa el plan: había mejores jugadas.' : 'Buena jugada.',
    yourReasons: [],
    bestReasons: [],
    alternatives: [],
  };
}

describe('trainingStats', () => {
  it('summarizes session verdict counts', () => {
    const summary = summarizeSession([
      mockFeedback('excellent', 0),
      mockFeedback('good', 3),
      mockFeedback('mistake', 15),
    ]);
    expect(summary.moves).toBe(3);
    expect(summary.excellent).toBe(1);
    expect(summary.good).toBe(1);
    expect(summary.mistakes).toBe(1);
    expect(summary.avgDelta).toBeGreaterThan(0);
  });

  it('updates career stats after win', () => {
    const summary = summarizeSession([mockFeedback('excellent'), mockFeedback('mistake', 12)]);
    const before = loadCareerStats();
    const after = updateCareerAfterGame(summary, 'win');
    expect(after.games).toBe(before.games + 1);
    expect(after.wins).toBe(before.wins + 1);
    expect(after.totalMistakes).toBe(before.totalMistakes + summary.mistakes);
    expect(winRate(after)).toBeGreaterThanOrEqual(0);
  });
});
