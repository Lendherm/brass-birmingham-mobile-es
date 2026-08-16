import { tileSpec } from '../data/industries';
import { connectedToMarket, playerNetwork } from '../connectivity';
import { levelForSpace } from '../income';
import { estimateTurnsUntilEraEnd } from '../canalEraWarnings';
import { activePlayer, type GameState } from '../state';
import type { CityId, IndustryType, PlayerId } from '../types';
import { getEvalWeights } from './evalWeights';

/** Cards still in play (hands + draw pile). Lower = less tempo left. */
export function cardsRemainingInGame(state: GameState): number {
  return state.drawPile.length + state.players.reduce((sum, p) => sum + p.hand.length, 0);
}

/** Rough tempo value: having cards left when rivals are dry is good. */
export function deckTempoBonus(state: GameState, player: PlayerId = activePlayer(state)): number {
  const w = getEvalWeights();
  const mine = state.players[player].hand.length;
  const total = cardsRemainingInGame(state);
  if (total === 0) return 0;
  const avg = total / state.playerCount;
  return (mine - avg) * w.tempoHand + (state.drawPile.length > 0 ? 1 : 0);
}

/** Beer on own breweries plus reachable merchant beer slots. */
export function playerBeerSupply(state: GameState, player: PlayerId): number {
  let beer = 0;
  for (const slots of Object.values(state.board)) {
    for (const tile of slots) {
      if (tile?.owner === player && tile.industry === 'brewery' && !tile.flipped) {
        beer += tile.resources;
      }
    }
  }
  for (const m of state.merchants) {
    beer += m.beer.filter(Boolean).length * 0.5;
  }
  return beer;
}

export function countNetworkCities(state: GameState, player: PlayerId): number {
  let cities = 0;
  for (const city of playerNetwork(state, player)) {
    if (!(city in state.board)) continue;
    cities += 1;
  }
  return cities;
}

/** Bonus for expanding network toward market or empty industry slots. */
export function networkExpansionValue(state: GameState, city: CityId, player: PlayerId): number {
  let bonus = 0;
  if (connectedToMarket(state, city)) bonus += 4;
  const net = playerNetwork(state, player);
  if (net.has(city)) bonus += 2;
  const emptySlots = state.board[city].filter((t) => t == null).length;
  bonus += emptySlots * 1.5;
  return bonus;
}

/** Penalty when era Canal ends soon and level-1 tiles remain. */
export function canalExpiryRisk(state: GameState, player: PlayerId): number {
  if (state.era !== 'canal') return 0;
  const turns = estimateTurnsUntilEraEnd(state);
  let risk = 0;
  for (const slots of Object.values(state.board)) {
    for (const tile of slots) {
      if (tile?.owner !== player || tile.level !== 1) continue;
      const spec = tileSpec(tile.industry, tile.level);
      if (spec.eras.length === 1) risk += turns <= 2 ? 12 : 6;
      else risk += turns <= 2 ? 5 : 2;
    }
  }
  return risk;
}

/** Aggregate position score for lookahead simulation. */
export function evaluatePosition(state: GameState, player: PlayerId): number {
  const w = getEvalWeights();
  const p = state.players[player];
  let score = p.vp * w.vp + p.money * w.money + levelForSpace(p.incomeSpace) * w.income;
  score += countNetworkCities(state, player) * w.networkCity;
  score += deckTempoBonus(state, player);
  score += playerBeerSupply(state, player) * w.beer;

  for (const slots of Object.values(state.board)) {
    for (const tile of slots) {
      if (tile?.owner !== player) continue;
      const spec = tileSpec(tile.industry, tile.level);
      if (tile.flipped) score += spec.vp * w.flippedVp;
      else if (tile.industry === 'coal' || tile.industry === 'iron') score += tile.resources * 2;
    }
  }

  score -= canalExpiryRisk(state, player) * w.canalRisk;

  for (let i = 0; i < state.playerCount; i++) {
    if (i === player) continue;
    score -= state.players[i].vp * w.rivalVp;
    score -= countNetworkCities(state, i as PlayerId) * w.rivalNetwork;
  }

  return score;
}

/** Action-level bonus hooks used by evaluate.ts */
export function bonusForBuild(state: GameState, city: CityId, industry: IndustryType, player: PlayerId): number {
  let bonus = networkExpansionValue(state, city, player);
  bonus += deckTempoBonus(state, player) * 0.15;
  if (industry === 'brewery') bonus += playerBeerSupply(state, player) * 0.4;
  if (state.era === 'canal') bonus -= canalExpiryRisk(state, player) * 0.08;
  return bonus;
}

export function bonusForSell(state: GameState, player: PlayerId): number {
  let bonus = playerBeerSupply(state, player) * -0.5;
  if (state.era === 'canal') bonus += canalExpiryRisk(state, player) * 0.12;
  bonus += deckTempoBonus(state, player) * 0.1;
  return bonus;
}

export function bonusForNetwork(state: GameState, city: CityId, player: PlayerId): number {
  return networkExpansionValue(state, city, player) + deckTempoBonus(state, player) * 0.1;
}
