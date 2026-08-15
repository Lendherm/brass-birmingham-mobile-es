import type { CityId, LocationId, PlayerId } from './types';
import { LINKS, MERCHANTS, isMerchant } from './data/board';
import { tileSpec } from './data/industries';
import { logForPlayer } from './logFormat';
import { automaOpponentIds, isSolo, log, playerLabel, type GameState } from './state';

/** Link VP contributed by one location (city tiles' link icons, merchants = 2). */
export function locationLinkVP(state: GameState, id: LocationId): number {
  if (isMerchant(id)) return MERCHANTS[id].linkVP;
  let total = 0;
  for (const tile of state.board[id as CityId]) {
    if (tile) total += tileSpec(tile.industry, tile.level).linkVP;
  }
  return total;
}

export function scoreLinks(state: GameState): void {
  for (const link of LINKS) {
    const owner = state.links[link.id];
    if (owner == null) continue;
    let vp = 0;
    for (const end of link.endpoints) vp += locationLinkVP(state, end);
    state.players[owner].vp += vp;
    logForPlayer(state, owner, `sumó ${vp} PV por el enlace ${link.id}.`);
  }
}

export function scoreFlippedIndustries(state: GameState): void {
  const totals = Array(state.playerCount).fill(0);
  for (const slots of Object.values(state.board)) {
    for (const tile of slots) {
      if (tile?.flipped) totals[tile.owner] += tileSpec(tile.industry, tile.level).vp;
    }
  }
  for (let i = 0; i < state.playerCount; i++) {
    state.players[i].vp += totals[i];
  }
  if (isSolo(state)) {
    const parts = [`tú +${totals[0]} PV`];
    for (const id of automaOpponentIds(state)) parts.push(`${playerLabel(state, id)} +${totals[id]} PV`);
    log(state, `Puntuación de era: ${parts.join(', ')}.`);
  } else {
    log(
      state,
      `Puntuación de era: ${totals.map((t, i) => `${state.playerNames[i]} +${t} PV`).join(', ')}.`,
    );
  }
}

/** VP per player from links and flipped industries, without mutating state. */
export function computeEraScoreBreakdown(state: GameState): { linkVp: number[]; industryVp: number[] } {
  const linkVp = Array(state.playerCount).fill(0);
  for (const link of LINKS) {
    const owner = state.links[link.id];
    if (owner == null) continue;
    let vp = 0;
    for (const end of link.endpoints) vp += locationLinkVP(state, end);
    linkVp[owner] += vp;
  }
  const industryVp = Array(state.playerCount).fill(0);
  for (const slots of Object.values(state.board)) {
    for (const tile of slots) {
      if (tile?.flipped) industryVp[tile.owner] += tileSpec(tile.industry, tile.level).vp;
    }
  }
  return { linkVp, industryVp };
}

/** End-of-Canal-Era cleanup: links off, level-1 tiles off, beer restock. */
export function canalEraCleanup(state: GameState): void {
  for (const link of LINKS) state.links[link.id] = null;
  for (const [cityId, slots] of Object.entries(state.board)) {
    slots.forEach((tile, i) => {
      if (tile && tile.level === 1) state.board[cityId as CityId][i] = null;
    });
  }
  for (const merchant of state.merchants) {
    merchant.beer = merchant.tiles.map((t) => t !== 'blank');
  }
  for (const id of automaOpponentIds(state)) {
    const automaMat = state.players[id].mat;
    for (const [industry, track] of Object.entries(automaMat)) {
      track.forEach((count, i) => {
        if (count > 0 && !tileSpec(industry as never, i + 1).eras.includes('rail')) {
          track[i] = 0;
        }
      });
    }
  }
  log(state, 'Fin de la Era Canal: enlaces y industrias nivel 1 retirados, cerveza de comerciantes repuesta.');
}

export function playerScoreSummary(state: GameState, player: PlayerId): { vp: number; income: number; money: number } {
  return { vp: state.players[player].vp, income: state.players[player].incomeSpace, money: state.players[player].money };
}
