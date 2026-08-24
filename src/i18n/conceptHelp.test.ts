import { describe, expect, it } from 'vitest';
import { NETWORK_TOLL_CONCEPT } from './conceptHelp';
import { INTERACTIVE_TUTORIAL } from '../engine/tutorial/steps';

describe('conceptHelp', () => {
  it('documents network toll as VP peaje', () => {
    expect(NETWORK_TOLL_CONCEPT.body).toMatch(/puntos de victoria|PV/i);
    expect(NETWORK_TOLL_CONCEPT.body).toMatch(/peaje/i);
    expect(NETWORK_TOLL_CONCEPT.body).toMatch(/monedas/i);
  });
});

describe('tutorial network toll step', () => {
  it('inserts peaje explanation after first link', () => {
    const toll = INTERACTIVE_TUTORIAL.find((s) => s.id === 'explain-network-toll');
    const link = INTERACTIVE_TUTORIAL.findIndex((s) => s.id === 'link-dudley');
    const tollIdx = INTERACTIVE_TUTORIAL.findIndex((s) => s.id === 'explain-network-toll');
    expect(toll).toBeDefined();
    expect(toll?.step.type).toBe('continue');
    expect(tollIdx).toBe(link + 1);
    expect(toll?.body).toMatch(/PV/);
  });
});
