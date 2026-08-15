import { COAL_MARKET, IRON_MARKET, nextBuyPrice, nextSellPrice, type MarketSpec } from '../engine/market';
import { COAL_MARKET_CONNECTION_HINT, COAL_MARKET_PANEL_NOTE } from '../i18n/es';
import { IndustryIcon } from './visual/IndustryIcon';

interface Props {
  coalCubes: number;
  ironCubes: number;
}

function MarketStrip({
  label,
  industry,
  cubes,
  spec,
}: {
  label: string;
  industry: 'coal' | 'iron';
  cubes: number;
  spec: MarketSpec;
}) {
  const max = spec.prices.length;
  const buyPrice = nextBuyPrice(spec, cubes);
  const sellPrice = nextSellPrice(spec, cubes);
  const sellSlots = Math.max(0, max - cubes);
  const canSell = sellSlots > 0;

  return (
    <div className={`market-strip ind-${industry}`} data-testid={`${industry}-market`} aria-label={`Mercado de ${label}`}>
      <div className="market-strip-header">
        <IndustryIcon industry={industry} size={20} colorful />
        <span className="market-strip-title">{label}</span>
      </div>

      <div className="market-ladder" aria-label={`${cubes} cubos en mercado, ${sellSlots} espacios para vender`}>
        {Array.from({ length: max }, (_, i) => {
          const filled = i >= max - cubes;
          const price = spec.prices[i];
          const isBuy = filled && i === max - cubes;
          const isSell = canSell && i === max - cubes - 1;
          return (
            <div key={i} className={`market-ladder-cell${filled ? ' filled' : ' empty'}${isSell ? ' sell-next' : ''}${isBuy ? ' buy-here' : ''}`}>
              <span
                className={`market-cube${filled ? ' filled' : ' empty'}${isSell ? ' sell-next' : ''}`}
                title={filled ? `En mercado · £${price}` : `Vacío · vender aquí · £${price}`}
              />
              <span className="market-price">£{price}</span>
            </div>
          );
        })}
      </div>

      <div className="market-cube-legend">
        <span className="legend-filled">● en mercado</span>
        <span className="legend-empty">○ puedes vender</span>
      </div>

      {industry === 'coal' && (
        <p className="market-coal-note" data-testid="coal-market-connection-note">
          {COAL_MARKET_PANEL_NOTE}
        </p>
      )}

      <div className="market-stats">
        <div className="market-stat">
          <span className="market-stat-label">En mercado</span>
          <span className="market-stat-value">
            <b>{cubes}</b>/{max}
          </span>
        </div>
        <div className="market-stat market-stat-sell">
          <span className="market-stat-label">Puedes vender</span>
          <span className={`market-stat-value${sellSlots === 0 ? ' market-full' : ''}`}>
            <b>{sellSlots}</b> {sellSlots === 1 ? 'cubo' : 'cubos'}
          </span>
        </div>
        <div className="market-stat">
          <span className="market-stat-label">Comprar</span>
          <span className="market-stat-value market-buy">
            £<b>{buyPrice}</b>
          </span>
        </div>
        <div className="market-stat">
          <span className="market-stat-label">Vender</span>
          <span className="market-stat-value market-sell">
            {canSell ? (
              <>
                £<b>{sellPrice}</b>
              </>
            ) : (
              <span className="market-full">lleno</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MarketDisplay({ coalCubes, ironCubes }: Props) {
  return (
    <div className="panel markets-panel">
      <h3>Mercados de recursos</h3>
      <details className="market-help" data-testid="market-help">
        <summary>¿Cómo funcionan los mercados?</summary>
        <div className="market-help-body">
          <p>
            <strong>Cubos llenos (●)</strong> = carbón/hierro disponible para <strong>comprar</strong> cuando construyes. El precio
            sube hacia la izquierda (£1 es más barato).
          </p>
          <p>
            <strong>Huecos vacíos (○)</strong> = espacios donde <strong>tú vendes</strong> carbón/hierro de tus minas/obras al
            construir. Ganas dinero al llenar el mercado.
          </p>
          <p>
            <strong>Comprar</strong> cuesta lo que indica la casilla más a la derecha con cubo. <strong>Vender</strong> paga la
            casilla vacía justo debajo del último cubo (resaltada en verde).
          </p>
          <p>
            <strong>Carbón:</strong> {COAL_MARKET_CONNECTION_HINT}
          </p>
        </div>
      </details>
      <div className="markets-grid">
        <MarketStrip label="Carbón" industry="coal" cubes={coalCubes} spec={COAL_MARKET} />
        <MarketStrip label="Hierro" industry="iron" cubes={ironCubes} spec={IRON_MARKET} />
      </div>
    </div>
  );
}
