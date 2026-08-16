import type { AIDifficulty } from '../ai/types';
import { HUMAN, emptyBoard, newVsAIGame, type GameState } from '../state';
import type { Card } from '../state';

export type TrainingScenarioId =
  | 'canal-countdown'
  | 'sell-or-build'
  | 'beer-scarcity'
  | 'rail-flip-race';

export interface TrainingScenarioMeta {
  id: TrainingScenarioId;
  title: string;
  objective: string;
  recommendedAi: AIDifficulty;
}

export const TRAINING_SCENARIOS: TrainingScenarioMeta[] = [
  {
    id: 'canal-countdown',
    title: 'Cuenta atrás Canal',
    objective:
      'Quedan ~2 rondas de era. Tienes minas y algodón nivel I: vende, desarrolla o voltea antes de perderlos.',
    recommendedAi: 'medium',
  },
  {
    id: 'sell-or-build',
    title: 'Vender o construir',
    objective: 'Tienes algodón conectado al mercado y cerveza disponible. ¿Vendes ya o construyes para más PV?',
    recommendedAi: 'medium',
  },
  {
    id: 'beer-scarcity',
    title: 'Cerveza escasa',
    objective: 'Solo queda 1 cerveza en tu cervecería y hay dos ventas posibles. Elige la más rentable.',
    recommendedAi: 'hard',
  },
  {
    id: 'rail-flip-race',
    title: 'Carrera de ingresos',
    objective: 'Era Ferrocarril: industria volteada lista para vender vs desarrollar el tapete para subir ingresos.',
    recommendedAi: 'hard',
  },
];

export function trainingScenarioMeta(id: TrainingScenarioId): TrainingScenarioMeta {
  return TRAINING_SCENARIOS.find((s) => s.id === id)!;
}

function stubHands(state: GameState, human: Card[], ai: Card[], draw: Card[] = []): void {
  state.players[HUMAN].hand = human;
  state.players[1].hand = ai;
  state.drawPile = draw;
}

function setupCanalCountdown(state: GameState): void {
  state.era = 'canal';
  state.turn = 8;
  state.firstTurnOfGame = false;
  state.actionsLeft = 2;
  state.currentPlayer = HUMAN;
  state.currentPlayerIndex = 0;
  state.board = emptyBoard();
  state.links = {};
  state.players[HUMAN].money = 11;
  state.players[HUMAN].vp = 6;
  state.players[HUMAN].incomeSpace = 12;
  state.players[1].money = 14;
  state.players[1].vp = 5;
  state.players[1].incomeSpace = 11;
  state.board.dudley[0] = { owner: HUMAN, industry: 'coal', level: 1, flipped: false, resources: 1 };
  state.board.walsall[1] = { owner: HUMAN, industry: 'cotton', level: 1, flipped: false, resources: 0 };
  state.board.birmingham[0] = { owner: 1, industry: 'brewery', level: 1, flipped: false, resources: 0 };
  state.links['birmingham-dudley'] = HUMAN;
  state.links['birmingham-walsall'] = HUMAN;
  state.links['gloucester-worcester'] = HUMAN;
  stubHands(
    state,
    [
      { kind: 'location', city: 'worcester' },
      { kind: 'industry', industries: ['coal'] },
    ],
    [{ kind: 'location', city: 'coventry' }, { kind: 'location', city: 'stafford' }],
  );
  state.log.push('Escenario: fin de era Canal con industrias nivel I en riesgo.');
}

function setupSellOrBuild(state: GameState): void {
  state.era = 'canal';
  state.turn = 4;
  state.firstTurnOfGame = false;
  state.actionsLeft = 2;
  state.currentPlayer = HUMAN;
  state.currentPlayerIndex = 0;
  state.board = emptyBoard();
  state.links = {};
  state.players[HUMAN].money = 9;
  state.players[HUMAN].vp = 4;
  state.players[HUMAN].incomeSpace = 11;
  state.players[1].money = 12;
  state.players[1].vp = 3;
  state.board.worcester[0] = { owner: HUMAN, industry: 'cotton', level: 1, flipped: false, resources: 0 };
  state.board.walsall[1] = { owner: HUMAN, industry: 'brewery', level: 1, flipped: false, resources: 1 };
  state.links['birmingham-worcester'] = HUMAN;
  state.links['gloucester-worcester'] = HUMAN;
  state.links['birmingham-walsall'] = HUMAN;
  for (const m of state.merchants) {
    if (m.id === 'gloucester') {
      m.tiles = ['cotton', 'goods'];
      m.beer = [true, true];
    }
  }
  stubHands(
    state,
    [
      { kind: 'location', city: 'dudley' },
      { kind: 'industry', industries: ['iron'] },
      { kind: 'location', city: 'birmingham' },
    ],
    [{ kind: 'location', city: 'coventry' }, { kind: 'industry', industries: ['coal'] }],
    [{ kind: 'location', city: 'walsall' }],
  );
  state.log.push('Escenario: venta inmediata vs construcción con enlace ya pagado.');
}

function setupBeerScarcity(state: GameState): void {
  state.era = 'canal';
  state.turn = 5;
  state.firstTurnOfGame = false;
  state.actionsLeft = 1;
  state.currentPlayer = HUMAN;
  state.currentPlayerIndex = 0;
  state.board = emptyBoard();
  state.links = {};
  state.players[HUMAN].money = 8;
  state.players[HUMAN].vp = 7;
  state.players[HUMAN].incomeSpace = 13;
  state.board.worcester[0] = { owner: HUMAN, industry: 'cotton', level: 1, flipped: false, resources: 0 };
  state.board.stafford[0] = { owner: HUMAN, industry: 'pottery', level: 1, flipped: false, resources: 0 };
  state.board.walsall[1] = { owner: HUMAN, industry: 'brewery', level: 1, flipped: false, resources: 1 };
  state.links['birmingham-worcester'] = HUMAN;
  state.links['birmingham-walsall'] = HUMAN;
  state.links['birmingham-stafford'] = HUMAN;
  state.links['gloucester-worcester'] = HUMAN;
  for (const m of state.merchants) {
    if (m.id === 'gloucester') {
      m.tiles = ['cotton', 'pottery'];
      m.beer = [true, false];
    }
  }
  stubHands(
    state,
    [{ kind: 'location', city: 'coventry' }],
    [{ kind: 'location', city: 'dudley' }],
    [{ kind: 'industry', industries: ['iron'] }],
  );
  state.log.push('Escenario: una sola cerveza propia — elige la venta correcta.');
}

function setupRailFlipRace(state: GameState): void {
  state.era = 'rail';
  state.turn = 3;
  state.firstTurnOfGame = false;
  state.actionsLeft = 2;
  state.currentPlayer = HUMAN;
  state.currentPlayerIndex = 0;
  state.board = emptyBoard();
  state.links = {};
  state.ironCubes = 6;
  state.players[HUMAN].money = 16;
  state.players[HUMAN].vp = 12;
  state.players[HUMAN].incomeSpace = 14;
  state.players[HUMAN].mat.coal[0] = 2;
  state.players[1].money = 15;
  state.players[1].vp = 11;
  state.board.dudley[0] = { owner: HUMAN, industry: 'coal', level: 2, flipped: true, resources: 0 };
  state.board.walsall[1] = { owner: HUMAN, industry: 'coal', level: 1, flipped: false, resources: 0 };
  state.links['birmingham-dudley'] = HUMAN;
  state.links['birmingham-walsall'] = HUMAN;
  stubHands(
    state,
    [
      { kind: 'industry', industries: ['coal'] },
      { kind: 'location', city: 'birmingham' },
    ],
    [{ kind: 'location', city: 'coventry' }, { kind: 'industry', industries: ['iron'] }],
    [{ kind: 'location', city: 'stafford' }],
  );
  state.log.push('Escenario: era Ferrocarril — vender carbón volteado o desarrollar el tapete.');
}

export function newTrainingScenario(id: TrainingScenarioId, aiDifficulty?: AIDifficulty): GameState {
  const meta = trainingScenarioMeta(id);
  const state = newVsAIGame(9000 + TRAINING_SCENARIOS.findIndex((s) => s.id === id), aiDifficulty ?? meta.recommendedAi, 1);
  state.trainingScenario = id;
  state.gameOver = false;
  state.pendingEraScore = null;

  switch (id) {
    case 'canal-countdown':
      setupCanalCountdown(state);
      break;
    case 'sell-or-build':
      setupSellOrBuild(state);
      break;
    case 'beer-scarcity':
      setupBeerScarcity(state);
      break;
    case 'rail-flip-race':
      setupRailFlipRace(state);
      break;
  }

  state.log.unshift(`Entrenamiento — ${meta.title}: ${meta.objective}`);
  return state;
}
