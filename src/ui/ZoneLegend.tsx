import { BOARD_ZONES, zoneTheme } from './visual/cityZones';

export function ZoneLegend() {
  return (
    <div className="zone-legend" data-testid="zone-legend" aria-label="Colores de zona del tablero">
      {BOARD_ZONES.map((z) => {
        const t = zoneTheme(z);
        return (
          <span key={z} className={`zone-legend-chip zone-${z}`} style={{ background: t.fill, borderColor: t.border, color: t.text }}>
            {t.label}
          </span>
        );
      })}
    </div>
  );
}
