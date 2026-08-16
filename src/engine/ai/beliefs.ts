import { cardsRemainingInGame } from './positionEval';
import { hiddenIndustryPressure } from './cardBeliefs';
import { HUMAN, activePlayer, isVsAI, type GameState, type PlayerId } from '../state';

/** How many more cards the opponent likely holds vs table average. */
export function opponentHandPressure(state: GameState, opponent: PlayerId): number {
  const total = cardsRemainingInGame(state);
  if (total === 0) return 0;
  const avg = total / state.playerCount;
  return state.players[opponent].hand.length - avg;
}

export function primaryOpponent(state: GameState, player: PlayerId = activePlayer(state)): PlayerId {
  if (!isVsAI(state)) return HUMAN;
  for (let i = 0; i < state.playerCount; i++) {
    const id = i as PlayerId;
    if (id !== player) return id;
  }
  return HUMAN;
}

/** 0..1 estimate of rival flexibility (more cards = more threat). */
export function opponentFlexibility(state: GameState, opponent?: PlayerId): number {
  const rival = opponent ?? primaryOpponent(state);
  const pressure = opponentHandPressure(state, rival);
  const hand = state.players[rival].hand.length;
  return Math.min(1, Math.max(0, hand / 8 + pressure * 0.08));
}

/** Short Spanish hint for coach / training UI. */
export function beliefHintForHuman(state: GameState): string | null {
  if (!isVsAI(state) || state.currentPlayer !== HUMAN) return null;
  const rival = primaryOpponent(state);
  const flex = opponentFlexibility(state, rival);
  const pressure = opponentHandPressure(state, rival);
  if (flex > 0.55 && pressure > 1) {
    return `${state.playerNames[rival]} probablemente aún tiene mano flexible (~${state.players[rival].hand.length} cartas): conviene presionar tablero antes de pasar.`;
  }
  const cardHint = hiddenIndustryPressure(state, HUMAN);
  if (cardHint) return cardHint;
  if (state.drawPile.length <= 4 && cardsRemainingInGame(state) <= 8) {
    return 'Pocas cartas en juego: cada acción restante pesa mucho en el tempo de era.';
  }
  return null;
}
