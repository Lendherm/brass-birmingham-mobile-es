interface Props {
  available?: boolean;
  size?: number;
  title?: string;
}

/** Tarro de cerveza — relleno si disponible, apagado si agotado. */
export function BeerIcon({ available = true, size = 18, title }: Props) {
  return (
    <span
      className={`beer-mug-icon${available ? ' available' : ' spent'}`}
      style={{ fontSize: size }}
      role="img"
      aria-label={title ?? (available ? 'Cerveza disponible' : 'Cerveza agotada')}
      title={title}
    >
      🍺
    </span>
  );
}

export function BeerIconRow({ beer, size = 20 }: { beer: readonly boolean[]; size?: number }) {
  if (beer.length === 0) return null;
  return (
    <span className="beer-mug-row" aria-label={`Cerveza: ${beer.filter(Boolean).length} de ${beer.length} disponible`}>
      {beer.map((available, i) => (
        <BeerIcon key={i} available={available} size={size} title={available ? 'Disponible' : 'Agotada'} />
      ))}
    </span>
  );
}
