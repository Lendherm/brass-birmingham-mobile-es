import { applyPlayerAction, type PlayerAction } from '../game';
import { nextInt } from '../rng';
import { type GameState, type PlayerId } from '../state';
import { rankCandidates, topCandidates } from './evaluate';
import { evaluatePosition } from './positionEval';
import { sampleBeliefStateSafe } from './cardBeliefs';
import { opponentFlexibility, primaryOpponent } from './beliefs';
import { pickByDifficulty } from './planner';
import type { AIDifficulty } from './types';

function cloneSim(state: GameState): GameState {
  const sim = structuredClone(state);
  sim.plannerSim = true;
  return sim;
}

function finishGreedyTurn(sim: GameState): void {
  let safety = 0;
  while (sim.actionsLeft > 0 && !sim.gameOver && safety < 4) {
    safety += 1;
    const candidates = rankCandidates(sim);
    if (candidates.length === 0) break;
    applyPlayerAction(sim, candidates.sort((a, b) => b.score - a.score)[0].action);
  }
}

/** Monte Carlo rollouts: our line + simulated rival response. */
export function monteCarloActionValue(
  state: GameState,
  player: PlayerId,
  firstAction: PlayerAction,
  rollouts = 2,
): number {
  let sum = 0;
  const rival = primaryOpponent(state, player);
  const rivalAggression: AIDifficulty = opponentFlexibility(state, rival) > 0.5 ? 'medium' : 'easy';

  for (let r = 0; r < rollouts; r++) {
    const sim = r === 0 ? cloneSim(state) : sampleBeliefStateSafe(state, player, r + 1);
    applyPlayerAction(sim, firstAction);
    finishGreedyTurn(sim);
    if (!sim.gameOver && sim.currentPlayer === rival) {
      let safety = 0;
      while (sim.currentPlayer === rival && sim.actionsLeft > 0 && !sim.gameOver && safety < 4) {
        safety += 1;
        const candidates = rankCandidates(sim);
        if (candidates.length === 0) break;
        const pick =
          r > 0 && candidates.length > 1
            ? candidates[nextInt(sim.rng, Math.min(3, candidates.length))].action
            : pickByDifficulty(sim, candidates, rivalAggression);
        applyPlayerAction(sim, pick);
      }
    }
    sum += evaluatePosition(sim, player);
  }
  return sum / rollouts;
}

/** Hard-mode planner helper: combine heuristic pair score with MC rollouts. */
export function enhanceHardScore(
  state: GameState,
  player: PlayerId,
  firstAction: PlayerAction,
  heuristicScore: number,
): number {
  const mc = monteCarloActionValue(state, player, firstAction, 2);
  return heuristicScore * 0.5 + mc * 0.5;
}

export function topActionsForSearch(state: GameState, n = 4): PlayerAction[] {
  return topCandidates(rankCandidates(state), n).map((c) => c.action);
}
