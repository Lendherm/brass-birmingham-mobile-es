import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import type { IndustryType } from '../engine/types';
import { INDUSTRY_TRACKS } from '../engine/data/industries';
import { activePlayer, type GameState } from '../engine/state';
import { industria } from '../i18n/es';
import { IndustryIcon } from './visual/IndustryIcon';
import { MatTile, matTileTitle } from './visual/MatTile';
import { TapInfoBubble } from './TapInfoBubble';

const MAT_ORDER: IndustryType[] = ['cotton', 'goods', 'pottery', 'coal', 'iron', 'brewery'];

interface Props {
  state: GameState;
}

function PlayerMatGrid({ state, className }: { state: GameState; className?: string }) {
  const player = state.players[activePlayer(state)];
  const era = state.era;
  const [infoText, setInfoText] = useState<string | null>(null);

  return (
    <>
      {era === 'canal' && (
        <p className="player-mat-era-note">
          ⛵ Al terminar la <strong>Era Canal</strong> se retiran del tablero las industrias <strong>nivel I</strong> y los
          enlaces solo canal que no hayas construido.
        </p>
      )}
      <div className={['player-mat-grid', className].filter(Boolean).join(' ')}>
        {MAT_ORDER.map((industry) => {
          const track = INDUSTRY_TRACKS[industry];
          const counts = player.mat[industry];
          const totalLeft = counts.reduce((a, c) => a + c, 0);
          return (
            <div key={industry} className={`mat-row ind-${industry}`} aria-label={`${industria(industry)}: ${totalLeft} fichas`}>
              <div className="mat-row-label">
                <IndustryIcon industry={industry} size={14} colorful />
                <span className="mat-row-name">{industria(industry)}</span>
                <span className="mat-row-total">{totalLeft}</span>
              </div>
              <div className="mat-slots">
                {track.map((spec) => {
                  const remaining = counts[spec.level - 1] ?? 0;
                  const tileInfo = matTileTitle(spec, era, remaining);
                  return (
                    <MatTile
                      key={spec.level}
                      industry={industry}
                      spec={spec}
                      era={era}
                      remaining={remaining}
                      infoActive={infoText === tileInfo}
                      onInfoRequest={setInfoText}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <TapInfoBubble text={infoText} onClose={() => setInfoText(null)} />
    </>
  );
}

export function PlayerMat({ state }: Props) {
  const [expanded, setExpanded] = useState(false);

  const close = useCallback(() => setExpanded(false), []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded, close]);

  const openExpanded = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(true);
  };

  return (
    <>
      <details className="panel player-mat player-mat-collapsible" data-testid="player-mat" open>
        <summary className="player-mat-summary">
          <span>Fichas en tu mat</span>
          <button
            type="button"
            className="player-mat-expand-btn"
            onClick={openExpanded}
            data-testid="player-mat-expand"
            aria-label="Ver mat a pantalla completa"
            title="Ampliar mat"
          >
            ⛶ Ampliar
          </button>
        </summary>
        <PlayerMatGrid state={state} />
      </details>

      {expanded && (
        <div className="player-mat-fullscreen" data-testid="player-mat-fullscreen" role="dialog" aria-modal="true" aria-label="Fichas en tu mat">
          <button type="button" className="player-mat-fullscreen-backdrop" aria-label="Cerrar" onClick={close} />
          <div className="panel player-mat-fullscreen-panel">
            <header className="player-mat-fullscreen-header">
              <h2>Fichas en tu mat</h2>
              <button type="button" className="primary" onClick={close} data-testid="player-mat-close">
                Cerrar
              </button>
            </header>
            <PlayerMatGrid state={state} className="player-mat-grid-large" />
          </div>
        </div>
      )}
    </>
  );
}
