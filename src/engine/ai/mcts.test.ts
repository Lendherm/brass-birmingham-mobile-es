import { describe, expect, it } from 'vitest';
import { auditAIAction } from './bot';
import { mctsPickAction } from './mcts';
import { planAIAction } from './planner';
import { newVsAIGame } from '../state';
import { applyPlayerAction } from '../game';

describe('mcts', () => {
  it('returns a legal action with fixed iterations', () => {
    const state = newVsAIGame(55, 'tournament', 1);
    state.currentPlayer = 1;
    state.actionsLeft = 2;
    const action = mctsPickAction(state, 1, { maxIterations: 12, topN: 4 });
    const issues = auditAIAction(state, action);
    expect(issues.filter((i) => i.code === 'ILLEGAL_ACTION')).toEqual([]);
    expect(action.type).not.toBe('pass');
  });

  it('tournament planner never picks illegal moves (sample seeds)', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const state = newVsAIGame(seed + 2000, 'tournament', 1);
      state.currentPlayer = 1;
      let safety = 0;
      while (!state.gameOver && state.currentPlayer !== 0 && safety < 15) {
        safety++;
        const action = planAIAction(state, 'tournament');
        const issues = auditAIAction(state, action);
        expect(issues.filter((i) => i.code === 'ILLEGAL_ACTION'), `seed ${seed}`).toEqual([]);
        applyPlayerAction(state, action);
      }
    }
  }, 60_000);

  it('respects time budget without hanging', () => {
    const state = newVsAIGame(66, 'tournament', 1);
    state.currentPlayer = 1;
    const start = Date.now();
    mctsPickAction(state, 1, { timeBudgetMs: 30, topN: 5 });
    expect(Date.now() - start).toBeLessThan(500);
  });
});
