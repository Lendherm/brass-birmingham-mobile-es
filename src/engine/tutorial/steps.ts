import type { CityId } from '../types';
import type { Card } from '../state';
import type { PlayerAction } from '../game';
import type { TutorialSegmentId } from './segments';

export type TutorialActionKind = 'build' | 'network' | 'sell' | 'develop' | 'loan' | 'scout' | 'pass';

export type TutorialStepKind =
  | { type: 'continue'; focus?: string }
  | { type: 'pick-action'; action: TutorialActionKind; focus: string }
  | {
      type: 'pick-card';
      action: TutorialActionKind;
      cardCity?: CityId;
      cardIndex?: number;
      cardIndustry?: string;
      focus: string;
    }
  | { type: 'apply-build'; city: CityId; industry: string; focus?: string }
  | { type: 'apply-network'; linkId: string; focus?: string }
  | { type: 'apply-sell'; city: CityId; slot: number; focus?: string }
  | { type: 'apply-develop'; industry: string; focus?: string };

export interface InteractiveTutorialStep {
  id: string;
  chapter: number;
  chapterTitle: string;
  title: string;
  body: string;
  wrongHint: string;
  segment?: TutorialSegmentId;
  step: TutorialStepKind;
}

export const TUTORIAL_CHAPTERS = [
  'Lo esencial',
  'Vender',
  'Desarrollar',
  'Préstamo',
  'Explorar',
  'Partida completa',
  'Coach y entrenamiento',
] as const;

export const INTERACTIVE_TUTORIAL: InteractiveTutorialStep[] = [
  // —— Capítulo 1: Construir / Red / Pasar ——
  {
    id: 'welcome',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Aprende jugando',
    body: 'Este tutorial tiene **7 capítulos interactivos**. En cada uno practicarás una mecánica real del juego o las herramientas de mejora. Solo podrás pulsar lo indicado.',
    wrongHint: '',
    step: { type: 'continue' },
  },
  {
    id: 'map',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Explora el mapa',
    body: '**Arrastra** para mover el tablero y **pellizca** (o usa +/−) para zoom. Prueba y pulsa Continuar.',
    wrongHint: '',
    step: { type: 'continue', focus: 'board-viewport' },
  },
  {
    id: 'pick-build',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Construir',
    body: 'Las industrias dan PV y recursos. Pulsa **Construir**.',
    wrongHint: 'Pulsa Construir.',
    step: { type: 'pick-action', action: 'build', focus: 'action-build' },
  },
  {
    id: 'pick-dudley-card',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Carta de ubicación',
    body: 'Cada acción gasta una carta. Elige **Dudley**.',
    wrongHint: 'Elige la carta Dudley.',
    step: { type: 'pick-card', action: 'build', cardCity: 'dudley', focus: 'hand' },
  },
  {
    id: 'build-coal',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Mina de carbón',
    body: 'Construye una **mina de carbón** (⚫) en Dudley.',
    wrongHint: 'Construye carbón en Dudley.',
    step: { type: 'apply-build', city: 'dudley', industry: 'coal', focus: 'board' },
  },
  {
    id: 'explain-coal',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Recursos',
    body: 'El número en la ficha es **carbón restante**. Al agotarse se voltea y puntúa al final de era. Mira tu **dinero** arriba.',
    wrongHint: '',
    step: { type: 'continue', focus: 'player-panel' },
  },
  {
    id: 'pick-network',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Red',
    body: 'Los **enlaces** extienden tu red. Pulsa **Red**.',
    wrongHint: 'Pulsa Red.',
    step: { type: 'pick-action', action: 'network', focus: 'action-network' },
  },
  {
    id: 'pick-birmingham-card',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Carta para enlace',
    body: 'Cualquier carta vale. Elige **Birmingham**.',
    wrongHint: 'Elige Birmingham.',
    step: { type: 'pick-card', action: 'network', cardCity: 'birmingham', focus: 'hand' },
  },
  {
    id: 'link-dudley',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Enlace Birmingham–Dudley',
    body: 'Coloca el enlace resaltado (£3 en era Canal).',
    wrongHint: 'Enlace Birmingham–Dudley.',
    step: { type: 'apply-network', linkId: 'birmingham-dudley', focus: 'board' },
  },
  {
    id: 'pick-pass',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Pasar',
    body: 'Te queda **1 acción**. Pulsa **Pasar** para terminar tu turno.',
    wrongHint: 'Pulsa Pasar.',
    step: { type: 'pick-action', action: 'pass', focus: 'action-pass' },
  },
  {
    id: 'pass-card',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Descartar al pasar',
    body: 'Elige **Coventry** para pasar.',
    wrongHint: 'Elige Coventry.',
    step: { type: 'pick-card', action: 'pass', cardCity: 'coventry', focus: 'hand' },
  },
  {
    id: 'automa',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Historial de partida',
    body: 'Debajo de **Símbolos del mapa** verás el **historial**: todo lo que hacen tú, rivales y la Automa, cada uno con su color. Puedes colapsarlo o cerrarlo con **×**.',
    wrongHint: '',
    step: { type: 'continue', focus: 'game-history' },
  },
  {
    id: 'mat-tap',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Fichas en tu mat',
    body: 'Abre **Fichas en tu mat** y **toca una ficha** para ver coste, PV e ingresos. En Era Canal, las de **nivel I** se retiran al final de la era.',
    wrongHint: '',
    step: { type: 'continue', focus: 'player-mat' },
  },
  {
    id: 'map-tap',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Detalles en el mapa',
    body: '**Toca** ciudades, comerciantes o enlaces para ver información. Si mantienes pulsado ya no aparece copiar/pegar.',
    wrongHint: '',
    step: { type: 'continue', focus: 'board-viewport' },
  },
  {
    id: 'assistant-intro',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Sugerencias de jugada',
    body: 'Pulsa **Sugerencias** arriba para activar o desactivar ideas de jugada. Dentro del panel usa **↻ Actualizar** para otra lista.',
    wrongHint: '',
    step: { type: 'continue', focus: 'assistant-toggle' },
  },
  {
    id: 'layout-intro',
    chapter: 1,
    chapterTitle: 'Lo esencial',
    title: 'Girar pantalla',
    body: 'Si el teléfono no gira solo, usa el botón **↻** (Horizontal): mapa y panel quedan lado a lado sin voltear el celular. Vuelve a pulsar para Vertical o Auto.',
    wrongHint: '',
    step: { type: 'continue', focus: 'layout-toggle' },
  },

  // —— Capítulo 2: Vender ——
  {
    id: 'sell-intro',
    chapter: 2,
    chapterTitle: 'Vender',
    title: 'Capítulo 2 — Vender',
    body: 'Ya tienes una **algodonera** en Worcester conectada al comerciante de Gloucester y cerveza en Walsall. Vender **voltea** la ficha y sube ingresos.',
    wrongHint: '',
    segment: 'sell',
    step: { type: 'continue', focus: 'board-viewport' },
  },
  {
    id: 'pick-sell',
    chapter: 2,
    chapterTitle: 'Vender',
    title: 'Acción Vender',
    body: 'Pulsa **Vender**.',
    wrongHint: 'Pulsa Vender.',
    step: { type: 'pick-action', action: 'sell', focus: 'action-sell' },
  },
  {
    id: 'pick-sell-card',
    chapter: 2,
    chapterTitle: 'Vender',
    title: 'Carta de venta',
    body: 'Elige la carta **Worcester**.',
    wrongHint: 'Elige Worcester.',
    step: { type: 'pick-card', action: 'sell', cardCity: 'worcester', focus: 'hand' },
  },
  {
    id: 'apply-sell',
    chapter: 2,
    chapterTitle: 'Vender',
    title: 'Voltea la algodonera',
    body: 'Marca la algodonera de Worcester y pulsa **Vender edificio(s)**. Usará 1 cerveza 🍺.',
    wrongHint: 'Vende la algodonera N1 en Worcester.',
    step: { type: 'apply-sell', city: 'worcester', slot: 0, focus: 'sell-options' },
  },
  {
    id: 'explain-sell',
    chapter: 2,
    chapterTitle: 'Vender',
    title: 'Venta completada',
    body: 'La ficha quedó **volteada** (atenuada) y subieron tus **ingresos**. Esa industria puntúa al final de era.',
    wrongHint: '',
    step: { type: 'continue', focus: 'player-panel' },
  },

  // —— Capítulo 3: Desarrollar ——
  {
    id: 'develop-intro',
    chapter: 3,
    chapterTitle: 'Desarrollar',
    title: 'Capítulo 3 — Desarrollar',
    body: '**Desarrollar** retira fichas de tu **tapete personal** (no del mapa) pagando **hierro**. Necesario antes de la Era Ferrocarril para quitar nivel 1.',
    wrongHint: '',
    segment: 'develop',
    step: { type: 'continue', focus: 'action-panel' },
  },
  {
    id: 'pick-develop',
    chapter: 3,
    chapterTitle: 'Desarrollar',
    title: 'Acción Desarrollar',
    body: 'Pulsa **Desarrollar**.',
    wrongHint: 'Pulsa Desarrollar.',
    step: { type: 'pick-action', action: 'develop', focus: 'action-develop' },
  },
  {
    id: 'pick-develop-card',
    chapter: 3,
    chapterTitle: 'Desarrollar',
    title: 'Carta',
    body: 'Elige la carta **Carbón** (industria).',
    wrongHint: 'Elige la carta de industria Carbón.',
    step: { type: 'pick-card', action: 'develop', cardIndustry: 'coal', focus: 'hand' },
  },
  {
    id: 'apply-develop',
    chapter: 3,
    chapterTitle: 'Desarrollar',
    title: 'Retirar del tapete',
    body: 'Marca **Carbón** en la lista y confirma **Desarrollar ficha**. Gastarás 1 hierro del mercado.',
    wrongHint: 'Desarrolla carbón de tu tapete.',
    step: { type: 'apply-develop', industry: 'coal', focus: 'develop-options' },
  },
  {
    id: 'explain-develop',
    chapter: 3,
    chapterTitle: 'Desarrollar',
    title: 'Tapete actualizado',
    body: 'Retiraste una ficha de carbón nivel 1 de tu reserva. Ahora puedes construir niveles superiores en Era Ferrocarril.',
    wrongHint: '',
    step: { type: 'continue', focus: 'action-panel' },
  },

  // —— Capítulo 4: Préstamo ——
  {
    id: 'loan-intro',
    chapter: 4,
    chapterTitle: 'Préstamo',
    title: 'Capítulo 4 — Préstamo',
    body: 'Tienes poco dinero (£4). Un **préstamo** da +£30 pero baja **3 niveles de ingresos**.',
    wrongHint: '',
    segment: 'loan',
    step: { type: 'continue', focus: 'player-panel' },
  },
  {
    id: 'pick-loan',
    chapter: 4,
    chapterTitle: 'Préstamo',
    title: 'Pedir préstamo',
    body: 'Pulsa **Préstamo**.',
    wrongHint: 'Pulsa Préstamo.',
    step: { type: 'pick-action', action: 'loan', focus: 'action-loan' },
  },
  {
    id: 'apply-loan-card',
    chapter: 4,
    chapterTitle: 'Préstamo',
    title: 'Confirma con una carta',
    body: 'Elige **Coventry** para confirmar el préstamo (+£30, −3 ingresos).',
    wrongHint: 'Elige Coventry para pedir el préstamo.',
    step: { type: 'pick-card', action: 'loan', cardCity: 'coventry', focus: 'hand' },
  },
  {
    id: 'explain-loan',
    chapter: 4,
    chapterTitle: 'Préstamo',
    title: 'Préstamo recibido',
    body: 'Ahora tienes más libras pero menos ingresos por ronda. Úsalo con cuidado.',
    wrongHint: '',
    step: { type: 'continue', focus: 'player-panel' },
  },

  // —— Capítulo 5: Explorar ——
  {
    id: 'scout-intro',
    chapter: 5,
    chapterTitle: 'Explorar',
    title: 'Capítulo 5 — Explorar',
    body: 'Estamos en **Era Ferrocarril**. **Explorar** descarta 3 cartas (incluida la de acción) y roba 2 **comodines** salvajes.',
    wrongHint: '',
    segment: 'scout',
    step: { type: 'continue', focus: 'era-turn' },
  },
  {
    id: 'pick-scout',
    chapter: 5,
    chapterTitle: 'Explorar',
    title: 'Acción Explorar',
    body: 'Pulsa **Explorar**.',
    wrongHint: 'Pulsa Explorar.',
    step: { type: 'pick-action', action: 'scout', focus: 'action-scout' },
  },
  {
    id: 'scout-action-card',
    chapter: 5,
    chapterTitle: 'Explorar',
    title: 'Carta de acción',
    body: 'Elige **Stafford** (1.ª carta) como carta de acción.',
    wrongHint: 'Elige la carta Stafford.',
    step: { type: 'pick-card', action: 'scout', cardIndex: 0, focus: 'hand' },
  },
  {
    id: 'scout-discard-1',
    chapter: 5,
    chapterTitle: 'Explorar',
    title: 'Primera carta extra',
    body: 'Descarta **Burton** (2.ª carta).',
    wrongHint: 'Elige Burton para descartar.',
    step: { type: 'pick-card', action: 'scout', cardIndex: 1, focus: 'hand' },
  },
  {
    id: 'scout-discard-2',
    chapter: 5,
    chapterTitle: 'Explorar',
    title: 'Segunda carta extra',
    body: 'Descarta **Hierro** (3.ª carta). Obtendrás 2 comodines.',
    wrongHint: 'Elige la carta de hierro.',
    step: { type: 'pick-card', action: 'scout', cardIndex: 2, focus: 'hand' },
  },
  {
    id: 'explain-scout',
    chapter: 5,
    chapterTitle: 'Explorar',
    title: 'Comodines',
    body: 'Las cartas ★ valen como **cualquier ubicación** o **cualquier industria**. Mira tu mano — aparecieron al final.',
    wrongHint: '',
    step: { type: 'continue', focus: 'hand' },
  },

  // —— Capítulo 6: Meta ——
  {
    id: 'eras',
    chapter: 6,
    chapterTitle: 'Partida completa',
    title: 'Dos eras',
    body: 'La partida tiene **Era Canal** y **Era Ferrocarril**. Termina cada era cuando se agotan mazo y manos. Se puntúan industrias volteadas y enlaces; en Canal se retiran del tablero las industrias **nivel I** y los enlaces solo canal sin construir.',
    wrongHint: '',
    step: { type: 'continue', focus: 'era-turn' },
  },
  {
    id: 'markets',
    chapter: 6,
    chapterTitle: 'Partida completa',
    title: 'Mercados',
    body: '**Carbón e hierro** se compran de los mercados (sube el precio) o de minas conectadas. Vigila los contadores arriba del tablero.',
    wrongHint: '',
    step: { type: 'continue', focus: 'coal-market' },
  },
  {
    id: 'goal',
    chapter: 6,
    chapterTitle: 'Partida completa',
    title: 'Objetivo',
    body: 'Gana quien tenga **más PV** al final. En solo puedes elegir **1 a 3 Automa**. En multijugador pasas el teléfono para ocultar cartas.',
    wrongHint: '',
    step: { type: 'continue', focus: 'player-panel' },
  },
  // —— Capítulo 7: Coach y entrenamiento ——
  {
    id: 'training-intro',
    chapter: 7,
    chapterTitle: 'Coach y entrenamiento',
    title: 'Capítulo 7 — Mejora con coach',
    body: 'Además de las reglas, la app incluye **modo entrenamiento 🎯**, comparativas numéricas, estrategias por carta y guías. Actívalas en partidas reales (no en este tutorial guiado).',
    wrongHint: '',
    step: { type: 'continue', focus: 'training-mode-toggle' },
  },
  {
    id: 'training-mode',
    chapter: 7,
    chapterTitle: 'Coach y entrenamiento',
    title: 'Modo entrenamiento 🎯',
    body: 'En partida, pulsa **🎯** arriba para activar el coach proactivo: detecta errores, explica bloqueos y sugiere la mejor línea según tu mano y tablero.',
    wrongHint: '',
    step: { type: 'continue', focus: 'training-mode-toggle' },
  },
  {
    id: 'training-hints',
    chapter: 7,
    chapterTitle: 'Coach y entrenamiento',
    title: 'Barra del coach',
    body: 'Con 🎯 activo, aparece una **franja sobre el mapa** (toca para expandir). Usa pestañas **Resumen, Comparar, Cartas y Plan**. Ciérrala con **×** cuando quieras.',
    wrongHint: '',
    step: { type: 'continue', focus: 'board-viewport' },
  },
  {
    id: 'training-map',
    chapter: 7,
    chapterTitle: 'Coach y entrenamiento',
    title: 'Ver en mapa',
    body: 'Si el coach resalta ciudades o enlaces, pulsa **Ver en mapa** para centrar la cámara. Usa **Restablecer mapa** para volver a la vista normal.',
    wrongHint: '',
    step: { type: 'continue', focus: 'board-viewport' },
  },
  {
    id: 'training-coach',
    chapter: 7,
    chapterTitle: 'Coach y entrenamiento',
    title: 'Entrenador comparativo 🎓',
    body: 'En **vs IA**, pulsa **🎓** para comparar tu jugada con la de la IA turno a turno. Complementa al modo 🎯: uno explica el tablero, el otro compite contigo.',
    wrongHint: '',
    step: { type: 'continue' },
  },
  {
    id: 'strategy-guide',
    chapter: 7,
    chapterTitle: 'Coach y entrenamiento',
    title: 'Guía de estrategia',
    body: 'Pulsa **📘 Estrategia** (arriba o en el menú) para leer **11 capítulos**: cómo ganar, eras, economía, Automa y errores comunes. Ideal después de este tutorial.',
    wrongHint: '',
    step: { type: 'continue', focus: 'strategy-open' },
  },
  {
    id: 'training-tools',
    chapter: 7,
    chapterTitle: 'Coach y entrenamiento',
    title: 'Aperturas y panel 📊',
    body: 'En **vs IA**, el menú ofrece **Biblioteca de aperturas** (planes por jugadores) y el **panel 📊** con Elo, metas semanales, escenarios y repaso de errores.',
    wrongHint: '',
    step: { type: 'continue' },
  },
  {
    id: 'done',
    chapter: 7,
    chapterTitle: 'Coach y entrenamiento',
    title: '¡Tutorial completo!',
    body: 'Practicaste **todas las acciones** y conoces el **coach 🎯**, comparativas, mapa guiado y guías. Empieza en **fácil vs 1 Automa** con 🎯 activado.',
    wrongHint: '',
    step: { type: 'continue' },
  },
];

export function matchCard(hand: Card[], idx: number, step: Extract<TutorialStepKind, { type: 'pick-card' }>): boolean {
  const card = hand[idx];
  if (!card) return false;
  if (step.cardIndex !== undefined) return idx === step.cardIndex;
  if (step.cardCity && card.kind === 'location') return card.city === step.cardCity;
  if (step.cardIndustry && card.kind === 'industry') return card.industries.includes(step.cardIndustry as never);
  return false;
}

export function matchAppliedAction(action: PlayerAction, step: InteractiveTutorialStep): boolean {
  const s = step.step;
  if (s.type === 'apply-build') {
    return action.type === 'build' && action.option.city === s.city && action.option.industry === s.industry;
  }
  if (s.type === 'apply-network') {
    return action.type === 'network' && action.option.linkIds[0] === s.linkId;
  }
  if (s.type === 'apply-sell') {
    return (
      action.type === 'sell' &&
      action.sales.length > 0 &&
      action.sales[0].sale.city === s.city &&
      action.sales[0].sale.slot === s.slot
    );
  }
  if (s.type === 'apply-develop') {
    return action.type === 'develop' && action.industries.includes(s.industry as never);
  }
  return false;
}

export function stepExpectsActionPick(step: InteractiveTutorialStep): TutorialActionKind | null {
  return step.step.type === 'pick-action' ? step.step.action : null;
}

export function stepExpectsCardPick(step: InteractiveTutorialStep): boolean {
  return step.step.type === 'pick-card';
}

export function stepExpectsApply(step: InteractiveTutorialStep): boolean {
  return (
    step.step.type === 'apply-build' ||
    step.step.type === 'apply-network' ||
    step.step.type === 'apply-sell' ||
    step.step.type === 'apply-develop'
  );
}

export function stepIsContinue(step: InteractiveTutorialStep): boolean {
  return step.step.type === 'continue';
}

export function stepFocus(step: InteractiveTutorialStep): string | undefined {
  if (step.step.type === 'continue') return step.step.focus;
  if ('focus' in step.step) return step.step.focus;
  return undefined;
}

export function stepApplySellTarget(step: InteractiveTutorialStep): { city: CityId; slot: number } | null {
  if (step.step.type !== 'apply-sell') return null;
  return { city: step.step.city, slot: step.step.slot };
}

export function stepApplyDevelopIndustry(step: InteractiveTutorialStep): string | null {
  if (step.step.type !== 'apply-develop') return null;
  return step.step.industry;
}

export function segmentForStep(stepIndex: number): TutorialSegmentId | undefined {
  return INTERACTIVE_TUTORIAL[stepIndex]?.segment;
}
