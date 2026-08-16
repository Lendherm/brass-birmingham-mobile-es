import { describe, expect, it, beforeEach } from 'vitest';
import { compareCoachMove } from '../ai/coach';
import { newVsAIGame } from '../state';
import {
  buildTrainingReplay,
  loadTrainingReplay,
  replayMistakeIndices,
  saveTrainingReplay,
} from './replay';

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
});

describe('training replay', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('builds replay when snapshots match coach history length', () => {
    const state = newVsAIGame(12, 'medium', 1);
    state.currentPlayer = 0;
    state.actionsLeft = 2;
    const fb = compareCoachMove(state, { type: 'pass', cardIdx: 0 });
    const replay = buildTrainingReplay([fb], [structuredClone(state)], { difficulty: 'medium', result: 'loss' });
    expect(replay?.coachHistory).toHaveLength(1);
    expect(replay?.snapshots[0].turn).toBe(state.turn);
  });

  it('rejects mismatched snapshot count', () => {
    const state = newVsAIGame(13, 'medium', 1);
    const fb = compareCoachMove(state, { type: 'pass', cardIdx: 0 });
    expect(buildTrainingReplay([fb], [])).toBeNull();
  });

  it('persists and loads replay from localStorage', () => {
    const state = newVsAIGame(14, 'medium', 1);
    const fb = compareCoachMove(state, { type: 'pass', cardIdx: 0 });
    const replay = buildTrainingReplay([fb], [structuredClone(state)])!;
    saveTrainingReplay(replay);
    const loaded = loadTrainingReplay();
    expect(loaded?.coachHistory).toHaveLength(1);
    expect(loaded?.snapshots).toHaveLength(1);
  });

  it('lists mistake indices', () => {
    const state = newVsAIGame(15, 'medium', 1);
    const good = compareCoachMove(state, { type: 'pass', cardIdx: 0 });
    expect(replayMistakeIndices({ savedAt: 0, coachHistory: [good], snapshots: [state] }).length).toBeGreaterThan(0);
  });
});
