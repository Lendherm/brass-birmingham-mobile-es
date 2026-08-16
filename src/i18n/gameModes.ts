import type { PlayerCount } from '../engine/state';
import type { Era } from '../engine/types';
import type { AIDifficulty } from '../engine/ai/bot';
import type { MautomaDifficulty } from '../engine/mautoma/cards';

/** Full Brass deck size by player count (matches official digital / rulebook). */
export const BRASS_DECK_SIZE: Record<PlayerCount, number> = {
  2: 40,
  3: 54,
  4: 64,
};

/** Typical rounds per era in official multiplayer (Canal Era). */
export const BRASS_ERA_ROUNDS: Record<PlayerCount, number> = {
  2: 10,
  3: 9,
  4: 8,
};

/** Mautoma uses a trimmed era deck (rulebook §5). */
export const MAUTOMA_ERA_CARDS: Record<PlayerCount, { canal: number; rail: number }> = {
  2: { canal: 19, rail: 20 },
  3: { canal: 28, rail: 29 },
  4: { canal: 37, rail: 38 },
};

/** Approximate human turns per era in Mautoma (shorter than full Brass). */
export const MAUTOMA_ERA_ROUNDS: Record<PlayerCount, number> = {
  2: 6,
  3: 5,
  4: 5,
};

const DIFFICULTY_LABEL: Record<MautomaDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

const AI_DIFFICULTY_LABEL: Record<AIDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

export function eraDeckTotal(mode: 'solo' | 'hotseat' | 'vsAI', playerCount: PlayerCount, era: Era): number {
  return mode === 'solo' ? MAUTOMA_ERA_CARDS[playerCount][era] : BRASS_DECK_SIZE[playerCount];
}

/** Cards the human can still draw this era (hand + draw pile; rival hands set aside in solo). */
export function humanCardsInPlay(playerCount: PlayerCount, era: Era): number {
  const total = MAUTOMA_ERA_CARDS[playerCount][era];
  return total - 8 * (playerCount - 1);
}

export interface ModeIntroContent {
  title: string;
  subtitle: string;
  deckLine: string;
  roundsLine: string;
  rivalLine: string;
  whyTitle: string;
  whyBullets: string[];
  compareNote: string;
}

export function mautomaIntroContent(
  playerCount: PlayerCount,
  difficulty: MautomaDifficulty,
  automaCount: number,
): ModeIntroContent {
  const eraCards = MAUTOMA_ERA_CARDS[playerCount].canal;
  const humanCards = humanCardsInPlay(playerCount, 'canal');
  const rounds = MAUTOMA_ERA_ROUNDS[playerCount];

  return {
    title: 'Modo Mautoma (solo)',
    subtitle: `${automaCount} Automa · dificultad ${DIFFICULTY_LABEL[difficulty]} · equivale a ${playerCount} jugadores en tablero`,
    deckLine: `Mazo recortado: ${eraCards} cartas por era (Canal ${MAUTOMA_ERA_CARDS[playerCount].canal} · Ferrocarril ${MAUTOMA_ERA_CARDS[playerCount].rail}). Tú juegas ${humanCards} cartas por era; el resto simula manos rivales fuera del juego.`,
    roundsLine: `Duración aproximada: ~${rounds} rondas por era (partida más corta que el Brass completo).`,
    rivalLine:
      'El Automa no usa tus cartas: tiene su propia baraja de 22 cartas de acción. Construye, enlaza y puntúa en el tablero como un jugador más.',
    whyTitle: '¿Por qué jugar Mautoma?',
    whyBullets: [
      'Practicar solo cuando no hay oponentes humanos.',
      'Partidas más rápidas (~1 h frente a ~2 h del modo completo).',
      'Aprender reglas y probar estrategias contra una IA predecible.',
      'Tres niveles de dificultad según las fichas iniciales del Automa.',
    ],
    compareNote: `En el Brass oficial a ${playerCount} jugadores hay ${BRASS_DECK_SIZE[playerCount]} cartas y ~${BRASS_ERA_ROUNDS[playerCount]} rondas por era. Mautoma recorta el mazo a propósito.`,
  };
}

export function vsAIIntroContent(
  playerCount: PlayerCount,
  difficulty: AIDifficulty,
  aiCount: number,
): ModeIntroContent {
  const deck = BRASS_DECK_SIZE[playerCount];
  const rounds = BRASS_ERA_ROUNDS[playerCount];

  return {
    title: 'Contra IA (Brass oficial)',
    subtitle: `${aiCount} rival(es) IA · dificultad ${AI_DIFFICULTY_LABEL[difficulty]} · ${playerCount} jugadores en tablero`,
    deckLine: `Mazo completo: ${deck} cartas por era (mismas reglas que el digital oficial o la mesa). Tú y la IA roban del mismo mazo de ubicación e industria.`,
    roundsLine: `Duración aproximada: ~${rounds} rondas por era (Canal y Ferrocarril).`,
    rivalLine:
      'La IA juega con dinero, cartas, préstamos y scout como un humano. Sus turnos se ejecutan solos; tú solo juegas cuando es tu turno.',
    whyTitle: '¿Por qué jugar contra IA?',
    whyBullets: [
      'Brass completo sin depender del Automa ni de reglas recortadas.',
      'Entrenador comparativo tras cada jugada: tu línea vs la mejor de la IA.',
      'Practicar solo contra 1, 2 o 3 oponentes automáticos.',
      'Tres niveles de dificultad de la IA (heurística).',
    ],
    compareNote:
      'El modo Mautoma usa un mazo recortado y cartas propias del Automa. Aquí todas las reglas oficiales aplican a humano e IA.',
  };
}

export function hotseatIntroContent(playerCount: PlayerCount, names: string[]): ModeIntroContent {
  const deck = BRASS_DECK_SIZE[playerCount];
  const rounds = BRASS_ERA_ROUNDS[playerCount];

  return {
    title: 'Modo multijugador (Brass completo)',
    subtitle: `${playerCount} jugadores: ${names.slice(0, playerCount).join(', ')}`,
    deckLine: `Mazo completo: ${deck} cartas (como el juego digital oficial). Cada jugador empieza con 8 cartas; el resto forma el mazo de robo.`,
    roundsLine: `Duración aproximada: ~${rounds} rondas por era (Canal y Ferrocarril).`,
    rivalLine:
      'Todos usan las mismas cartas de ubicación e industria. El orden de turno cambia cada ronda: actúa antes quien gastó menos dinero.',
    whyTitle: '¿Por qué jugar multijugador?',
    whyBullets: [
      'Experiencia completa igual que el Brass digital o de mesa.',
      'Competir con amigos en el mismo teléfono (pantalla oculta entre turnos).',
      'Más cartas y más rondas = más planificación y presión en el tablero.',
      'Ideal cuando queréis la partida “larga” y equilibrada entre humanos.',
    ],
    compareNote:
      'El modo Mautoma usa solo 19–37 cartas por era (según jugadores simulados) para partidas más cortas en solitario.',
  };
}

export interface SetupModeCard {
  id: 'solo' | 'vsAI' | 'hotseat';
  label: string;
  tag: string;
  deck: string;
  rounds: string;
  bestFor: string;
}

export function setupModeCards(playerCount: PlayerCount): SetupModeCard[] {
  return [
    {
      id: 'vsAI',
      label: 'Contra IA',
      tag: 'Brass oficial · oponentes automáticos',
      deck: `${BRASS_DECK_SIZE[playerCount]} cartas (mazo completo)`,
      rounds: `~${BRASS_ERA_ROUNDS[playerCount]} rondas/era`,
      bestFor: 'Solo con reglas oficiales, como el juego de PC',
    },
    {
      id: 'solo',
      label: 'Mautoma (solo)',
      tag: 'Variante fan · oponente automático',
      deck: `${MAUTOMA_ERA_CARDS[playerCount].canal} cartas/era (recortado)`,
      rounds: `~${MAUTOMA_ERA_ROUNDS[playerCount]} rondas/era`,
      bestFor: 'Partidas cortas, variante Automa',
    },
    {
      id: 'hotseat',
      label: 'Multijugador local',
      tag: 'Brass oficial · pasar el teléfono',
      deck: `${BRASS_DECK_SIZE[playerCount]} cartas (mazo completo)`,
      rounds: `~${BRASS_ERA_ROUNDS[playerCount]} rondas/era`,
      bestFor: 'Amigos en el mismo teléfono',
    },
  ];
}
