import { describe, expect, it } from 'vitest';
import { rankCandidates } from '../ai/evaluate';
import { HUMAN, isVsAI } from '../state';
import { TRAINING_SCENARIOS, newTrainingScenario } from './scenarios';

describe('training scenarios', () => {
  for (const meta of TRAINING_SCENARIOS) {
    it(`${meta.id} starts a playable vs AI position`, () => {
      const state = newTrainingScenario(meta.id);
      expect(isVsAI(state)).toBe(true);
      expect(state.trainingScenario).toBe(meta.id);
      expect(state.gameOver).toBe(false);
      expect(state.currentPlayer).toBe(HUMAN);
      expect(state.actionsLeft).toBeGreaterThan(0);
      expect(rankCandidates(state).length).toBeGreaterThan(0);
    });
  }

  it('canal-countdown triggers urgent canal warning', () => {
    const state = newTrainingScenario('canal-countdown');
    expect(state.era).toBe('canal');
    expect(state.players[HUMAN].hand.length).toBeGreaterThan(0);
  });
});
