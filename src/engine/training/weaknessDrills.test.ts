import { describe, expect, it } from 'vitest';
import type { TrainingCareerStats } from '../ai/trainingStats';
import { drillScenarioForWeakness, recommendedWeaknessDrill } from './weaknessDrills';

function mockCareer(weaknessCounts: Record<string, number>): TrainingCareerStats {
  return {
    games: 5,
    wins: 2,
    losses: 3,
    ties: 0,
    totalMoves: 40,
    totalMistakes: 8,
    bestStreak: 2,
    currentStreak: 0,
    elo: 1000,
    byDifficulty: {
      easy: { wins: 0, losses: 0, ties: 0 },
      medium: { wins: 0, losses: 0, ties: 0 },
      hard: { wins: 0, losses: 0, ties: 0 },
      tournament: { wins: 0, losses: 0, ties: 0 },
    },
    weaknessCounts,
    recentMistakes: [],
    weekly: { weekId: '2026-W33', gamesPlayed: 1, moves: 10, mistakes: 2, wins: 0, tournamentWins: 0 },
  };
}

describe('weaknessDrills', () => {
  it('maps pass weakness to pass-tempo scenario', () => {
    expect(drillScenarioForWeakness('pass')).toBe('pass-tempo');
  });

  it('maps sell weakness to beer scarcity', () => {
    expect(drillScenarioForWeakness('sell')).toBe('beer-scarcity');
  });

  it('maps network weakness to dedicated scenario', () => {
    expect(drillScenarioForWeakness('network')).toBe('network-timing');
  });

  it('recommends drill from top career weakness', () => {
    const career = mockCareer({ sell: 4, pass: 2 });
    const drill = recommendedWeaknessDrill(career);
    expect(drill?.weaknessKey).toBe('sell');
    expect(drill?.scenarioId).toBe('beer-scarcity');
  });
});
