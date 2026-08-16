import { describe, expect, it, beforeEach } from 'vitest';
import type { CoachFeedback } from './coach';
import { loadCareerStats, summarizeSession, updateCareerAfterGame, winRate, weeklyGoalSummary, WEEKLY_GOAL_GAMES, loadWeeklyGoalSettings, saveWeeklyGoalSettings } from './trainingStats';

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
    confidence: 70,
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

  it('updates career stats and elo after win', () => {
    const summary = summarizeSession([mockFeedback('excellent'), mockFeedback('mistake', 12)]);
    const before = loadCareerStats();
    const after = updateCareerAfterGame(summary, 'win', 'medium');
    expect(after.games).toBe(before.games + 1);
    expect(after.wins).toBe(before.wins + 1);
    expect(after.elo).toBeGreaterThanOrEqual(before.elo);
    expect(after.totalMistakes).toBe(before.totalMistakes + summary.mistakes);
    expect(winRate(after)).toBeGreaterThanOrEqual(0);
  });

  it('tracks weakness categories', () => {
    const fb = mockFeedback('mistake', 12);
    fb.yourAction = { type: 'pass', cardIdx: 0 };
    fb.bestAction = { type: 'sell', cardIdx: 0, sales: [] as never };
    const summary = summarizeSession([fb]);
    expect(summary.weaknesses.length).toBeGreaterThan(0);
  });

  it('updates weekly goals after a game', () => {
    const summary = summarizeSession([mockFeedback('mistake', 10), mockFeedback('good', 2)]);
    const after = updateCareerAfterGame(summary, 'win', 'tournament');
    expect(after.weekly.gamesPlayed).toBeGreaterThanOrEqual(1);
    expect(after.weekly.tournamentWins).toBeGreaterThanOrEqual(1);
    const status = weeklyGoalSummary(after.weekly);
    expect(status.gamesLeft).toBeLessThanOrEqual(WEEKLY_GOAL_GAMES);
  });

  it('persists customizable weekly goal settings', () => {
    saveWeeklyGoalSettings({ targetGames: 5, maxMistakeRate: 10, targetTournamentWins: 2 });
    const loaded = loadWeeklyGoalSettings();
    expect(loaded.targetGames).toBe(5);
    expect(loaded.maxMistakeRate).toBe(10);
    expect(loaded.targetTournamentWins).toBe(2);
  });
});
