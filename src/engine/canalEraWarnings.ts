import { CITIES, LINKS } from './data/board';
import { activePlayer, HUMAN, isSolo, isTutorial, type GameState, type PlayerId } from './state';
import type { CityId, IndustryType } from './types';

/** Show map alert when estimated full turns until era end are at or below this. */
export const CANAL_ERA_URGENT_TURNS = 2;

export interface Level1TileRisk {
  cityId: CityId;
  slot: number;
  industry: IndustryType;
}

export function level1TilesForPlayer(state: GameState, playerId: PlayerId = activePlayer(state)): Level1TileRisk[] {
  const out: Level1TileRisk[] = [];
  for (const [cityId, slots] of Object.entries(state.board)) {
    slots.forEach((tile, slot) => {
      if (!tile || tile.owner !== playerId || tile.level !== 1) return;
      out.push({ cityId: cityId as CityId, slot, industry: tile.industry });
    });
  }
  return out;
}

export function linksForPlayer(state: GameState, playerId: PlayerId = activePlayer(state)): number {
  return LINKS.filter((link) => state.links[link.id] === playerId).length;
}

/** Rough estimate of full turns (rondas en solo) until the era ends. */
export function estimateTurnsUntilEraEnd(state: GameState): number {
  if (isSolo(state)) {
    const hand = state.players[HUMAN].hand.length;
    const pile = state.drawPile.length;
    if (hand === 0 && pile === 0) return 0;
    const cardActions = hand + pile;
    let turns = state.actionsLeft > 0 ? 1 : 0;
    const remaining = Math.max(0, cardActions - state.actionsLeft);
    if (remaining > 0) turns += Math.ceil(remaining / 2);
    return turns;
  }

  const totalCards = state.drawPile.length + state.players.reduce((sum, p) => sum + p.hand.length, 0);
  if (totalCards === 0) return state.actionsLeft > 0 ? 1 : 0;
  const actionsPerRound = Math.max(1, 2 * state.playerCount);
  return Math.ceil((totalCards + state.actionsLeft) / actionsPerRound);
}

export interface CanalEraWarningView {
  level1Tiles: Level1TileRisk[];
  linkCount: number;
  turnsLeft: number;
  urgent: boolean;
}

export function canalEraWarning(state: GameState): CanalEraWarningView | null {
  if (state.era !== 'canal' || state.gameOver || state.pendingEraScore || isTutorial(state)) return null;

  const playerId = activePlayer(state);
  const level1Tiles = level1TilesForPlayer(state, playerId);
  const linkCount = linksForPlayer(state, playerId);
  if (level1Tiles.length === 0 && linkCount === 0) return null;

  const turnsLeft = estimateTurnsUntilEraEnd(state);
  const urgent = level1Tiles.length > 0 && turnsLeft <= CANAL_ERA_URGENT_TURNS;

  return { level1Tiles, linkCount, turnsLeft, urgent };
}

export function formatLevel1CityList(tiles: Level1TileRisk[], max = 3): string {
  const names = tiles.slice(0, max).map((t) => CITIES[t.cityId].name);
  if (tiles.length > max) return `${names.join(', ')} +${tiles.length - max}`;
  return names.join(', ');
}
