import { useEffect, useMemo, useState } from 'react';
import './ui/theme.css';
import { HUMAN, activePlayer, isTutorial, isVsAI, isVsAutoma, type AIOpponents, type AutomaOpponents, type GameState, type PlayerCount } from './engine/state';
import type { PlayerAction } from './engine/game';
import type { AIDifficulty } from './engine/ai/bot';
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
import { CoachPanel } from './ui/CoachPanel';
import { useTrainingCoach } from './ui/useTrainingCoach';
import { useTrainingMode } from './ui/useTrainingMode';
import { TrainingHintBar } from './ui/TrainingHintBar';
import { getTrainingHint, postMoveTrainingHint, type TrainingPendingChoice } from './engine/training/trainingHints';
import { getLivePlayGuide } from './engine/playGuide';
import { developIndustriesFromGuide, mergeMapHighlights } from './engine/training/trainingMapGuide';
import { useTrainingTurnLog } from './ui/useTrainingTurnLog';
import type { BuildChoice } from './engine/options';
import { usePlayAssistant } from './ui/usePlayAssistant';
import { useLayoutMode } from './ui/useLayoutMode';
import { TutorialLauncher } from './ui/Tutorial';
import { FirstVisitPrompt } from './ui/FirstVisitPrompt';
import { StrategyGuideButton } from './ui/StrategyGuide';
import { OpeningsGuideButton } from './ui/OpeningsGuide';
import { ConceptHelpButton } from './ui/ConceptHelp';
import { TrainingDashboardButton, TrainingDashboardModal } from './ui/TrainingDashboard';
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
import { GameHistory } from './ui/GameHistory';
import { PlayAssistant } from './ui/PlayAssistant';
import { BoardSymbolLegend } from './ui/BoardSymbolLegend';
import { CityMapOverlay } from './ui/CityMapOverlay';
import { MerchantMapOverlay } from './ui/MerchantMapOverlay';
import { EraScoreOverlay } from './ui/EraScoreOverlay';
import { GameModeIntro } from './ui/GameModeIntro';
import { formatBuildCost, formatNetworkCost } from './ui/formatCost';
import { actionIntroHint, developWhy, networkWhy, sellWhyFromState } from './engine/actionExplain';
import { ACCIONES, DEFAULT_PLAYER_NAMES, PLAYER_COLORS, type AccionId, eraNombre, industria, linkLabel } from './i18n/es';
import { industryCssClass } from './ui/visual/industryTheme';
import { ProjectCredits } from './ui/ProjectCredits';
import { PwaUpdateBanner } from './ui/PwaUpdateBanner';
import { TapInfoBubble } from './ui/TapInfoBubble';
import { RoundSpendingTopbar } from './ui/RoundSpending';
import { CanalEraMapAlert, CanalEraSidebarWarning } from './ui/CanalEraWarning';
import { setupModeCards } from './i18n/gameModes';
import { TRAINING_SCENARIOS, trainingScenarioMeta, type TrainingScenarioId } from './engine/training/scenarios';
import { buildTrainingReplay } from './engine/training/replay';
import { loadLastVsAISeed } from './engine/ai/trainingStats';
import { TrainingReviewOverlay } from './ui/TrainingReviewOverlay';
import { APP_NAME_SHORT } from './i18n/projectMeta';

type SetupMode = 'solo' | 'vsAI' | 'hotseat';
type TrainingDrill = 'normal' | 'repeat-seed' | 'canal-drill' | 'rail-drill';

export default function App() {
  const game = useGame();
  const { theme, toggle } = useTheme();
  const { largeText, toggleLargeText } = useAccessibility();
  const { assistantEnabled, assistantRefresh, pressAssistant, refreshAssistant, disableAssistant } = usePlayAssistant();
  const { coachEnabled, hotseatCoachEnabled, toggleCoach, toggleHotseatCoach } = useTrainingCoach();
  const { trainingMode, toggleTrainingMode } = useTrainingMode();
  const { layoutMode, layoutLabel, cycleLayout } = useLayoutMode();

  const startWeaknessDrill = (scenarioId: TrainingScenarioId, difficulty: AIDifficulty) => {
    game.reset();
    game.startTrainingScenario(scenarioId, difficulty);
  };

  const startTrainingDrill = (scenarioId: TrainingScenarioId) => {
    const difficulty = game.state?.aiDifficulty ?? 'medium';
    game.reset();
    game.startTrainingScenario(scenarioId, difficulty);
  };

  const inGame = Boolean(game.state && !game.screenHidden && !game.modeIntroPending);
  const gs = game.state;

  return (
    <div className={`app${inGame ? ' in-game' : ''}`}>
      <div className="topbar">
        <h1 className="app-title">{APP_NAME_SHORT}</h1>
        {inGame && gs!.trainingScenario && (
          <span className="stat training-scenario-badge" data-testid="training-scenario-badge" title={trainingScenarioMeta(gs!.trainingScenario).objective}>
            🎯 {trainingScenarioMeta(gs!.trainingScenario).title}
          </span>
        )}
        {inGame && gs && (
          <>
            <span className={`era-badge era-${gs.era}`} data-testid="era-badge">
              {gs.era === 'canal' ? '⛵ Canal' : '🚂 Ferrocarril'}
            </span>
            <span className="stat" data-testid="era-turn">
            {isVsAutoma(gs) ? (
              <>
                Era {eraNombre(gs.era)} — Turno {gs.turn} — {gs.actionsLeft}{' '}
                {gs.actionsLeft === 1 ? 'acción restante' : 'acciones restantes'}
              </>
            ) : (
              <>
                Era {eraNombre(gs.era)} — Ronda {gs.turn} —{' '}
                <span style={{ color: PLAYER_COLORS[gs.currentPlayer] }}>
                  {gs.playerNames[gs.currentPlayer]}
                </span>{' '}
                — {gs.actionsLeft} {gs.actionsLeft === 1 ? 'acción' : 'acciones'}
              </>
            )}
          </span>
            <RoundSpendingTopbar state={gs} />
          </>
        )}
        <div className="spacer" />
        {inGame && game.tutorialStep === null && (
          <>
            <button onClick={game.undo} disabled={!game.canUndo} data-testid="undo">
              ⎌ Deshacer
            </button>
            <button
              onClick={() => {
                if (window.confirm('¿Empezar una partida nueva? Se perderá el progreso de la partida actual.')) {
                  game.reset();
                }
              }}
              data-testid="new-game"
            >
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
        {game.state && (game.screenHidden || game.tutorialStep !== null) && <ConceptHelpButton compact />}
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
        {inGame && (
          <button
            type="button"
            onClick={toggleTrainingMode}
            data-testid="training-mode-toggle"
            aria-pressed={trainingMode}
            title={
              trainingMode
                ? 'Desactivar modo entrenamiento (detección y ayuda proactiva)'
                : 'Modo entrenamiento: detecta patrones, explica bloqueos y compara jugadas'
            }
            className={`topbar-compact-btn${trainingMode ? ' active' : ''}`}
          >
            🎯
          </button>
        )}
        {inGame && gs && isVsAI(gs) && (
          <>
            <OpeningsGuideButton playerCount={gs.playerCount} compact />
            <button
            type="button"
            onClick={toggleCoach}
            data-testid="coach-toggle"
            aria-pressed={coachEnabled}
            title={coachEnabled ? 'Ocultar entrenador' : 'Mostrar entrenador comparativo'}
            className={`topbar-compact-btn${coachEnabled ? ' active' : ''}`}
          >
            🎓
          </button>
          </>
        )}
        {inGame && gs && gs.mode === 'hotseat' && (
          <button
            type="button"
            onClick={toggleHotseatCoach}
            data-testid="hotseat-coach-toggle"
            aria-pressed={hotseatCoachEnabled}
            title={hotseatCoachEnabled ? 'Ocultar entrenador hotseat' : 'Entrenador comparativo en hotseat'}
            className={`topbar-compact-btn${hotseatCoachEnabled ? ' active' : ''}`}
          >
            🎓
          </button>
        )}
        {inGame && (
          <button
            type="button"
            onClick={cycleLayout}
            data-testid="layout-toggle"
            aria-pressed={layoutMode !== 'auto'}
            title={`Orientación: ${layoutLabel}. Toca para cambiar.`}
            className={`topbar-compact-btn topbar-layout-btn${layoutMode !== 'auto' ? ' active' : ''}`}
          >
            {layoutMode === 'landscape' ? '⬒' : layoutMode === 'portrait' ? '⬓' : '↻'}
          </button>
        )}
        {inGame && (
          <button
            type="button"
            onClick={pressAssistant}
            data-testid="assistant-toggle"
            aria-pressed={assistantEnabled}
            title={assistantEnabled ? 'Desactivar sugerencias de jugada' : 'Activar sugerencias de jugada'}
            className={`topbar-compact-btn topbar-assistant-btn${assistantEnabled ? ' active' : ''}`}
          >
            <span className="assistant-btn-icon" aria-hidden>
              ✦
            </span>
            <span className="assistant-btn-label">Sugerencias</span>
          </button>
        )}
        {inGame && <ConceptHelpButton compact />}
        <button onClick={toggle} data-testid="theme-toggle" aria-label="Cambiar modo oscuro">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {!game.state ? (
        <>
          <FirstVisitPrompt onStart={game.startTutorial} />
          <SetupScreen
            onStartSolo={game.startSolo}
            onStartVsAI={game.startVsAI}
            onStartTrainingScenario={game.startTrainingScenario}
            onStartHotseat={game.startHotseat}
            onStartTutorial={game.startTutorial}
            onStartWeaknessDrill={startWeaknessDrill}
          />
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
          coachFeedback={game.coachFeedback}
          coachEnabled={coachEnabled}
          hotseatCoachEnabled={hotseatCoachEnabled}
          trainingMode={trainingMode}
          coachHistory={game.coachHistory}
          replaySnapshots={game.replaySnapshots}
          onDismissCoach={game.dismissCoachFeedback}
          tutorialStep={game.tutorialStep}
          tutorialDone={game.tutorialDone}
          onTutorialAdvance={game.advanceTutorial}
          onTutorialExit={game.reset}
          onReset={game.reset}
          onDismissEraScore={game.dismissEraScore}
          onStartWeaknessDrill={startWeaknessDrill}
          onStartTrainingDrill={startTrainingDrill}
          assistantEnabled={assistantEnabled}
          assistantRefresh={assistantRefresh}
          onDisableAssistant={disableAssistant}
          onRefreshAssistant={refreshAssistant}
        />
      )}
      <PwaUpdateBanner />
    </div>
  );
}

function SetupScreen({
  onStartSolo,
  onStartVsAI,
  onStartTrainingScenario,
  onStartHotseat,
  onStartTutorial,
  onStartWeaknessDrill,
}: {
  onStartSolo: (seed: number, difficulty: MautomaDifficulty, automaOpponents: AutomaOpponents) => void;
  onStartVsAI: (seed: number, difficulty: AIDifficulty, aiOpponents: AIOpponents) => void;
  onStartTrainingScenario: (scenarioId: TrainingScenarioId, difficulty: AIDifficulty) => void;
  onStartHotseat: (seed: number, count: PlayerCount, names: string[]) => void;
  onStartTutorial: () => void;
  onStartWeaknessDrill: (scenarioId: TrainingScenarioId, difficulty: AIDifficulty) => void;
}) {
  const [mode, setMode] = useState<SetupMode>('vsAI');
  const [difficulty, setDifficulty] = useState<MautomaDifficulty>('easy');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [trainingScenario, setTrainingScenario] = useState<TrainingScenarioId | ''>('');
  const [trainingDrill, setTrainingDrill] = useState<TrainingDrill>('normal');
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const lastSeed = loadLastVsAISeed();
  const [automaOpponents, setAutomaOpponents] = useState<AutomaOpponents>(1);
  const [aiOpponents, setAiOpponents] = useState<AIOpponents>(1);
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);
  const [names, setNames] = useState<string[]>([...DEFAULT_PLAYER_NAMES]);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const { hotseatCoachEnabled, toggleHotseatCoach } = useTrainingCoach();
  const { trainingMode, toggleTrainingMode } = useTrainingMode();

  const previewCount =
    mode === 'solo' ? ((automaOpponents + 1) as PlayerCount) : mode === 'vsAI' ? ((aiOpponents + 1) as PlayerCount) : playerCount;
  const modeCards = setupModeCards(previewCount);

  return (
    <div className="setup panel" data-testid="setup">
      <h2 style={{ margin: 0 }}>Nueva partida</h2>

      <div className="setup-guides">
        <TutorialLauncher onStart={onStartTutorial} prominent />
        <StrategyGuideButton />
        <ConceptHelpButton />
        {mode === 'vsAI' && (
          <>
            <OpeningsGuideButton playerCount={previewCount} />
            <TrainingDashboardButton onOpen={() => setDashboardOpen(true)} />
          </>
        )}
      </div>
      <TrainingDashboardModal
        open={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
        onStartWeaknessDrill={onStartWeaknessDrill}
      />

      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
        <strong>Tutorial interactivo</strong> (7 capítulos jugables) · <strong>Guía de estrategia</strong> (11 capítulos:
        cómo ganar, eras, economía, Automa…) · <strong>? Ayuda</strong> (conceptos: peaje de la red en PV)
      </p>

      <div className="mode-compare" data-testid="mode-compare">
        {modeCards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`mode-compare-card${mode === card.id ? ' selected' : ''}`}
            onClick={() => setMode(card.id)}
            data-testid={
              card.id === 'solo' ? 'mode-solo' : card.id === 'vsAI' ? 'mode-vs-ai' : 'mode-hotseat'
            }
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
      ) : mode === 'vsAI' ? (
        <>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            <strong>Brass oficial</strong> contra oponentes automáticos: mismo mazo, dinero, cartas y reglas que el
            juego de PC o multijugador. La IA juega sus turnos sola.
          </p>
          <label>
            Rivales IA
            <select
              value={aiOpponents}
              onChange={(e) => setAiOpponents(Number(e.target.value) as AIOpponents)}
              data-testid="ai-opponents"
            >
              <option value={1}>1 IA (2 jugadores)</option>
              <option value={2}>2 IA (3 jugadores)</option>
              <option value={3}>3 IA (4 jugadores)</option>
            </select>
          </label>
          <label>
            Dificultad IA
            <select
              value={aiDifficulty}
              onChange={(e) => setAiDifficulty(e.target.value as AIDifficulty)}
              data-testid="ai-difficulty"
            >
              <option value="easy">Fácil</option>
              <option value="medium">Media</option>
              <option value="hard">Difícil</option>
              <option value="tournament">Torneo (MCTS ~350 ms)</option>
            </select>
          </label>
          <label>
            Modo de práctica
            <select
              value={trainingDrill}
              onChange={(e) => {
                const v = e.target.value as TrainingDrill;
                setTrainingDrill(v);
                if (v === 'canal-drill') setTrainingScenario('canal-countdown');
                else if (v === 'rail-drill') setTrainingScenario('rail-flip-race');
                else if (v !== 'normal') setTrainingScenario('');
              }}
              data-testid="training-drill"
            >
              <option value="normal">Partida libre</option>
              <option value="repeat-seed" disabled={lastSeed == null}>
                Repetir última semilla{lastSeed != null ? ` (${lastSeed})` : ''}
              </option>
              <option value="canal-drill">Drill fin de era Canal</option>
              <option value="rail-drill">Drill era Ferrocarril</option>
            </select>
          </label>
          <label>
            Escenario de entrenamiento
            <select
              value={trainingScenario}
              onChange={(e) => {
                setTrainingScenario(e.target.value as TrainingScenarioId | '');
                setTrainingDrill('normal');
              }}
              data-testid="training-scenario"
              disabled={trainingDrill === 'canal-drill' || trainingDrill === 'rail-drill'}
            >
              <option value="">Partida normal (semilla aleatoria)</option>
              {TRAINING_SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          {trainingScenario && (
            <p className="training-scenario-objective" data-testid="training-scenario-objective">
              <strong>Objetivo:</strong> {trainingScenarioMeta(trainingScenario).objective}
            </p>
          )}
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
          <label className="hotseat-coach-option">
            <input
              type="checkbox"
              checked={hotseatCoachEnabled}
              onChange={() => toggleHotseatCoach()}
              data-testid="hotseat-coach-setup"
            />
            Entrenador comparativo (analiza cada jugada del jugador activo)
          </label>
        </>
      )}

      <label>
        Semilla
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value) || 0)}
          data-testid="seed"
          disabled={mode === 'vsAI' && !!trainingScenario}
        />
      </label>

      <label className="setup-training-mode" data-testid="setup-training-mode">
        <input type="checkbox" checked={trainingMode} onChange={toggleTrainingMode} />
        <span>
          <strong>Modo entrenamiento 🎯</strong>
          Detecta patrones (mina + cerveza + red), explica bloqueos, compara jugadas con %,
          plan a 3 turnos y feedback del entrenador integrado en la barra inferior.
        </span>
      </label>

      <button
        className="primary"
        onClick={() => {
          if (mode === 'solo') onStartSolo(seed, difficulty, automaOpponents);
          else if (mode === 'vsAI') {
            if (trainingDrill === 'canal-drill') onStartTrainingScenario('canal-countdown', aiDifficulty);
            else if (trainingDrill === 'rail-drill') onStartTrainingScenario('rail-flip-race', aiDifficulty);
            else if (trainingScenario) onStartTrainingScenario(trainingScenario, aiDifficulty);
            else if (trainingDrill === 'repeat-seed' && lastSeed != null) onStartVsAI(lastSeed, aiDifficulty, aiOpponents);
            else onStartVsAI(seed, aiDifficulty, aiOpponents);
          } else onStartHotseat(seed, playerCount, names.slice(0, playerCount));
        }}
        data-testid="start-game"
      >
        {trainingScenario || trainingDrill !== 'normal' ? 'Iniciar entrenamiento' : 'Iniciar partida'}
      </button>
    </div>
  );
}

function GameScreen({
  state,
  dispatch,
  coachFeedback,
  coachEnabled,
  hotseatCoachEnabled,
  trainingMode,
  coachHistory,
  replaySnapshots,
  onDismissCoach,
  tutorialStep,
  tutorialDone,
  onTutorialAdvance,
  onTutorialExit,
  onReset,
  onDismissEraScore,
  onStartWeaknessDrill,
  onStartTrainingDrill,
  assistantEnabled,
  assistantRefresh,
  onDisableAssistant,
  onRefreshAssistant,
}: {
  state: GameState;
  dispatch: (a: PlayerAction) => string | null;
  coachFeedback: import('./engine/ai/coach').CoachFeedback | null;
  coachEnabled: boolean;
  hotseatCoachEnabled: boolean;
  trainingMode: boolean;
  coachHistory: import('./engine/ai/coach').CoachFeedback[];
  replaySnapshots: GameState[];
  onDismissCoach: () => void;
  tutorialStep: number | null;
  tutorialDone: boolean;
  onTutorialAdvance: () => void;
  onTutorialExit: () => void;
  onReset: () => void;
  onDismissEraScore: () => void;
  onStartWeaknessDrill: (scenarioId: TrainingScenarioId, difficulty: AIDifficulty) => void;
  onStartTrainingDrill: (scenarioId: TrainingScenarioId) => void;
  assistantEnabled: boolean;
  assistantRefresh: number;
  onDisableAssistant: () => void;
  onRefreshAssistant: () => void;
}) {
  const inTutorial = tutorialStep !== null && isTutorial(state);
  const humanTurn = !isVsAI(state) || state.currentPlayer === HUMAN;
  const coachActive =
    !inTutorial &&
    ((isVsAI(state) && coachEnabled) || (state.mode === 'hotseat' && hotseatCoachEnabled));
  const [liveReviewOpen, setLiveReviewOpen] = useState(false);
  const liveReplay = useMemo(
    () => buildTrainingReplay(coachHistory, replaySnapshots),
    [coachHistory, replaySnapshots],
  );
  const [inspectCity, setInspectCity] = useState<CityId | null>(null);
  const [inspectMerchant, setInspectMerchant] = useState<MerchantId | null>(null);
  const [mapInfo, setMapInfo] = useState<string | null>(null);
  const [focusedLinkId, setFocusedLinkId] = useState<string | null>(null);
  const [focusedBuild, setFocusedBuild] = useState<BuildChoice | null>(null);
  const [mapGuideFocus, setMapGuideFocus] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const playerId = isVsAI(state) ? HUMAN : activePlayer(state);
  const hand = state.players[playerId].hand;

  const tutorial = useInteractiveTutorial(tutorialStep ?? 0, onTutorialAdvance, hand);
  const { turnLog, recordTurn } = useTrainingTurnLog(trainingMode ? state : null);

  const guardedDispatch = (action: PlayerAction): string | null => {
    if (inTutorial) {
      const block = tutorial.guardDispatch(action);
      if (block) return block;
    }
    const before = state;
    const err = dispatch(action);
    if (!err && trainingMode && humanTurn && !inTutorial) recordTurn(action, before);
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
    if (!humanTurn) return true;
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

  const trainingPendingChoice = useMemo((): TrainingPendingChoice | null => {
    if (focusedBuild) return { type: 'build', build: focusedBuild };
    if (focusedLinkId && flow.flow.action === 'network') return { type: 'network', linkId: focusedLinkId };
    if (flow.flow.action === 'sell' && flow.flow.sales.length === 1) return { type: 'sell', sell: flow.flow.sales[0] };
    if (flow.flow.action === 'develop' && flow.flow.develops.length >= 1) {
      return { type: 'develop', developIndustries: flow.flow.develops };
    }
    return null;
  }, [focusedBuild, focusedLinkId, flow.flow.action, flow.flow.sales, flow.flow.develops]);

  const liveGuide = useMemo(() => {
    if (!humanTurn || inTutorial || state.gameOver) return null;
    if (!trainingMode && !(isVsAI(state) && coachEnabled)) return null;
    return getLivePlayGuide(state);
  }, [humanTurn, inTutorial, state, trainingMode, coachEnabled]);

  const trainingHint = useMemo(() => {
    if (!trainingMode || !humanTurn || inTutorial) return null;
    if (coachFeedback) return postMoveTrainingHint(state, coachFeedback);
    return getTrainingHint(state, {
      action: flow.flow.action,
      cardIdx: flow.flow.cardIdx,
      inspectCity,
      focusedLinkId,
      pendingChoice: trainingPendingChoice,
      turnLog,
      flowError: flow.error,
    });
  }, [
    trainingMode,
    humanTurn,
    inTutorial,
    coachFeedback,
    state,
    flow.flow.action,
    flow.flow.cardIdx,
    inspectCity,
    focusedLinkId,
    trainingPendingChoice,
    turnLog,
    flow.error,
  ]);

  const boardHighlights = useMemo(() => {
    const guide = trainingHint?.mapGuide ?? liveGuide?.mapGuide ?? null;
    if (!guide) {
      return {
        cities: flow.highlightCities,
        slots: flow.highlightBuildSlots,
        links: flow.highlightLinks,
        proLinks: new Set<string>(),
        proSlots: new Set<string>(),
      };
    }
    return mergeMapHighlights(
      flow.highlightCities,
      flow.highlightBuildSlots,
      flow.highlightLinks,
      guide,
    );
  }, [
    trainingHint?.mapGuide,
    liveGuide?.mapGuide,
    flow.highlightCities,
    flow.highlightBuildSlots,
    flow.highlightLinks,
  ]);

  const highlightDevelopIndustries = useMemo(() => {
    const guide = trainingHint?.mapGuide ?? liveGuide?.mapGuide ?? null;
    const fromGuide = developIndustriesFromGuide(guide);
    if (flow.flow.action === 'develop' && liveGuide?.recommendedDevelop) {
      return [liveGuide.recommendedDevelop];
    }
    return fromGuide;
  }, [trainingHint?.mapGuide, liveGuide, flow.flow.action]);

  const boardViewTarget = useMemo(() => {
    if (inTutorial) return tutorialBoardView(tutorial.step);
    if (mapGuideFocus && trainingHint?.mapGuide?.viewTarget) return trainingHint.mapGuide.viewTarget;
    if (focusCity) {
      const pos = LAYOUT[focusCity];
      return { x: pos.x, y: pos.y, scale: 1.08 };
    }
    return null;
  }, [inTutorial, tutorial.step, focusCity, mapGuideFocus, trainingHint?.mapGuide]);

  useEffect(() => {
    setMapGuideFocus(false);
    setHintDismissed(false);
  }, [flow.flow.action, flow.flow.cardIdx, trainingHint?.headline, coachFeedback, state.turn]);

  const showTrainingHint = trainingHint && !hintDismissed;

  const dismissTrainingHint = () => {
    setHintDismissed(true);
    setMapGuideFocus(false);
    setMapInfo(null);
    if (coachFeedback) onDismissCoach();
  };

  return (
    <>
      {liveReviewOpen && liveReplay && (
        <TrainingReviewOverlay replay={liveReplay} onClose={() => setLiveReviewOpen(false)} />
      )}
      <div className={`game-layout map-locked-layout${inTutorial ? ' tutorial-active' : ''}`}>
        <div className="game-map-zone board-wrap map-locked">
          <PanZoomBoard
            viewRevision={(tutorial.stepIndex ?? 0) + (focusCity ? 500 : 0) + (mapGuideFocus ? 900 : 0)}
            viewTarget={boardViewTarget}
          >
            <BoardMap
              state={state}
              highlightCities={boardHighlights.cities}
              highlightBuildSlots={boardHighlights.slots}
              highlightLinks={boardHighlights.links}
              trainingProLinks={boardHighlights.proLinks}
              trainingProBuildSlots={boardHighlights.proSlots}
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
              onTrainingLinkInspect={
                trainingMode && !inTutorial
                  ? (linkId) => {
                      setMapInfo(null);
                      setFocusedLinkId(linkId);
                    }
                  : undefined
              }
              onMapInfo={setMapInfo}
            />
          </PanZoomBoard>
          <TapInfoBubble text={mapInfo} onClose={() => setMapInfo(null)} className="map-tap-info" />
          {!inTutorial && <CanalEraMapAlert state={state} enabled={mapInfo == null} />}
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
          {showTrainingHint && (
            <TrainingHintBar
              hint={trainingHint}
              className="coach-dock-map"
              onDismiss={dismissTrainingHint}
              onStartDrill={onStartTrainingDrill}
              onShowOnMap={trainingHint.mapGuide?.viewTarget ? () => setMapGuideFocus(true) : undefined}
              onResetMapView={mapGuideFocus ? () => setMapGuideFocus(false) : undefined}
              mapFocused={mapGuideFocus}
            />
          )}
          {trainingMode && trainingHint && hintDismissed && (
            <button
              type="button"
              className="training-hint-reopen"
              data-testid="training-hint-reopen"
              onClick={() => setHintDismissed(false)}
            >
              🎯 Ver coach
            </button>
          )}
        </div>

        <div className="side side-scroll">
          <div className="game-hud">
            <PlayerPanel state={state} />
            {coachActive && coachFeedback && !trainingMode && (
              <CoachPanel feedback={coachFeedback} onDismiss={onDismissCoach} />
            )}
            {(isVsAI(state) || state.mode === 'hotseat') && !inTutorial && coachHistory.length > 0 && (
              <button
                type="button"
                className="training-live-review-btn"
                onClick={() => setLiveReviewOpen(true)}
                data-testid="live-training-review"
              >
                📋 Repaso en partida ({coachHistory.length})
              </button>
            )}
            <CanalEraSidebarWarning state={state} />
            <ZoneLegend />
            <PlayerMat state={state} highlightDevelop={highlightDevelopIndustries} />
            <MarketDisplay coalCubes={state.coalCubes} ironCubes={state.ironCubes} />
            {assistantEnabled && !inTutorial && (
              <PlayAssistant
                state={state}
                refreshKey={assistantRefresh}
                onClose={onDisableAssistant}
                onRefresh={onRefreshAssistant}
              />
            )}
          </div>

          <div className="game-play-dock panel action-panel" data-testid="action-panel">
            <h3>Acciones</h3>
            <ActionGrid
              selected={flow.flow.action}
              availability={flow.availability}
              disabled={actionDisabled}
              recommended={liveGuide?.recommendedAction ?? null}
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
              <>
                <p className="action-intro-hint" data-testid="action-intro-hint">
                  {actionIntroHint(state, flow.flow.action)}
                  {liveGuide && flow.flow.action === liveGuide.recommendedAction && (
                    <span className="action-intro-rec"> ★ Mejor jugada sugerida este turno.</span>
                  )}
                </p>
                {liveGuide && !trainingMode && coachEnabled && !flow.flow.action && (
                  <p className="live-guide-line" data-testid="live-guide-line">
                    ★ Sugerencia: <strong>{liveGuide.topLine}</strong>
                  </p>
                )}
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
              </>
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
                  <button
                    key={i}
                    className={`option-btn ${industryCssClass(b.option.industry)}`}
                    onMouseEnter={() => setFocusedBuild(b)}
                    onMouseLeave={() => setFocusedBuild(null)}
                    onFocus={() => setFocusedBuild(b)}
                    onBlur={() => setFocusedBuild(null)}
                    onClick={() => flow.chooseBuild(b)}
                  >
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
                  <button
                    key={i}
                    className="option-btn option-network"
                    onMouseEnter={() => setFocusedLinkId(n.option.linkIds[0])}
                    onMouseLeave={() => setFocusedLinkId(null)}
                    onFocus={() => setFocusedLinkId(n.option.linkIds[0])}
                    onBlur={() => setFocusedLinkId(null)}
                    onClick={() => flow.chooseNetwork(n)}
                  >
                    <span>{linkLabel(n.option.linkIds[0])} — {formatNetworkCost(n.option)}</span>
                    <span className="option-reason">{networkWhy(n)}</span>
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
                      <span>
                        {CITIES[s.sale.city].name}: {industria(tile.industry)} N{tile.level} (cerveza ×{s.sale.beerNeeded})
                      </span>
                      <span className="option-reason">{sellWhyFromState(state, s)}</span>
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
                    className={`option-btn ${industryCssClass(d.industries[0])}${flow.flow.develops.includes(d.industries[0]) ? ' selected' : ''}${liveGuide?.recommendedDevelop === d.industries[0] ? ' recommended' : ''}`}
                    onClick={() => {
                      if (inTutorial && !tutorial.guardToggleDevelop(d.industries[0])) return;
                      flow.toggleDevelop(d.industries[0]);
                    }}
                  >
                    <span>
                      {industria(d.industries[0])}
                      {liveGuide?.recommendedDevelop === d.industries[0] && ' ★'}
                    </span>
                    <span className="option-reason">{developWhy(state, d.industries[0], industria(d.industries[0]))}</span>
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
          <GameHistory state={state} />
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
        <EraScoreOverlay
          score={state.pendingEraScore}
          coachHistory={coachHistory}
          replaySnapshots={replaySnapshots}
          aiDifficulty={state.aiDifficulty}
          onDismiss={state.pendingEraScore.gameOver ? onReset : onDismissEraScore}
          onStartWeaknessDrill={onStartWeaknessDrill}
        />
      )}

      {state.gameOver && !inTutorial && !state.pendingEraScore && <GameOverOverlay state={state} />}
    </>
  );
}

function GameOverOverlay({ state }: { state: GameState }) {
  if (isVsAutoma(state) || isVsAI(state)) {
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
      return 'Elige un enlace resaltado en el mapa o una opción abajo.';
    case 'sell':
      return 'Marca los edificios a vender (cada uno muestra por qué conviene) y confirma.';
    case 'develop':
      return 'Elige 1–2 industrias a retirar de tu mat y confirma.';
    case 'loan':
      return 'Elige la carta de préstamo para recibir £30.';
    case 'scout':
      return 'Elige carta de acción y luego 2 más para descartar.';
    default:
      return '';
  }
}
