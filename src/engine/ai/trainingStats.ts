import type { CoachFeedback } from './coach';
import type { AIDifficulty } from './types';

export interface TrainingMoveRecord {
  turn: number;
  verdict: CoachFeedback['verdict'];
  yourLabel: string;
  bestLabel: string;
  delta: number;
  weakness?: string;
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
  weaknesses: { label: string; count: number }[];
}

export interface DifficultyRecord {
  wins: number;
  losses: number;
  ties: number;
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
  elo: number;
  byDifficulty: Record<AIDifficulty, DifficultyRecord>;
  weaknessCounts: Record<string, number>;
  recentMistakes: TrainingMoveRecord[];
}

const CAREER_KEY = 'bbsolo-training-career-v1';
const LAST_SEED_KEY = 'bbsolo-last-vsai-seed';

const OPPONENT_ELO: Record<AIDifficulty, number> = {
  easy: 950,
  medium: 1100,
  hard: 1250,
  tournament: 1400,
};

const WEAKNESS_LABELS: Record<string, string> = {
  pass: 'Pasar con jugadas mejores',
  sell: 'Ventas perdidas',
  build: 'Construcciones subóptimas',
  network: 'Enlaces mal temporizados',
  develop: 'Desarrollo tardío',
  wild: 'Cartas comodín mal gastadas',
  tempo: 'Tempo / cartas',
  other: 'Decisiones tácticas',
};

function emptyDifficultyRecord(): DifficultyRecord {
  return { wins: 0, losses: 0, ties: 0 };
}

function defaultCareer(): TrainingCareerStats {
  return {
    games: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    totalMoves: 0,
    totalMistakes: 0,
    bestStreak: 0,
    currentStreak: 0,
    elo: 1000,
    byDifficulty: {
      easy: emptyDifficultyRecord(),
      medium: emptyDifficultyRecord(),
      hard: emptyDifficultyRecord(),
      tournament: emptyDifficultyRecord(),
    },
    weaknessCounts: {},
    recentMistakes: [],
  };
}

function normalizeCareer(raw: Partial<TrainingCareerStats>): TrainingCareerStats {
  const base = defaultCareer();
  return {
    ...base,
    ...raw,
    byDifficulty: {
      easy: { ...base.byDifficulty.easy, ...raw.byDifficulty?.easy },
      medium: { ...base.byDifficulty.medium, ...raw.byDifficulty?.medium },
      hard: { ...base.byDifficulty.hard, ...raw.byDifficulty?.hard },
      tournament: { ...base.byDifficulty.tournament, ...raw.byDifficulty?.tournament },
    },
    weaknessCounts: raw.weaknessCounts ?? base.weaknessCounts,
    recentMistakes: raw.recentMistakes ?? base.recentMistakes,
  };
}

export function categorizeWeakness(f: CoachFeedback): string {
  if (f.verdict === 'excellent' || f.verdict === 'good') return 'other';
  if (f.yourAction.type === 'pass' && f.bestAction.type !== 'pass') return 'pass';
  if (f.yourAction.type === 'sell' && f.bestAction.type !== 'sell') return 'sell';
  if (f.yourAction.type === 'build' && f.bestAction.type === 'build') return 'build';
  if (f.yourAction.type === 'network') return 'network';
  if (f.yourAction.type === 'develop') return 'develop';
  if (f.summary.toLowerCase().includes('wild') || f.summary.toLowerCase().includes('comodín')) return 'wild';
  if (f.delta >= 10) return 'tempo';
  return 'other';
}

export function weaknessLabel(key: string): string {
  return WEAKNESS_LABELS[key] ?? key;
}

export function recordFromFeedback(f: CoachFeedback): TrainingMoveRecord {
  const weakness = categorizeWeakness(f);
  return {
    turn: f.turn,
    verdict: f.verdict,
    yourLabel: f.yourLabel,
    bestLabel: f.bestLabel,
    delta: f.delta,
    weakness,
  };
}

export function summarizeSession(feedbackHistory: CoachFeedback[]): TrainingSessionSummary {
  const records = feedbackHistory.map(recordFromFeedback);
  const counts = { excellent: 0, good: 0, ok: 0, mistakes: 0 };
  let deltaSum = 0;
  const issueCounts: Record<string, number> = {};
  const weaknessCounts: Record<string, number> = {};

  for (const f of feedbackHistory) {
    counts[f.verdict === 'mistake' ? 'mistakes' : f.verdict]++;
    deltaSum += f.delta;
    const w = categorizeWeakness(f);
    if (f.verdict === 'mistake' || f.verdict === 'ok') {
      weaknessCounts[w] = (weaknessCounts[w] ?? 0) + 1;
      const key = f.summary.split(':')[0] ?? f.summary.slice(0, 40);
      issueCounts[key] = (issueCounts[key] ?? 0) + 1;
    }
  }

  const topIssues = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, n]) => `${k} (${n}×)`);

  const weaknesses = Object.entries(weaknessCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label: weaknessLabel(label), count }));

  return {
    moves: feedbackHistory.length,
    excellent: counts.excellent,
    good: counts.good,
    ok: counts.ok,
    mistakes: counts.mistakes,
    avgDelta: feedbackHistory.length ? deltaSum / feedbackHistory.length : 0,
    topIssues,
    records,
    weaknesses,
  };
}

export function loadCareerStats(): TrainingCareerStats {
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    if (raw) return normalizeCareer(JSON.parse(raw) as Partial<TrainingCareerStats>);
  } catch {
    /* ignore */
  }
  return defaultCareer();
}

export function saveCareerStats(stats: TrainingCareerStats): void {
  localStorage.setItem(CAREER_KEY, JSON.stringify(stats));
}

export function saveLastVsAISeed(seed: number): void {
  localStorage.setItem(LAST_SEED_KEY, String(seed));
}

export function loadLastVsAISeed(): number | null {
  try {
    const raw = localStorage.getItem(LAST_SEED_KEY);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function updateElo(elo: number, result: 'win' | 'loss' | 'tie', opponentElo: number): number {
  const score = result === 'win' ? 1 : result === 'tie' ? 0.5 : 0;
  const expected = 1 / (1 + 10 ** ((opponentElo - elo) / 400));
  return Math.round(elo + 32 * (score - expected));
}

export function updateCareerAfterGame(
  summary: TrainingSessionSummary,
  result: 'win' | 'loss' | 'tie',
  difficulty: AIDifficulty = 'medium',
  feedbackHistory: CoachFeedback[] = [],
): TrainingCareerStats {
  const stats = loadCareerStats();
  stats.games += 1;
  stats.totalMoves += summary.moves;
  stats.totalMistakes += summary.mistakes;
  stats.elo = updateElo(stats.elo, result, OPPONENT_ELO[difficulty]);

  const rec = stats.byDifficulty[difficulty];
  if (result === 'win') rec.wins += 1;
  else if (result === 'tie') rec.ties += 1;
  else rec.losses += 1;

  for (const f of feedbackHistory) {
    if (f.verdict !== 'mistake' && f.verdict !== 'ok') continue;
    const w = categorizeWeakness(f);
    stats.weaknessCounts[w] = (stats.weaknessCounts[w] ?? 0) + 1;
  }

  const newMistakes = summary.records.filter((r) => r.verdict === 'mistake' || r.verdict === 'ok');
  stats.recentMistakes = [...newMistakes, ...stats.recentMistakes].slice(0, 20);

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

export function mistakeRate(stats: TrainingCareerStats): number {
  if (stats.totalMoves === 0) return 0;
  return Math.round((stats.totalMistakes / stats.totalMoves) * 100);
}

export function topWeaknesses(stats: TrainingCareerStats, n = 5): { label: string; count: number }[] {
  return Object.entries(stats.weaknessCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ label: weaknessLabel(key), count }));
}
