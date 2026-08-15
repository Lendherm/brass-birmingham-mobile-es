import { useMemo, useState } from 'react';
import './ui/theme.css';
import { HUMAN, activePlayer, isTutorial, isVsAutoma, type AutomaOpponents, type GameState, type PlayerCount } from './engine/state';
import type { PlayerAction } from './engine/game';
import { CITIES } from './engine/data/board';
import { LAYOUT } from './engine/data/layout';
import type { CityId, MerchantId } from './engine/types';
import type { MautomaDifficulty } from './engine/mautoma/cards';
import { BoardMap } from './ui/BoardMap';
import { PanZoomBoard } from './ui/PanZoomBoard';
import { tutorialBoardView } from './ui/tutorialBoardView';
import { useActionFlow } from './ui/ActionPanel';
import { useGame, useTheme } from './ui/useGame';
import { useAccessibility } from './ui/useAccessibility';
import { usePlayAssistant } from './ui/usePlayAssistant';
import { TutorialLauncher } from './ui/Tutorial';
import { FirstVisitPrompt } from './ui/FirstVisitPrompt';
import { StrategyGuideButton } from './ui/StrategyGuide';
import { TutorialCoach, TutorialCompleteOverlay } from './ui/TutorialCoach';
import { useInteractiveTutorial } from './ui/useInteractiveTutorial';
import { PassScreen } from './ui/PassScreen';
import { ActionGrid } from './ui/ActionGrid';
import { Hand } from './ui/Hand';
import { CardPreview, cardFocusCity } from './ui/Card';
import { PlayerPanel, ToastStack, useGameFeedback } from './ui/PlayerPanel';
import { PlayerMat } from './ui/PlayerMat';
import { MarketDisplay } from './ui/MarketDisplay';
import { ZoneLegend } from './ui/ZoneLegend';
import { AutomaFeed } from './ui/AutomaFeed';
import { PlayAssistant } from './ui/PlayAssistant';
import { BoardSymbolLegend } from './ui/BoardSymbolLegend';
import { CityMapOverlay } from './ui/CityMapOverlay';
import { MerchantMapOverlay } from './ui/MerchantMapOverlay';
import { EraScoreOverlay } from './ui/EraScoreOverlay';
import { GameModeIntro } from './ui/GameModeIntro';
import { formatBuildCost, formatNetworkCost } from './ui/formatCost';
import { ACCIONES, DEFAULT_PLAYER_NAMES, PLAYER_COLORS, type AccionId, eraNombre, industria, linkLabel } from './i18n/es';
import { industryCssClass } from './ui/visual/industryTheme';
import { ProjectCredits } from './ui/ProjectCredits';
import { setupModeCards } from './i18n/gameModes';
import { APP_NAME_SHORT } from './i18n/projectMeta';

type SetupMode = 'solo' | 'hotseat';

export default function App() {
  const game = useGame();
  const { theme, toggle } = useTheme();
  const { largeText, toggleLargeText } = useAccessibility();
  const { assistantEnabled, toggleAssistant } = usePlayAssistant();

  return (
    <div className={`app${game.state && !game.screenHidden ? ' in-game' : ''}`}>
      <div className="topbar">
        <h1 className="app-title">{APP_NAME_SHORT}</h1>
        {game.state && !game.screenHidden && (
          <>
            <span className={`era-badge era-${game.state.era}`} data-testid="era-badge">
              {game.state.era === 'canal' ? '⛵ Canal' : '🚂 Ferrocarril'}
            </span>
            <span className="stat" data-testid="era-turn">
            {isVsAutoma(game.state) ? (
              <>
                Era {eraNombre(game.state.era)} — Turno {game.state.turn} — {game.state.actionsLeft}{' '}
                {game.state.actionsLeft === 1 ? 'acción restante' : 'acciones restantes'}
              </>
            ) : (
              <>
                Era {eraNombre(game.state.era)} — Ronda {game.state.turn} —{' '}
                <span style={{ color: PLAYER_COLORS[game.state.currentPlayer] }}>
                  {game.state.playerNames[game.state.currentPlayer]}
                </span>{' '}
                — {game.state.actionsLeft} {game.state.actionsLeft === 1 ? 'acción' : 'acciones'}
              </>
            )}
          </span>
          </>
        )}
        <div className="spacer" />
        {game.state && !game.screenHidden && game.tutorialStep === null && (
          <>
            <button onClick={game.undo} disabled={!game.canUndo} data-testid="undo">
              ⎌ Deshacer
            </button>
            <button onClick={game.reset} data-testid="new-game">
              Nueva partida
            </button>
          </>
        )}
        {game.tutorialStep !== null && (
          <span className="stat tutorial-live-badge" data-testid="tutorial-mode">
            Tutorial
          </span>
        )}
        {game.state && (game.screenHidden || game.tutorialStep !== null) && <StrategyGuideButton compact />}
        <button
          type="button"
          onClick={toggleLargeText}
          data-testid="a11y-toggle"
          aria-label={largeText ? 'Texto normal' : 'Texto grande'}
          title={largeText ? 'Texto normal' : 'Texto grande'}
          className="topbar-compact-btn"
        >
          {largeText ? 'A' : 'A+'}
        </button>
        {game.state && !game.screenHidden && (
          <button
            type="button"
            onClick={toggleAssistant}
            data-testid="assistant-toggle"
            aria-pressed={assistantEnabled}
            title={assistantEnabled ? 'Desactivar asistente' : 'Activar asistente de jugadas'}
            className={`topbar-compact-btn${assistantEnabled ? ' active' : ''}`}
          >
            💡
          </button>
        )}
        <button onClick={toggle} data-testid="theme-toggle" aria-label="Cambiar modo oscuro">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {!game.state ? (
        <>
          <FirstVisitPrompt onStart={game.startTutorial} />
          <SetupScreen onStartSolo={game.startSolo} onStartHotseat={game.startHotseat} onStartTutorial={game.startTutorial} />
          <ProjectCredits />
        </>
      ) : game.modeIntroPending && game.state ? (
        <GameModeIntro state={game.state} onContinue={game.dismissModeIntro} />
      ) : game.screenHidden ? (
        <PassScreen state={game.state} onReady={game.revealScreen} />
      ) : (
        <GameScreen
          state={game.state}
          dispatch={game.dispatch}
          tutorialStep={game.tutorialStep}
          tutorialDone={game.tutorialDone}
          onTutorialAdvance={game.advanceTutorial}
          onTutorialExit={game.reset}
          onReset={game.reset}
          onDismissEraScore={game.dismissEraScore}
          assistantEnabled={assistantEnabled}
        />
      )}
    </div>
  );
}

function SetupScreen({
  onStartSolo,
  onStartHotseat,
  onStartTutorial,
}: {
  onStartSolo: (seed: number, difficulty: MautomaDifficulty, automaOpponents: AutomaOpponents) => void;
  onStartHotseat: (seed: number, count: PlayerCount, names: string[]) => void;
  onStartTutorial: () => void;
}) {
  const [mode, setMode] = useState<SetupMode>('solo');
  const [difficulty, setDifficulty] = useState<MautomaDifficulty>('easy');
  const [automaOpponents, setAutomaOpponents] = useState<AutomaOpponents>(1);
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);
  const [names, setNames] = useState<string[]>([...DEFAULT_PLAYER_NAMES]);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));

  const previewCount = mode === 'solo' ? ((automaOpponents + 1) as PlayerCount) : playerCount;
  const modeCards = setupModeCards(previewCount);

  return (
    <div className="setup panel" data-testid="setup">
      <h2 style={{ margin: 0 }}>Nueva partida</h2>

      <div className="setup-guides">
        <TutorialLauncher onStart={onStartTutorial} prominent />
        <StrategyGuideButton />
      </div>

      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
        <strong>Tutorial interactivo</strong> (6 capítulos jugables) · <strong>Guía de estrategia</strong> (11 capítulos:
        cómo ganar, eras, economía, Automa…)
      </p>

      <div className="mode-compare" data-testid="mode-compare">
        {modeCards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`mode-compare-card${mode === card.id ? ' selected' : ''}`}
            onClick={() => setMode(card.id)}
            data-testid={card.id === 'solo' ? 'mode-solo' : 'mode-hotseat'}
          >
            <span className="mode-compare-label">{card.label}</span>
            <span className="mode-compare-tag">{card.tag}</span>
            <span className="mode-compare-stat">
              <strong>Cartas:</strong> {card.deck}
            </span>
            <span className="mode-compare-stat">
              <strong>Rondas:</strong> {card.rounds}
            </span>
            <span className="mode-compare-best">{card.bestFor}</span>
          </button>
        ))}
      </div>

      {mode === 'solo' ? (
        <>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Variante <strong>Mautoma</strong> (fan): oponente automático con 22 cartas propias. El mazo Brass se recorta
            para partidas más cortas que el juego oficial.
          </p>
          <label>
            Oponentes Automa
            <select
              value={automaOpponents}
              onChange={(e) => setAutomaOpponents(Number(e.target.value) as AutomaOpponents)}
              data-testid="automa-opponents"
            >
              <option value={1}>1 Automa (2 jugadores)</option>
              <option value={2}>2 Automa (3 jugadores)</option>
              <option value={3}>3 Automa (4 jugadores)</option>
            </select>
          </label>
          <label>
            Dificultad
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as MautomaDifficulty)} data-testid="difficulty">
              <option value="easy">Fácil</option>
              <option value="medium">Media</option>
              <option value="hard">Difícil</option>
            </select>
          </label>
        </>
      ) : (
        <>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            <strong>Brass completo</strong> como el digital oficial: mazo entero (40 / 54 / 64 cartas) y ~10 / 9 / 8
            rondas por era. Pantalla oculta entre turnos para que nadie vea las cartas ajenas.
          </p>
          <label>
            Jugadores
            <select
              value={playerCount}
              onChange={(e) => setPlayerCount(Number(e.target.value) as PlayerCount)}
              data-testid="player-count"
            >
              <option value={2}>2 jugadores</option>
              <option value={3}>3 jugadores</option>
              <option value={4}>4 jugadores</option>
            </select>
          </label>
          {Array.from({ length: playerCount }, (_, i) => (
            <label key={i}>
              Nombre jugador {i + 1}
              <input
                value={names[i]}
                onChange={(e) => {
                  const next = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                data-testid={`player-name-${i}`}
              />
            </label>
          ))}
        </>
      )}

      <label>
        Semilla
        <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} data-testid="seed" />
      </label>

      <button
        className="primary"
        onClick={() =>
          mode === 'solo'
            ? onStartSolo(seed, difficulty, automaOpponents)
            : onStartHotseat(seed, playerCount, names.slice(0, playerCount))
        }
        data-testid="start-game"
      >
        Iniciar partida
      </button>
    </div>
  );
}

function GameScreen({
  state,
  dispatch,
  tutorialStep,
  tutorialDone,
  onTutorialAdvance,
  onTutorialExit,
  onReset,
  onDismissEraScore,
  assistantEnabled,
}: {
  state: GameState;
  dispatch: (a: PlayerAction) => string | null;
  tutorialStep: number | null;
  tutorialDone: boolean;
  onTutorialAdvance: () => void;
  onTutorialExit: () => void;
  onReset: () => void;
  onDismissEraScore: () => void;
  assistantEnabled: boolean;
}) {
  const inTutorial = tutorialStep !== null && isTutorial(state);
  const [inspectCity, setInspectCity] = useState<CityId | null>(null);
  const [inspectMerchant, setInspectMerchant] = useState<MerchantId | null>(null);
  const playerId = activePlayer(state);
  const hand = state.players[playerId].hand;

  const tutorial = useInteractiveTutorial(tutorialStep ?? 0, onTutorialAdvance, hand);

  const guardedDispatch = (action: PlayerAction): string | null => {
    if (inTutorial) {
      const block = tutorial.guardDispatch(action);
      if (block) return block;
    }
    const err = dispatch(action);
    if (!err && inTutorial) tutorial.onDispatched(action);
    return err;
  };

  const flow = useActionFlow(state, guardedDispatch);
  const current = state.players[playerId];
  const { toasts } = useGameFeedback(state);
  const selectedCard = flow.flow.cardIdx !== null ? current.hand[flow.flow.cardIdx] ?? null : null;
  const focusCity = cardFocusCity(selectedCard);

  const lockActions = inTutorial && !tutorial.isContinue && tutorial.step?.step.type !== 'pick-action';

  const actionDisabled = (a: AccionId) => {
    if (!flow.availability[a] || state.gameOver) return true;
    if (!inTutorial) return false;
    if (tutorial.isContinue) return true;
    if (tutorial.step?.step.type === 'pick-action') return tutorial.step.step.action !== a;
    return lockActions;
  };

  const cardClickable = (i: number) => {
    if (!inTutorial) return flow.cardsSelectable.has(i);
    if (tutorial.step?.step.type === 'pick-card') return tutorial.canPickCard(i);
    if (tutorial.step?.step.type === 'apply-build' || tutorial.step?.step.type === 'apply-network') {
      return flow.cardsSelectable.has(i);
    }
    return false;
  };

  const boardViewTarget = useMemo(() => {
    if (inTutorial) return tutorialBoardView(tutorial.step);
    if (focusCity) {
      const pos = LAYOUT[focusCity];
      return { x: pos.x, y: pos.y, scale: 1.08 };
    }
    return null;
  }, [inTutorial, tutorial.step, focusCity]);

  return (
    <>
      <div className={`game-layout map-locked-layout${inTutorial ? ' tutorial-active' : ''}`}>
        <div className="game-map-zone board-wrap map-locked">
          <PanZoomBoard viewRevision={(tutorial.stepIndex ?? 0) + (focusCity ? 500 : 0)} viewTarget={boardViewTarget}>
            <BoardMap
              state={state}
              highlightCities={flow.highlightCities}
              highlightBuildSlots={flow.highlightBuildSlots}
              highlightLinks={flow.highlightLinks}
              cardFocusCity={focusCity}
              selectedCity={inspectCity}
              onCityClick={(city) => {
                setInspectMerchant(null);
                if (flow.flow.action === 'build' && flow.flow.cardIdx !== null) {
                  const cityBuilds = flow.cardBuilds.filter((b) => b.option.city === city);
                  if (cityBuilds.length > 0) {
                    setInspectCity(city);
                    return;
                  }
                }
                if (flow.flow.action === 'build') {
                  const cityBuilds = flow.allBuilds.filter((b) => b.option.city === city);
                  if (cityBuilds.length > 0) {
                    setInspectCity(city);
                    return;
                  }
                }
                setInspectCity((c) => (c === city ? null : city));
              }}
              onMerchantClick={(merchant) => {
                setInspectCity(null);
                setInspectMerchant((m) => (m === merchant ? null : merchant));
              }}
              onLinkClick={(linkId) => {
                const choice = flow.networks.find((n) => n.option.linkIds[0] === linkId);
                if (choice) flow.chooseNetwork(choice);
              }}
            />
          </PanZoomBoard>
          {inspectMerchant && !inTutorial && (
            <MerchantMapOverlay
              state={state}
              merchantId={inspectMerchant}
              onClose={() => setInspectMerchant(null)}
            />
          )}
          {inspectCity && !inTutorial && (
            <CityMapOverlay
              state={state}
              cityId={inspectCity}
              builds={flow.flow.cardIdx !== null ? flow.cardBuilds : flow.allBuilds}
              selectedCard={selectedCard}
              buildMode={flow.flow.action === 'build' && flow.flow.cardIdx !== null}
              onClose={() => setInspectCity(null)}
              onBuild={(b) => {
                if (flow.flow.action === 'build' && flow.flow.cardIdx === b.cardIdx) {
                  flow.chooseBuild(b);
                  setInspectCity(null);
                }
              }}
            />
          )}
        </div>

        <div className="side side-scroll">
          <div className="game-hud">
            <PlayerPanel state={state} />
            <ZoneLegend />
            <PlayerMat state={state} />
            <MarketDisplay coalCubes={state.coalCubes} ironCubes={state.ironCubes} />
            {isVsAutoma(state) && <AutomaFeed state={state} />}
            {assistantEnabled && !inTutorial && <PlayAssistant state={state} />}
          </div>

          <div className="game-play-dock panel action-panel" data-testid="action-panel">
            <h3>Acciones</h3>
            <ActionGrid
              selected={flow.flow.action}
              availability={flow.availability}
              disabled={actionDisabled}
              onChoose={(a) => {
                if (inTutorial && !tutorial.guardChooseAction(a)) return;
                flow.chooseAction(a);
              }}
            />

            {selectedCard && (
              <>
                <CardPreview card={selectedCard} />
                {focusCity && (
                  <p className="card-focus-hint" data-testid="card-focus-hint">
                    Ciudad <strong>{CITIES[focusCity].name}</strong> resaltada en el mapa (mismo color que la carta).
                  </p>
                )}
              </>
            )}

            {!flow.flow.action && flow.allBuilds.length > 0 && (
              <p style={{ margin: '8px 0 4px', fontSize: 13, color: 'var(--muted)' }} data-testid="flow-hint">
                Toca <strong>Construir</strong> o una carta válida para ver casillas resaltadas en el mapa.
              </p>
            )}

            {flow.flow.action && (
              <p style={{ margin: '8px 0 4px', fontSize: 13, color: 'var(--muted)' }} data-testid="flow-hint">
                {flow.flow.cardIdx === null
                  ? flow.flow.action === 'scout'
                    ? 'Elige la carta de acción y luego 2 más para descartar.'
                    : flow.flow.action === 'build'
                      ? 'Casillas resaltadas en el mapa. Elige carta o toca una ciudad.'
                      : `Elige una carta para ${ACCIONES[flow.flow.action].toLowerCase()}.`
                  : flowHint(flow.flow.action)}
                <button style={{ marginLeft: 8, fontSize: 12, padding: '2px 8px' }} onClick={flow.reset} data-testid="flow-cancel">
                  cancelar
                </button>
              </p>
            )}
            {(flow.error || (inTutorial && tutorial.hint)) && (
              <p style={{ color: 'var(--danger)', fontSize: 13 }} data-testid="flow-error">
                {flow.error || tutorial.hint}
              </p>
            )}

            <h3 className="hand-heading">Mano</h3>
            <Hand
              cards={current.hand}
              selectedIdx={flow.flow.cardIdx}
              scoutExtras={flow.flow.scoutExtras}
              selectable={flow.cardsSelectable}
              hasAction={!!flow.flow.action}
              onSelect={(i) => {
                if (inTutorial && !tutorial.guardChooseCard(i)) return;
                if (cardClickable(i)) flow.chooseCard(i);
              }}
            />

            {flow.flow.action === 'build' && (
              <div className="option-list" style={{ marginTop: 8 }} data-testid="build-options">
                {(flow.flow.cardIdx !== null ? flow.cardBuilds : flow.allBuilds).map((b, i) => (
                  <button key={i} className={`option-btn ${industryCssClass(b.option.industry)}`} onClick={() => flow.chooseBuild(b)}>
                    {CITIES[b.option.city].name}: {industria(b.option.industry)} N{b.option.level} — {formatBuildCost(b.option)}
                    {b.option.overbuild ? ' (reconstruir)' : ''}
                  </button>
                ))}
                {(flow.flow.cardIdx !== null ? flow.cardBuilds : flow.allBuilds).length === 0 && (
                  <span style={{ color: 'var(--muted)' }}>
                    {flow.flow.cardIdx !== null
                      ? 'No hay construcciones legales con esta carta.'
                      : 'No hay construcciones legales.'}
                  </span>
                )}
              </div>
            )}

            {flow.flow.action === 'network' && (
              <div className="option-list" style={{ marginTop: 8 }} data-testid="network-options">
                {flow.networks.map((n, i) => (
                  <button key={i} className="option-btn option-network" onClick={() => flow.chooseNetwork(n)}>
                    {linkLabel(n.option.linkIds[0])} — {formatNetworkCost(n.option)}
                  </button>
                ))}
              </div>
            )}

            {flow.flow.action === 'sell' && flow.flow.cardIdx !== null && (
              <div className="option-list" style={{ marginTop: 8 }} data-testid="sell-options">
                {flow.sells.map((s, i) => {
                  const selected = flow.flow.sales.some((x) => x.sale.city === s.sale.city && x.sale.slot === s.sale.slot);
                  const tile = state.board[s.sale.city][s.sale.slot]!;
                  return (
                    <button
                      key={i}
                      className={`option-btn ${industryCssClass(tile.industry)}${selected ? ' selected' : ''}`}
                      onClick={() => {
                        if (inTutorial && !tutorial.guardToggleSale(s)) return;
                        flow.toggleSale(s);
                      }}
                    >
                      {CITIES[s.sale.city].name}: {industria(tile.industry)} N{tile.level} (cerveza ×{s.sale.beerNeeded})
                    </button>
                  );
                })}
                <button
                  className="primary"
                  disabled={flow.flow.sales.length === 0}
                  onClick={() => {
                    if (inTutorial && !tutorial.guardConfirmSell(flow.flow.sales.length)) return;
                    flow.confirmSell();
                  }}
                  data-testid="confirm-sell"
                >
                  Vender {flow.flow.sales.length} {flow.flow.sales.length === 1 ? 'edificio' : 'edificios'}
                </button>
              </div>
            )}

            {flow.flow.action === 'develop' && flow.flow.cardIdx !== null && (
              <div className="option-list" style={{ marginTop: 8 }} data-testid="develop-options">
                {flow.develops.map((d, i) => (
                  <button
                    key={i}
                    className={`option-btn ${industryCssClass(d.industries[0])}${flow.flow.develops.includes(d.industries[0]) ? ' selected' : ''}`}
                    onClick={() => {
                      if (inTutorial && !tutorial.guardToggleDevelop(d.industries[0])) return;
                      flow.toggleDevelop(d.industries[0]);
                    }}
                  >
                    {industria(d.industries[0])}
                  </button>
                ))}
                <button
                  className="primary"
                  disabled={flow.flow.develops.length === 0}
                  onClick={() => {
                    if (inTutorial && !tutorial.guardConfirmDevelop(flow.flow.develops)) return;
                    flow.confirmDevelop();
                  }}
                  data-testid="confirm-develop"
                >
                  Desarrollar {flow.flow.develops.length} {flow.flow.develops.length === 1 ? 'ficha' : 'fichas'}
                </button>
              </div>
            )}
          </div>

          <BoardSymbolLegend />

          <details className="panel log-panel log-collapsible">
            <summary>Registro de partida</summary>
            <div className="log" data-testid="log">
              {[...state.log].reverse().map((line, i) => (
                <div key={state.log.length - i} className={i < 6 ? 'recent log-line' : 'log-line'}>
                  {line}
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>

      <ToastStack toasts={toasts} />

      {inTutorial && !tutorialDone && (
        <TutorialCoach
          step={tutorial.step}
          stepIndex={tutorial.stepIndex}
          total={tutorial.total}
          hint={tutorial.hint}
          focus={tutorial.focus}
          isContinue={tutorial.isContinue}
          onContinue={onTutorialAdvance}
          onSkip={onTutorialExit}
        />
      )}

      {tutorialDone && <TutorialCompleteOverlay onPlay={onReset} onSetup={onReset} />}

      {state.pendingEraScore && (
        <EraScoreOverlay score={state.pendingEraScore} onDismiss={state.pendingEraScore.gameOver ? onReset : onDismissEraScore} />
      )}

      {state.gameOver && !inTutorial && !state.pendingEraScore && <GameOverOverlay state={state} />}
    </>
  );
}

function GameOverOverlay({ state }: { state: GameState }) {
  if (isVsAutoma(state)) {
    const ranking = state.players
      .map((p, i) => ({ name: state.playerNames[i], vp: p.vp }))
      .sort((a, b) => b.vp - a.vp);
    const winner = ranking[0];
    const youWon = winner.name === state.playerNames[HUMAN] && ranking.filter((r) => r.vp === winner.vp).length === 1;
    const tied = ranking.filter((r) => r.vp === winner.vp).length > 1;
    return (
      <div className="gameover" data-testid="gameover">
        <div className="panel">
          <h2>Fin de la partida</h2>
          <p>
            {ranking.map((r, i) => (
              <span key={r.name}>
                {i > 0 ? ' · ' : ''}
                <span className={r.name === state.playerNames[HUMAN] ? 'badge-human' : 'badge-automa'}>
                  {r.name}: {r.vp} PV
                </span>
              </span>
            ))}
          </p>
          <p style={{ fontSize: 22 }}>
            {youWon ? '🏆 ¡Ganaste!' : tied ? '🤝 ¡Empate por el primer puesto!' : `🤖 Gana ${winner.name}.`}
          </p>
        </div>
      </div>
    );
  }

  const ranking = state.players
    .map((p, i) => ({ name: state.playerNames[i], vp: p.vp, color: PLAYER_COLORS[i] }))
    .sort((a, b) => b.vp - a.vp);

  return (
    <div className="gameover" data-testid="gameover">
      <div className="panel">
        <h2>Fin de la partida</h2>
        {ranking.map((r, i) => (
          <p key={r.name} style={{ color: r.color, fontSize: i === 0 ? 22 : 16, margin: '6px 0' }}>
            {i === 0 ? '🏆 ' : `${i + 1}. `}
            {r.name}: {r.vp} PV
          </p>
        ))}
      </div>
    </div>
  );
}

function flowHint(action: AccionId): string {
  switch (action) {
    case 'build':
      return 'Elige una ciudad resaltada o una opción abajo.';
    case 'network':
      return 'Elige un enlace resaltado o una opción abajo.';
    case 'sell':
      return 'Marca los edificios a vender y confirma.';
    case 'develop':
      return 'Elige 1–2 industrias y confirma.';
    default:
      return '';
  }
}
