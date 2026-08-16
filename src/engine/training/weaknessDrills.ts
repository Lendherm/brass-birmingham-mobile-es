import type { TrainingCareerStats } from '../ai/trainingStats';
import { weaknessLabel } from '../ai/trainingStats';
import type { TrainingScenarioId } from './scenarios';
import { trainingScenarioMeta } from './scenarios';

/** Maps coach weakness keys to dedicated training scenarios. */
export const WEAKNESS_DRILL_MAP: Record<string, TrainingScenarioId> = {
  pass: 'pass-tempo',
  sell: 'beer-scarcity',
  build: 'sell-or-build',
  network: 'network-timing',
  develop: 'develop-mat',
  wild: 'wild-spot',
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

export function drillsForWeakness(key: string): TrainingScenarioId[] {
  const primary = drillScenarioForWeakness(key);
  const extras: TrainingScenarioId[] = [];
  if (key === 'pass' || key === 'tempo') extras.push('canal-countdown');
  if (key === 'sell') extras.push('sell-or-build');
  if (key === 'build') extras.push('pass-tempo');
  return [primary, ...extras.filter((id) => id !== primary)];
}
