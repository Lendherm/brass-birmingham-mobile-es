import { describe, expect, it } from 'vitest';
import { newGame } from '../state';
import { newTrainingScenario } from './scenarios';
import { buildHandStrategyGuide } from './handStrategy';

describe('buildHandStrategyGuide', () => {
  it('summarizes board and hand', () => {
    const state = newGame(21, 'medium', 1);
    state.actionsLeft = 8;
    const guide = buildHandStrategyGuide(state);
    expect(guide.boardSummary).toContain('Mano:');
    expect(guide.themes.length).toBeGreaterThan(0);
    expect(guide.cardLines.length).toBe(state.players[0].hand.length);
  });

  it('prioritizes sell theme in sell-or-build scenario', () => {
    const state = newTrainingScenario('sell-or-build');
    const guide = buildHandStrategyGuide(state);
    expect(guide.themes.some((t) => t.id === 'sell-window')).toBe(true);
  });

  it('puts focused card first', () => {
    const state = newGame(22, 'easy', 1);
    state.actionsLeft = 8;
    const guide = buildHandStrategyGuide(state, 1);
    expect(guide.cardLines[0]?.cardIdx).toBe(1);
  });

  it('gives per-card play or blocked advice', () => {
    const state = newGame(23, 'easy', 1);
    state.actionsLeft = 8;
    const guide = buildHandStrategyGuide(state);
    for (const line of guide.cardLines) {
      expect(line.cardLabel.length).toBeGreaterThan(0);
      expect(line.play.length).toBeGreaterThan(0);
      expect(line.strategy.length).toBeGreaterThan(5);
    }
  });
});
