import { useState, type KeyboardEvent } from 'react';
import type { CityId, IndustryType } from '../engine/types';
import { CITIES, LINKS } from '../engine/data/board';
import { tileSpec } from '../engine/data/industries';
import { buildBlockReason } from '../engine/buildExplain';
import { eligibleSlots, lowestBuildable, tileAllowedInEra } from '../engine/actions';
import { activePlayer, type Card, type GameState } from '../engine/state';
import { industria, linkLabel } from '../i18n/es';
import type { BuildChoice } from '../engine/options';
import { legalNetworks } from '../engine/options';
import { cityZone, zoneTheme } from './visual/cityZones';
import { LocationSlotIcons } from './visual/LocationSlotIcons';
import { MatTile } from './visual/MatTile';
import { formatBuildCost } from './formatCost';
import { CitySlotGuide } from './CitySlotGuide';

interface Props {
  state: GameState;
  cityId: CityId;
  builds: BuildChoice[];
  selectedCard: Card | null;
  buildMode: boolean;
  onClose: () => void;
  onBuild?: (b: BuildChoice) => void;
}

const INDUSTRY_ORDER: IndustryType[] = ['cotton', 'goods', 'pottery', 'coal', 'iron', 'brewery'];

export interface CityBuildOption {
  slotIndex: number;
  industry: IndustryType;
  level: number;
  remaining: number;
  buildChoice: BuildChoice | null;
  blockReason: string | null;
}

export interface CityBuildSection {
  slotIndex: number;
  options: CityBuildOption[];
}

function slotGridClass(slotCount: number, slotIndex: number): string {
  if (slotCount === 1) return 'slot-pos-single';
  if (slotCount === 2) return slotIndex === 0 ? 'slot-pos-top' : 'slot-pos-bottom';
  if (slotCount === 3) {
    if (slotIndex === 0) return 'slot-pos-top';
    if (slotIndex === 1) return 'slot-pos-left';
    return 'slot-pos-right';
  }
  return ['slot-pos-top', 'slot-pos-right', 'slot-pos-bottom', 'slot-pos-left'][slotIndex] ?? 'slot-pos-top';
}

function slotIndustryBlockReason(
  state: GameState,
  card: Card | null,
  cityId: CityId,
  industry: IndustryType,
  slotIndex: number,
): string | null {
  const general = buildBlockReason(state, card, cityId, industry);
  if (general) return general;
  if (!eligibleSlots(state, cityId, industry).includes(slotIndex)) {
    return 'Usa primero las casillas dedicadas';
  }
  return null;
}

function cityBuildOptions(
  state: GameState,
  cityId: CityId,
  builds: BuildChoice[],
  selectedCard: Card | null,
  buildMode: boolean,
): CityBuildOption[] {
  const city = CITIES[cityId];
  const player = activePlayer(state);
  const options: CityBuildOption[] = [];

  city.slots.forEach((allowed, slotIndex) => {
    if (state.board[cityId][slotIndex]) return;

    const industries = [...allowed].sort(
      (a, b) => INDUSTRY_ORDER.indexOf(a) - INDUSTRY_ORDER.indexOf(b),
    );

    for (const industry of industries) {
      if (buildMode && selectedCard?.kind === 'industry' && !selectedCard.industries.includes(industry)) {
        continue;
      }

      const level = lowestBuildable(state, player, industry);
      if (level === null || !tileAllowedInEra(industry, level, state.era)) continue;

      const buildChoice =
        builds.find(
          (b) =>
            b.option.city === cityId &&
            b.option.slot === slotIndex &&
            b.option.industry === industry,
        ) ?? null;

      const blockReason = buildMode
        ? slotIndustryBlockReason(state, selectedCard, cityId, industry, slotIndex)
        : null;

      options.push({
        slotIndex,
        industry,
        level,
        remaining: state.players[player].mat[industry][level - 1] ?? 0,
        buildChoice,
        blockReason,
      });
    }
  });

  return options;
}

function cityBuildSections(
  state: GameState,
  cityId: CityId,
  builds: BuildChoice[],
  selectedCard: Card | null,
  buildMode: boolean,
): CityBuildSection[] {
  const grouped = new Map<number, CityBuildOption[]>();
  for (const opt of cityBuildOptions(state, cityId, builds, selectedCard, buildMode)) {
    const list = grouped.get(opt.slotIndex) ?? [];
    list.push(opt);
    grouped.set(opt.slotIndex, list);
  }
  return [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([slotIndex, options]) => ({ slotIndex, options }));
}

export function CityMapOverlay({ state, cityId, builds, selectedCard, buildMode, onClose, onBuild }: Props) {
  const city = CITIES[cityId];
  const zone = zoneTheme(cityZone(cityId));
  const sections = cityBuildSections(state, cityId, builds, selectedCard, buildMode);
  const [confirmChoice, setConfirmChoice] = useState<BuildChoice | null>(null);
  const cityLinks = legalNetworks(state).filter((n) => {
    const link = LINKS.find((l) => l.id === n.option.linkIds[0]);
    return link?.endpoints.includes(cityId);
  });

  return (
    <div className="city-map-overlay" data-testid="city-inspect" role="dialog" aria-modal="true" aria-label={`Ciudad ${city.name}`}>
      <button type="button" className="city-overlay-backdrop" onClick={onClose} aria-label="Cerrar" />
      <div className="city-overlay-panel">
        <CitySlotGuide state={state} cityId={cityId} slots={city.slots} />

        <div className={`city-overlay-cross slots-${city.slots.length}`}>
          {buildMode && (
            <p className="city-overlay-build-hint">Toca la ficha en verde para elegir qué construir</p>
          )}
          <div className="city-overlay-center">
            <LocationSlotIcons slots={city.slots} size="md" variant="board" />
            <span
              className="city-overlay-ribbon"
              style={{ background: zone.banner, borderColor: zone.border, color: zone.bannerText }}
            >
              {city.name}
            </span>
            <span className="city-overlay-zone-label">{zone.label}</span>
          </div>

          {sections.map((section) => (
            <div
              key={section.slotIndex}
              className={`city-overlay-section ${slotGridClass(city.slots.length, section.slotIndex)}`}
              data-testid={`city-overlay-section-${section.slotIndex}`}
            >
              <div className={`city-overlay-section-mats mats-${section.options.length}`}>
                {[...section.options]
                  .sort((a, b) => {
                    const aBuild = buildMode && !!a.buildChoice ? 1 : 0;
                    const bBuild = buildMode && !!b.buildChoice ? 1 : 0;
                    return aBuild - bBuild;
                  })
                  .map((opt) => {
                  const spec = tileSpec(opt.industry, opt.level);
                  const canBuild = buildMode && !!opt.buildChoice;
                  const blockedMsg =
                    buildMode && !canBuild
                      ? (opt.blockReason ?? 'No se puede construir aquí')
                      : null;
                  const isConfirming =
                    confirmChoice != null &&
                    opt.buildChoice != null &&
                    confirmChoice.cardIdx === opt.buildChoice.cardIdx &&
                    confirmChoice.option.city === opt.buildChoice.option.city &&
                    confirmChoice.option.slot === opt.buildChoice.option.slot &&
                    confirmChoice.option.industry === opt.buildChoice.option.industry;

                  return (
                    <div
                      key={opt.industry}
                      className={`city-overlay-option${canBuild ? ' can-build' : ''}${blockedMsg ? ' blocked' : ''}`}
                      {...(canBuild && opt.buildChoice && !isConfirming
                        ? {
                            role: 'button',
                            tabIndex: 0,
                            onClick: () => setConfirmChoice(opt.buildChoice!),
                            onKeyDown: (e: KeyboardEvent) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setConfirmChoice(opt.buildChoice!);
                              }
                            },
                          }
                        : {})}
                    >
                      <span className="city-overlay-ind-label">{industria(opt.industry)}</span>
                      <MatTile industry={opt.industry} spec={spec} era={state.era} remaining={opt.remaining} />

                      {canBuild && opt.buildChoice && !isConfirming && (
                        <>
                          <p className="city-overlay-cost">{formatBuildCost(opt.buildChoice.option)}</p>
                          <button
                            type="button"
                            className="city-overlay-build-btn primary"
                            data-testid={`city-build-${opt.industry}-${opt.slotIndex}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmChoice(opt.buildChoice!);
                            }}
                          >
                            Construir
                          </button>
                        </>
                      )}

                      {canBuild && opt.buildChoice && isConfirming && (
                        <div className="city-overlay-confirm" data-testid="city-build-confirm">
                          <p className="city-overlay-confirm-text">
                            ¿Construir {industria(opt.industry)} N{opt.level} en {city.name}?
                          </p>
                          <p className="city-overlay-cost">{formatBuildCost(opt.buildChoice.option)}</p>
                          <div className="city-overlay-confirm-actions">
                            <button
                              type="button"
                              className="city-overlay-build-btn primary"
                              data-testid="city-build-confirm-yes"
                              onClick={() => {
                                onBuild?.(opt.buildChoice!);
                                setConfirmChoice(null);
                              }}
                            >
                              Sí, construir
                            </button>
                            <button
                              type="button"
                              className="city-overlay-build-btn city-overlay-build-cancel"
                              data-testid="city-build-confirm-no"
                              onClick={() => setConfirmChoice(null)}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      )}

                      {blockedMsg && <p className="city-overlay-blocked-msg">{blockedMsg}</p>}
                    </div>
                  );
                })}
              </div>

              {!buildMode && <p className="city-overlay-hint muted-inline">Elige acción Construir</p>}
            </div>
          ))}

          {sections.length === 0 && (
            <p className="city-overlay-empty-msg muted-inline">Sin casillas libres o sin fichas en tu mat</p>
          )}
        </div>

        {cityLinks.length > 0 && (
          <div className="city-overlay-links">
            <span className="muted-inline">Enlaces posibles: </span>
            {cityLinks.map((n, i) => (
              <span key={i}>
                {linkLabel(n.option.linkIds[0])} (£{n.option.totalCost})
                {i < cityLinks.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </div>
        )}

        <button type="button" className="city-overlay-cancel" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

/** @internal exported for tests */
export { cityBuildOptions, cityBuildSections };
