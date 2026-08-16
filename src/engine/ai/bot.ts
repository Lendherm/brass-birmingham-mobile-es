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
export { evaluatePosition, deckTempoBonus, playerBeerSupply } from './positionEval';
export { planAIAction, simulateOpponentTurn } from './planner';
export { auditAIAction, auditAIGameplay, summarizeIssues, filterBySeverity } from './audit';
export { compareCoachMove, describeAction, shouldCoachHuman } from './coach';
export type { CoachFeedback, CoachVerdict } from './coach';
export { beliefHintForHuman, opponentFlexibility } from './beliefs';
export { monteCarloActionValue, enhanceHardScore } from './search';
export type { AIAuditReport } from './audit';

import type { GameState } from '../state';
import { planAIAction } from './planner';

/** Choose one legal Brass action for the active AI player. */
export function pickAIAction(state: GameState) {
  const difficulty = state.aiDifficulty ?? 'medium';
  return planAIAction(state, difficulty);
}
