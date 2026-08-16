import { cloneRng, shuffle, type Rng } from '../rng';
import { HUMAN, type Card, type GameState, type PlayerId } from '../state';

/** Stable identity for multiset counting of Brass cards. */
export function cardKey(card: Card): string {
  switch (card.kind) {
    case 'location':
      return `loc:${card.city}`;
    case 'industry':
      return `ind:${card.industries.join('+')}`;
    case 'wildLocation':
      return 'wild:loc';
    case 'wildIndustry':
      return 'wild:ind';
  }
}

/** Cards not visible to `observer` (draw pile + all opponent hands). */
export function unknownCardPool(state: GameState, observer: PlayerId): Card[] {
  const pool: Card[] = [...state.drawPile];
  for (let i = 0; i < state.playerCount; i++) {
    if (i !== observer) pool.push(...state.players[i].hand);
  }
  return pool;
}

export function countPoolByKey(cards: readonly Card[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const card of cards) {
    const key = cardKey(card);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Imperfect-information sample: keep observer hand, reshuffle hidden cards
 * into rival hands (same sizes) and draw pile.
 */
export function sampleBeliefState(state: GameState, observer: PlayerId, rng: Rng): GameState {
  const sim = structuredClone(state);
  sim.plannerSim = true;
  const pool = shuffle(rng, unknownCardPool(state, observer));
  let idx = 0;
  for (let i = 0; i < state.playerCount; i++) {
    if (i === observer) continue;
    const size = state.players[i].hand.length;
    sim.players[i].hand = pool.slice(idx, idx + size);
    idx += size;
  }
  sim.drawPile = pool.slice(idx);
  return sim;
}

/** Sample using a forked RNG so callers do not advance the live game RNG. */
export function sampleBeliefStateSafe(state: GameState, observer: PlayerId, salt = 0): GameState {
  const rng = cloneRng(state.rng);
  rng.state = (rng.state + salt * 9973) >>> 0;
  return sampleBeliefState(state, observer, rng);
}

/** Industry groups still likely in hidden pool (for human coach hints). */
export function hiddenIndustryPressure(state: GameState, observer: PlayerId = HUMAN): string | null {
  const pool = unknownCardPool(state, observer);
  let industryCards = 0;
  let wilds = 0;
  for (const card of pool) {
    if (card.kind === 'industry') industryCards++;
    if (card.kind === 'wildIndustry' || card.kind === 'wildLocation') wilds++;
  }
  const rivals = state.playerCount - 1;
  const avgPerRival = pool.length / Math.max(1, rivals);
  if (industryCards >= rivals * 2 && avgPerRival >= 5) {
    return `En el mazo oculto quedan ~${industryCards} cartas de industria: los rivales pueden tener manos de construcción.`;
  }
  if (wilds >= 2 && state.era === 'canal') {
    return 'Varios comodines siguen en juego oculto: vigila construcciones sorpresa en ciudades clave.';
  }
  return null;
}
