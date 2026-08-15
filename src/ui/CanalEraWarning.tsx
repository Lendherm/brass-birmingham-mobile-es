import { useMemo, useState } from 'react';
import type { GameState } from '../engine/state';
import {
  CANAL_ERA_URGENT_TURNS,
  canalEraWarning,
  formatLevel1CityList,
} from '../engine/canalEraWarnings';
import { industria } from '../i18n/es';
import { TapInfoBubble } from './TapInfoBubble';

interface SidebarProps {
  state: GameState;
}

export function CanalEraSidebarWarning({ state }: SidebarProps) {
  const warning = useMemo(() => canalEraWarning(state), [state]);
  if (!warning) return null;

  const { level1Tiles, linkCount, turnsLeft, urgent } = warning;
  const cityList = level1Tiles.length > 0 ? formatLevel1CityList(level1Tiles) : null;

  return (
    <div
      className={`canal-era-warning panel${urgent ? ' canal-era-warning-urgent' : ''}`}
      data-testid="canal-era-warning"
      role="status"
    >
      <p className="canal-era-warning-title">⛵ Fin de Era Canal</p>
      {level1Tiles.length > 0 && (
        <p className="canal-era-warning-body">
          Tienes <strong>{level1Tiles.length}</strong>{' '}
          {level1Tiles.length === 1 ? 'industria nivel I' : 'industrias nivel I'} en el tablero
          {cityList ? ` (${cityList})` : ''}. Se <strong>retiran</strong> al terminar la era si no las volteas o
          desarrollas.
        </p>
      )}
      {linkCount > 0 && (
        <p className="canal-era-warning-body">
          Tus <strong>{linkCount}</strong> {linkCount === 1 ? 'enlace desaparece' : 'enlaces desaparecen'} al cerrar la
          era (puntúan antes).
        </p>
      )}
      {turnsLeft <= CANAL_ERA_URGENT_TURNS + 1 && (
        <p className="canal-era-warning-meta">
          {turnsLeft <= CANAL_ERA_URGENT_TURNS
            ? `⚠️ Quedan ~${turnsLeft} ${turnsLeft === 1 ? 'turno' : 'turnos'} — actúa ya.`
            : `Quedan ~${turnsLeft} turnos para cerrar la era.`}
        </p>
      )}
    </div>
  );
}

interface MapAlertProps {
  state: GameState;
  enabled: boolean;
}

export function CanalEraMapAlert({ state, enabled }: MapAlertProps) {
  const warning = useMemo(() => canalEraWarning(state), [state]);
  const [dismissedTurn, setDismissedTurn] = useState<number | null>(null);

  const show =
    enabled &&
    warning?.urgent &&
    warning.level1Tiles.length > 0 &&
    dismissedTurn !== state.turn;

  if (!show || !warning) return null;

  const cityList = formatLevel1CityList(warning.level1Tiles, 4);
  const industries = [...new Set(warning.level1Tiles.map((t) => industria(t.industry)))].slice(0, 3).join(', ');

  const text = `⛵ Quedan ~${warning.turnsLeft} ${warning.turnsLeft === 1 ? 'turno' : 'turnos'} de Era Canal. ${warning.level1Tiles.length} industria${warning.level1Tiles.length === 1 ? '' : 's'} nivel I (${industries}${cityList ? ` en ${cityList}` : ''}) se retirará${warning.level1Tiles.length === 1 ? '' : 'n'} del tablero. Voltea o desarrolla antes de que acabe la era.`;

  return (
    <TapInfoBubble
      text={text}
      onClose={() => setDismissedTurn(state.turn)}
      className="map-tap-info map-era-alert"
    />
  );
}
