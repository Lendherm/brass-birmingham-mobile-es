import type { CoachFeedback, CoachVerdict } from './coach';

export interface TrainingMoveRecord {
  turn: number;
  verdict: CoachVerdict;
  yourLabel: string;
  bestLabel: string;
  delta: number;
}

export interface TrainingSessionSummary {
  moves: number;
  excellent: number;
  good: number;
  ok: number;
  mistakes: number;
  avgDelta: number;
  topIssues: string[];
  records: TrainingMoveRecord[];
}

export interface TrainingCareerStats {
  games: number;
  wins: number;
  losses: number;
  ties: number;
  totalMoves: number;
  totalMistakes: number;
  bestStreak: number;
  currentStreak: number;
}

const CAREER_KEY = 'bbsolo-training-career-v1';

export function recordFromFeedback(f: CoachFeedback): TrainingMoveRecord {
  return {
    turn: f.turn,
    verdict: f.verdict,
    yourLabel: f.yourLabel,
    bestLabel: f.bestLabel,
    delta: f.delta,
  };
}

export function summarizeSession(feedbackHistory: CoachFeedback[]): TrainingSessionSummary {
  const records = feedbackHistory.map(recordFromFeedback);
  const counts = { excellent: 0, good: 0, ok: 0, mistakes: 0 };
  let deltaSum = 0;
  const issueCounts: Record<string, number> = {};

  for (const f of feedbackHistory) {
    counts[f.verdict === 'mistake' ? 'mistakes' : f.verdict]++;
    deltaSum += f.delta;
    if (f.verdict === 'mistake' || f.verdict === 'ok') {
      const key = f.summary.split(':')[0] ?? f.summary.slice(0, 40);
      issueCounts[key] = (issueCounts[key] ?? 0) + 1;
    }
  }

  const topIssues = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, n]) => `${k} (${n}×)`);

  return {
    moves: feedbackHistory.length,
    excellent: counts.excellent,
    good: counts.good,
    ok: counts.ok,
    mistakes: counts.mistakes,
    avgDelta: feedbackHistory.length ? deltaSum / feedbackHistory.length : 0,
    topIssues,
    records,
  };
}

export function loadCareerStats(): TrainingCareerStats {
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    if (raw) return JSON.parse(raw) as TrainingCareerStats;
  } catch {
    /* ignore */
  }
  return {
    games: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    totalMoves: 0,
    totalMistakes: 0,
    bestStreak: 0,
    currentStreak: 0,
  };
}

export function saveCareerStats(stats: TrainingCareerStats): void {
  localStorage.setItem(CAREER_KEY, JSON.stringify(stats));
}

export function updateCareerAfterGame(
  summary: TrainingSessionSummary,
  result: 'win' | 'loss' | 'tie',
): TrainingCareerStats {
  const stats = loadCareerStats();
  stats.games += 1;
  stats.totalMoves += summary.moves;
  stats.totalMistakes += summary.mistakes;
  if (result === 'win') {
    stats.wins += 1;
    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  } else if (result === 'tie') {
    stats.ties += 1;
    stats.currentStreak = 0;
  } else {
    stats.losses += 1;
    stats.currentStreak = 0;
  }
  saveCareerStats(stats);
  return stats;
}

export function winRate(stats: TrainingCareerStats): number {
  if (stats.games === 0) return 0;
  return Math.round((stats.wins / stats.games) * 100);
}
