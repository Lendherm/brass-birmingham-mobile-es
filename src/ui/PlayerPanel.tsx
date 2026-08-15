import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { activePlayer, automaOpponentIds, HUMAN, isVsAutoma, type GameState, type PlayerState } from '../engine/state';
import { levelForSpace } from '../engine/income';
import { LINK_SUPPLY, playerLinksRemaining } from '../engine/links';
import { BRASS_DECK_SIZE, MAUTOMA_ERA_CARDS } from '../i18n/gameModes';
import { playCoinSound, playEraSound, playVpSound } from './visual/sounds';
import { LinkTransportIcon } from './visual/LinkTransportIcon';

interface Props {
  state: GameState;
}

export function IncomeTrack({ space, compact = false }: { space: number; compact?: boolean }) {
  const level = levelForSpace(space);
  const pct = ((level + 10) / 40) * 100;
  return (
    <div className={`income-track${compact ? ' income-track-compact' : ''}`} data-testid={compact ? 'income-track-compact' : 'income-track'}>
      {!compact && (
        <div className="income-track-labels">
          <span>−10</span>
          <span>Ingresos</span>
          <span>30</span>
        </div>
      )}
      <div className="income-track-bar">
        <div className="income-track-fill" style={{ width: `${pct}%` }} />
        <div className="income-track-marker" style={{ left: `${pct}%` }} title={`Nivel ${level}`} />
      </div>
      <div className="income-track-value">
        {compact ? (
          <>
            Ing. <b>{level}</b>
          </>
        ) : (
          <>
            Nivel <b>{level}</b>
          </>
        )}
      </div>
    </div>
  );
}

function NetworkSupplyRow({ state, playerId }: { state: GameState; playerId: number }) {
  const total = LINK_SUPPLY[state.playerCount];
  const left = playerLinksRemaining(state, playerId);
  return (
    <div className="player-network-supply" data-testid="player-network-supply" title="Enlaces que aún puedes colocar">
      <LinkTransportIcon era={state.era} size={16} />
      <span>
        Red <b>{left}</b>/{total}
      </span>
    </div>
  );
}

function PlayerCard({
  name,
  player,
  badgeClass,
  badgeStyle,
  deckLabel,
  deckCount,
  deckTitle,
  compactIncome = false,
  vpTestId,
  state,
  playerId,
}: {
  name: string;
  player: PlayerState;
  badgeClass?: string;
  badgeStyle?: CSSProperties;
  deckLabel?: string;
  deckCount?: number;
  deckTitle?: string;
  compactIncome?: boolean;
  vpTestId?: string;
  state: GameState;
  playerId: number;
}) {
  return (
    <div className={`player-card${compactIncome ? ' player-card-compact' : ''}`}>
      <div className="player-header">
        {badgeClass ? (
          <span className={`${badgeClass} player-name`}>{name}</span>
        ) : (
          <span className="player-badge" style={badgeStyle}>
            {name}
          </span>
        )}
        <div className="player-stats">
          <span className="stat-money">
            £<b>{player.money}</b>
          </span>
          <span className="stat-vp" data-testid={vpTestId}>
            <b>{player.vp}</b> PV
          </span>
        </div>
      </div>
      <IncomeTrack space={player.incomeSpace} compact={compactIncome} />
      <NetworkSupplyRow state={state} playerId={playerId} />
      {deckLabel != null && deckCount != null && (
        <div className="player-card-deck" title={deckTitle}>
          {deckLabel} <b>{deckCount}</b>
        </div>
      )}
    </div>
  );
}

export function PlayerPanel({ state }: Props) {
  const playerId = activePlayer(state);
  const current = state.players[playerId];
  const vpBump = useVpBump(current.vp);

  return (
    <div className="panel player-panel" data-testid="player-panel">
      {isVsAutoma(state) ? (
        <>
          <div className={`player-card player-card-human${vpBump ? ' vp-bump-active' : ''}`}>
            <div className="player-header">
              <span className="badge-human player-name">Tú</span>
              <div className="player-stats">
                <span className="stat-money">
                  £<b>{current.money}</b>
                </span>
                <span className={`stat-vp${vpBump ? ' vp-bump' : ''}`} data-testid="player-vp">
                  <b>{current.vp}</b> PV
                </span>
              </div>
            </div>
            <IncomeTrack space={current.incomeSpace} />
            <NetworkSupplyRow state={state} playerId={HUMAN} />
            <div className="player-card-deck" title="Cartas de ubicación e industria que te quedan por robar esta era">
              Mazo{' '}
              <b data-testid="draw-pile">
                {state.drawPile.length}/{MAUTOMA_ERA_CARDS[state.playerCount][state.era]}
              </b>
            </div>
          </div>

          <div className="rivals-section">
            <h4 className="rivals-heading">Rivales</h4>
            {automaOpponentIds(state).map((id) => (
              <PlayerCard
                key={id}
                name={state.playerNames[id]}
                player={state.players[id]}
                badgeClass="badge-automa"
                deckLabel="Baraja Mautoma"
                deckCount={state.automaDecks[id]?.length ?? 0}
                deckTitle="22 cartas de acción aparte — no son las mismas que las tuyas"
                compactIncome
                vpTestId={`automa-vp-${id}`}
                state={state}
                playerId={id}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className={`player-card player-card-active${vpBump ? ' vp-bump-active' : ''}`}>
            <div className="player-header">
              <span className="player-badge" style={{ background: `var(--p${playerId}-bg)`, color: `var(--p${playerId})` }}>
                {state.playerNames[playerId]}
              </span>
              <div className="player-stats">
                <span className="stat-money">
                  £<b>{current.money}</b>
                </span>
                <span className={`stat-vp${vpBump ? ' vp-bump' : ''}`}>
                  <b>{current.vp}</b> PV
                </span>
              </div>
            </div>
            <IncomeTrack space={current.incomeSpace} />
            <NetworkSupplyRow state={state} playerId={playerId} />
            <div className="player-card-deck">
              Mazo{' '}
              <b data-testid="draw-pile">
                {state.drawPile.length}/{BRASS_DECK_SIZE[state.playerCount]}
              </b>
            </div>
          </div>

          <div className="rivals-section">
            <h4 className="rivals-heading">Otros jugadores</h4>
            {state.players.map((p, i) =>
              i === playerId ? null : (
                <PlayerCard
                  key={i}
                  name={state.playerNames[i]}
                  player={p}
                  badgeStyle={{ background: `var(--p${i}-bg)`, color: `var(--p${i})` }}
                  compactIncome
                  state={state}
                  playerId={i}
                />
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}

function useVpBump(vp: number): boolean {
  const [bump, setBump] = useState(false);
  const prev = useRef(vp);
  useEffect(() => {
    if (vp > prev.current) {
      setBump(true);
      playVpSound();
      const t = setTimeout(() => setBump(false), 600);
      prev.current = vp;
      return () => clearTimeout(t);
    }
    prev.current = vp;
  }, [vp]);
  return bump;
}

export function useGameFeedback(state: GameState) {
  const prev = useRef({ era: state.era, income: state.players[activePlayer(state)].incomeSpace });
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: string }[]>([]);
  const idRef = useRef(0);

  const push = useCallback((msg: string, kind = 'info') => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-4), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  useEffect(() => {
    const pid = isVsAutoma(state) ? HUMAN : activePlayer(state);
    const p = state.players[pid];
    if (state.era !== prev.current.era) {
      push(`Era ${state.era === 'canal' ? 'Canal' : 'Ferrocarril'}`, 'era');
      playEraSound();
    }
    const incomeDiff = levelForSpace(p.incomeSpace) - levelForSpace(prev.current.income);
    if (incomeDiff > 0) {
      push(`Ingresos +${incomeDiff}`, 'coin');
      playCoinSound();
    }
    prev.current = { era: state.era, income: p.incomeSpace };
  }, [state, push]);

  return { toasts, push };
}

export function ToastStack({ toasts }: { toasts: { id: number; msg: string; kind: string }[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
