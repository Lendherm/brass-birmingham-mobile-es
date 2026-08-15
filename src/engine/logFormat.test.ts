import { describe, expect, it } from 'vitest';
import { formatPlayerLogLine, isHumanLogLine } from './logFormat';
import { newGame } from './state';

describe('logFormat', () => {
  it('uses second person for human in solo', () => {
    const state = newGame(1, 'easy');
    expect(formatPlayerLogLine(state, 0, 'construyó Mina de carbón N1 en Redditch.')).toBe(
      'Construiste Mina de carbón N1 en Redditch.',
    );
  });

  it('keeps third person for Automa', () => {
    const state = newGame(1, 'easy');
    expect(formatPlayerLogLine(state, 1, 'construyó un enlace de canal: belper-derby.')).toBe(
      'Automa 1 construyó un enlace de canal: belper-derby.',
    );
  });

  it('detects human log prefixes', () => {
    expect(isHumanLogLine('Construiste Mina de carbón N1 en Redditch.')).toBe(true);
    expect(isHumanLogLine('Automa 1 construyó un enlace de canal: belper-derby.')).toBe(false);
  });
});
