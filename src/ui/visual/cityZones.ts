import type { CityId, MerchantId } from '../../engine/types';

/** Five location-banner colors — Roxley PC / physical board. */
export type BoardZone = 'orange' | 'blueDark' | 'cyan' | 'red' | 'purple';

export type MerchantZone = 'merchant';

export const ZONE_THEME: Record<
  BoardZone,
  {
    label: string;
    fill: string;
    border: string;
    banner: string;
    cardBg: string;
    cardBorder: string;
    text: string;
    bannerText: string;
  }
> = {
  orange: {
    label: 'Naranja',
    fill: '#c4883a',
    border: '#8a5a18',
    banner: '#b87828',
    cardBg: '#fff4e6',
    cardBorder: '#c4883a',
    text: '#5c3d1e',
    bannerText: '#fff8eb',
  },
  blueDark: {
    label: 'Azul oscuro',
    fill: '#2a5080',
    border: '#1a3058',
    banner: '#234870',
    cardBg: '#e8f0ff',
    cardBorder: '#3a6898',
    text: '#1e3a5f',
    bannerText: '#e8f0ff',
  },
  cyan: {
    label: 'Cian',
    fill: '#4a98a8',
    border: '#2a6878',
    banner: '#3a8898',
    cardBg: '#e6f7fa',
    cardBorder: '#5ab0c0',
    text: '#1a4048',
    bannerText: '#e8ffff',
  },
  red: {
    label: 'Rojo',
    fill: '#8b3030',
    border: '#5a1818',
    banner: '#7a2828',
    cardBg: '#ffecec',
    cardBorder: '#a84848',
    text: '#5c2020',
    bannerText: '#ffe8e8',
  },
  purple: {
    label: 'Morado',
    fill: '#6a5090',
    border: '#4a3070',
    banner: '#5a4080',
    cardBg: '#f3ecff',
    cardBorder: '#9078b0',
    text: '#3d2858',
    bannerText: '#f0e8ff',
  },
};

export const MERCHANT_ZONE_THEME = {
  label: 'Comerciante',
  fill: '#c8c0b0',
  border: '#8a8278',
  banner: '#b0a898',
  cardBg: '#f5f2eb',
  cardBorder: '#a09888',
  text: '#2b2620',
  bannerText: '#f5f0e8',
};

export const CITY_ZONE: Record<CityId, BoardZone> = {
  coalbrookdale: 'orange',
  wolverhampton: 'orange',
  kidderminster: 'orange',
  worcester: 'orange',
  dudley: 'orange',
  farmSouth: 'orange',
  stoke: 'blueDark',
  stone: 'blueDark',
  uttoxeter: 'blueDark',
  leek: 'blueDark',
  belper: 'cyan',
  derby: 'cyan',
  stafford: 'red',
  cannock: 'red',
  burton: 'red',
  tamworth: 'red',
  walsall: 'red',
  birmingham: 'purple',
  farmNorth: 'red',
  nuneaton: 'purple',
  coventry: 'purple',
  redditch: 'purple',
};

export const MERCHANT_ZONE: Record<MerchantId, MerchantZone> = {
  shrewsbury: 'merchant',
  gloucester: 'merchant',
  oxford: 'merchant',
  warrington: 'merchant',
  nottingham: 'merchant',
};

export function cityZone(cityId: CityId): BoardZone {
  return CITY_ZONE[cityId] ?? 'orange';
}

export function zoneTheme(zone: BoardZone) {
  return ZONE_THEME[zone];
}

export function merchantZoneTheme() {
  return MERCHANT_ZONE_THEME;
}

export const BOARD_ZONES: BoardZone[] = ['orange', 'blueDark', 'cyan', 'red', 'purple'];
