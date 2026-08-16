import { useCallback, useEffect, useRef, useState } from 'react';
import { newGame, newHotseatGame, newVsAIGame, isTutorial, isVsAI, type AIOpponents, type AutomaOpponents, type GameState, type PlayerCount } from '../engine/state';
import { applyPlayerAction, processAITurns, type PlayerAction } from '../engine/game';
import type { CoachFeedback } from '../engine/ai/coach';
import { compareCoachMove, shouldCoachHuman } from '../engine/ai/coach';
import type { AIDifficulty } from '../engine/ai/types';
import { newTutorialGame, tutorialSegmentState } from '../engine/tutorial/segments';
import { INTERACTIVE_TUTORIAL, segmentForStep } from '../engine/tutorial/steps';
import type { MautomaDifficulty } from '../engine/mautoma/cards';

const SAVE_KEY = 'bbsolo-save-v1';

interface Session {
  state: GameState;
  history: GameState[];
  screenHidden: boolean;
  tutorialStep: number | null;
  modeIntroPending: boolean;
  coachFeedback: CoachFeedback | null;
  coachHistory: CoachFeedback[];
}

function clone(state: GameState): GameState {
  return structuredClone(state);
}

export function useGame() {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const state = JSON.parse(raw) as GameState;
      if (state.mode === 'tutorial') return null;
      return {
        state,
        history: [],
        screenHidden: state.mode === 'hotseat',
        tutorialStep: null,
        modeIntroPending: false,
        coachFeedback: null,
        coachHistory: [],
      };
    } catch {
      return null;
    }
  });

  const prevPlayer = useRef<number | null>(null);

  useEffect(() => {
    if (session && !isTutorial(session.state)) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(session.state));
    } else if (!session) {
      localStorage.removeItem(SAVE_KEY);
    }
  }, [session]);

  const startSolo = useCallback((seed: number, difficulty: MautomaDifficulty, automaOpponents: AutomaOpponents = 1) => {
    setSession({
      state: newGame(seed, difficulty, automaOpponents),
      history: [],
      screenHidden: false,
      tutorialStep: null,
      modeIntroPending: true,
      coachFeedback: null,
      coachHistory: [],
    });
  }, []);

  const startTutorial = useCallback(() => {
    setSession({
      state: newTutorialGame(),
      history: [],
      screenHidden: false,
      tutorialStep: 0,
      modeIntroPending: false,
      coachFeedback: null,
      coachHistory: [],
    });
  }, []);

  const advanceTutorial = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.tutorialStep === null) return prev;
      const nextStep = prev.tutorialStep + 1;
      const segment = segmentForStep(nextStep);
      const state = segment ? tutorialSegmentState(segment) : prev.state;
      return { ...prev, tutorialStep: nextStep, state, history: [], coachFeedback: null, coachHistory: prev.coachHistory };
    });
  }, []);

  const startVsAI = useCallback((seed: number, difficulty: AIDifficulty, aiOpponents: AIOpponents = 1) => {
    const state = newVsAIGame(seed, difficulty, aiOpponents);
    processAITurns(state);
    setSession({
      state,
      history: [],
      screenHidden: false,
      tutorialStep: null,
      modeIntroPending: true,
      coachFeedback: null,
      coachHistory: [],
    });
  }, []);

  const startHotseat = useCallback((seed: number, playerCount: PlayerCount, names: string[]) => {
    setSession({
      state: newHotseatGame(seed, playerCount, names),
      history: [],
      screenHidden: false,
      tutorialStep: null,
      modeIntroPending: true,
      coachFeedback: null,
      coachHistory: [],
    });
    prevPlayer.current = null;
  }, []);

  const revealScreen = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, screenHidden: false } : prev));
  }, []);

  const dismissModeIntro = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        modeIntroPending: false,
        screenHidden: prev.state.mode === 'hotseat',
      };
    });
  }, []);

  const dispatch = useCallback((action: PlayerAction): string | null => {
    let error: string | null = null;
    setSession((prev) => {
      if (!prev || prev.screenHidden) return prev;
      if (isVsAI(prev.state) && prev.state.currentPlayer !== 0) return prev;
      const before = prev.state;
      let coachFeedback: CoachFeedback | null = prev.coachFeedback;
      let coachHistory = prev.coachHistory;
      if (shouldCoachHuman(before)) {
        coachFeedback = compareCoachMove(before, action);
        coachHistory = [...coachHistory, coachFeedback];
      }
      const next = clone(before);
      const beforePlayer = next.currentPlayer;
      try {
        applyPlayerAction(next, action);
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
        return prev;
      }
      const playerChanged = next.mode === 'hotseat' && next.currentPlayer !== beforePlayer;
      const history = [...prev.history, prev.state].slice(-40);
      return {
        state: next,
        history,
        screenHidden: playerChanged ? true : prev.screenHidden,
        tutorialStep: prev.tutorialStep,
        modeIntroPending: prev.modeIntroPending,
        coachFeedback,
        coachHistory,
      };
    });
    return error;
  }, []);

  const undo = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.history.length === 0) return prev;
      return {
        state: prev.history[prev.history.length - 1],
        history: prev.history.slice(0, -1),
        screenHidden: false,
        tutorialStep: prev.tutorialStep,
        modeIntroPending: prev.modeIntroPending,
        coachFeedback: null,
        coachHistory: prev.coachHistory.slice(0, -1),
      };
    });
  }, []);

  const reset = useCallback(() => setSession(null), []);

  const dismissCoachFeedback = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, coachFeedback: null } : prev));
  }, []);

  const dismissEraScore = useCallback(() => {
    setSession((prev) => {
      if (!prev?.state.pendingEraScore) return prev;
      if (prev.state.pendingEraScore.gameOver) return null;
      const state = clone(prev.state);
      state.pendingEraScore = null;
      processAITurns(state);
      return { ...prev, state };
    });
  }, []);

  return {
    state: session?.state ?? null,
    screenHidden: session?.screenHidden ?? false,
    tutorialStep: session?.tutorialStep ?? null,
    tutorialDone: (session?.tutorialStep ?? null) !== null && (session?.tutorialStep ?? 0) >= INTERACTIVE_TUTORIAL.length,
    canUndo: (session?.history.length ?? 0) > 0 && session?.tutorialStep === null,
    modeIntroPending: session?.modeIntroPending ?? false,
    coachFeedback: session?.coachFeedback ?? null,
    coachHistory: session?.coachHistory ?? [],
    startSolo,
    startVsAI,
    startTutorial,
    advanceTutorial,
    startHotseat,
    revealScreen,
    dismissModeIntro,
    dispatch,
    undo,
    reset,
    dismissCoachFeedback,
    dismissEraScore,
  };
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('bbsolo-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('bbsolo-theme', theme);
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) };
}
