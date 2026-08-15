import type { CityId, MerchantId, IndustryType, LocationId } from '../engine/types';
import { CITIES, LINKS, MERCHANTS } from '../engine/data/board';
import { tileSpec } from '../engine/data/industries';
import { LAYOUT } from '../engine/data/layout';
import { HUMAN, isVsAutoma, type GameState } from '../engine/state';
import { linkLabel, merchantBonusLabel, playerBgCssVar, playerCssVar } from '../i18n/es';
import { IndustryIcon } from './visual/IndustryIcon';
import { LinkTransportIcon } from './visual/LinkTransportIcon';
import { TileResourceBadge } from './visual/TileResourceBadge';
import { MerchantBoardFace, MerchantLinkVPBadgeRow } from './visual/MerchantBoardFace';
import { MerchantLinkVPBadge } from './visual/LinkVPBadge';
import { BoardMapArt, BoardMapArtDefs } from './visual/BoardMapArt';
import { cityZone, merchantZoneTheme, zoneTheme } from './visual/cityZones';
import { industryTheme } from './visual/industryTheme';

const SLOT = 36;
const SLOT_GAP = 5;

interface Props {
  state: GameState;
  highlightCities?: Set<string>;
  highlightBuildSlots?: Set<string>;
  highlightLinks?: Set<string>;
  /** Location card selected — spotlight this city (zone color). */
  cardFocusCity?: CityId | null;
  selectedCity?: string | null;
  onCityClick?: (city: CityId) => void;
  onMerchantClick?: (merchant: MerchantId) => void;
  onLinkClick?: (linkId: string) => void;
}

function linkActiveInEra(link: (typeof LINKS)[number], era: GameState['era']): boolean {
  return era === 'canal' ? link.canal : link.rail;
}

function linkSegments(endpoints: readonly LocationId[]): [LocationId, LocationId][] {
  if (endpoints.length === 2) return [[endpoints[0], endpoints[1]]];
  return [
    [endpoints[0], endpoints[1]],
    [endpoints[1], endpoints[2]],
  ];
}

function ownerStroke(state: GameState, owner: number | null | undefined, highlighted: boolean): string {
  if (highlighted) return 'var(--highlight)';
  if (owner == null) return 'var(--board-link)';
  if (isVsAutoma(state)) return owner === HUMAN ? 'var(--human)' : 'var(--automa)';
  return playerCssVar(owner);
}

function ownerFill(state: GameState, owner: number): string {
  if (isVsAutoma(state)) return owner === HUMAN ? 'var(--human)' : 'var(--automa)';
  return playerCssVar(owner);
}

function ownerTileFill(state: GameState, owner: number): string {
  if (isVsAutoma(state)) return owner === HUMAN ? 'var(--human-bg)' : 'var(--automa-bg)';
  return playerBgCssVar(owner);
}

function industryFill(ind: IndustryType): string {
  return industryTheme(ind).bg;
}

function IndustrySlot({
  x,
  y,
  allowed,
  tile,
  state,
  buildTarget,
}: {
  x: number;
  y: number;
  allowed: readonly IndustryType[];
  tile: GameState['board'][CityId][number];
  state: GameState;
  buildTarget: boolean;
}) {
  const r = SLOT / 2;
  const cx = x + r;
  const cy = y + r;
  const slotClass = buildTarget ? 'board-slot-build-target' : '';

  if (!tile) {
    const icons = allowed.slice(0, 2);
    const step = icons.length > 1 ? 12 : 0;
    const startX = cx - ((icons.length - 1) * step) / 2;
    return (
      <g className={`board-slot-empty ${slotClass}`.trim()}>
        {buildTarget && (
          <rect
            x={x - 2}
            y={y - 2}
            width={SLOT + 4}
            height={SLOT + 4}
            rx={6}
            fill="none"
            stroke="var(--build-slot-glow)"
            strokeWidth={2}
            className="board-slot-glow-ring"
            pointerEvents="none"
          />
        )}
        <rect
          x={x}
          y={y}
          width={SLOT}
          height={SLOT}
          rx={4}
          fill="var(--board-slot-empty-fill)"
          stroke={buildTarget ? 'var(--build-slot-glow)' : 'var(--board-slot-border)'}
          strokeWidth={buildTarget ? 2.5 : 1}
        />
        {icons.map((ind, i) => (
          <foreignObject key={`${ind}-${i}`} x={startX + i * step - 10} y={cy - 10} width={20} height={20}>
            <div style={{ lineHeight: 0, display: 'flex', justifyContent: 'center' }}>
              <IndustryIcon industry={ind} size={icons.length > 1 ? 15 : 18} colorful />
            </div>
          </foreignObject>
        ))}
      </g>
    );
  }

  const theme = industryTheme(tile.industry);
  const spec = tileSpec(tile.industry, tile.level);
  const isRound = tile.industry === 'coal' || tile.industry === 'brewery';

  return (
    <g className={`${tile.flipped ? 'tile-flipped' : ''}${buildTarget ? ' board-slot-build-target' : ''}`.trim()} opacity={tile.flipped ? 0.65 : 1}>
      {buildTarget && (
        <rect
          x={x - 2}
          y={y - 2}
          width={SLOT + 4}
          height={SLOT + 4}
          rx={tile.industry === 'pottery' ? 12 : 7}
          fill="none"
          stroke="var(--build-slot-glow)"
          strokeWidth={2}
          className="board-slot-glow-ring"
          pointerEvents="none"
        />
      )}
      {tile.flipped && (
        <rect x={x} y={y} width={SLOT} height={SLOT} rx={6} fill="var(--panel)" opacity={0.35} pointerEvents="none" />
      )}
      {isRound ? (
        <circle cx={cx} cy={cy} r={r - 1} fill={industryFill(tile.industry)} stroke={ownerTileFill(state, tile.owner)} strokeWidth={3} />
      ) : (
        <rect x={x + 1} y={y + 1} width={SLOT - 2} height={SLOT - 2} rx={tile.industry === 'pottery' ? 10 : 5} fill={industryFill(tile.industry)} stroke={ownerTileFill(state, tile.owner)} strokeWidth={3} />
      )}
      <foreignObject x={x + 4} y={y + 4} width={SLOT - 8} height={SLOT - 8}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <IndustryIcon industry={tile.industry} size={18} colorful />
        </div>
      </foreignObject>
      <text x={cx + r - 6} y={y + SLOT - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill={theme.color}>
        {tile.level}
      </text>
      {spec.linkVP > 0 && (
        <text x={x + 6} y={y + 10} textAnchor="middle" fontSize={7} fontWeight={700} fill={theme.color}>
          +{spec.linkVP}
        </text>
      )}
      {!tile.flipped && (
        <TileResourceBadge industry={tile.industry} count={tile.resources} cx={x + 8} bottomY={y + SLOT - 2} />
      )}
      <circle cx={x + SLOT - 5} cy={y + 5} r={4} fill={ownerFill(state, tile.owner)} stroke="var(--panel)" strokeWidth={1} />
    </g>
  );
}

const FARM_LABEL: Record<'farmNorth' | 'farmSouth', { name: string; labelX: number; anchor: 'start' | 'end' | 'middle' }> = {
  farmNorth: { name: 'Granja N.', labelX: 20, anchor: 'start' },
  farmSouth: { name: 'Granja S.', labelX: -20, anchor: 'end' },
};

function FarmBreweryMarker({
  farmId,
  pos,
  tile,
  state,
  highlighted,
  cardFocused,
  onClick,
}: {
  farmId: 'farmNorth' | 'farmSouth';
  pos: { x: number; y: number };
  tile: GameState['board'][CityId][number];
  state: GameState;
  highlighted: boolean;
  cardFocused?: boolean;
  onClick?: () => void;
}) {
  const meta = FARM_LABEL[farmId];
  const zone = zoneTheme(cityZone(farmId));
  return (
    <g
      data-testid={`city-${farmId}`}
      data-focused={cardFocused ? 'true' : undefined}
      className={cardFocused ? 'board-city-card-focus farm-marker' : highlighted ? 'board-highlight-pulse' : 'farm-marker'}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {cardFocused && (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={22}
          fill="none"
          stroke={zone.cardBorder}
          strokeWidth={2.5}
          className="board-city-focus-ring"
          pointerEvents="none"
        />
      )}
      <circle
        cx={pos.x}
        cy={pos.y}
        r={tile ? 16 : 13}
        fill={tile ? industryFill('brewery') : 'var(--board-slot-empty)'}
        stroke={
          tile
            ? ownerTileFill(state, tile.owner)
            : cardFocused
              ? zone.cardBorder
              : highlighted
                ? 'var(--highlight)'
                : 'var(--ind-brewery-border)'
        }
        strokeWidth={cardFocused ? 3 : tile ? 3 : 2}
        strokeDasharray={tile ? undefined : '4 3'}
      />
      <foreignObject x={pos.x - 10} y={pos.y - 10} width={20} height={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <IndustryIcon industry="brewery" size={tile ? 16 : 14} colorful />
        </div>
      </foreignObject>
      {tile && (
        <>
          <circle cx={pos.x + 11} cy={pos.y - 9} r={4} fill={ownerFill(state, tile.owner)} stroke="var(--panel)" strokeWidth={1} />
          <text x={pos.x + 11} y={pos.y - 6} textAnchor="middle" fontSize={7} fontWeight={700} fill="var(--panel)">
            {tile.level}
          </text>
          {tileSpec(tile.industry, tile.level).linkVP > 0 && (
            <MerchantLinkVPBadge cx={pos.x + 14} y={pos.y - 14} size={11} />
          )}
          {!tile.flipped && tile.resources > 0 && (
            <TileResourceBadge industry="brewery" count={tile.resources} cx={pos.x - 6} bottomY={pos.y + 12} />
          )}
        </>
      )}
      <text
        x={pos.x + meta.labelX}
        y={pos.y + 4}
        textAnchor={meta.anchor}
        fontSize={10}
        fontWeight={700}
        fill="var(--ind-brewery-text)"
        className="farm-label"
      >
        {meta.name}
      </text>
      {!tile && (
        <title>Cervecería de granja — enlace (sin construir)</title>
      )}
    </g>
  );
}

export function BoardMap({ state, highlightCities, highlightBuildSlots, highlightLinks, cardFocusCity, selectedCity, onCityClick, onMerchantClick, onLinkClick }: Props) {
  return (
    <svg viewBox="0 0 900 860" width={900} height={860} role="img" aria-label="Tablero de juego" data-testid="board" className="board-svg" shapeRendering="geometricPrecision" textRendering="optimizeLegibility">
      <defs>
        <BoardMapArtDefs />
      </defs>

      <BoardMapArt era={state.era} />

      {LINKS.map((link) => {
        const owner = state.links[link.id];
        if (owner == null && !linkActiveInEra(link, state.era)) return null;
        const highlighted = highlightLinks?.has(link.id);
        const isCanalOnly = link.canal && !link.rail;
        const canalEra = state.era === 'canal';
        const stroke =
          highlighted || owner != null
            ? ownerStroke(state, owner, !!highlighted)
            : canalEra
              ? 'var(--canal)'
              : 'var(--rail)';
        const width = owner != null ? 8 : link.canal && link.rail ? 6 : highlighted ? 7 : isCanalOnly && canalEra ? 4 : 5;
        const midA = LAYOUT[link.endpoints[0]];
        const midB = LAYOUT[link.endpoints[link.endpoints.length - 1]];
        const mx = (midA.x + midB.x) / 2;
        const my = (midA.y + midB.y) / 2;
        return (
          <g
            key={link.id}
            data-testid={`link-${link.id}`}
            className={highlighted ? 'board-highlight-pulse' : ''}
            style={{ cursor: highlighted && onLinkClick ? 'pointer' : 'default' }}
            onClick={() => highlighted && onLinkClick?.(link.id)}
          >
            <title>
              {isCanalOnly && canalEra && owner == null
                ? `${linkLabel(link.id)} — solo canal (desaparece en era ferrocarril si no se construye)`
                : linkLabel(link.id)}
            </title>
            {linkSegments(link.endpoints).map(([a, b], i) => (
              <line
                key={i}
                x1={LAYOUT[a].x}
                y1={LAYOUT[a].y}
                x2={LAYOUT[b].x}
                y2={LAYOUT[b].y}
                stroke={stroke}
                strokeWidth={width}
                strokeLinecap="round"
                opacity={isCanalOnly && canalEra && owner == null ? 0.88 : 1}
              />
            ))}
            {owner != null && (
              <g className="link-transport-marker" transform={`translate(${mx}, ${my})`} pointerEvents="none">
                <circle r={11} fill={ownerFill(state, owner)} stroke="var(--panel)" strokeWidth={2} />
                <foreignObject x={-7} y={-7} width={14} height={14}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      color: '#fff',
                    }}
                  >
                    <LinkTransportIcon era={state.era} size={12} />
                  </div>
                </foreignObject>
              </g>
            )}
            {(highlighted || owner != null) && (
              <text x={mx} y={my - 12} textAnchor="middle" fontSize={9} fill="var(--muted)" className="link-label">
                {linkLabel(link.id)}
              </text>
            )}
          </g>
        );
      })}

      {Object.values(CITIES).map((city) => {
        const pos = LAYOUT[city.id];
        const slots = state.board[city.id];
        const highlighted = highlightCities?.has(city.id);
        const isCardFocus = cardFocusCity === city.id;
        const cardTarget = !isCardFocus && !!highlighted && (highlightBuildSlots?.size ?? 0) > 0;
        const selected = selectedCity === city.id;
        const zone = zoneTheme(cityZone(city.id));
        const cityClass = [
          isCardFocus ? 'board-city-card-focus' : '',
          cardTarget ? 'board-city-card-target' : '',
          !isCardFocus && highlighted ? 'board-highlight-pulse' : '',
          selected ? 'board-city-selected' : '',
        ]
          .filter(Boolean)
          .join(' ');

        if (city.isFarmBrewery) {
          const farmId = city.id as 'farmNorth' | 'farmSouth';
          const farmFocused = isCardFocus;
          return (
            <FarmBreweryMarker
              key={city.id}
              farmId={farmId}
              pos={pos}
              tile={slots[0]}
              state={state}
              highlighted={!!highlighted || selected || farmFocused}
              cardFocused={farmFocused}
              onClick={onCityClick ? () => onCityClick(city.id) : undefined}
            />
          );
        }

        const w = Math.max(76, city.slots.length * (SLOT + SLOT_GAP) + 14);
        const h = 58;
        const labelW = w;
        return (
          <g
            key={city.id}
            data-testid={`city-${city.id}`}
            data-focused={isCardFocus ? 'true' : undefined}
            className={cityClass}
            style={{ cursor: onCityClick ? 'pointer' : 'default' }}
            onClick={() => onCityClick?.(city.id)}
          >
            {isCardFocus && (
              <rect
                x={pos.x - w / 2 - 5}
                y={pos.y - h / 2 + 1}
                width={w + 10}
                height={h + 6}
                rx={11}
                fill="none"
                stroke={zone.cardBorder}
                strokeWidth={2.5}
                className="board-city-focus-ring"
                pointerEvents="none"
              />
            )}
            <rect
              x={pos.x - w / 2}
              y={pos.y - h / 2 + 6}
              width={w}
              height={h - 6}
              rx={8}
              fill={isCardFocus ? zone.cardBg : 'var(--board-city-body)'}
              stroke={isCardFocus ? zone.cardBorder : selected ? 'var(--card-select-glow)' : cardTarget ? zone.cardBorder : zone.border}
              strokeWidth={isCardFocus ? 3 : selected || cardTarget ? 2 : 1}
            />
            <rect
              x={pos.x - labelW / 2}
              y={pos.y - h / 2 - 4}
              width={labelW}
              height={18}
              rx={4}
              fill={isCardFocus || cardTarget ? zone.cardBorder : zone.banner}
              stroke={isCardFocus || cardTarget ? zone.cardBorder : zone.border}
              strokeWidth={isCardFocus || cardTarget ? 2 : 0.75}
              className={isCardFocus || cardTarget ? 'city-banner-active' : ''}
            />
            <text
              x={pos.x}
              y={pos.y - h / 2 + 9}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill={isCardFocus || cardTarget ? '#fff' : zone.bannerText}
              className="city-label"
            >
              {city.name}
            </text>
            {city.slots.map((allowed, i) => {
                const tile = slots[i];
                const sx = pos.x - w / 2 + 6 + i * (SLOT + SLOT_GAP);
                const sy = pos.y - 14;
                const buildTarget = highlightBuildSlots?.has(`${city.id}:${i}`) ?? false;
                return (
                  <IndustrySlot key={i} x={sx} y={sy} allowed={allowed} tile={tile} state={state} buildTarget={buildTarget} />
                );
              })}
          </g>
        );
      })}

      {Object.values(MERCHANTS).map((m) => {
        const pos = LAYOUT[m.id];
        const merchantState = state.merchants.find((s) => s.id === m.id);
        const mTheme = merchantZoneTheme();
        const nameSize = m.name.length > 11 ? 8 : 9;
        const boxTop = pos.y - 36;
        return (
          <g
            key={m.id}
            data-testid={`merchant-${m.id}`}
            aria-label={`Comerciante ${m.name}. ${merchantBonusLabel(m.bonus)}.`}
            style={{ cursor: onMerchantClick ? 'pointer' : 'default' }}
            onClick={() => onMerchantClick?.(m.id)}
          >
            <title>{`${m.name} — ${merchantBonusLabel(m.bonus)} · Toca para detalles`}</title>
            <MerchantLinkVPBadgeRow cx={pos.x} y={boxTop - 2} count={m.slotCount} size={11} />
            <rect
              x={pos.x - 36}
              y={boxTop}
              width={72}
              height={76}
              rx={10}
              fill="var(--board-city-body)"
              stroke={mTheme.border}
              strokeWidth={1.5}
            />
            <rect x={pos.x - 36} y={boxTop} width={72} height={17} rx={4} fill={mTheme.banner} />
            <text x={pos.x} y={boxTop + 12} textAnchor="middle" fontSize={nameSize} fontWeight={700} fill={mTheme.bannerText}>
              {m.name}
            </text>
            {merchantState ? (
              <MerchantBoardFace
                cx={pos.x}
                bodyTop={boxTop + 17}
                tiles={merchantState.tiles}
                beer={merchantState.beer}
                bonus={m.bonus}
              />
            ) : (
              <text x={pos.x} y={pos.y + 8} textAnchor="middle" fontSize={9} fill="var(--muted)">
                libre
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
