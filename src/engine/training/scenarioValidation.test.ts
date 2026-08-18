import { describe, expect, it } from 'vitest';
import { newTrainingScenario } from './scenarios';
import { evaluateScenarioProgress } from './scenarioValidation';

describe('evaluateScenarioProgress', () => {
  it('detects sell-or-build on-track with legal sell', () => {
    const state = newTrainingScenario('sell-or-build');
    const progress = evaluateScenarioProgress(state);
    expect(progress?.status).toBe('on-track');
    expect(progress?.progressPct).toBeGreaterThan(40);
  });

  it('marks sell-or-build completed after flip', () => {
    const state = newTrainingScenario('sell-or-build');
    state.board.worcester[0]!.flipped = true;
    const progress = evaluateScenarioProgress(state);
    expect(progress?.status).toBe('completed');
  });

  it('detects network-timing progress', () => {
    const state = newTrainingScenario('network-timing');
    const progress = evaluateScenarioProgress(state);
    expect(progress?.status).toBe('on-track');
  });
});
