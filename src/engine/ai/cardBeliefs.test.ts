import { describe, expect, it } from 'vitest';
import { cardsRemainingInGame } from './positionEval';
import { HUMAN, newVsAIGame } from '../state';
import {
  cardKey,
  countPoolByKey,
  sampleBeliefState,
  sampleBeliefStateSafe,
  unknownCardPool,
} from './cardBeliefs';
import { makeRng } from '../rng';

describe('cardBeliefs', () => {
  it('cardKey distinguishes card kinds', () => {
    expect(cardKey({ kind: 'wildLocation' })).toBe('wild:loc');
    expect(cardKey({ kind: 'wildIndustry' })).toBe('wild:ind');
    expect(cardKey({ kind: 'location', city: 'birmingham' })).toBe('loc:birmingham');
    expect(cardKey({ kind: 'industry', industries: ['coal', 'iron'] })).toBe('ind:coal+iron');
  });

  it('unknown pool excludes observer hand only', () => {
    const state = newVsAIGame(11, 'medium', 1);
    const pool = unknownCardPool(state, HUMAN);
    const totalCards = cardsRemainingInGame(state);
    expect(pool.length).toBe(totalCards - state.players[HUMAN].hand.length);
  });

  it('sampleBeliefState preserves hand sizes and total cards', () => {
    const state = newVsAIGame(22, 'medium', 1);
    const beforeTotal = cardsRemainingInGame(state);
    const rng = makeRng(999);
    const sampled = sampleBeliefState(state, HUMAN, rng);
    expect(sampled.players[HUMAN].hand).toEqual(state.players[HUMAN].hand);
    expect(sampled.players[1].hand.length).toBe(state.players[1].hand.length);
    expect(cardsRemainingInGame(sampled)).toBe(beforeTotal);
    expect(sampled.drawPile.length).toBe(state.drawPile.length);
  });

  it('sampleBeliefStateSafe does not mutate live rng', () => {
    const state = newVsAIGame(33, 'medium', 1);
    const rngBefore = state.rng.state;
    sampleBeliefStateSafe(state, 1, 3);
    expect(state.rng.state).toBe(rngBefore);
  });

  it('countPoolByKey aggregates multiset', () => {
    const state = newVsAIGame(44, 'medium', 1);
    const counts = countPoolByKey(unknownCardPool(state, HUMAN));
    let sum = 0;
    for (const n of counts.values()) sum += n;
    expect(sum).toBe(unknownCardPool(state, HUMAN).length);
  });
});
