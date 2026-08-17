import type { MerchantBonus, IndustryType, MerchantId } from '../engine/types';
import { CITIES, MERCHANTS } from '../engine/data/board';
import type { CityId } from '../engine/types';
import { INDUSTRIA, eraNombre, enlaceTipo, industria } from '../engine/messages';

export { INDUSTRIA, eraNombre, enlaceTipo, industria };

export const ACCIONES = {
  build: 'Construir',
  network: 'Red',
  sell: 'Vender',
  develop: 'Desarrollar',
  loan: 'Préstamo',
  scout: 'Explorar',
  pass: 'Pasar',
} as const;

export const ACCION_ICON: Record<keyof typeof ACCIONES, string> = {
  build: '🔨',
  network: '🛤️',
  sell: '💰',
  develop: '⬆️',
  loan: '🏦',
  scout: '🔍',
  pass: '⏭️',
};

export type AccionId = keyof typeof ACCIONES;

export function jugador(esHumano: boolean): string {
  return esHumano ? 'Tú' : 'Automa';
}

export const PLAYER_COLORS = ['#0f766e', '#2563eb', '#ca8a04', '#9333ea'] as const;
export const PLAYER_BG_COLORS = ['#ccfbf1', '#dbeafe', '#fef9c3', '#f3e8ff'] as const;
export const DEFAULT_PLAYER_NAMES = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4'] as const;

export function playerCssVar(id: number): string {
  return `var(--p${id})`;
}

export function playerBgCssVar(id: number): string {
  return `var(--p${id}-bg)`;
}

const FARM_LABELS: Record<string, string> = {
  farmNorth: 'Granja N.',
  farmSouth: 'Granja S.',
};

export function linkLabel(linkId: string): string {
  return linkId
    .split('-')
    .map((id) => {
      if (id in FARM_LABELS) return FARM_LABELS[id];
      if (id in CITIES) return CITIES[id as CityId].name;
      if (id in MERCHANTS) return MERCHANTS[id as MerchantId].name;
      return id;
    })
    .join(' – ');
}

export function merchantBonusLabel(bonus: MerchantBonus): string {
  switch (bonus.kind) {
    case 'vp':
      return `+${bonus.amount} PV`;
    case 'money':
      return `+£${bonus.amount}`;
    case 'incomeSpaces':
      return `+${bonus.amount} espacios de ingreso`;
    case 'develop':
      return `+${bonus.amount} desarrollo`;
  }
}

/** Label for one merchant ring tile. */
export function merchantTileLabel(t: IndustryType | 'any' | 'blank'): string {
  if (t === 'blank') return 'Vacío';
  if (t === 'any') return 'Comodín — cualquier industria';
  return industria(t);
}

/** Extra explanation shown in the merchant info popup. */
export function merchantTileDetail(t: IndustryType | 'any' | 'blank'): string | null {
  if (t === 'blank') return 'Sin ficha activa en este comerciante.';
  if (t === 'any') {
    return `Acepta cualquier industria vendible: ${industria('cotton')}, ${industria('goods')} o ${industria('pottery')}. Necesitas red hasta aquí y cerveza.`;
  }
  return `Acepta solo ${industria(t)} vendible (conectada por red + cerveza).`;
}

/** Industries this merchant tile ring accepts (deduped labels). */
export function merchantBuysLabel(tiles: readonly (IndustryType | 'any' | 'blank')[]): string {
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const t of tiles) {
    if (t === 'blank') continue;
    const label = t === 'any' ? 'Cualquier industria' : industria(t);
    if (!seen.has(label)) {
      seen.add(label);
      parts.push(label);
    }
  }
  return parts.join(', ');
}

/** Carbón del mercado global: comprar (si no hay minas) o vender excedente de minas. */
export const COAL_MARKET_CONNECTION_HINT =
  'Con enlace a un comerciante puedes comprar carbón del mercado (cuando no hay minas cercanas) y vender el excedente al construir minas.';
export const COAL_MARKET_PANEL_NOTE =
  'Requiere enlace a un comerciante para comprar carbón del mercado o vender excedente de minas.';
