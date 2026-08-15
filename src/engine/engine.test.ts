import { describe, expect, it } from 'vitest';
import { AUTOMA, HUMAN, newGame } from './state';
import { applyPlayerAction } from './game';
import { legalBuilds, legalNetworks } from './options';
import { levelForSpace } from './income';

describe('game setup', () => {
  it('deals 8 cards and a 3-card canal draw pile (2p Mautoma setup)', () => {
    const state = newGame(42, 'easy');
    expect(state.players[HUMAN].hand).toHaveLength(8);
    expect(state.drawPile).toHaveLength(3);
    expect(state.actionsLeft).toBe(1);
    expect(state.players[HUMAN].money).toBe(17);
    expect(levelForSpace(state.players[HUMAN].incomeSpace)).toBe(0);
  });

  it('prepares a 22-card automa deck with the 10/3/9 structure', () => {
    const state = newGame(7, 'medium');
    expect(state.automaDecks[AUTOMA]).toHaveLength(22);
    expect(new Set(state.automaDecks[AUTOMA]).size).toBe(22);
  });

  it('is deterministic for a given seed', () => {
    const a = newGame(123, 'hard');
    const b = newGame(123, 'hard');
    expect(a.automaDecks[AUTOMA]).toEqual(b.automaDecks[AUTOMA]);
    expect(a.players[HUMAN].hand).toEqual(b.players[HUMAN].hand);
    expect(a.merchants).toEqual(b.merchants);
  });

  it('gives the Automa a difficulty-adjusted mat', () => {
    const easy = newGame(1, 'easy');
    const hard = newGame(1, 'hard');
    expect(easy.players[AUTOMA].mat.coal[0]).toBe(0);
    expect(easy.players[AUTOMA].mat.cotton[0]).toBe(2);
    expect(hard.players[AUTOMA].mat.goods[0]).toBe(0);
    expect(hard.players[AUTOMA].mat.iron[0]).toBe(0);
  });

  it('supports 1 human vs 3 Automa (4 players)', () => {
    const state = newGame(42, 'easy', 3);
    expect(state.playerCount).toBe(4);
    expect(state.players).toHaveLength(4);
    expect(state.players[HUMAN].hand).toHaveLength(8);
    expect(state.drawPile).toHaveLength(5); // 37 − 8 human − 3×8 rival hands
    expect(state.automaDecks[1]).toHaveLength(22);
    expect(state.automaDecks[2]).toHaveLength(22);
    expect(state.automaDecks[3]).toHaveLength(22);
  });
});

describe('first turn', () => {
  it('offers builds on the first turn and runs a full round after one action', () => {
    const state = newGame(42, 'easy');
    const builds = legalBuilds(state);
    expect(builds.length).toBeGreaterThan(0);
    const before = state.players[HUMAN].hand.length;
    applyPlayerAction(state, { type: 'build', cardIdx: builds[0].cardIdx, option: builds[0].option });
    // One action on turn 1 → automa ran, income round happened, turn 2 begins
    expect(state.turn).toBe(2);
    expect(state.actionsLeft).toBe(2);
    expect(state.players[HUMAN].hand.length).toBe(8);
    expect(before).toBe(8);
  });

  it('canal era: no rail-only links are offered', () => {
    const state = newGame(42, 'easy');
    // Give the player a network first so links are legal at all
    const builds = legalBuilds(state);
    applyPlayerAction(state, { type: 'build', cardIdx: builds[0].cardIdx, option: builds[0].option });
    for (const choice of legalNetworks(state)) {
      expect(choice.option.linkIds.every((id) => !['belper-leek', 'coventry-nuneaton'].includes(id))).toBe(true);
    }
  });
});

describe('loan', () => {
  it('adds £30 and drops three income levels', () => {
    const state = newGame(42, 'easy');
    applyPlayerAction(state, { type: 'loan', cardIdx: 0 });
    // Turn 1 had a single action; the round then ended with income -3
    expect(state.players[HUMAN].money).toBe(17 + 30 - 3);
    expect(levelForSpace(state.players[HUMAN].incomeSpace)).toBe(-3);
  });
});
