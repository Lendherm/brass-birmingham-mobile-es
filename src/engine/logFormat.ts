import { HUMAN, log, playerLabel, type GameState, type PlayerId } from './state';

export const HUMAN_LOG_PREFIXES = [
  'Construiste',
  'Reconstruiste',
  'Vendiste',
  'Desarrollaste',
  'Pediste',
  'Exploraste',
  'Pasaste',
  'Volteaste',
  'Sumaste',
];

function toSecondPerson(clause: string): string {
  if (clause.startsWith('construyó')) return `construiste${clause.slice('construyó'.length)}`;
  if (clause.startsWith('reconstruyó')) return `reconstruiste${clause.slice('reconstruyó'.length)}`;
  if (clause.startsWith('vendió')) return `vendiste${clause.slice('vendió'.length)}`;
  if (clause.startsWith('desarrolló')) return `desarrollaste${clause.slice('desarrolló'.length)}`;
  if (clause.startsWith('pidió')) return `pediste${clause.slice('pidió'.length)}`;
  if (clause.startsWith('exploró')) return `exploraste${clause.slice('exploró'.length)}`;
  if (clause.startsWith('pasó')) return `pasaste${clause.slice('pasó'.length)}`;
  if (clause.startsWith('volteó')) return `volteaste${clause.slice('volteó'.length)}`;
  if (clause.startsWith('sumó')) return `sumaste${clause.slice('sumó'.length)}`;
  return clause;
}

/** Human player in solo uses "Construiste…"; rivals keep "Automa 1 construyó…". */
export function formatPlayerLogLine(state: GameState, player: PlayerId, thirdPersonClause: string): string {
  if (player === HUMAN && state.playerNames[HUMAN] === 'Tú') {
    const tu = toSecondPerson(thirdPersonClause);
    return tu.charAt(0).toUpperCase() + tu.slice(1);
  }
  return `${playerLabel(state, player)} ${thirdPersonClause}`;
}

export function logForPlayer(state: GameState, player: PlayerId, thirdPersonClause: string): void {
  log(state, formatPlayerLogLine(state, player, thirdPersonClause));
}

export function isHumanLogLine(text: string): boolean {
  return HUMAN_LOG_PREFIXES.some((prefix) => text.startsWith(prefix));
}
