import { HUMAN, type GameState, type PlayerId } from './state';
import { isHumanLogLine } from './logFormat';

export interface ClassifiedLogLine {
  index: number;
  text: string;
  playerId: PlayerId | null;
}

/** Assign each log line to a player (or system) for colored history rendering. */
export function classifyGameLog(state: GameState): ClassifiedLogLine[] {
  const byName = state.playerNames
    .map((name, id) => ({ name, id: id as PlayerId }))
    .sort((a, b) => b.name.length - a.name.length);

  return state.log.map((text, index) => {
    if (text.startsWith('Ingresos:') || isHumanLogLine(text)) {
      return { index, text, playerId: HUMAN };
    }
    if (text.startsWith('Partida iniciada') || text.startsWith('Nueva partida')) {
      return { index, text, playerId: null };
    }
    for (const { name, id } of byName) {
      if (text.startsWith(name)) return { index, text, playerId: id };
    }
    return { index, text, playerId: null };
  });
}

export function logLineClass(playerId: PlayerId | null): string {
  if (playerId == null) return 'game-history-line game-history-line-system';
  return `game-history-line game-history-line-p${playerId}`;
}
