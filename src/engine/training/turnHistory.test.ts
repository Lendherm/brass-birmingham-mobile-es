import { describe, expect, it } from 'vitest';
import type { PlayerAction } from '../game';
import { newGame } from '../state';
import { detectHistoryPattern, recordTurnHistory } from './turnHistory';

describe('turnHistory', () => {
  it('records build industry', () => {
    const state = newGame(1, 'easy', 1);
    const action: PlayerAction = {
      type: 'build',
      cardIdx: 0,
      option: {
        city: 'birmingham',
        industry: 'coal',
        slot: 0,
        level: 1,
        overbuild: false,
        coalPlan: null,
        ironPlan: null,
        moneyCost: 5,
        totalCost: 5,
      },
    };
    const log = recordTurnHistory([], action, state);
    expect(log[0]?.industry).toBe('coal');
  });

  it('detects network streak', () => {
    const log = [
      { turn: 1, type: 'network' as const, linkId: 'a' },
      { turn: 1, type: 'network' as const, linkId: 'b' },
      { turn: 2, type: 'network' as const, linkId: 'c' },
    ];
    expect(detectHistoryPattern(log)?.id).toBe('network-streak');
  });
});
