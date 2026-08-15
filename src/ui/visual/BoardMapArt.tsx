import type { Era } from '../../engine/types';

/** Fondo del tablero; sigue --board-bg / --board-map-border del tema activo. */
export function BoardMapArt({ era: _era }: { era: Era }) {
  return (
    <g className="board-map-art" aria-hidden="true">
      <rect className="board-map-surface" x={0} y={0} width={900} height={860} />
      <rect className="board-map-frame" x={3} y={3} width={894} height={854} rx={11} />
    </g>
  );
}

export function BoardMapArtDefs() {
  return null;
}
