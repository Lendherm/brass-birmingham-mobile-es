import type { IndustryType } from '../engine/types';
import { RESOURCE_INDUSTRIES } from '../engine/types';
import type { GameState } from '../engine/state';
import { industria } from './es';

export const BOARD_SYMBOL_LEGEND: { id: string; sample: string; label: string; detail: string }[] = [
  {
    id: 'owner',
    sample: '●',
    label: 'Dueño',
    detail: 'Punto de color en la esquina: quién construyó esa ficha.',
  },
  {
    id: 'level',
    sample: 'N',
    label: 'Nivel',
    detail: 'Número abajo a la derecha: nivel de la industria (I, II, III…).',
  },
  {
    id: 'linkvp',
    sample: '+2',
    label: 'PV de enlace',
    detail:
      'Al puntuar cada era, sumas esos PV por cada vía tuya conectada a esa ciudad o comerciante. Es el “peaje” conceptual de tu red: no quitas monedas a rivales; cobras dominio del transporte en puntos. Más detalle: ? Ayuda.',
  },
  {
    id: 'coal',
    sample: '◼',
    label: 'Carbón',
    detail: 'Cubos negros en minas: carbón que queda en la ficha. Cualquiera conectado puede usarlo.',
  },
  {
    id: 'iron',
    sample: '◼',
    label: 'Hierro',
    detail: 'Cubos naranjas en fundiciones: hierro restante en la ficha.',
  },
  {
    id: 'beer',
    sample: '🍺',
    label: 'Cerveza',
    detail: 'En cervecerías o comerciantes: cerveza disponible para vender. Si se gasta, desaparece.',
  },
  {
    id: 'empty',
    sample: '▢',
    label: 'Casilla vacía',
    detail: 'Iconos pequeños indican qué industrias se pueden construir ahí.',
  },
  {
    id: 'linkvp-hex',
    sample: '⬡2',
    label: 'Comerciante',
    detail: 'Hexágono azul con 2: el comerciante aporta 2 PV de enlace al puntuar.',
  },
];

export function linkVPDetail(amount: number): string {
  return `+${amount} PV de enlace: al final de cada era sumas ${amount} PV por cada vía tuya conectada a esta ubicación.`;
}

export function slotOwnerLabel(state: GameState, owner: number): string {
  return state.playerNames[owner] ?? `Jugador ${owner + 1}`;
}

export function placedTileResourceDetail(industry: IndustryType, count: number): string | null {
  if (count <= 0 || !RESOURCE_INDUSTRIES.includes(industry)) return null;
  switch (industry) {
    case 'coal':
      return `${count} carbón en la mina — cualquier jugador conectado por red puede gastarlo al construir.`;
    case 'iron':
      return `${count} hierro en la fundición — se gasta al construir industrias que lo requieran.`;
    case 'brewery':
      return `${count} cerveza en la cervecería — se usa al vender algodón, manufacturas o cerámica.`;
    default:
      return null;
  }
}

export function emptySlotDetail(allowed: readonly IndustryType[]): string {
  if (allowed.length === 1) {
    return `Casilla libre: solo se puede construir ${industria(allowed[0])}.`;
  }
  return `Casilla libre: se puede construir ${allowed.map(industria).join(', ')}.`;
}

export function flippedTileDetail(): string {
  return 'Ficha volteada: ya no produce recursos; sus PV cuentan al puntuar el final de era.';
}
