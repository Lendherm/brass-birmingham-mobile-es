import type { PlayerAction } from '../game';
import type { GameState } from '../state';
import type { IndustryType } from '../types';
import type { PlayPattern } from './detectors';

export interface TurnHistoryEntry {
  turn: number;
  type: PlayerAction['type'];
  industry?: IndustryType;
  linkId?: string;
}

const MAX_LOG = 24;

export function recordTurnHistory(
  log: TurnHistoryEntry[],
  action: PlayerAction,
  stateBefore: GameState,
): TurnHistoryEntry[] {
  const entry: TurnHistoryEntry = { turn: stateBefore.turn, type: action.type };
  if (action.type === 'build') entry.industry = action.option.industry;
  if (action.type === 'network') entry.linkId = action.option.linkIds[0];
  return [...log, entry].slice(-MAX_LOG);
}

/** Patterns from recent human moves (habits across turns). */
export function detectHistoryPattern(log: TurnHistoryEntry[]): PlayPattern | null {
  if (log.length < 3) return null;
  const recent = log.slice(-8);

  const networks = recent.filter((e) => e.type === 'network').length;
  const sells = recent.filter((e) => e.type === 'sell').length;
  const builds = recent.filter((e) => e.type === 'build');
  const passes = recent.filter((e) => e.type === 'pass').length;

  if (networks >= 3 && sells === 0 && builds.length <= 1) {
    return {
      id: 'network-streak',
      title: 'Hábito: muchas redes seguidas',
      message: `En tus últimas ${recent.length} jugadas colocaste ${networks} enlaces sin vender ni construir casi nada.`,
      pivot: 'Para antes de gastar la última ficha de red: ¿hay venta o industria que puntúe en ciudades ya conectadas?',
    };
  }

  const loopBuilds = builds.filter(
    (b) => b.industry === 'coal' || b.industry === 'cotton' || b.industry === 'brewery',
  );
  if (loopBuilds.length >= 3 && sells === 0) {
    return {
      id: 'build-loop',
      title: 'Hábito: construir mina/algodón/cerveza en bucle',
      message: 'Repites construcciones del mismo ecosistema sin voltear industrias.',
      pivot: 'El siguiente paso pro suele ser vender (ingresos) o desarrollar (niveles altos), no otro N1 igual.',
    };
  }

  if (passes >= 2 && networks === 0 && builds.length === 0) {
    return {
      id: 'pass-streak',
      title: 'Hábito: pasar sin plan',
      message: 'Varios pases seguidos ceden tempo y dejan cartas muertas.',
      pivot: 'Prueba explorar, préstamo puntual, o una venta/enlace que desbloquee la mano.',
    };
  }

  return null;
}

export function mergePatternDetection(
  state: GameState,
  log: TurnHistoryEntry[],
  boardPattern: PlayPattern | null,
): PlayPattern | null {
  return detectHistoryPattern(log) ?? boardPattern;
}
