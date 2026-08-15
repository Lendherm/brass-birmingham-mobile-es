import { describe, expect, it } from 'vitest';
import { eraNombre, industria, enlaceTipo, INDUSTRIA } from './messages';

describe('engine messages', () => {
  it('labels industries in Spanish', () => {
    expect(industria('coal')).toBe('Mina de carbón');
    expect(INDUSTRIA.cotton).toBe('Algodonera');
  });

  it('labels eras and link types', () => {
    expect(eraNombre('canal')).toBe('Canal');
    expect(eraNombre('rail')).toBe('Ferrocarril');
    expect(enlaceTipo('canal')).toBe('canal');
    expect(enlaceTipo('rail')).toBe('ferrocarril');
  });
});
