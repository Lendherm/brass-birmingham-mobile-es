import { useEffect, useRef, useState } from 'react';
import { BOARD_SYMBOL_LEGEND } from '../i18n/boardSymbols';
import { BeerIcon } from './visual/BeerIcon';

function SymbolSample({ id, fallback }: { id: string; fallback: string }) {
  switch (id) {
    case 'owner':
      return <span className="board-symbol-owner-dot" />;
    case 'level':
      return <span className="board-symbol-sample-text">1</span>;
    case 'linkvp':
      return <span className="board-symbol-linkvp">+2</span>;
    case 'coal':
      return (
        <span className="board-symbol-cubes">
          <span className="mat-res-cube coal board-symbol-cube-lg" />
          <span className="mat-res-cube coal board-symbol-cube-lg" />
        </span>
      );
    case 'iron':
      return <span className="mat-res-cube iron board-symbol-cube-lg" />;
    case 'beer':
      return <BeerIcon available size={18} />;
    case 'empty':
      return <span className="board-symbol-sample-text">▢</span>;
    case 'linkvp-hex':
      return <span className="board-symbol-linkvp">⬡2</span>;
    default:
      return <span className="board-symbol-sample-text">{fallback}</span>;
  }
}

export function BoardSymbolLegend() {
  const [hidden, setHidden] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!expanded) return;
    rootRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [expanded]);

  if (hidden) {
    return (
      <button
        type="button"
        className="board-symbol-legend-reopen"
        onClick={() => setHidden(false)}
        data-testid="board-symbol-legend-reopen"
      >
        Ver símbolos del mapa ({BOARD_SYMBOL_LEGEND.length})
      </button>
    );
  }

  return (
    <details
      ref={rootRef}
      className={`panel board-symbol-legend${expanded ? ' is-expanded' : ''}`}
      data-testid="board-symbol-legend"
      open
    >
      <summary className="board-symbol-legend-summary">
        <span>Símbolos del mapa</span>
        <span className="board-symbol-legend-actions">
          <button
            type="button"
            className="board-symbol-legend-expand"
            aria-label={expanded ? 'Compactar símbolos' : 'Ampliar símbolos'}
            aria-pressed={expanded}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            {expanded ? 'Compactar' : 'Ampliar'}
          </button>
          <button
            type="button"
            className="board-symbol-legend-close"
            aria-label="Cerrar símbolos del mapa"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHidden(true);
              setExpanded(false);
            }}
          >
            ×
          </button>
        </span>
      </summary>
      <ul className={`board-symbol-legend-list${expanded ? ' is-expanded' : ''}`} data-testid="board-symbol-legend-list">
        {BOARD_SYMBOL_LEGEND.map((item) => (
          <li key={item.id}>
            <span className="board-symbol-sample" aria-hidden>
              <SymbolSample id={item.id} fallback={item.sample} />
            </span>
            <div className="board-symbol-meta">
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
