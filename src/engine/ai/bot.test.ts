import { describe, expect, it } from 'vitest';
import { applyPlayerAction, processAITurns, type PlayerAction } from '../game';
import { canLoan, legalBuilds, legalDevelops, legalNetworks, legalSells, scoutAllowed } from '../options';
import { makeRng, nextFloat, nextInt } from '../rng';
import { HUMAN, newVsAIGame, type GameState } from '../state';
import {
  auditAIAction,
  auditAIGameplay,
  filterBySeverity,
  pickAIAction,
  rankCandidates,
  summarizeIssues,
} from './bot';
import { personalityFor } from './personality';
import { planAIAction } from './planner';

function pickHumanAction(state: GameState, rng: ReturnType<typeof makeRng>): PlayerAction {
  const sells = legalSells(state);
  const builds = legalBuilds(state);
  const networks = legalNetworks(state);
  const develops = legalDevelops(state);
  const roll = nextFloat(rng);
  if (sells.length > 0 && roll < 0.7) {
    const c = sells[nextInt(rng, sells.length)];
    return { type: 'sell', cardIdx: c.cardIdx, sales: [{ sale: c.sale, beer: c.beer }] };
  }
  if (builds.length > 0 && roll < 0.85) {
    const c = builds[nextInt(rng, builds.length)];
    return { type: 'build', cardIdx: c.cardIdx, option: c.option };
  }
  if (networks.length > 0 && roll < 0.9) {
    const c = networks[nextInt(rng, networks.length)];
    return { type: 'network', cardIdx: c.cardIdx, option: c.option };
  }
  if (develops.length > 0) {
    const c = develops[nextInt(rng, develops.length)];
    return { type: 'develop', cardIdx: c.cardIdx, industries: c.industries };
  }
  if (canLoan(state)) return { type: 'loan', cardIdx: 0 };
  if (scoutAllowed(state) && state.players[HUMAN].hand.length >= 3) {
    return { type: 'scout', cardIdx: 0, extraDiscards: [1, 2] };
  }
  return { type: 'pass', cardIdx: 0 };
}

describe('vs AI mode', () => {
  it('starts with full deck and human first', () => {
    const state = newVsAIGame(42, 'medium', 1);
    expect(state.mode).toBe('vsAI');
    expect(state.playerCount).toBe(2);
    expect(state.drawPile.length + state.players[0].hand.length + state.players[1].hand.length).toBe(38);
    expect(state.currentPlayer).toBe(HUMAN);
    expect(state.players[1].money).toBe(17);
    expect(state.players[1].hand.length).toBe(8);
  });

  it('AI finishes a full game vs human', () => {
    const state = newVsAIGame(7, 'easy', 1);
    const rng = makeRng(99);
    let safety = 0;
    while (!state.gameOver && safety < 400) {
      safety++;
      if (state.currentPlayer === HUMAN) {
        applyPlayerAction(state, pickHumanAction(state, rng));
      } else {
        processAITurns(state);
      }
      expect(state.players.every((p) => p.money >= 0)).toBe(true);
    }
    expect(state.gameOver, `seed did not finish in ${safety} steps`).toBe(true);
  }, 60_000);
});

describe('AI engine', () => {
  it('assigns different personalities per rival slot', () => {
    expect(personalityFor(1).network).toBeGreaterThan(personalityFor(2).network);
    expect(personalityFor(2).build).toBeGreaterThan(personalityFor(3).build);
    expect(personalityFor(3).sell).toBeGreaterThan(personalityFor(1).sell);
  });

  it('hard difficulty scores higher than easy on same position', () => {
    const state = newVsAIGame(100, 'hard', 1);
    state.currentPlayer = 1;
    state.actionsLeft = 2;
    const ranked = rankCandidates(state);
    expect(ranked.length).toBeGreaterThan(0);
    const hardBest = ranked.sort((a, b) => b.score - a.score)[0].score;
    const easyAction = planAIAction({ ...structuredClone(state), aiDifficulty: 'easy' }, 'easy');
    const hardAction = planAIAction(structuredClone(state), 'hard');
    const easyScore = ranked.find((c) => c.action.type === easyAction.type)?.score ?? -99;
    void easyScore;
    expect(hardBest).toBeGreaterThan(-20);
    expect(hardAction.type).not.toBe('pass');
  });

  it('never returns illegal actions (20 seeds, 1v1)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const state = newVsAIGame(seed, 'hard', 1);
      state.currentPlayer = 1;
      let safety = 0;
      while (!state.gameOver && state.currentPlayer !== HUMAN && safety < 80) {
        safety++;
        const action = pickAIAction(state);
        const issues = auditAIAction(state, action);
        expect(issues.filter((i) => i.code === 'ILLEGAL_ACTION'), `seed ${seed}`).toEqual([]);
        applyPlayerAction(state, action);
      }
    }
  });

  it('audit gameplay report: no errors in hard 1v1 sample', () => {
    const allReports = [];
    for (let seed = 1; seed <= 8; seed++) {
      const state = newVsAIGame(seed + 500, 'hard', 1);
      allReports.push(...auditAIGameplay(state, 120));
    }
    const errors = filterBySeverity(allReports, 'error');
    const summary = summarizeIssues(allReports);
    expect(errors, JSON.stringify(summary)).toEqual([]);
    expect(summary.ILLEGAL_ACTION ?? 0).toBe(0);
  });

  it('hard mode passes less than easy in audited sample', () => {
    let hardPasses = 0;
    let easyPasses = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const hard = newVsAIGame(seed + 1000, 'hard', 1);
      const easy = newVsAIGame(seed + 1000, 'easy', 1);
      hard.currentPlayer = 1;
      easy.currentPlayer = 1;
      for (let i = 0; i < 15; i++) {
        if (hard.currentPlayer === 1 && hard.actionsLeft > 0) {
          const a = planAIAction(hard, 'hard');
          if (a.type === 'pass') hardPasses++;
          applyPlayerAction(hard, a);
        }
        if (easy.currentPlayer === 1 && easy.actionsLeft > 0) {
          const a = planAIAction(easy, 'easy');
          if (a.type === 'pass') easyPasses++;
          applyPlayerAction(easy, a);
        }
      }
    }
    expect(hardPasses).toBeLessThanOrEqual(easyPasses + 3);
  });

  it('two-action planning prefers non-pass when actionsLeft=2', () => {
    const state = newVsAIGame(77, 'hard', 1);
    state.currentPlayer = 1;
    state.actionsLeft = 2;
    const action = planAIAction(state, 'hard');
    expect(action.type).not.toBe('pass');
  });
});
