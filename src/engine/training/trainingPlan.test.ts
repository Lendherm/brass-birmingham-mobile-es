import { describe, expect, it } from 'vitest';
import { newGame } from '../state';
import { canalEraChecklistSteps } from './trainingPlan';

describe('canalEraChecklistSteps', () => {
  it('warns about canal-only industries near era end', () => {
    const state = newGame(11, 'medium', 1);
    state.era = 'canal';
    state.actionsLeft = 2;
    state.board.walsall[1] = { industry: 'cotton', level: 1, owner: 0, resources: 0, flipped: false };
    const steps = canalEraChecklistSteps(state);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]?.label).toContain('Canal');
  });
});
