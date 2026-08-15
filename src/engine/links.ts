import type { PlayerCount } from './state';
import type { PlayerId } from './types';
import type { GameState } from './state';

/** Fichas de enlace por jugador (Brass Birmingham). */
export const LINK_SUPPLY: Record<PlayerCount, number> = {
  2: 10,
  3: 9,
  4: 8,
};

export function playerLinksPlaced(state: GameState, player: PlayerId): number {
  const stored = state.players[player].linksPlaced;
  if (stored != null) return stored;
  return Object.values(state.links).filter((owner) => owner === player).length;
}

export function playerLinksRemaining(state: GameState, player: PlayerId): number {
  return Math.max(0, LINK_SUPPLY[state.playerCount] - playerLinksPlaced(state, player));
}
