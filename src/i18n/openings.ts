export interface OpeningPlan {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
}

export interface OpeningLibrary {
  playerCount: 2 | 3 | 4;
  intro: string;
  plans: OpeningPlan[];
}

export const OPENING_LIBRARIES: OpeningLibrary[] = [
  {
    playerCount: 2,
    intro:
      'En 2 jugadores el mazo es corto (40 cartas) y hay ~10 rondas por era. El tempo de cartas y bloquear ciudades clave pesa más que en mesas grandes.',
    plans: [
      {
        id: '2p-links-first',
        title: 'Enlaces antes que industria cara',
        summary: 'Canal temprano: 1–2 enlaces baratos hacia mercado, luego mina/cervecería conectada.',
        bullets: [
          'Prioriza **Birmingham ↔ mercado** o rutas a Gloucester/Worcester.',
          'No gastes wild en enlaces si puedes construir mina conectada la ronda siguiente.',
          'Reserva dinero para 2ª acción de ronda: pasar con 2 acciones es regalar tempo.',
        ],
      },
      {
        id: '2p-coal-beer',
        title: 'Cadena carbón + cerveza',
        summary: 'Mina de carbón conectada al mercado financia cervecería y ventas propias.',
        bullets: [
          'Carbón propio evita pagar mercado y acelera construcciones.',
          'Cervecería en red propia alimenta ventas de algodón/porcelana sin depender del rival.',
          'Voltea mina antes del fin de Canal si el carbón ya no renta.',
        ],
      },
      {
        id: '2p-sell-timing',
        title: 'Vender en ventana Canal',
        summary: 'Una venta fuerte en Canal suele superar construir una ficha nivel II tarde.',
        bullets: [
          'Conecta algodón al comerciante con cerveza propia (+ bonificación).',
          'Vender sube ingresos y financia enlaces de Ferrocarril.',
          'No acumules nivel I sin plan de venta o desarrollo antes del cierre de era.',
        ],
      },
      {
        id: '2p-block',
        title: 'Bloqueo de ciudad única',
        summary: 'En 2p ocupar la 2ª casilla de una ciudad clave frena al rival una era entera.',
        bullets: [
          'Walsall, Dudley y Coventry son puntos de fricción frecuentes.',
          'Overbuild solo si subes nivel o cortas una línea rival clara.',
          'Cuidado: bloquear sin PV propio regala tempo al oponente.',
        ],
      },
      {
        id: '2p-rail-pivot',
        title: 'Pivot Ferrocarril',
        summary: 'Entra a Ferrocarril con ingresos altos y mano flexible (wild/industria).',
        bullets: [
          'Desarrolla tapete de carbón/hierro si quedaron fichas bajas en Canal.',
          'Segundo enlace ferroviario con cerveza propia desbloquea ventas dobles.',
          'Scout solo si la mano no tiene carta de ubicación para tu plan.',
        ],
      },
    ],
  },
  {
    playerCount: 3,
    intro:
      'A 3 jugadores hay más competencia por ciudades y comerciantes. Las rondas son ~9 por era; equilibra bloqueo y PV inmediato.',
    plans: [
      {
        id: '3p-merchant-race',
        title: 'Carrera a comerciantes',
        summary: 'Llegar primero a Gloucester o Liverpool con algodón/bienes listos.',
        bullets: [
          'Un enlace hacia mercado antes que el tercer jugador suele pagar solo.',
          'Reserva cerveza: el comerciante externo es caro en PV.',
          'Si pierdes la carrera, pivot a ingresos por carbón conectado.',
        ],
      },
      {
        id: '3p-flex-hand',
        title: 'Mano flexible > carta única',
        summary: 'Conserva wild/industria doble para reaccionar al mapa.',
        bullets: [
          'Pasar 2 acciones con mano rígida es error común en torneo.',
          'Scout cuando menos de 2 cartas sirven para construir o enlazar.',
          'Préstamo puntual financia jugada de 2 acciones que genera PV.',
        ],
      },
      {
        id: '3p-develop-plan',
        title: 'Desarrollo planificado',
        summary: 'Retira nivel I del tapete en Canal para acceder a nivel III en Ferrocarril.',
        bullets: [
          'Desarrolla cuando el hierro en red es barato y hay PV en la ficha siguiente.',
          'No desarrolles si aún necesitas vender esa industria en Canal.',
          'Coal track limpio acelera minas de Ferrocarril.',
        ],
      },
      {
        id: '3p-income',
        title: 'Escalera de ingresos',
        summary: 'Sube ingresos con ventas y minas volteadas antes de construir nivel IV.',
        bullets: [
          'Cada +4 ingresos ≈ una construcción extra por era.',
          'Ventas múltiples en Ferrocarril requieren red + cerveza estable.',
          'Evita préstamos encadenados: bajan techo de mano.',
        ],
      },
      {
        id: '3p-tempo',
        title: 'Gastar poco para actuar pronto',
        summary: 'Gastar menos que rivales en una ronda te da prioridad la siguiente.',
        bullets: [
          'Construcción barata + pasar 2ª acción puede ser correcto.',
          'Lee la pista de gasto: quien gasta mucho actúa tarde.',
          'Úsalo para colocar enlace bloqueando justo antes del rival.',
        ],
      },
    ],
  },
  {
    playerCount: 4,
    intro:
      '4 jugadores: mazo largo (64 cartas), ~8 rondas/era. Hay tiempo para motores de ingresos pero la presión por casillas es máxima.',
    plans: [
      {
        id: '4p-survive-canal',
        title: 'Sobrevivir Canal sin déficit',
        summary: 'Evita quedar sin red y sin PV a mitad de Canal.',
        bullets: [
          'Primera construcción conectada al mercado o mina en red propia.',
          'No compitas todas las ciudades: elige corredor propio.',
          'Préstamo temprano es aceptable si desbloquea 2 acciones fuertes.',
        ],
      },
      {
        id: '4p-beer-engine',
        title: 'Motor de cerveza compartido',
        summary: 'Cervecería grande alimenta tus ventas y puede vender cerveza a rivales.',
        bullets: [
          'Nivel II cervecería en red densa = flexibilidad de ventas.',
          'Cerveza vendida a rival aún te da ingresos y tempo.',
          'Protege la cervecería con enlace propio antes del fin de Canal.',
        ],
      },
      {
        id: '4p-rail-links',
        title: 'Doble enlace Ferrocarril',
        summary: 'Planifica 2 enlaces rail con cerveza para ventas repetidas.',
        bullets: [
          'Primera venta financia segundo enlace.',
          'Industrias nivel III+ necesitan red densa.',
          'No ignores PV de enlaces al cerrar era.',
        ],
      },
      {
        id: '4p-scout-late',
        title: 'Scout tardío controlado',
        summary: 'Con mazo largo, scout mejora mano cuando quedan 2–3 rondas.',
        bullets: [
          'Descarta cartas muertas de ubicación incorrecta.',
          'Busca wild antes del último tercio de era.',
          'Scout con 3 acciones restantes en ronda es raro pero potente.',
        ],
      },
      {
        id: '4p-vp-routes',
        title: 'Rutas de PV por industria',
        summary: 'Elige una vertical (algodón, cerámica, hierro) según cartas iniciales.',
        bullets: [
          'Mezclar 3 verticales diluye enlaces.',
          'Goods/porcelana necesitan comerciante correcto: mira los 3 mercados.',
          'Pivot si rival bloquea tu ciudad inicial.',
        ],
      },
      {
        id: '4p-end-canal',
        title: 'Checklist fin de Canal',
        summary: '2 rondas antes: lista de nivel I a vender/desarrollar/voltear.',
        bullets: [
          'Industrias solo Canal desaparecen: convierten a PV o se pierden.',
          'Enlaces solo canal sin industria también desaparecen.',
          'Prioriza venta con comerciante sobre construir otra ficha nivel I.',
        ],
      },
    ],
  },
];

export function openingsFor(count: 2 | 3 | 4): OpeningLibrary {
  return OPENING_LIBRARIES.find((l) => l.playerCount === count) ?? OPENING_LIBRARIES[0];
}
