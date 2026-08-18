import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlayerAction } from '../engine/game';
import type { GameState } from '../engine/state';
import { recordTurnHistory, type TurnHistoryEntry } from '../engine/training/turnHistory';

/** Tracks human moves for training pattern detection (resets each new game). */
export function useTrainingTurnLog(state: GameState | null) {
  const [turnLog, setTurnLog] = useState<TurnHistoryEntry[]>([]);
  const seedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state) {
      seedRef.current = null;
      setTurnLog([]);
      return;
    }
    if (seedRef.current !== null && seedRef.current !== state.seed) {
      setTurnLog([]);
    }
    seedRef.current = state.seed;
  }, [state?.seed, state]);

  const recordTurn = useCallback((action: PlayerAction, before: GameState) => {
    setTurnLog((prev) => recordTurnHistory(prev, action, before));
  }, []);

  return { turnLog, recordTurn };
}
