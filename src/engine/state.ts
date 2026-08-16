import type { CityId, Era, IndustryType, LocationId, MerchantId, MerchantTileKind, PlayerId } from './types';

export type { PlayerId } from './types';
import {
  CITIES,
  INDUSTRY_CARDS,
  LOCATION_CARDS,
  MERCHANTS,
  MERCHANT_TILE_GROUPS,
  MERCHANT_TILE_MIX,
} from './data/board';
import { INDUSTRY_TRACKS } from './data/industries';
import { COAL_MARKET, IRON_MARKET } from './market';
import { STARTING_SPACE } from './income';
import type { AIDifficulty } from './ai/types';
import type { TrainingScenarioId } from './training/scenarios';
import { MAUTOMA_CARDS, MAUTOMA_MATS, type MautomaDifficulty } from './mautoma/cards';
import { makeRng, shuffle, type Rng } from './rng';

export type GameMode = 'solo' | 'hotseat' | 'vsAI' | 'tutorial';
export type PlayerCount = 2 | 3 | 4;

export const HUMAN: PlayerId = 0;
export const AUTOMA: PlayerId = 1;

export type Card =
  | { kind: 'location'; city: CityId }
  | { kind: 'industry'; industries: readonly IndustryType[] }
  | { kind: 'wildLocation' }
  | { kind: 'wildIndustry' };

export interface PlacedTile {
  owner: PlayerId;
  industry: IndustryType;
  level: number;
  flipped: boolean;
  resources: number;
}

export interface MerchantState {
  id: MerchantId;
  tiles: MerchantTileKind[];
  beer: boolean[];
}

export interface PlayerState {
  money: number;
  spent: number;
  incomeSpace: number;
  vp: number;
  hand: Card[];
  mat: Record<IndustryType, number[]>;
  /** Enlaces colocados desde la reserva del jugador. */
  linksPlaced?: number;
}

export interface EraScorePlayerLine {
  playerId: PlayerId;
  label: string;
  linkVp: number;
  industryVp: number;
  totalVp: number;
  vpAfter: number;
}

export interface PendingEraScore {
  era: Era;
  lines: EraScorePlayerLine[];
  gameOver: boolean;
  ranking?: { label: string; vp: number }[];
  resultMessage?: string;
}

export interface GameState {
  mode: GameMode;
  playerCount: PlayerCount;
  seed: number;
  rng: Rng;
  difficulty?: MautomaDifficulty;
  aiDifficulty?: AIDifficulty;
  era: Era;
  turn: number;
  actionsLeft: number;
  /** Solo: always human. Hotseat: who is playing now. */
  currentPlayer: PlayerId;
  currentPlayerIndex: number;
  turnOrder: PlayerId[];
  playerNames: string[];
  moneySpentThisRound: number[];
  firstTurnOfGame: boolean;
  players: PlayerState[];
  board: Record<CityId, (PlacedTile | null)[]>;
  links: Record<string, PlayerId | null>;
  coalCubes: number;
  ironCubes: number;
  merchants: MerchantState[];
  drawPile: Card[];
  /** Per-Automa Mautoma state (solo mode, player ids 1..N). */
  automaDecks: Partial<Record<PlayerId, number[]>>;
  automaDiscards: Partial<Record<PlayerId, number[]>>;
  automaLastCities: Partial<Record<PlayerId, CityId | null>>;
  automaFirstTurnDone: Partial<Record<PlayerId, boolean>>;
  /** Internal: which Automa is executing during runAutomaTurn. */
  executingAutoma?: PlayerId;
  gameOver: boolean;
  log: string[];
  /** Modal de puntuación de era pendiente de cerrar (null = ninguno). */
  pendingEraScore?: PendingEraScore | null;
  /** Escenario fijo de entrenamiento (modo vs AI). */
  trainingScenario?: TrainingScenarioId;
  /** Evita turnos IA automáticos durante simulación del planner. */
  plannerSim?: boolean;
}

export function isSolo(state: GameState): boolean {
  return state.mode === 'solo';
}

export function isTutorial(state: GameState): boolean {
  return state.mode === 'tutorial';
}

/** Solo or tutorial: human vs Automa UI and one human player. */
export function isVsAutoma(state: GameState): boolean {
  return state.mode === 'solo' || state.mode === 'tutorial';
}

export function isVsAI(state: GameState): boolean {
  return state.mode === 'vsAI';
}

/** Full Brass rules with turn order and shared deck (hotseat or vs AI). */
export function isFullBrass(state: GameState): boolean {
  return state.mode === 'hotseat' || state.mode === 'vsAI';
}

export function isAIPlayer(state: GameState, player: PlayerId): boolean {
  return isVsAI(state) && player !== HUMAN;
}

export function activePlayer(state: GameState): PlayerId {
  return isSolo(state) ? HUMAN : state.currentPlayer;
}

export function emptyBoard(): Record<CityId, (PlacedTile | null)[]> {
  const board = {} as Record<CityId, (PlacedTile | null)[]>;
  for (const city of Object.values(CITIES)) {
    board[city.id] = city.slots.map(() => null);
  }
  return board;
}

function standardMat(): Record<IndustryType, number[]> {
  const mat = {} as Record<IndustryType, number[]>;
  for (const [industry, tiles] of Object.entries(INDUSTRY_TRACKS)) {
    const track: number[] = [];
    for (const t of tiles) track[t.level - 1] = t.count;
    mat[industry as IndustryType] = track;
  }
  return mat;
}

function automaMat(difficulty: MautomaDifficulty): Record<IndustryType, number[]> {
  const mat = {} as Record<IndustryType, number[]>;
  for (const [industry, counts] of Object.entries(MAUTOMA_MATS[difficulty])) {
    mat[industry as IndustryType] = [...counts];
  }
  return mat;
}

export function buildDeck(rng: Rng, playerCount: PlayerCount): Card[] {
  const cards: Card[] = [];
  for (const [city, count] of Object.entries(LOCATION_CARDS[playerCount])) {
    for (let i = 0; i < count!; i++) cards.push({ kind: 'location', city: city as CityId });
  }
  for (const group of INDUSTRY_CARDS[playerCount]) {
    for (let i = 0; i < group.count; i++) cards.push({ kind: 'industry', industries: group.industries });
  }
  return shuffle(rng, cards);
}

export function buildAutomaDeck(rng: Rng): number[] {
  const byGroup = (g: string) => MAUTOMA_CARDS.filter((c) => c.group === g).map((c) => c.id);
  const pools = { a: shuffle(rng, byGroup('a')), b: shuffle(rng, byGroup('b')), c: shuffle(rng, byGroup('c')) };
  const ten = shuffle(rng, [...pools.a.splice(0, 4), ...pools.b.splice(0, 3), ...pools.c.splice(0, 3)]);
  const three = shuffle(rng, [pools.a.shift()!, pools.b.shift()!, pools.c.shift()!]);
  const nine = shuffle(rng, [...pools.a, ...pools.b, ...pools.c]);
  return [...ten, ...three, ...nine];
}

function setupMerchants(rng: Rng, playerCount: PlayerCount): MerchantState[] {
  const mix = shuffle(rng, [...MERCHANT_TILE_MIX[playerCount]]);
  const merchants: MerchantState[] = [];
  let i = 0;
  for (let p = 2; p <= playerCount; p++) {
    for (const group of MERCHANT_TILE_GROUPS[p as PlayerCount]) {
      const spec = MERCHANTS[group.location];
      const tiles = mix.slice(i, i + group.count);
      i += group.count;
      merchants.push({
        id: spec.id,
        tiles,
        beer: tiles.map((t) => t !== 'blank'),
      });
    }
  }
  return merchants;
}

/** Deal shared deck in hotseat: 8 cards each, seed discard pile (1 card per player removed). */
export function dealHotseatHands(state: GameState): void {
  const deck = buildDeck(state.rng, state.playerCount);
  for (let i = 0; i < state.playerCount; i++) deck.pop();
  for (const player of state.players) {
    player.hand = deck.splice(0, 8);
  }
  state.drawPile = deck;
}

export function automaOpponentIds(state: GameState): PlayerId[] {
  if (!isVsAutoma(state)) return [];
  return Array.from({ length: state.playerCount - 1 }, (_, i) => i + 1);
}

export function initAutomaPlayer(state: GameState, automaId: PlayerId): void {
  state.automaDecks[automaId] = buildAutomaDeck(state.rng);
  state.automaDiscards[automaId] = [];
  state.automaLastCities[automaId] = null;
  state.automaFirstTurnDone[automaId] = false;
}

/** Cards in play per era (Brass Birmingham player-count deck sizes). */
const SOLO_ERA_CARDS: Record<PlayerCount, { canal: number; rail: number }> = {
  2: { canal: 19, rail: 20 },
  3: { canal: 28, rail: 29 },
  4: { canal: 37, rail: 38 },
};

export function soloEraCardCount(playerCount: PlayerCount, era: Era): number {
  return SOLO_ERA_CARDS[playerCount][era === 'canal' ? 'canal' : 'rail'];
}

/**
 * Deal the human's hand for solo (Mautoma setup = 2p deal).
 * The Automa does not use Brass cards: set aside 8 per rival, same draw pile as hotseat.
 */
export function dealSoloHumanDeck(state: GameState): void {
  const eraCount = soloEraCardCount(state.playerCount, state.era);
  const deck = buildDeck(state.rng, state.playerCount);
  const eraCards = deck.slice(0, eraCount);
  state.players[HUMAN].hand = eraCards.splice(0, 8);
  for (let i = 1; i < state.playerCount; i++) {
    eraCards.splice(0, 8);
  }
  state.drawPile = eraCards;
}

export type AutomaOpponents = 1 | 2 | 3;

const DIFFICULTY_ES: Record<MautomaDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

export function newGame(seed: number, difficulty: MautomaDifficulty, automaOpponents: AutomaOpponents = 1): GameState {
  const playerCount = (1 + automaOpponents) as PlayerCount;
  const rng = makeRng(seed);
  const players: PlayerState[] = [
    { money: 17, spent: 0, incomeSpace: STARTING_SPACE, vp: 0, hand: [], mat: standardMat() },
  ];
  const names = ['Tú'];
  for (let i = 1; i <= automaOpponents; i++) {
    players.push({ money: 0, spent: 0, incomeSpace: STARTING_SPACE, vp: 0, hand: [], mat: automaMat(difficulty) });
    names.push(`Automa ${i}`);
  }
  const turnOrder = [HUMAN, ...Array.from({ length: automaOpponents }, (_, i) => i + 1)];
  const state: GameState = {
    mode: 'solo',
    playerCount,
    seed,
    rng,
    difficulty,
    era: 'canal',
    turn: 1,
    actionsLeft: 1,
    currentPlayer: HUMAN,
    currentPlayerIndex: 0,
    turnOrder,
    playerNames: names,
    moneySpentThisRound: Array(playerCount).fill(0),
    firstTurnOfGame: true,
    players,
    board: emptyBoard(),
    links: {},
    coalCubes: COAL_MARKET.initialCubes,
    ironCubes: IRON_MARKET.initialCubes,
    merchants: setupMerchants(rng, playerCount),
    drawPile: [],
    automaDecks: {},
    automaDiscards: {},
    automaLastCities: {},
    automaFirstTurnDone: {},
    gameOver: false,
    log: [],
  };
  for (let id = 1; id <= automaOpponents; id++) initAutomaPlayer(state, id);
  dealSoloHumanDeck(state);
  state.log.push(
    `Partida iniciada — ${DIFFICULTY_ES[difficulty]}, ${automaOpponents} Automa(s), semilla ${seed}. Era Canal.`,
  );
  return state;
}

export type AIOpponents = 1 | 2 | 3;

const AI_DIFFICULTY_ES: Record<AIDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
  tournament: 'Torneo',
};

export function newVsAIGame(seed: number, aiDifficulty: AIDifficulty, aiOpponents: AIOpponents = 1): GameState {
  const playerCount = (1 + aiOpponents) as PlayerCount;
  const rng = makeRng(seed);
  const aiIds = Array.from({ length: aiOpponents }, (_, i) => i + 1) as PlayerId[];
  const turnOrder: PlayerId[] = [HUMAN, ...aiIds];
  const names = ['Tú', ...aiIds.map((id) => `IA ${id}`)];
  const state: GameState = {
    mode: 'vsAI',
    playerCount,
    seed,
    rng,
    aiDifficulty,
    era: 'canal',
    turn: 1,
    actionsLeft: 1,
    currentPlayer: HUMAN,
    currentPlayerIndex: 0,
    turnOrder,
    playerNames: names,
    moneySpentThisRound: Array(playerCount).fill(0),
    firstTurnOfGame: true,
    players: Array.from({ length: playerCount }, () => ({
      money: 17,
      spent: 0,
      incomeSpace: STARTING_SPACE,
      vp: 0,
      hand: [],
      mat: standardMat(),
    })),
    board: emptyBoard(),
    links: {},
    coalCubes: COAL_MARKET.initialCubes,
    ironCubes: IRON_MARKET.initialCubes,
    merchants: setupMerchants(rng, playerCount),
    drawPile: [],
    automaDecks: {},
    automaDiscards: {},
    automaLastCities: {},
    automaFirstTurnDone: {},
    gameOver: false,
    log: [],
  };
  dealHotseatHands(state);
  state.log.push(
    `Partida iniciada — Contra IA (${AI_DIFFICULTY_ES[aiDifficulty]}), ${aiOpponents} rival(es), semilla ${seed}. Era Canal. Mazo completo (${playerCount} jugadores).`,
  );
  return state;
}

export function newHotseatGame(seed: number, playerCount: PlayerCount, names: string[]): GameState {
  const rng = makeRng(seed);
  const ids = [...Array(playerCount).keys()] as PlayerId[];
  const turnOrder = shuffle(rng, ids);
  const state: GameState = {
    mode: 'hotseat',
    playerCount,
    seed,
    rng,
    era: 'canal',
    turn: 1,
    actionsLeft: 1,
    currentPlayer: turnOrder[0],
    currentPlayerIndex: 0,
    turnOrder,
    playerNames: names.slice(0, playerCount),
    moneySpentThisRound: Array(playerCount).fill(0),
    firstTurnOfGame: true,
    players: Array.from({ length: playerCount }, () => ({
      money: 17,
      spent: 0,
      incomeSpace: STARTING_SPACE,
      vp: 0,
      hand: [],
      mat: standardMat(),
    })),
    board: emptyBoard(),
    links: {},
    coalCubes: COAL_MARKET.initialCubes,
    ironCubes: IRON_MARKET.initialCubes,
    merchants: setupMerchants(rng, playerCount),
    drawPile: [],
    automaDecks: {},
    automaDiscards: {},
    automaLastCities: {},
    automaFirstTurnDone: {},
    gameOver: false,
    log: [],
  };
  dealHotseatHands(state);
  state.log.push(
    `Nueva partida multijugador (${playerCount} jugadores), semilla ${seed}. Comienza la Era Canal. Orden: ${turnOrder.map((id) => names[id]).join(' → ')}.`,
  );
  return state;
}

export function log(state: GameState, message: string): void {
  state.log.push(message);
}

export function cityName(id: LocationId): string {
  return id in CITIES ? CITIES[id as CityId].name : MERCHANTS[id as MerchantId].name;
}

export function isPayingPlayer(state: GameState, player: PlayerId): boolean {
  return isFullBrass(state) || player === HUMAN;
}

export function spendMoney(state: GameState, player: PlayerId, amount: number): void {
  if (!isPayingPlayer(state, player)) return;
  state.players[player].money -= amount;
  if (isFullBrass(state)) {
    state.moneySpentThisRound[player] = (state.moneySpentThisRound[player] ?? 0) + amount;
  }
}

export function addMoney(state: GameState, player: PlayerId, amount: number): void {
  if (!isPayingPlayer(state, player)) return;
  state.players[player].money += amount;
}

export function playerLabel(state: GameState, id: PlayerId): string {
  return state.playerNames[id] ?? `Jugador ${id + 1}`;
}
