import type { TrainingCareerStats } from '../ai/trainingStats';
import { weaknessLabel } from '../ai/trainingStats';
import type { TrainingScenarioId } from './scenarios';
import { trainingScenarioMeta } from './scenarios';

/** Maps coach weakness keys to fixed training scenarios. */
export const WEAKNESS_DRILL_MAP: Record<string, TrainingScenarioId> = {
  pass: 'sell-or-build',
  sell: 'beer-scarcity',
  build: 'sell-or-build',
  network: 'canal-countdown',
  develop: 'rail-flip-race',
  wild: 'sell-or-build',
  tempo: 'canal-countdown',
  other: 'sell-or-build',
};

export function drillScenarioForWeakness(key: string): TrainingScenarioId {
  return WEAKNESS_DRILL_MAP[key] ?? 'sell-or-build';
}

export function topWeaknessKey(stats: TrainingCareerStats): string | null {
  const entries = Object.entries(stats.weaknessCounts).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? null;
}

export function recommendedWeaknessDrill(stats: TrainingCareerStats): {
  weaknessKey: string;
  label: string;
  scenarioId: TrainingScenarioId;
  scenarioTitle: string;
  count: number;
} | null {
  const key = topWeaknessKey(stats);
  if (!key) return null;
  const scenarioId = drillScenarioForWeakness(key);
  return {
    weaknessKey: key,
    label: weaknessLabel(key),
    scenarioId,
    scenarioTitle: trainingScenarioMeta(scenarioId).title,
    count: stats.weaknessCounts[key] ?? 0,
  };
}
