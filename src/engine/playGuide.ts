import { describeAction } from './ai/coach';
import { rankCandidatesForCoach } from './coachRank';
import type { ActionKind } from './actionExplain';
import { mapGuideForAction, type TrainingMapGuide } from './training/trainingMapGuide';
import { activePlayer, HUMAN, type GameState } from './state';
import type { IndustryType } from './types';

export interface LivePlayGuide {
  recommendedAction: ActionKind;
  recommendedDevelop: IndustryType | null;
  topLine: string;
  mapGuide: TrainingMapGuide;
  qualityPct: number;
}

function scoreSpreadPct(score: number, best: number, worst: number): number {
  const range = Math.max(6, best - worst);
  return Math.min(100, Math.max(15, Math.round(28 + ((score - worst) / range) * 72)));
}

/** Mejor línea del turno para entrenador / guía en vivo (vs IA o modo entrenamiento). */
export function getLivePlayGuide(state: GameState): LivePlayGuide | null {
  if (state.gameOver) return null;
  const player = activePlayer(state);
  if (state.mode === 'vsAI' && player !== HUMAN) return null;

  const ranked = rankCandidatesForCoach(state)
    .filter((c) => c.action.type !== 'pass')
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best) return null;

  const worst = ranked[ranked.length - 1]?.score ?? best.score - 10;
  const actionType = best.action.type as ActionKind;

  let recommendedDevelop: IndustryType | null = null;
  if (best.action.type === 'develop') {
    recommendedDevelop = best.action.industries[0] ?? null;
  } else {
    const bestDevelop = ranked.find((c) => c.action.type === 'develop');
    if (bestDevelop && bestDevelop.action.type === 'develop') {
      recommendedDevelop = bestDevelop.action.industries[0] ?? null;
    }
  }

  const mapGuide = mapGuideForAction(state, best.action);
  if (recommendedDevelop && best.action.type !== 'develop') {
    mapGuide.developIndustries = [recommendedDevelop];
  }

  return {
    recommendedAction: actionType,
    recommendedDevelop,
    topLine: describeAction(state, best.action),
    mapGuide,
    qualityPct: scoreSpreadPct(best.score, best.score, worst),
  };
}
