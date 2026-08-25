import { useMemo } from 'react';
import type { CityId } from '../engine/types';
import { computePlaySuggestions } from '../engine/suggestions';
import type { GameState } from '../engine/state';
import { CITIES, LINKS } from '../engine/data/board';
import { industria, linkLabel } from '../i18n/es';
import { cityZone, zoneTheme } from './visual/cityZones';
import type { BuildChoice } from '../engine/options';
import { legalNetworks } from '../engine/options';

interface Props {
  state: GameState;
  refreshKey?: number;
  onClose?: () => void;
  onRefresh?: () => void;
}

export function PlayAssistant({ state, refreshKey = 0, onClose, onRefresh }: Props) {
  const suggestions = useMemo(
    () =>
      computePlaySuggestions(state, (city, industry) => ({
        city: CITIES[city].name,
        industry: industria(industry),
      }), refreshKey),
    [state, refreshKey],
  );

  return (
    <div className="panel play-assistant" data-testid="play-assistant">
      <div className="play-assistant-header">
        <div>
          <h3>Asistente de jugadas</h3>
          <p className="play-assistant-meta">
            Pulsa <strong>Sugerencias</strong> arriba para activar o desactivar.
            {onRefresh ? (
              <>
                {' '}
                <button type="button" className="play-assistant-refresh" onClick={onRefresh} data-testid="play-assistant-refresh">
                  ↻ Actualizar lista
                </button>
              </>
            ) : null}
          </p>
        </div>
        {onClose && (
          <button type="button" className="play-assistant-close" onClick={onClose} aria-label="Ocultar sugerencias" data-testid="play-assistant-close">
            Ocultar
          </button>
        )}
      </div>
      <p className="play-assistant-note">Ideas según tu dinero, cartas y reglas. No juega por ti.</p>
      <ol className="play-assistant-list">
        {suggestions.map((s) => (
          <li key={`${s.id}-${refreshKey}`} className={s.recommended ? 'recommended-line' : undefined}>
            <strong>
              {s.recommended ? '★ ' : ''}
              {s.action}:
            </strong>{' '}
            {s.detail}
            <span className="play-assistant-reason">{s.reason}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

interface CityInspectProps {
  state: GameState;
  cityId: CityId;
  builds: BuildChoice[];
  onClose: () => void;
  onBuild?: (b: BuildChoice) => void;
}

export function CityInspectPanel({ state, cityId, builds, onClose, onBuild }: CityInspectProps) {
  const city = CITIES[cityId];
  const zone = zoneTheme(cityZone(cityId));
  const cityBuilds = builds.filter((b) => b.option.city === cityId);
  const cityLinks = legalNetworks(state).filter((n) => {
    const link = LINKS.find((l) => l.id === n.option.linkIds[0]);
    return link?.endpoints.includes(cityId);
  });

  return (
    <div className="city-inspect panel" data-testid="city-inspect">
      <div className="city-inspect-header">
        <span className="city-inspect-zone" style={{ background: zone.banner, borderColor: zone.border, color: zone.bannerText }}>
          {zone.label}
        </span>
        <h3>{city.name}</h3>
        <button type="button" className="city-inspect-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      </div>
      <ul className="city-inspect-slots">
        {city.slots.map((allowed, i) => {
          const tile = state.board[cityId][i];
          return (
            <li key={i}>
              {tile ? (
                <>
                  <strong>{industria(tile.industry)} N{tile.level}</strong>
                  {tile.flipped && ' · puntuada'}
                </>
              ) : (
                <>
                  Vacía — <span className="muted-inline">{allowed.map((a) => industria(a)).join(', ')}</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {cityBuilds.length > 0 && (
        <div className="city-inspect-actions">
          <h4>Construcciones legales aquí</h4>
          {cityBuilds.map((b, i) => (
            <button key={i} type="button" className="option-btn" onClick={() => onBuild?.(b)}>
              {industria(b.option.industry)} N{b.option.level} — £{b.option.totalCost}
            </button>
          ))}
        </div>
      )}
      {cityLinks.length > 0 && (
        <div className="city-inspect-actions">
          <h4>Enlaces desde aquí</h4>
          {cityLinks.map((n, i) => (
            <p key={i} className="city-inspect-link">
              {linkLabel(n.option.linkIds[0])} — £{n.option.totalCost}
            </p>
          ))}
        </div>
      )}
      {cityBuilds.length === 0 && cityLinks.length === 0 && (
        <p className="muted-inline">Selecciona una acción y carta para ver opciones en esta ciudad.</p>
      )}
    </div>
  );
}
