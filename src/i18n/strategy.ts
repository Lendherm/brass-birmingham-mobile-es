export interface StrategyChapter {
  id: string;
  title: string;
  subtitle: string;
  sections: { heading: string; body: string }[];
}

export const STRATEGY_CHAPTERS: StrategyChapter[] = [
  {
    id: 'win',
    title: 'Cómo ganar',
    subtitle: 'Objetivo y puntuación',
    sections: [
      {
        heading: 'El objetivo',
        body: 'Gana quien tenga **más puntos de victoria (PV)** al terminar la **Era Ferrocarril**. No gana quien tenga más dinero: las libras solo sirven para construir; al final lo que cuenta son los PV.',
      },
      {
        heading: 'De dónde salen los PV',
        body: '• **Industrias volteadas** (algodón, manufacturas, cerámica): puntúan al final de **cada era**.\n• **Enlaces**: al final de cada era sumas PV según los iconos de enlace de las ciudades y comerciantes conectados.\n• **Ventas**: suben ingresos (indirectamente te dan más dinero por ronda) y dejan fichas volteadas que puntúan.\n• **Bonificaciones** de comerciantes al vender con su cerveza.\n• La Automa puede ganar PV extra al pasar o desarrollar — tú no.',
      },
      {
        heading: 'Cómo compararte con rivales',
        body: 'En **solo vs Automa**, compites contra 1–3 rivales IA. Gana quien tenga **más PV**, no necesariamente “tú contra la mejor Automa”. En **multijugador**, gana el jugador humano con más PV al final.\n\nRevisa el panel lateral y el **registro** tras cada puntuación de era.',
      },
    ],
  },
  {
    id: 'plan',
    title: 'Plan de partida',
    subtitle: 'Visión general',
    sections: [
      {
        heading: 'Las dos eras',
        body: '**Era Canal** (~10 turnos): enlaces baratos (£3), muchas industrias solo de nivel 1, tablero más abierto.\n\n**Era Ferrocarril** (~10 turnos): enlaces caros (£5 + carbón), debes **desarrollar** nivel 1, aparecen industrias de niveles altos. Al cambiar de era se **puntúa**, se retiran enlaces e industrias nivel 1, y repartes manos nuevas.',
      },
      {
        heading: 'Flujo de cada turno',
        body: '**2 acciones** por turno (1 solo en el primer turno del juego). Cada acción **gasta 1 carta**. Tras tu turno robas hasta 8 cartas.\n\nEn solo, después juegan **todas las Automa**. Al acabar la ronda cobras **ingresos**.',
      },
      {
        heading: 'Mentalidad ganadora',
        body: 'Piensa en **PV por carta** y **PV por libra**. Una acción que da muchos PV al final de era (enlace bien colocado, venta que sube ingresos y voltea ficha) suele valer más que ahorrar £2 ahora.\n\nPlanifica **dos eras**: lo que construyes en Canal debe encajar con tu red e industrias en Ferrocarril.',
      },
    ],
  },
  {
    id: 'canal',
    title: 'Era Canal',
    subtitle: 'Apertura y mid-game',
    sections: [
      {
        heading: 'Prioridades tempranas',
        body: '1. **Primera ficha** en una ciudad fuerte (Birmingham, Coventry, Wolverhampton…) — no necesitas red previa.\n2. **Red hacia comerciantes** que compren lo que puedes vender.\n3. **Mina de carbón** o acceso barato al carbón — en Ferrocarril todo enlace cuesta carbón.\n4. **Cervecería** conectada si planeas vender pronto.',
      },
      {
        heading: 'Enlaces en Canal',
        body: 'Cuestan solo **£3**. Colócalos hacia:\n• Ciudades donde quieras construir en Ferrocarril.\n• **Comerciantes** con buenos iconos de enlace y bonificación.\n• Rutas que den **muchos PV** al final de era (mira iconos de enlace en ciudades con varias fichas).\n\nNo llenes el mapa: cada enlace es una carta que no usaste para construir o vender.',
      },
      {
        heading: 'Industrias típicas',
        body: '• **Carbón**: produce recurso, sube ingresos al construir, ayuda en Ferrocarril.\n• **Algodón / manufacturas**: construyes, vendes con cerveza, vuelcas y puntúas.\n• **Cervecería**: enable ventas; también produce cerveza en el tablero.\n• **Hierro**: útil para construcciones y desarrollar antes de Ferrocarril.',
      },
      {
        heading: 'Fin de Canal',
        body: 'La era termina cuando **mazo y manos** se agotan. Antes del cierre:\n• Intenta tener **fichas volteadas** que puntúen.\n• Tus **enlaces** suman ahora — coloca los que falten si tienes cartas de red.\n• Recuerda: enlaces e industrias **nivel 1 desaparecen** al cambiar de era.',
      },
    ],
  },
  {
    id: 'rail',
    title: 'Era Ferrocarril',
    subtitle: 'Transición y cierre',
    sections: [
      {
        heading: 'Antes de que empiece',
        body: 'En Canal debiste **desarrollar** (retirar del tapete) industrias de nivel 1 que ya no podrás usar. Si quedan nivel 1 en tu tapete, bloquean construcciones superiores.\n\n**Desarrollar** cuesta 1 hierro por ficha retirada (del tablero o mercado). Hazlo con tiempo, no en la última carta.',
      },
      {
        heading: 'Prioridades en Ferrocarril',
        body: '1. **Industrias de alto nivel** (algodón 3–4, manufacturas, cerámica) en ciudades de tu red.\n2. **Enlaces de ferrocarril** (£5 + carbón) hacia zonas ricas en iconos de enlace.\n3. **Vender** cuando la subida de ingresos compense la carta gastada.\n4. **Explorar** solo si los comodines desbloquean una jugada clave (ubicación o industria que te falta).',
      },
      {
        heading: 'Cerámica y niveles altos',
        body: 'La **cerámica** puntúa mucho pero cuesta caro y pide cerveza al vender. En Ferrocarril, si tienes red y cerveza, una venta de cerámica puede ser decisiva.\n\nLas **minas y cervecerías** de nivel alto siguen produciendo recursos — protege tu cadena de suministro.',
      },
      {
        heading: 'Cierre de partida',
        body: 'Igual que Canal: cuando se acaban cartas, **puntuación final**. Maximiza:\n• Fichas **volteadas** en el tablero.\n• **Enlaces** con muchos iconos en los extremos.\n• No dejes cartas “muertas” si aún puedes colocar un enlace barato o vender.',
      },
    ],
  },
  {
    id: 'economy',
    title: 'Economía',
    subtitle: 'Dinero e ingresos',
    sections: [
      {
        heading: 'Dinero vs ingresos',
        body: '**Dinero (£)**: pagas construcciones y compras en mercados. Empiezas con £17.\n\n**Ingresos**: cada ronda recibes (o pagas) según tu casilla en la pista. **Vender** y algunas construcciones **suben** ingresos; los **préstamos** los bajan 3 casillas.',
      },
      {
        heading: 'Cuándo pedir préstamo',
        body: 'Pide **préstamo** (+£30) cuando:\n• Una jugada genera **más PV o ingresos** de los que pierdes por −3 en la pista.\n• Necesitas carbón/hierro del mercado para no perder el turno.\n\nEvita préstamos repetidos: bajar ingresos a **−10** no está permitido y te limita mucho.',
      },
      {
        heading: 'Déficit',
        body: 'Si al cobrar ingresos debes dinero, el juego **vende fichas** a mitad de precio. Si aún debes, **pierdes PV**. Mantén siempre un colchón de £ o ingresos positivos en mid/late game.',
      },
      {
        heading: 'Regla práctica',
        body: 'Gastar la última libra en un enlace mediocre suele ser peor que **pasar** y conservar flexibilidad — excepto si ese enlace cierra una ruta de venta o suma 5+ PV en el cierre de era.',
      },
    ],
  },
  {
    id: 'network',
    title: 'Red e industrias',
    subtitle: 'Construcción inteligente',
    sections: [
      {
        heading: 'Regla de la red',
        body: 'Solo construyes en ciudades **conectadas a tu red** (excepto tu **primera ficha**). Sin enlaces no expandes. Cada enlace es inversión en futuras construcciones y en PV.',
      },
      {
        heading: 'Cartas de ubicación vs industria',
        body: '• **Ubicación**: construyes **cualquier industria legal** en esa ciudad.\n• **Industria**: construyes esa industria en **cualquier ciudad de tu red** con hueco.\n\nGuarda cartas que coincidan con ciudades donde ya tienes buenos huecos o comerciantes cerca.',
      },
      {
        heading: 'Carbón e hierro al construir',
        body: 'Muchas fichas piden **carbón** (de mina conectada o mercado) e **hierro** (de cualquier fundición conectada por red, propia o ajena). Antes de construir, mira si comprar del mercado encarece el suministro para rivales.\n\nConstruir **minas temprano** suele pagarse solas.',
      },
      {
        heading: 'Sobreconstruir',
        body: 'No llenes ciudades sin plan de **vender** o **puntuar**. Una ficha sin voltear al cierre de era puede ser PV perdidos frente a una venta bien hecha.',
      },
    ],
  },
  {
    id: 'sell',
    title: 'Vender',
    subtitle: 'Cuándo volcar fichas',
    sections: [
      {
        heading: 'Por qué vender',
        body: '**Vender** voltea algodoneras, manufacturas y cerámica conectadas a un **comerciante** que compre ese producto. Pagas **cerveza** (tuya, ajena o del comerciante). Ganas **subida de ingresos** y la ficha **puntúa al final de era**.',
      },
      {
        heading: 'Cuándo conviene',
        body: '• Tienes **cerveza segura** (cervecería conectada o comerciante con barril).\n• La subida de **ingresos** te permite construir más en 2–3 rondas.\n• Necesitas **PV volteados** antes del cierre de era.\n• Usar cerveza del **comerciante** activa su bonificación (dinero, ingresos o PV extra).',
      },
      {
        heading: 'Cuándo esperar',
        body: '• Aún no tienes red al comerciante.\n• Gastarías la única cerveza en una venta pequeña de nivel 1 si puedes vender nivel 2–3 en Ferrocarril.\n• La carta serviría mejor para un **enlace crítico** este turno.',
      },
      {
        heading: 'Cadena ideal',
        body: 'Red → comerciante → cervecería en ruta → algodonera → **vender** → ingresos altos → construcciones caras en Ferrocarril. Monta esta cadena ya en Canal.',
      },
    ],
  },
  {
    id: 'resources',
    title: 'Recursos',
    subtitle: 'Carbón, hierro, cerveza',
    sections: [
      {
        heading: 'Carbón',
        body: 'En el tablero (minas) y en el **mercado**. Comprar sube el precio para todos. En Ferrocarril **cada enlace** consume carbón — tener mina propia ahorra mucho.\n\nSi la Automa agota minas, el mercado se encarece: construye minas antes.',
      },
      {
        heading: 'Hierro',
        body: 'Las **fundiciones** producen hierro al construirse; también hay mercado. Cualquier jugador puede usar hierro de una fundición **conectada por red** (pagando al dueño si es ajena, según reglas de la app).\n\nNecesitas hierro para **desarrollar** y para muchas construcciones de nivel alto.',
      },
      {
        heading: 'Cerveza',
        body: 'Solo en **cervecerías** (cubos en ficha) y en **comerciantes** (barril por casilla). Es el cuello de botella de las ventas. Sin cerveza no vendes; planifica 1–2 cervecerías en tu red o negocia rutas al comerciante.',
      },
      {
        heading: 'Mercados en pantalla',
        body: 'Arriba del tablero ves precio y cubos restantes. Si quedan pocos cubos, el precio sube — a veces conviene **construir antes** que comprar.',
      },
    ],
  },
  {
    id: 'automa',
    title: 'Contra la Automa',
    subtitle: 'Solo 1–3 rivales',
    sections: [
      {
        heading: 'Cómo juega la Automa',
        body: 'Usa cartas **Mautoma**, no paga dinero pero **sí consume** carbón, hierro y cerveza reales. Ocupa huecos, enlaces y puntúa como tú. **No** pide préstamo, explora ni reconstruye.\n\nLee el **registro** cada ronda para ver qué hizo.',
      },
      {
        heading: 'Dificultad',
        body: '• **Fácil**: empieza con menos fichas en el tapete — más huecos para ti.\n• **Media / difícil**: tapete más lleno, compite antes por ciudades clave.\n\nSube dificultad cuando ganes con regularidad en fácil.',
      },
      {
        heading: 'Varios oponentes (2–4 jugadores)',
        body: 'Con **2 o 3 Automa**, compites por el **primer puesto** entre todos. Bloquear una ciudad clave perjudica a todas las Automa, pero **no descuides PV**: a veces conviene construir lejos si suma más puntos.\n\nCada Automa tiene **mazo y puntuación** propios.',
      },
      {
        heading: 'Estrategias anti-Automa',
        body: '• **Correr al comerciante** antes que bloqueen la ruta.\n• **Vender pronto** para subir ingresos y despegarte en Ferrocarril.\n• **Enlaces de alto PV** en ciudades que la Automa ya ocupó — aún suman a tu puntuación.\n• No intentes bloquear todo el mapa: la Automa pasa y gana PV si no avanzas tú.',
      },
    ],
  },
  {
    id: 'hotseat',
    title: 'Multijugador',
    subtitle: 'Pasar el teléfono',
    sections: [
      {
        heading: 'Diferencias clave',
        body: 'No hay Automa: todos usan el mismo mazo de cartas según jugadores (2–4). El **orden de turno** cambia cada ronda: actúa antes quien **gastó menos dinero** (a igualdad, quien iba antes).',
      },
      {
        heading: 'Estrategia de gasto',
        body: 'Gastar **poco** te da iniciativa next round (actuar antes = mejores huecos). Pero gastar **mucho** en una jugada fuerte puede valer más que ir primero. Equilibra según el tablero.',
      },
      {
        heading: 'Ocultar información',
        body: 'La app **oculta la pantalla** al cambiar de jugador. No mires cartas ajenas. Planifica tu turno mentalmente mientras esperas.',
      },
      {
        heading: 'Interacción',
        body: 'Bloquear ciudades y rutas perjudica a humanos más que a Automa. Si un rival va ganando en PV, **bloquea comerciantes** y minas que necesite — sin olvidar sumar tus propios PV.',
      },
    ],
  },
  {
    id: 'mistakes',
    title: 'Errores comunes',
    subtitle: 'Evita perder por esto',
    sections: [
      {
        heading: 'Errores de principiante',
        body: '• Construir sin **plan de red** hacia comerciantes.\n• Olvidar **desarrollar** antes de Ferrocarril.\n• Guardar cartas “por si acaso” hasta que el mazo se acaba.\n• Pedir **préstamos** sin un plan para recuperar ingresos.\n• Ignorar el **cierre de era** — fichas sin voltear son PV perdidos.',
      },
      {
        heading: 'Errores en solo',
        body: '• Subestimar PV de la **Automa** en el registro.\n• Dejar que acumule **enlaces baratos** en Canal sin competir en puntuación.\n• No leer qué carta Mautoma jugó — te indica dónde construirá después.',
      },
      {
        heading: 'Checklist antes de actuar',
        body: '1. ¿Esta acción suma **PV** o **ingresos** pronto?\n2. ¿Me acerca a un **comerciante** o mina?\n3. ¿Tengo **cerveza/carbón** para la próxima era?\n4. ¿Me quedan cartas para el **cierre de era**?',
      },
      {
        heading: 'Siguiente paso',
        body: 'Practica cada mecánica en el **tutorial interactivo** (7 capítulos). Luego juega en **fácil vs 1 Automa** con **modo entrenamiento 🎯** activado, aplicando una estrategia por partida: una vez prioriza ventas, otra enlaces, otra minas.',
      },
    ],
  },
];

export const STRATEGY_QUICK_TIPS = [
  'Canal: red hacia comerciantes + mina de carbón temprana.',
  'Ferrocarril: desarrolla nivel 1 antes de que acabe Canal.',
  'Vender sube ingresos — clave para construcciones caras.',
  'Enlaces baratos en Canal suelen ser los mejores PV/libra.',
  'Lee el registro de la Automa cada turno.',
  'Explorar solo si el comodín desbloquea una jugada ganadora.',
] as const;
