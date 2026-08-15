import type { IndustryType } from '../../engine/types';

/** Bright palette for readable map/card icons (Brass PC–inspired). */
export const INDUSTRY_ICON: Record<
  IndustryType,
  { body: string; detail: string; accent: string; label: string }
> = {
  cotton: { body: '#f5ead6', detail: '#6b5344', accent: '#b8956a', label: 'Algodonera' },
  goods: { body: '#c9925a', detail: '#5c3d1e', accent: '#f0d4a8', label: 'Manufacturas' },
  pottery: { body: '#e87850', detail: '#8b3018', accent: '#ffc8a8', label: 'Cerámica' },
  coal: { body: '#1a1a1a', detail: '#444444', accent: '#666666', label: 'Carbón' },
  iron: { body: '#c8d0d8', detail: '#5a4030', accent: '#e87828', label: 'Fundición' },
  brewery: { body: '#f5e6c8', detail: '#6b4510', accent: '#e05030', label: 'Cervecería' },
};

export interface IndustryTheme {
  id: IndustryType;
  label: string;
  short: string;
  color: string;
  bg: string;
  border: string;
  darkBg: string;
}

export const INDUSTRY_THEME: Record<IndustryType, IndustryTheme> = {
  cotton: { id: 'cotton', label: 'Algodonera', short: 'Algodón', color: '#6b5344', bg: '#f5ead6', border: '#b8956a', darkBg: '#3d3528' },
  goods: { id: 'goods', label: 'Manufacturas', short: 'Manuf.', color: '#5c3d1e', bg: '#f0d4a8', border: '#c9925a', darkBg: '#1a3d24' },
  pottery: { id: 'pottery', label: 'Cerámica', short: 'Cerámica', color: '#8b3018', bg: '#ffc8a8', border: '#e87850', darkBg: '#5c2612' },
  coal: { id: 'coal', label: 'Carbón', short: 'Carbón', color: '#cccccc', bg: '#2e2e2e', border: '#555555', darkBg: '#1a1a1a' },
  iron: { id: 'iron', label: 'Hierro', short: 'Hierro', color: '#8a3810', bg: '#ffe0c0', border: '#e87828', darkBg: '#5c3010' },
  brewery: { id: 'brewery', label: 'Cerveza', short: 'Cerveza', color: '#6b4510', bg: '#ffe082', border: '#d4a020', darkBg: '#92400e' },
};

export const CARD_LOCATION = { bg: '#dbeafe', border: '#2563eb', color: '#1e3a5f', darkBg: '#1e3a5f' };
export const CARD_WILD = { bg: '#fef3c7', border: '#d97706', color: '#78350f', darkBg: '#78350f' };

export function industryTheme(ind: IndustryType): IndustryTheme {
  return INDUSTRY_THEME[ind];
}

export function industryIconColors(ind: IndustryType) {
  return INDUSTRY_ICON[ind];
}

export function industryCssClass(ind: IndustryType): string {
  return `ind-${ind}`;
}
