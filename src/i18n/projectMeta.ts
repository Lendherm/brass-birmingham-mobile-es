/** Repositorio original (motor web en inglés). */
export const UPSTREAM_REPO = 'https://github.com/KDC-Solo/brass-birmingham';

/** Slug del repo en GitHub (Lendherm). */
export const GITHUB_REPO_SLUG = 'brass-birmingham-mobile-es';

/** Este fork — interfaz móvil en español y mejoras de Nathanael De la Rosa. */
export const THIS_REPO = `https://github.com/Lendherm/${GITHUB_REPO_SLUG}`;

export const AUTHOR_NAME = 'Nathanael De la Rosa';
export const AUTHOR_GITHUB = 'https://github.com/Lendherm';

/** Nombre completo (web, créditos, stores). */
export const APP_NAME_FULL = 'Brass Birmingham — Edición Móvil (ES)';

/** Nombre corto (icono Android, barra superior, PWA). */
export const APP_NAME_SHORT = 'Brass Móvil ES';

export const FORK_CHANGES = [
  'Interfaz completa en español y diseño optimizado para móvil (vertical y horizontal).',
  'APK Android con Capacitor, icono propio y pantalla de inicio adaptada.',
  'Modo oscuro con tablero sincronizado, texto grande (A+) y guardado automático.',
  'Asistente de jugadas, guía de casillas al seleccionar ciudad, leyenda de símbolos del mapa.',
  'Mercados explicados, mat de fichas estilo PC, popups de ciudad/comerciante y zoom en el mapa.',
  'Modo Contra IA (Brass oficial), entrenador comparativo, escenarios de torneo y panel Elo.',
  'Repaso jugada a jugada, drills por debilidad, metas semanales y modo Torneo (MCTS).',
] as const;
