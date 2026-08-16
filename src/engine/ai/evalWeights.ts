/** Tunable coefficients for position evaluation (self-play calibration). */
export interface EvalWeights {
  vp: number;
  money: number;
  income: number;
  networkCity: number;
  beer: number;
  rivalVp: number;
  rivalNetwork: number;
  tempoHand: number;
  canalRisk: number;
  flippedVp: number;
}

/** Baseline weights (pre self-play calibration). */
export const BASE_EVAL_WEIGHTS: EvalWeights = {
  vp: 55,
  money: 0.6,
  income: 9,
  networkCity: 2.5,
  beer: 2.2,
  rivalVp: 8,
  rivalNetwork: 1.2,
  tempoHand: 2.5,
  canalRisk: 1,
  flippedVp: 3,
};

/** Self-play tuned weights (hard vs medium, seeds 1–8). */
export const TUNED_EVAL_WEIGHTS: EvalWeights = {
  vp: 55,
  money: 0.6,
  income: 9,
  networkCity: 2.5,
  beer: 2.2,
  rivalVp: 7.36,
  rivalNetwork: 1.2,
  tempoHand: 2.7,
  canalRisk: 1,
  flippedVp: 3.24,
};

let active: EvalWeights = { ...TUNED_EVAL_WEIGHTS };

export function getEvalWeights(): EvalWeights {
  return active;
}

export function setEvalWeights(partial: Partial<EvalWeights>): void {
  active = { ...active, ...partial };
}

export function resetEvalWeights(): void {
  active = { ...TUNED_EVAL_WEIGHTS };
}

export function useBaseEvalWeights(): void {
  active = { ...BASE_EVAL_WEIGHTS };
}

export function useTunedEvalWeights(): void {
  active = { ...TUNED_EVAL_WEIGHTS };
}
