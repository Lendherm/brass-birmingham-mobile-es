export type { AIDifficulty, AIIssue, ScoredAction } from './types';
export { personalityFor } from './personality';
export {
  rankCandidates,
  scoreBuild,
  scoreSell,
  scoreNetwork,
  pickExpendableCard,
  bestActionScore,
} from './evaluate';
export { planAIAction } from './planner';
export { auditAIAction, auditAIGameplay, summarizeIssues, filterBySeverity } from './audit';
export { compareCoachMove, describeAction, shouldCoachHuman } from './coach';
export type { CoachFeedback, CoachVerdict } from './coach';
export type { AIAuditReport } from './audit';

import type { GameState } from '../state';
import { planAIAction } from './planner';

/** Choose one legal Brass action for the active AI player. */
export function pickAIAction(state: GameState) {
  const difficulty = state.aiDifficulty ?? 'medium';
  return planAIAction(state, difficulty);
}
