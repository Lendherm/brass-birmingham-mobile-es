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
  return (
    <details className="panel board-symbol-legend" data-testid="board-symbol-legend" open>
      <summary>Símbolos del mapa</summary>
      <ul className="board-symbol-legend-list">
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
