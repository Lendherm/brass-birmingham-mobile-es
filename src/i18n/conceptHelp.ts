/** Conceptual help texts shown via “?” and the strategy guide. */

export const NETWORK_TOLL_CONCEPT = {
  id: 'network-toll',
  title: 'La red como peaje industrial',
  short: 'Los enlaces no te dan monedas de los rivales: el “peaje” se cobra en puntos de victoria.',
  body: `Aunque mecánicamente el juego no te dé monedas de los demás jugadores, a nivel conceptual y de diseño de la Revolución Industrial, la **red comercial** funciona como ese impuesto o beneficio indirecto por monopolizar el transporte.

**El “peaje” se cobra en puntos (PV):** en lugar de quitarle monedas a tus oponentes durante la partida (lo cual desequilibraría la economía del juego), el juego simula que controlar el transporte te da un poderío y un dominio regional tan grande que se traduce directamente en **puntos de victoria** al final de cada era.

**Tú cobras por el flujo:** como el carbón, el hierro, la cerveza y las mercancías pasan obligatoriamente por esas rutas para llegar a los mercados, tú (el magnate del transporte) te llevas la tajada grande al puntuar por haber facilitado (o controlado) todo ese tráfico industrial.`,
} as const;

export const CONCEPT_HELPS = [NETWORK_TOLL_CONCEPT] as const;
