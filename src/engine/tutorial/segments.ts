import type { CityId, IndustryType } from '../types';
import { HUMAN, emptyBoard, newGame, type GameState } from '../state';

export type TutorialSegmentId = 'intro' | 'sell' | 'develop' | 'loan' | 'scout';

function baseTutorialShell(): GameState {
  const state = newGame(1001, 'easy', 1);
  state.mode = 'tutorial';
  state.playerNames = ['Tú', 'Automa (demo)'];
  state.gameOver = false;
  state.drawPile = [];
  return state;
}

function setupIntro(state: GameState): GameState {
  state.actionsLeft = 3;
  state.firstTurnOfGame = false;
  state.turn = 1;
  state.era = 'canal';
  state.board = emptyBoard();
  state.links = {};
  state.players[HUMAN].hand = [
    { kind: 'location', city: 'dudley' },
    { kind: 'location', city: 'birmingham' },
    { kind: 'location', city: 'coventry' },
    { kind: 'industry', industries: ['brewery'] },
    { kind: 'location', city: 'walsall' },
  ];
  state.players[HUMAN].money = 17;
  state.players[HUMAN].vp = 0;
  state.players[HUMAN].spent = 0;
  state.players[HUMAN].incomeSpace = 10;
  state.log = ['Capítulo 1 — Construir, enlazar y pasar.'];
  return state;
}

function setupSell(state: GameState): GameState {
  state.actionsLeft = 1;
  state.turn = 2;
  state.era = 'canal';
  state.board = emptyBoard();
  state.links = {};
  state.players[HUMAN].hand = [
    { kind: 'location', city: 'worcester' },
    { kind: 'location', city: 'birmingham' },
    { kind: 'industry', industries: ['iron'] },
  ];
  state.players[HUMAN].money = 12;
  state.players[HUMAN].vp = 2;
  state.players[HUMAN].incomeSpace = 12;
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
  state.log = ['Capítulo 2 — Vender algodón en Worcester usando cerveza de tu cervecería.'];
  return state;
}

function setupDevelop(state: GameState): GameState {
  state.actionsLeft = 1;
  state.turn = 3;
  state.era = 'canal';
  state.board = emptyBoard();
  state.links = {};
  state.players[HUMAN].hand = [
    { kind: 'industry', industries: ['coal'] },
    { kind: 'location', city: 'dudley' },
    { kind: 'location', city: 'birmingham' },
  ];
  state.players[HUMAN].money = 14;
  state.players[HUMAN].vp = 5;
  state.players[HUMAN].incomeSpace = 14;
  state.ironCubes = 8;
  state.board.dudley[0] = { owner: HUMAN, industry: 'coal', level: 1, flipped: false, resources: 1 };
  state.links['birmingham-dudley'] = HUMAN;
  state.log = ['Capítulo 3 — Desarrollar retira fichas de tu tapete pagando hierro.'];
  return state;
}

function setupLoan(state: GameState): GameState {
  state.actionsLeft = 1;
  state.turn = 4;
  state.era = 'canal';
  state.board = emptyBoard();
  state.links = {};
  state.players[HUMAN].hand = [
    { kind: 'location', city: 'coventry' },
    { kind: 'location', city: 'walsall' },
    { kind: 'industry', industries: ['brewery'] },
  ];
  state.players[HUMAN].money = 4;
  state.players[HUMAN].vp = 5;
  state.players[HUMAN].incomeSpace = 10;
  state.log = ['Capítulo 4 — Pedir un préstamo cuando te falta dinero.'];
  return state;
}

function setupScout(state: GameState): GameState {
  state.actionsLeft = 1;
  state.turn = 1;
  state.era = 'rail';
  state.board = emptyBoard();
  state.links = {};
  state.players[HUMAN].hand = [
    { kind: 'location', city: 'stafford' },
    { kind: 'location', city: 'burton' },
    { kind: 'industry', industries: ['iron'] },
    { kind: 'location', city: 'tamworth' },
    { kind: 'industry', industries: ['coal'] },
  ];
  state.drawPile = [
    { kind: 'location', city: 'nuneaton' },
    { kind: 'industry', industries: ['brewery'] },
  ];
  state.players[HUMAN].money = 20;
  state.players[HUMAN].vp = 8;
  state.players[HUMAN].incomeSpace = 12;
  state.log = ['Capítulo 5 — Era Ferrocarril: explorar descarta 3 cartas por 2 comodines.'];
  return state;
}

export function tutorialSegmentState(segment: TutorialSegmentId): GameState {
  const state = baseTutorialShell();
  switch (segment) {
    case 'intro':
      return setupIntro(state);
    case 'sell':
      return setupSell(state);
    case 'develop':
      return setupDevelop(state);
    case 'loan':
      return setupLoan(state);
    case 'scout':
      return setupScout(state);
  }
}

export function newTutorialGame(): GameState {
  return tutorialSegmentState('intro');
}

export function tutorialBuildMatches(
  action: { type: string; option?: { city: CityId; industry: IndustryType } },
  city: CityId,
  industry: IndustryType,
): boolean {
  return action.type === 'build' && action.option?.city === city && action.option?.industry === industry;
}

export function tutorialNetworkMatches(action: { type: string; option?: { linkIds: string[] } }, linkId: string): boolean {
  return action.type === 'network' && action.option?.linkIds[0] === linkId;
}

export function isTutorial(state: GameState): boolean {
  return state.mode === 'tutorial';
}
