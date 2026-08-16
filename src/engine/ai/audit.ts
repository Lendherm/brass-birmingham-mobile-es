import { applyPlayerAction, type PlayerAction } from '../game';
import { activePlayer, HUMAN, isAIPlayer, type GameState } from '../state';
import { bestActionScore, rankCandidates } from './evaluate';
import { planAIAction } from './planner';
import type { AIIssue } from './types';

import { actionKey } from './actionKey';
import type { Card } from '../state';

function isWildCard(card: Card | undefined): boolean {
  return card?.kind === 'wildIndustry' || card?.kind === 'wildLocation';
}

/** Validate a chosen action and return heuristic quality issues. */
export function auditAIAction(state: GameState, action: PlayerAction): AIIssue[] {
  const issues: AIIssue[] = [];
  const player = activePlayer(state);
  const hand = state.players[player].hand;
  const candidates = rankCandidates(state);
  const best = bestActionScore(candidates);
  const key = actionKey(action);
  const chosen = candidates.find((c) => actionKey(c.action) === key);
  const chosenScore = chosen?.score ?? -999;

  if (action.type === 'pass' && best > 5) {
    issues.push({
      severity: 'warn',
      code: 'PASS_WITH_BETTER',
      message: `Pasó con opciones mejores (mejor≈${best.toFixed(1)}).`,
    });
  }

  const card = hand[action.cardIdx];
  if (!card && action.type !== 'sell' && action.type !== 'develop' && action.type !== 'network') {
    issues.push({ severity: 'error', code: 'INVALID_CARD', message: 'Índice de carta inválido.' });
  }

  if (card && isWildCard(card) && (action.type === 'pass' || action.type === 'network')) {
    issues.push({
      severity: 'warn',
      code: 'WILD_WASTED',
      message: `Descartó wild en ${action.type}.`,
    });
  }

  if (chosen && best - chosenScore > 10 && state.aiDifficulty === 'hard') {
    issues.push({
      severity: 'warn',
      code: 'SUBOPTIMAL',
      message: `Subóptimo en difícil (≈${chosenScore.toFixed(1)} vs ${best.toFixed(1)}).`,
    });
  }

  try {
    const sim = structuredClone(state);
    applyPlayerAction(sim, action);
  } catch (e) {
    issues.push({
      severity: 'error',
      code: 'ILLEGAL_ACTION',
      message: e instanceof Error ? e.message : String(e),
    });
  }

  return issues;
}

export interface AIAuditReport {
  seed: number;
  turn: number;
  player: number;
  action: PlayerAction;
  issues: AIIssue[];
}

/** Audit each AI action while advancing the game (human plays simple pass/loan fallback). */
export function auditAIGameplay(state: GameState, maxSteps: number): AIAuditReport[] {
  const reports: AIAuditReport[] = [];
  let steps = 0;

  while (!state.gameOver && steps < maxSteps) {
    steps++;
    if (isAIPlayer(state, state.currentPlayer)) {
      const action = planAIAction(state, state.aiDifficulty ?? 'medium');
      const issues = auditAIAction(state, action);
      const notable = issues.filter((i) => i.severity !== 'info');
      if (notable.length > 0) {
        reports.push({
          seed: state.seed,
          turn: state.turn,
          player: state.currentPlayer,
          action,
          issues: notable,
        });
      }
      applyPlayerAction(state, action);
      continue;
    }

    const hand = state.players[HUMAN].hand;
    if (hand.length === 0) break;
    applyPlayerAction(state, { type: 'pass', cardIdx: 0 });
  }

  return reports;
}

export function summarizeIssues(reports: AIAuditReport[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of reports) {
    for (const issue of r.issues) {
      counts[issue.code] = (counts[issue.code] ?? 0) + 1;
    }
  }
  return counts;
}

export function filterBySeverity(reports: AIAuditReport[], severity: AIIssue['severity']): AIAuditReport[] {
  return reports
    .map((r) => ({ ...r, issues: r.issues.filter((i) => i.severity === severity) }))
    .filter((r) => r.issues.length > 0);
}
