import type { PlayPatternId } from './detectors';
import type { TrainingScenarioId } from './scenarios';
import { trainingScenarioMeta } from './scenarios';

export interface HabitDrillOffer {
  scenarioId: TrainingScenarioId;
  buttonLabel: string;
  reason: string;
}

/** Maps detected habits to a focused training scenario. */
export const HABIT_DRILL_MAP: Record<PlayPatternId, TrainingScenarioId> = {
  'coal-brewery-loop': 'sell-or-build',
  'network-heavy': 'network-timing',
  'sell-neglect': 'beer-scarcity',
  'network-streak': 'network-timing',
  'build-loop': 'develop-mat',
  'pass-streak': 'pass-tempo',
};

export function drillOfferForPattern(patternId: PlayPatternId): HabitDrillOffer {
  const scenarioId = HABIT_DRILL_MAP[patternId];
  const meta = trainingScenarioMeta(scenarioId);
  return {
    scenarioId,
    buttonLabel: `Practicar: ${meta.title}`,
    reason: meta.objective,
  };
}
