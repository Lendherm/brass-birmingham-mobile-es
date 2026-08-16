import type { CoachFeedback } from '../ai/coach';
import type { AIDifficulty } from '../ai/types';
import type { GameState } from '../state';

export interface TrainingReplay {
  savedAt: number;
  coachHistory: CoachFeedback[];
  snapshots: GameState[];
  difficulty?: AIDifficulty;
  result?: 'win' | 'loss' | 'tie';
}

const REPLAY_KEY = 'bbsolo-training-replay-v1';

export function buildTrainingReplay(
  coachHistory: CoachFeedback[],
  snapshots: GameState[],
  meta?: Pick<TrainingReplay, 'difficulty' | 'result'>,
): TrainingReplay | null {
  if (coachHistory.length === 0) return null;
  if (snapshots.length !== coachHistory.length) return null;
  return {
    savedAt: Date.now(),
    coachHistory,
    snapshots,
    difficulty: meta?.difficulty,
    result: meta?.result,
  };
}

export function saveTrainingReplay(replay: TrainingReplay): void {
  localStorage.setItem(REPLAY_KEY, JSON.stringify(replay));
}

export function loadTrainingReplay(): TrainingReplay | null {
  try {
    const raw = localStorage.getItem(REPLAY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrainingReplay;
    if (!parsed.coachHistory?.length || !parsed.snapshots?.length) return null;
    if (parsed.snapshots.length !== parsed.coachHistory.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function replayMoveCount(replay: TrainingReplay): number {
  return replay.coachHistory.length;
}

export function replayMistakeIndices(replay: TrainingReplay): number[] {
  return replay.coachHistory
    .map((f, i) => (f.verdict === 'mistake' || f.verdict === 'ok' ? i : -1))
    .filter((i) => i >= 0);
}

export function clampReplayIndex(replay: TrainingReplay, index: number): number {
  return Math.max(0, Math.min(replay.coachHistory.length - 1, index));
}
