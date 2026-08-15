import { describe, expect, it } from 'vitest';
import { classifyGameLog } from './gameHistory';
import { newGame } from './state';

describe('classifyGameLog', () => {
  it('assigns human and automa lines by player name', () => {
    const state = newGame(1, 'easy', 1);
    const automa = state.playerNames[1];
    state.log.push('Construiste Mina de carbón N1 en Dudley.');
    state.log.push(`${automa} construyó un enlace de canal: belper-derby.`);
    state.log.push('--- Fin de la Era Canal ---');

    const lines = classifyGameLog(state);
    expect(lines.at(-3)?.playerId).toBe(0);
    expect(lines.at(-2)?.playerId).toBe(1);
    expect(lines.at(-1)?.playerId).toBeNull();
  });

  it('maps solo income line to human', () => {
    const state = newGame(1, 'easy');
    state.log.push('Ingresos: +£5.');
    expect(classifyGameLog(state).at(-1)?.playerId).toBe(0);
  });
});
