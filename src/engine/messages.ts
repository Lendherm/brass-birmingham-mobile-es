import type { IndustryType } from './types';

/** Textos del motor de reglas (español). Sin dependencia de la capa UI. */

export const INDUSTRIA: Record<IndustryType, string> = {
  cotton: 'Algodonera',
  goods: 'Manufacturas',
  pottery: 'Cerámica',
  coal: 'Mina de carbón',
  iron: 'Fundición',
  brewery: 'Cervecería',
};

export function industria(i: IndustryType): string {
  return INDUSTRIA[i];
}

export function eraNombre(era: 'canal' | 'rail'): string {
  return era === 'canal' ? 'Canal' : 'Ferrocarril';
}

export function enlaceTipo(era: 'canal' | 'rail'): string {
  return era === 'canal' ? 'canal' : 'ferrocarril';
}
