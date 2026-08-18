import { describeAction, reasonsForAction } from '../ai/coach';
import { rankCandidates } from '../ai/evaluate';
import { simulateOpponentTurn } from '../ai/planner';
import { applyPlayerAction } from '../game';
import { tileSpec } from '../data/industries';
import { HUMAN, type GameState } from '../state';
import { scoreToQualityPct } from './trainingHints';

export interface TrainingPlanStep {
  /** now | next | later */
  phase: 'now' | 'next' | 'later';
  label: string;
  pct: number;
  reason: string;
}

function cloneSim(state: GameState): GameState {
  const sim = structuredClone(state);
  sim.plannerSim = true;
  return sim;
}

function rankedSpread(sim: GameState) {
  const ranked = rankCandidates(sim);
  const sorted = [...ranked].sort((a, b) => b.score - a.score);
  return {
    ranked,
    best: sorted[0]?.score ?? 0,
    worst: sorted[sorted.length - 1]?.score ?? 0,
  };
}

function bestHumanAction(sim: GameState) {
  const { ranked, best, worst } = rankedSpread(sim);
  const pick =
    ranked.filter((c) => c.action.type !== 'pass').sort((a, b) => b.score - a.score)[0] ??
    ranked.sort((a, b) => b.score - a.score)[0];
  if (!pick) return null;
  return { pick, pct: scoreToQualityPct(pick.score, best, worst) };
}

/** Finish the active human turn in simulation (greedy). */
function finishHumanTurn(sim: GameState): void {
  let safety = 0;
  while (sim.currentPlayer === HUMAN && sim.actionsLeft > 0 && !sim.gameOver && safety < 4) {
    safety += 1;
    const next = bestHumanAction(sim);
    if (!next) break;
    applyPlayerAction(sim, next.pick.action);
  }
}

function advanceToHuman(sim: GameState): void {
  let safety = 0;
  while (sim.currentPlayer !== HUMAN && !sim.gameOver && safety < 12) {
    safety += 1;
    simulateOpponentTurn(sim, sim.currentPlayer);
  }
}

/** Checklist steps when Canal era is ending. */
export function canalEraChecklistSteps(state: GameState): TrainingPlanStep[] {
  if (state.era !== 'canal' || state.actionsLeft > 5) return [];

  const steps: TrainingPlanStep[] = [];
  let canalOnlyUnflipped = 0;

  for (const slots of Object.values(state.board)) {
    for (const tile of slots) {
      if (!tile || tile.owner !== HUMAN || tile.flipped) continue;
      const spec = tileSpec(tile.industry, tile.level);
      if (spec.eras.length === 1) canalOnlyUnflipped += 1;
    }
  }

  if (canalOnlyUnflipped > 0) {
    steps.push({
      phase: 'now',
      label: `Voltea o desarrolla ${canalOnlyUnflipped} industria(s) de solo era Canal`,
      pct: Math.min(92, 45 + canalOnlyUnflipped * 12),
      reason: 'Desaparecen al cambiar de era si no actúas ya.',
    });
  }

  if (state.actionsLeft <= 3) {
    steps.push({
      phase: 'next',
      label: `${state.actionsLeft} acción(es) restantes en era Canal`,
      pct: 78,
      reason: 'Enlaces sin PV desaparecen; cierra ventas y construcciones canal-first.',
    });
  }

  return steps;
}

/** 2–3 step plan: now + next human turns (light sim with rival response). */
export function buildTrainingPlan(state: GameState, humanRounds = 3): TrainingPlanStep[] {
  const canalSteps = canalEraChecklistSteps(state);
  const sim = cloneSim(state);
  const phases: TrainingPlanStep['phase'][] = ['now', 'next', 'later'];
  const steps: TrainingPlanStep[] = [];

  for (let i = 0; i < humanRounds && !sim.gameOver; i++) {
    advanceToHuman(sim);
    if (sim.currentPlayer !== HUMAN || sim.gameOver) break;

    const choice = bestHumanAction(sim);
    if (!choice) break;

    steps.push({
      phase: phases[i] ?? 'later',
      label: describeAction(sim, choice.pick.action),
      pct: choice.pct,
      reason: reasonsForAction(sim, choice.pick, HUMAN)[0] ?? 'Línea recomendada por valor táctico.',
    });

    applyPlayerAction(sim, choice.pick.action);
    finishHumanTurn(sim);
    if (sim.currentPlayer !== HUMAN) simulateOpponentTurn(sim, sim.currentPlayer);
  }

  if (canalSteps.length > 0) {
    return [...canalSteps, ...steps].slice(0, 4);
  }
  return steps;
}
