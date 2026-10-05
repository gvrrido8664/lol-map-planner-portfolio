import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Image as KImage,
  Line,
  Arrow,
  Text as KText,
  Circle,
  Group,
  Rect,
} from "react-konva";
import useImage from "use-image";
import minionAzulUrl from "@/assets/minion_azul.png";
import minionRojoUrl from "@/assets/minion_rojo.png";
import type Konva from "konva";
import {
  AnyElement,
  MonsterElement,
  ChampionElement,
  PencilElement,
  TextElement,
  WardElement,
  DangerElement,
  ArrowElement,
  MinionWaveElement,
  TurretElement,
  makeId,
  thicknessToPx,
  useEditorStore,
} from "@/stores/editorStore";
import { drawKonvaLine } from "@/lib/spline";
import { Champion, SUMMONERS_RIFT_MAP_URL } from "@/lib/champions";
import {
  FAELIGHTS,
  FAELIGHT_WARD_VISION_MULTIPLIER,
  FAELIGHT_INNER_RADIUS,
  FAELIGHT_TRIGGER_RADIUS,
  FOUNTAIN,
  SIGHT,
  faelightAt,
  faelightVisionMask,
  reachableFrom,
  snapWardToFaelight,
  visionPolygon,
  walkVersusRecall,
  wallMaskSnapshot,
  bushMaskSnapshot,
  wardWallMaskSnapshot,
  type Faelight,
} from "@/lib/rift";

import { MONSTERS, ELEMENTS, HEXGATES, WIND_ZONES } from "@/lib/map-variants";
import { objectiveIcon } from "@/lib/objective-assets";

type Props = {
  width: number;
  height: number;
  selectedChampion: Champion | null;
  onPlaceChampion: () => void; // called after placement to clear selection
};

function ChampionToken({
  el,
  selected,
  groupSelected,
  draggable,
  showVision,
  iconScale,
  displayX,
  displayY,
  onDragStart,
  onDragMove,
  onDragEnd,
  onClick,
  onDblClick,
}: {
  el: ChampionElement;
  selected: boolean;
  groupSelected?: boolean;
  draggable: boolean;
  showVision: boolean;
  iconScale: number;
  displayX?: number;
  displayY?: number;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onClick: () => void;
  onDblClick: () => void;
}) {
  const [img] = useImage(el.iconUrl, "anonymous");
  const r = 22;
  return (
    <>
      {/* Visión del campeón: 1350 unidades. Sigue la posición ya soltada, no la
          del arrastre en curso: retrazar los rayos en cada píxel iría a tirones. */}
      {showVision && (
        <VisionArea
          x={el.x}
          y={el.y}
          range={SIGHT.champion}
          color={el.team === "blue" ? "#3B82F6" : "#EF4444"}
          fillAlpha="1f"
          iconScale={iconScale}
        />
      )}
      <Group
        x={displayX ?? el.x}
        y={displayY ?? el.y}
        scaleX={iconScale}
        scaleY={iconScale}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragMove={onDragMove ? (e) => onDragMove(e.target.x(), e.target.y()) : undefined}
        onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
        onClick={onClick}
        onTap={onClick}
        onDblClick={onDblClick}
        onDblTap={onDblClick}
      >
        <Circle
          radius={r + 2}
          fill={el.team === "blue" ? "#3B82F6" : "#EF4444"}
          shadowBlur={selected ? 12 : 4}
          shadowColor={el.team === "blue" ? "#3B82F6" : "#EF4444"}
        />
        {img && <KImage image={img} x={-r} y={-r} width={r * 2} height={r * 2} cornerRadius={r} />}
        {selected && <Circle radius={r + 5} stroke="#C89B3C" strokeWidth={2} dash={[4, 3]} />}
        {groupSelected && !selected && (
          <Circle radius={r + 5} stroke="#22D3EE" strokeWidth={2} dash={[4, 3]} />
        )}
      </Group>
    </>
  );
}

// Los radios de visión reales (en unidades de juego) viven en @/lib/rift, junto
// con la máscara de muros y los arbustos: la visión ya no es un círculo, es el
// polígono que queda tras recortar con muros y arbustos.

/**
 * Área de visión de una unidad. Se dibuja en coordenadas del mapa (fuera de los
 * grupos que escalan el icono) y se recalcula solo al cambiar de sitio.
 */
function VisionArea({
  x,
  y,
  range,
  color,
  fillAlpha = "22",
  dash,
  iconScale,
  ward = false,
}: {
  x: number;
  y: number;
  /** Radio en unidades de juego. */
  range: number;
  /** Color en hex de 6 dígitos: se le añade la transparencia. */
  color: string;
  fillAlpha?: string;
  dash?: number[];
  iconScale: number;
  /** Las wards además chocan con las paredes moradas. */
  ward?: boolean;
}) {
  const variant = useEditorStore((s) => s.state.map);
  const points = visionPolygon(x, y, range, ward, variant);
  // Relleno muy suave + borde marcado: con varias visiones superpuestas el
  // relleno se acumula, pero el borde sigue diciendo dónde acaba cada una.
  return (
    <Line
      points={points}
      closed
      fill={color + fillAlpha}
      stroke={color + "99"}
      strokeWidth={1.2 / iconScale}
      dash={dash}
      listening={false}
      perfectDrawEnabled={false}
    />
  );
}

const ICON_TOWER = "https://raw.communitydragon.org/latest/game/assets/ux/minimap/icons/tower.png";
const ICON_MINION =
  "https://raw.communitydragon.org/latest/game/assets/ux/minimap/icons/minionmapcircle.png";

const wardVisionRange = (kind: WardElement["kind"]) =>
  kind === "pink" ? SIGHT.controlWard : SIGHT.ward;

function WardIcon({
  el,
  faelight,
  faelightMask,
  selected,
  draggable,
  iconScale,
  onDragEnd,
  onClick,
}: {
  el: WardElement;
  faelight: Faelight | null;
  faelightMask: HTMLCanvasElement | null;
  selected: boolean;
  draggable: boolean;
  iconScale: number;
  onDragEnd: (x: number, y: number) => void;
  onClick: () => void;
}) {
  const isPink = el.kind === "pink";
  const dotColor = isPink ? "#EC4899" : "#FACC15";
  const visionColor = dotColor;
  const range = wardVisionRange(el.kind);
  return (
    <>
      {faelightMask && (
        <KImage
          image={faelightMask}
          width={1000}
          height={1000}
          opacity={0.22}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      <VisionArea
        x={el.x}
        y={el.y}
        range={faelight ? range * FAELIGHT_WARD_VISION_MULTIPLIER : range}
        color={visionColor}
        fillAlpha="26"
        dash={isPink ? [4 / iconScale, 3 / iconScale] : undefined}
        iconScale={iconScale}
        ward
      />
      <Group
        x={el.x}
        y={el.y}
        scaleX={iconScale}
        scaleY={iconScale}
        draggable={draggable}
        onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
        onClick={onClick}
        onTap={onClick}
      >
        {/* ward icon — screen-constant size */}
        {faelight && <Circle radius={11} stroke="#C4B5FD" strokeWidth={2} opacity={0.9} />}
        <Circle radius={9} fill={dotColor} opacity={0.35} />
        <Circle radius={5} fill={dotColor} stroke="#fff" strokeWidth={1.5} />
        {selected && <Circle radius={12} stroke="#C89B3C" strokeWidth={1.5} dash={[3, 2]} />}
      </Group>
    </>
  );
}

/** Cian para las ocho de siempre, morado para las cuatro ocultas. */
const faelightRgb = (faelight: Faelight) =>
  faelight.postTransform ? [168, 85, 247] : [34, 211, 238];
const faelightHex = (faelight: Faelight) => (faelight.postTransform ? "#A855F7" : "#22D3EE");

function makeFaelightMask(
  faelight: Faelight,
  index: number,
  walls: Uint8Array,
  wardWalls: Uint8Array,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1000;
  const context = canvas.getContext("2d");
  if (!context) return null;

  // Las doce regiones están horneadas; aquí solo se recortan con los muros (y
  // las paredes solo-ward) y se apaga lo que quede aislado tras ellos.
  const baked = faelightVisionMask(index);
  if (!baked) return canvas;
  const visible = new Uint8Array(baked.length);
  for (let i = 0; i < baked.length; i++)
    visible[i] = baked[i] && !walls[i] && !wardWalls[i] ? 1 : 0;
  const lit = reachableFrom(visible, faelight.x, faelight.y);
  const [r, g, b] = faelightRgb(faelight);
  const image = context.createImageData(1000, 1000);
  for (let i = 0; i < lit.length; i++) {
    if (!lit[i]) continue;
    const offset = i * 4;
    image.data[offset] = r;
    image.data[offset + 1] = g;
    image.data[offset + 2] = b;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

function MinionWaveIcon({
  el,
  selected,
  draggable,
  baseSize,
  iconScale,
  onDragEnd,
  onClick,
}: {
  el: MinionWaveElement;
  selected: boolean;
  draggable: boolean;
  baseSize: number;
  iconScale: number;
  onDragEnd: (x: number, y: number) => void;
  onClick: () => void;
}) {
  const teamColor = el.team === "blue" ? "#3B82F6" : "#EF4444";
  const minionUrl = el.team === "blue" ? minionAzulUrl : minionRojoUrl;
  const [minionImg] = useImage(minionUrl, "anonymous");
  const s = 16;
  return (
    <Group
      x={el.x}
      y={el.y}
      scaleX={iconScale}
      scaleY={iconScale}
      draggable={draggable}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onClick={onClick}
      onTap={onClick}
    >
      <Circle x={0} y={0} radius={s + 2} stroke={teamColor} strokeWidth={2} />
      {minionImg ? (
        <KImage image={minionImg} x={-s} y={-s} width={s * 2} height={s * 2} />
      ) : (
        <Circle x={0} y={0} radius={s} fill={teamColor} stroke="#fff" strokeWidth={1} />
      )}
      {selected && <Circle radius={s + 4} stroke="#C89B3C" strokeWidth={1.5} dash={[3, 2]} />}
    </Group>
  );
}

function TurretIconBase({
  el,
  image,
  selected,
  draggable,
  showVision,
  baseSize,
  iconScale,
  effectiveScale,
  onDragEnd,
  onClick,
}: {
  el: TurretElement;
  image?: HTMLImageElement;
  selected: boolean;
  draggable: boolean;
  showVision: boolean;
  baseSize: number;
  iconScale: number;
  effectiveScale: number;
  onDragEnd: (x: number, y: number) => void;
  onClick: () => void;
}) {
  const teamColor = el.team === "blue" ? "#3B82F6" : "#EF4444";
  const s = 14;
  return (
    <>
      {/* Visión de la torreta: 1350 unidades, igual que un campeón. */}
      {showVision && (
        <VisionArea
          x={el.x}
          y={el.y}
          range={SIGHT.turret}
          color={teamColor}
          fillAlpha="18"
          iconScale={iconScale}
        />
      )}
      <Group
        x={el.x}
        y={el.y}
        scaleX={iconScale}
        scaleY={iconScale}
        draggable={draggable}
        listening={draggable}
        onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
        onClick={onClick}
        onTap={onClick}
        transformsEnabled="position"
      >
        {image ? (
          <>
            <Circle
              radius={s + 2}
              fill={teamColor}
              opacity={0.85}
              stroke="#fff"
              strokeWidth={1.5}
              listening={false}
              perfectDrawEnabled={false}
              shadowForStrokeEnabled={false}
              hitStrokeWidth={0}
            />
            <KImage
              image={image}
              x={-s}
              y={-s}
              width={s * 2}
              height={s * 2}
              listening={false}
              perfectDrawEnabled={false}
            />
          </>
        ) : (
          <Rect
            x={-8}
            y={-10}
            width={16}
            height={20}
            fill={teamColor}
            stroke="#fff"
            strokeWidth={1.5}
            cornerRadius={2}
            listening={false}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
        )}
        {selected && <Circle radius={s + 4} stroke="#C89B3C" strokeWidth={1.5} dash={[3, 2]} />}
      </Group>
    </>
  );
}

const TurretIcon = memo(
  TurretIconBase,
  (a, b) =>
    a.el === b.el &&
    a.image === b.image &&
    a.selected === b.selected &&
    a.draggable === b.draggable &&
    a.showVision === b.showVision &&
    a.baseSize === b.baseSize &&
    a.iconScale === b.iconScale &&
    a.effectiveScale === b.effectiveScale,
);

function ObjectiveIcon({
  el,
  iconScale,
  selected,
  draggable,
  onSelect,
  onMove,
}: {
  el: MonsterElement;
  iconScale: number;
  selected: boolean;
  draggable: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const monster = MONSTERS[el.kind];
  const [img] = useImage(objectiveIcon(monster.icon));
  return (
    <Group
      x={el.x}
      y={el.y}
      scaleX={iconScale}
      scaleY={iconScale}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onMove(e.target.x(), e.target.y())}
    >
      <Circle
        radius={22}
        fill="#071521"
        stroke={selected ? "#C89B3C" : "#7C8BA1"}
        strokeWidth={selected ? 2 : 1}
      />
      {img ? (
        <KImage image={img} x={-18} y={-18} width={36} height={36} />
      ) : (
        <KText
          text={monster.name.slice(0, 2)}
          x={-18}
          y={-7}
          width={36}
          align="center"
          fill="#fff"
          fontSize={13}
        />
      )}
      <KText
        text={monster.name}
        x={-65}
        y={27}
        width={130}
        align="center"
        fontSize={12}
        fill="#F8F8F2"
        stroke="#071521"
        strokeWidth={2}
        fillAfterStrokeEnabled
        listening={false}
      />
    </Group>
  );
}

export function MapCanvas({ width, height, selectedChampion, onPlaceChampion }: Props) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const {
    state,
    tool,
    color,
    thickness,
    team,
    wardKind,
    selectedId,
    multiSelectedIds,
    setSelected,
    setMultiSelected,
    moveElementsBy,
    addElement,
    updateElement,
    removeElement,
    setTool,
    fogOfWar,
    showBushes,
    showTerrain,
    showFaelights,
    empoweredRecall,
    movement,
    setMovementPoint,
    resetMovement,
  } = useEditorStore();
  const variant = state.map;

  const elementUrl = useMemo(() => {
    switch (variant.element) {
      case "ocean":
        return "/mapas/mapa-ocean.jpg";
      case "hextech":
        return "/mapas/mapa-hextech.jpg";
      case "mountain":
        return "/mapas/mapa-mountain.jpg";
      case "chemtech":
        return "/mapas/mapa-chemtech.jpg";
      case "infernal":
        return "/mapas/mapa-infernal.jpg";
      case "cloud":
        return "/mapas/mapa-cloud.jpg";
      default:
        return "/mapas/baron-hunting.jpg";
    }
  }, [variant.element]);

  const baronUrl = useMemo(() => {
    switch (variant.baron) {
      case "allSeeing":
        return "/mapas/baron-allSeeing.jpg";
      case "territorial":
        return "/mapas/baron-territorial.jpg";
      case "hunting":
      default:
        return "/mapas/baron-hunting.jpg";
    }
  }, [variant.baron]);

  const [elementImg] = useImage(elementUrl, "anonymous");
  const [baronImg] = useImage(baronUrl, "anonymous");
  const [towerImg] = useImage(ICON_TOWER, "anonymous");

  const transformed = variant.element !== "base";
  const activeFaelights = showFaelights
    ? FAELIGHTS.filter((f) => !f.postTransform || transformed)
    : [];
  const getFaelight = (x: number, y: number) =>
    showFaelights ? faelightAt(x, y, transformed) : null;
  const [hoveredFaelight, setHoveredFaelight] = useState<Faelight | null>(null);

  const [drawing, setDrawing] = useState<PencilElement | ArrowElement | DangerElement | null>(null);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const spacePressed = useRef(false);
  const rightPan = useRef<{
    clientX: number;
    clientY: number;
    stageX: number;
    stageY: number;
  } | null>(null);
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);
  const erasing = useRef(false);
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(
    null,
  );
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const [groupDrag, setGroupDrag] = useState<{ leaderId: string; dx: number; dy: number } | null>(
    null,
  );
  const multiSet = useMemo(() => new Set(multiSelectedIds), [multiSelectedIds]);
  const faelightMasks = useMemo(() => {
    const walls = wallMaskSnapshot(variant);
    const wardWalls = wardWallMaskSnapshot();
    return new Map(
      FAELIGHTS.map((faelight, index) => [
        faelight,
        makeFaelightMask(faelight, index, walls, wardWalls),
      ]),
    );
  }, [variant]);

  // Ruta A→B andando y su alternativa (retroceder en A y salir de la fuente).
  // Se recalcula solo cuando cambian los extremos, las estadísticas o el bando.
  const plan = useMemo(() => {
    const { origin, destination, stats } = movement;
    if (!origin || !destination) return null;
    return walkVersusRecall(
      origin,
      destination,
      { ...stats, terrain: variant },
      team,
      empoweredRecall,
      state.elements.filter((el) => el.type === "minion"),
      state.elements.filter((el) => el.type === "turret"),
    );
  }, [movement, team, empoweredRecall, state.elements, variant]);
  const route = plan?.walk ?? null;

  // Logical map coordinate space — all element coords live in [0..LOGICAL_SIZE].
  // The displayed size is derived from the container via `fit`, so resizing the
  // window (e.g. entering/exiting fullscreen) does NOT move any drawing/icon
  // relative to the map.
  const LOGICAL_SIZE = 1000;
  const baseSize = Math.min(width, height);
  const fit = baseSize / LOGICAL_SIZE;
  const effectiveScale = scale * fit;
  /** Pinta una máscara 0/1 en un canvas del tamaño del mapa. */
  const maskOverlay = (pixels: Uint8Array, [r, g, b, a]: number[]) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = LOGICAL_SIZE;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const image = context.createImageData(LOGICAL_SIZE, LOGICAL_SIZE);
    for (let i = 0; i < pixels.length; i++) {
      if (!pixels[i]) continue;
      const offset = i * 4;
      image.data[offset] = r;
      image.data[offset + 1] = g;
      image.data[offset + 2] = b;
      image.data[offset + 3] = a;
    }
    context.putImageData(image, 0, 0);
    return canvas;
  };
  const bushOverlay = useMemo(() => {
    if (!showBushes || typeof document === "undefined") return null;
    return maskOverlay(bushMaskSnapshot(variant), [52, 211, 153, 110]);
  }, [showBushes, variant]);
  const terrainOverlay = useMemo(() => {
    if (!showTerrain || typeof document === "undefined") return null;
    return maskOverlay(wallMaskSnapshot(variant), [239, 68, 68, 110]);
  }, [showTerrain, variant]);

  // Center the map whenever the container size changes so the map stays
  // visually anchored. Element coordinates are in logical space, so they move
  // with the map — nothing drifts off the map.
  useEffect(() => {
    setStagePos({
      x: (width - LOGICAL_SIZE * effectiveScale) / 2,
      y: (height - LOGICAL_SIZE * effectiveScale) / 2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  // Zoom helpers — center on a given screen point (defaults to canvas center).
  const zoomAt = (factor: number, screen?: { x: number; y: number }) => {
    const center = screen ?? { x: width / 2, y: height / 2 };
    const oldScale = scale;
    const newScale = Math.min(4, Math.max(0.4, oldScale * factor));
    if (newScale === oldScale) return;
    const oldEff = oldScale * fit;
    const newEff = newScale * fit;
    const mapPoint = {
      x: (center.x - stagePos.x) / oldEff,
      y: (center.y - stagePos.y) / oldEff,
    };
    setScale(newScale);
    setStagePos({
      x: center.x - mapPoint.x * newEff,
      y: center.y - mapPoint.y * newEff,
    });
  };
  const resetView = () => {
    setScale(1);
    setStagePos({
      x: (width - LOGICAL_SIZE * fit) / 2,
      y: (height - LOGICAL_SIZE * fit) / 2,
    });
  };

  // Expose zoom controls for the toolbar.
  useEffect(() => {
    const w = window as unknown as {
      __lolZoomIn?: () => void;
      __lolZoomOut?: () => void;
      __lolZoomReset?: () => void;
    };
    w.__lolZoomIn = () => zoomAt(1.2);
    w.__lolZoomOut = () => zoomAt(1 / 1.2);
    w.__lolZoomReset = resetView;
    return () => {
      w.__lolZoomIn = undefined;
      w.__lolZoomOut = undefined;
      w.__lolZoomReset = undefined;
    };
    // zoomAt/resetView close over scale & stagePos, so we re-bind whenever
    // those change. Without this dep list, the effect ran on EVERY render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, stagePos.x, stagePos.y, width, height, baseSize]);

  // Track Space key — hold to temporarily switch to "pan", release to restore previous tool.
  const previousTool = useRef<typeof tool | null>(null);
  useEffect(() => {
    const isTypingTarget = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
    };
    const down = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.code === "KeyF" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        useEditorStore.getState().toggleFogOfWar();
        return;
      }
      if (e.code !== "Space") return;
      e.preventDefault();
      if (spacePressed.current) return; // ignore key repeat
      spacePressed.current = true;
      const current = useEditorStore.getState().tool;
      if (current !== "pan") {
        previousTool.current = current;
        setTool("pan");
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (!spacePressed.current) return;
      spacePressed.current = false;
      const prev = previousTool.current;
      previousTool.current = null;
      if (prev && prev !== "pan") {
        setTool(prev);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [setTool]);

  // Expose stage to parent via ref on window for export. Lightweight bridge.
  useEffect(() => {
    (window as unknown as { __lolStage?: Konva.Stage | null }).__lolStage = stageRef.current;
    return () => {
      (window as unknown as { __lolStage?: Konva.Stage | null }).__lolStage = null;
    };
  }, []);

  // Convert pointer to map-local coordinates (within base square).
  const pointerInMap = (): { x: number; y: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const p = stage.getPointerPosition();
    if (!p) return null;
    const mapPoint = {
      x: (p.x - stagePos.x) / effectiveScale,
      y: (p.y - stagePos.y) / effectiveScale,
    };
    if (mapPoint.x < 0 || mapPoint.x > LOGICAL_SIZE || mapPoint.y < 0 || mapPoint.y > LOGICAL_SIZE)
      return null;
    return mapPoint;
  };

  // Find topmost element within a tolerance of the given map point.
  // The tolerance scales inversely with zoom so the hit-area stays roughly constant on screen.
  const eraseAt = (p: { x: number; y: number }) => {
    const tol = 14 / effectiveScale; // ~14px on screen
    const els = state.elements;
    // Iterate from top (last drawn) to bottom for natural priority.
    for (let i = els.length - 1; i >= 0; i--) {
      const el = els[i];
      if (hitTest(el, p, tol)) {
        removeElement(el.id);
        return true;
      }
    }
    if (
      (plan && [plan.walk.route, plan.recall.route].some((path) => hitRoute(path, p, tol))) ||
      (movement.origin &&
        !movement.destination &&
        Math.hypot(p.x - movement.origin.x, p.y - movement.origin.y) <= tol + 16)
    ) {
      resetMovement();
      return true;
    }
    return false;
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.evt instanceof MouseEvent && e.evt.button === 2) {
      e.evt.preventDefault();
      rightPan.current = {
        clientX: e.evt.clientX,
        clientY: e.evt.clientY,
        stageX: stagePos.x,
        stageY: stagePos.y,
      };
      return;
    }
    rightPan.current = null;
    const p = pointerInMap();
    if (!p) return;

    // Champion placement is allowed regardless of the active tool —
    // including eraser — so users don't have to switch tools just to
    // drop a champion on the map.
    if (selectedChampion) {
      const el: ChampionElement = {
        id: makeId("ch"),
        type: "champion",
        x: p.x,
        y: p.y,
        championId: selectedChampion.id,
        alias: selectedChampion.alias,
        name: selectedChampion.name,
        iconUrl: selectedChampion.iconUrl,
        team,
      };
      addElement(el);
      onPlaceChampion();
      return;
    }

    // Pan / space-drag: don't draw or select while moving the map.
    if (spacePressed.current || tool === "pan") return;

    // Empty click on background deselects
    const isStageClick = e.target === e.target.getStage() || e.target.name() === "map-bg";

    // Eraser: start drag-erase. Erase initial element under cursor and keep
    // erasing on move.
    if (tool === "eraser") {
      erasing.current = true;
      eraseAt(p);
      return;
    }

    if (tool === "select") {
      if (isStageClick) setSelected(null);
      return;
    }

    if (tool === "marquee") {
      if (isStageClick) {
        // Begin a marquee. If the click is empty, also clear any previous
        // group selection so the new rect replaces it.
        setMultiSelected([]);
        marqueeStart.current = { x: p.x, y: p.y };
        setMarquee({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
      }
      // If the user mouse-downed on a champion that is part of the current
      // group selection, Konva will start a drag on that token (it is
      // draggable in marquee mode when in multi-selection).
      return;
    }

    if (tool === "pencil") {
      const el: PencilElement = {
        id: makeId("pn"),
        type: "pencil",
        points: [p.x, p.y],
        color,
        thickness,
      };
      setDrawing(el);
      return;
    }

    if (tool === "arrow") {
      const el: ArrowElement = {
        id: makeId("ar"),
        type: "arrow",
        points: [p.x, p.y, p.x, p.y],
        color,
        thickness,
      };
      setDrawing(el);
      return;
    }

    if (tool === "danger") {
      const el: DangerElement = {
        id: makeId("dz"),
        type: "danger",
        x: p.x,
        y: p.y,
        radius: 4,
        color,
      };
      setDrawing(el);
      return;
    }

    if (tool === "text") {
      const text = window.prompt("Label text:");
      if (!text) return;
      const el: TextElement = {
        id: makeId("tx"),
        type: "text",
        x: p.x,
        y: p.y,
        text,
        color,
      };
      addElement(el);
      return;
    }

    if (tool === "ward") {
      const wardPosition = showFaelights
        ? snapWardToFaelight(p.x, p.y, transformed)
        : { x: p.x, y: p.y };
      const el: WardElement = {
        id: makeId("wd"),
        type: "ward",
        x: wardPosition.x,
        y: wardPosition.y,
        team,
        kind: wardKind,
      };
      addElement(el);
      return;
    }

    if (tool === "route") {
      setMovementPoint({ x: p.x, y: p.y });
      return;
    }

    if (tool === "minion") {
      const el: MinionWaveElement = {
        id: makeId("mn"),
        type: "minion",
        x: p.x,
        y: p.y,
        team,
      };
      addElement(el);
      return;
    }
  };

  const handleMouseMove = (e?: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (rightPan.current && e?.evt instanceof MouseEvent) {
      if ((e.evt.buttons & 2) === 0) {
        rightPan.current = null;
        return;
      }
      setStagePos({
        x: rightPan.current.stageX + e.evt.clientX - rightPan.current.clientX,
        y: rightPan.current.stageY + e.evt.clientY - rightPan.current.clientY,
      });
      return;
    }

    // Pinch-zoom (two-finger touch)
    const touchEvt = e?.evt as TouchEvent | undefined;
    if (touchEvt && "touches" in touchEvt && touchEvt.touches.length === 2) {
      touchEvt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.container().getBoundingClientRect();
      const t1 = touchEvt.touches[0];
      const t2 = touchEvt.touches[1];
      const p1 = { x: t1.clientX - rect.left, y: t1.clientY - rect.top };
      const p2 = { x: t2.clientX - rect.left, y: t2.clientY - rect.top };
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      if (lastPinchDist.current != null) {
        const factor = dist / lastPinchDist.current;
        zoomAt(factor, center);
      }
      lastPinchDist.current = dist;
      lastPinchCenter.current = center;
      if (drawing) setDrawing(null);
      return;
    }

    // Drag-erase: while eraser tool held down, keep removing elements under cursor.
    if (erasing.current) {
      const p = pointerInMap();
      if (p) eraseAt(p);
      return;
    }

    // Marquee drag (group-select)
    if (marqueeStart.current) {
      const p = pointerInMap();
      if (!p) return;
      const s = marqueeStart.current;
      setMarquee({ x1: s.x, y1: s.y, x2: p.x, y2: p.y });
      return;
    }

    if (!drawing) return;
    const p = pointerInMap();
    if (!p) return;

    if (drawing.type === "pencil") {
      setDrawing({ ...drawing, points: [...drawing.points, p.x, p.y] });
    } else if (drawing.type === "arrow") {
      const [x1, y1] = drawing.points;
      setDrawing({ ...drawing, points: [x1, y1, p.x, p.y] });
    } else if (drawing.type === "danger") {
      const dx = p.x - drawing.x;
      const dy = p.y - drawing.y;
      setDrawing({ ...drawing, radius: Math.max(4, Math.hypot(dx, dy)) });
    }
  };

  const handleMouseUp = () => {
    rightPan.current = null;
    lastPinchDist.current = null;
    lastPinchCenter.current = null;
    erasing.current = false;

    // Finalize marquee selection: ally champions inside the rect.
    if (marqueeStart.current && marquee) {
      const minX = Math.min(marquee.x1, marquee.x2);
      const maxX = Math.max(marquee.x1, marquee.x2);
      const minY = Math.min(marquee.y1, marquee.y2);
      const maxY = Math.max(marquee.y1, marquee.y2);
      const ids = state.elements
        .filter(
          (el) =>
            el.type === "champion" &&
            el.team === team &&
            el.x >= minX &&
            el.x <= maxX &&
            el.y >= minY &&
            el.y <= maxY,
        )
        .map((el) => el.id);
      setMultiSelected(ids);
      marqueeStart.current = null;
      setMarquee(null);
      return;
    }

    if (!drawing) return;
    addElement(drawing);
    setDrawing(null);
  };

  // Wheel zoom (centered on pointer).
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const factor = e.evt.deltaY > 0 ? 1 / 1.1 : 1.1;
    zoomAt(factor, pointer);
  };

  const elementClick = (id: string) => {
    if (tool === "eraser") {
      removeElement(id);
      return;
    }
    if (tool === "select") setSelected(id);
  };

  const draggable = tool === "select";
  // Inverse-scale factor for icons so they keep a roughly constant screen size.
  // Clamped so they don't grow huge when zoomed out, nor disappear when zoomed in.
  const iconScale = Math.min(1.4, Math.max(0.45, 1 / scale));

  // Sorted so champions render on top.
  const renderOrder = useMemo(() => {
    const order = (e: AnyElement): number => {
      switch (e.type) {
        case "danger":
          return 0;
        case "pencil":
        case "arrow":
          return 1;
        case "text":
          return 2;
        case "turret":
          return 2;
        case "minion":
          return 3;
        case "ward":
          return 3;
        case "champion":
          return 4;
        default:
          return 5;
      }
    };
    return [...state.elements].sort((a, b) => order(a) - order(b));
  }, [state.elements]);

  return (
    <Stage
      width={width}
      height={height}
      ref={stageRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      onContextMenu={(e) => e.evt.preventDefault()}
      onWheel={handleWheel}
      draggable={(spacePressed.current || tool === "pan") && !selectedChampion}
      onDragEnd={(e) => {
        if (e.target === stageRef.current) {
          setStagePos({ x: e.target.x(), y: e.target.y() });
        }
      }}
      x={stagePos.x}
      y={stagePos.y}
      scaleX={effectiveScale}
      scaleY={effectiveScale}
      offsetX={stagePos.x / effectiveScale}
      offsetY={stagePos.y / effectiveScale}
      // Reset position handling: we set x/y manually so override offsets.
      style={{
        cursor: selectedChampion
          ? "copy"
          : spacePressed.current || tool === "pan"
            ? "grab"
            : cursorForTool(tool, false),
      }}
    >
      <Layer x={stagePos.x / effectiveScale} y={stagePos.y / effectiveScale}>
        {/* background map */}
        {elementImg ? (
          <KImage
            name="map-bg"
            image={elementImg}
            width={LOGICAL_SIZE}
            height={LOGICAL_SIZE}
            x={0}
            y={0}
          />
        ) : (
          <Circle
            name="map-bg"
            x={LOGICAL_SIZE / 2}
            y={LOGICAL_SIZE / 2}
            radius={LOGICAL_SIZE / 2}
            fill="#1a2638"
          />
        )}

        {/* baron pit overlay */}
        {baronImg && variant.baron !== "hunting" && (
          <Group clipX={250} clipY={200} clipWidth={180} clipHeight={190}>
            <KImage
              name="map-bg-baron"
              image={baronImg}
              width={LOGICAL_SIZE}
              height={LOGICAL_SIZE}
              x={0}
              y={0}
              listening={false}
            />
          </Group>
        )}

        {bushOverlay && (
          <KImage
            image={bushOverlay}
            width={LOGICAL_SIZE}
            height={LOGICAL_SIZE}
            listening={false}
            perfectDrawEnabled={false}
          />
        )}
        {terrainOverlay && (
          <KImage
            image={terrainOverlay}
            width={LOGICAL_SIZE}
            height={LOGICAL_SIZE}
            listening={false}
            perfectDrawEnabled={false}
          />
        )}

        {activeFaelights.map((faelight, i) => {
          const hidden = !!faelight.postTransform;
          const edge = hidden ? "#C084FC" : "#67E8F9";
          const glow = hidden ? "#C084FC" : "#22D3EE";
          return (
            <Group
              key={`faelight-${i}`}
              x={faelight.x}
              y={faelight.y}
              onMouseEnter={() => setHoveredFaelight(faelight)}
              onMouseLeave={() => setHoveredFaelight(null)}
            >
              {hoveredFaelight === faelight && (
                <Circle
                  radius={FAELIGHT_TRIGGER_RADIUS}
                  fill={glow + "1A"}
                  stroke={edge}
                  strokeWidth={1.4 / iconScale}
                  dash={[4 / iconScale, 3 / iconScale]}
                />
              )}
              <Circle
                radius={FAELIGHT_INNER_RADIUS}
                fill={hidden ? "#6B21A833" : "#0E749033"}
                stroke={edge}
                strokeWidth={1.2 / iconScale}
              />
              {Array.from({ length: 8 }, (_, mushroom) => {
                const angle = (mushroom * Math.PI) / 4;
                return (
                  <Circle
                    key={mushroom}
                    x={Math.cos(angle) * FAELIGHT_INNER_RADIUS}
                    y={Math.sin(angle) * FAELIGHT_INNER_RADIUS}
                    radius={1.35 / iconScale}
                    fill={hidden ? "#F3E8FF" : "#CFFAFE"}
                    shadowColor={glow}
                    shadowBlur={5}
                  />
                );
              })}
            </Group>
          );
        })}

        {renderOrder.map((el) => {
          const selected = selectedId === el.id;
          if (el.type === "pencil") {
            return (
              <Line
                key={el.id}
                points={el.points}
                stroke={el.color}
                strokeWidth={thicknessToPx(el.thickness)}
                tension={0.4}
                lineCap="round"
                lineJoin="round"
                onClick={() => elementClick(el.id)}
                onTap={() => elementClick(el.id)}
                shadowBlur={selected ? 8 : 0}
                shadowColor="#C89B3C"
              />
            );
          }
          if (el.type === "arrow") {
            return (
              <Arrow
                key={el.id}
                points={el.points}
                stroke={el.color}
                fill={el.color}
                strokeWidth={thicknessToPx(el.thickness)}
                pointerLength={10}
                pointerWidth={10}
                lineCap="round"
                onClick={() => elementClick(el.id)}
                onTap={() => elementClick(el.id)}
                shadowBlur={selected ? 8 : 0}
                shadowColor="#C89B3C"
              />
            );
          }
          if (el.type === "text") {
            return (
              <KText
                key={el.id}
                x={el.x}
                y={el.y}
                text={el.text}
                fill={el.color}
                fontSize={16}
                fontStyle="bold"
                draggable={draggable}
                onDragEnd={(e) => updateElement(el.id, { x: e.target.x(), y: e.target.y() })}
                onClick={() => elementClick(el.id)}
                onTap={() => elementClick(el.id)}
                onDblClick={() => {
                  const next = window.prompt("Edit label:", el.text);
                  if (next !== null) updateElement(el.id, { text: next });
                }}
                shadowBlur={selected ? 6 : 0}
                shadowColor="#C89B3C"
              />
            );
          }
          if (el.type === "danger") {
            return (
              <Circle
                key={el.id}
                x={el.x}
                y={el.y}
                radius={el.radius}
                fill={el.color}
                opacity={0.25}
                stroke={el.color}
                strokeWidth={1.5}
                draggable={draggable}
                onDragEnd={(e) => updateElement(el.id, { x: e.target.x(), y: e.target.y() })}
                onClick={() => elementClick(el.id)}
                onTap={() => elementClick(el.id)}
              />
            );
          }
          if (el.type === "monster") {
            return (
              <ObjectiveIcon
                key={el.id}
                el={el}
                iconScale={iconScale}
                selected={selected}
                draggable={draggable}
                onSelect={() => elementClick(el.id)}
                onMove={(x, y) => updateElement(el.id, { x, y })}
              />
            );
          }
          if (el.type === "ward") {
            const faelight = getFaelight(el.x, el.y);
            return (
              <WardIcon
                key={el.id}
                el={el}
                faelight={faelight}
                faelightMask={faelight ? (faelightMasks.get(faelight) ?? null) : null}
                selected={selected}
                draggable={draggable}
                iconScale={iconScale}
                onDragEnd={(x, y) => {
                  updateElement(
                    el.id,
                    showFaelights ? snapWardToFaelight(x, y, transformed) : { x, y },
                  );
                }}
                onClick={() => elementClick(el.id)}
              />
            );
          }
          if (el.type === "minion") {
            return (
              <MinionWaveIcon
                key={el.id}
                el={el}
                selected={selected}
                draggable={draggable}
                baseSize={LOGICAL_SIZE}
                iconScale={iconScale}
                onDragEnd={(x, y) => updateElement(el.id, { x, y })}
                onClick={() => elementClick(el.id)}
              />
            );
          }
          if (el.type === "turret") {
            return (
              <TurretIcon
                key={el.id}
                el={el}
                image={towerImg}
                selected={selected}
                draggable={draggable}
                showVision={fogOfWar}
                baseSize={LOGICAL_SIZE}
                iconScale={iconScale}
                effectiveScale={effectiveScale}
                onDragEnd={(x, y) => updateElement(el.id, { x, y })}
                onClick={() => elementClick(el.id)}
              />
            );
          }
          if (el.type === "champion") {
            const inGroup = multiSet.has(el.id);
            const isLeader = groupDrag?.leaderId === el.id;
            const displayX = inGroup && groupDrag && !isLeader ? el.x + groupDrag.dx : undefined;
            const displayY = inGroup && groupDrag && !isLeader ? el.y + groupDrag.dy : undefined;
            const champDraggable = draggable || (inGroup && tool === "marquee");
            return (
              <ChampionToken
                key={el.id}
                el={el}
                selected={selected}
                groupSelected={inGroup}
                draggable={champDraggable}
                showVision={fogOfWar}
                iconScale={iconScale}
                displayX={displayX}
                displayY={displayY}
                onDragStart={
                  inGroup && tool === "marquee"
                    ? () => setGroupDrag({ leaderId: el.id, dx: 0, dy: 0 })
                    : undefined
                }
                onDragMove={
                  inGroup && tool === "marquee"
                    ? (x, y) => setGroupDrag({ leaderId: el.id, dx: x - el.x, dy: y - el.y })
                    : undefined
                }
                onDragEnd={(x, y) => {
                  if (inGroup && tool === "marquee") {
                    moveElementsBy(multiSelectedIds, x - el.x, y - el.y);
                    setGroupDrag(null);
                  } else {
                    updateElement(el.id, { x, y });
                  }
                }}
                onClick={() => {
                  if (tool === "eraser") {
                    removeElement(el.id);
                    return;
                  }
                  if (tool === "marquee") return;
                  setTool("select");
                  setSelected(el.id);
                }}
                onDblClick={() => removeElement(el.id)}
              />
            );
          }
          return null;
        })}

        {/* live marquee rectangle */}
        {marquee && (
          <Rect
            x={Math.min(marquee.x1, marquee.x2)}
            y={Math.min(marquee.y1, marquee.y2)}
            width={Math.abs(marquee.x2 - marquee.x1)}
            height={Math.abs(marquee.y2 - marquee.y1)}
            fill="#22D3EE"
            opacity={0.12}
            stroke="#22D3EE"
            strokeWidth={1 / effectiveScale}
            dash={[6 / effectiveScale, 4 / effectiveScale]}
            listening={false}
          />
        )}

        {/* live drawing preview */}
        {drawing?.type === "pencil" && (
          <Line
            points={drawing.points}
            stroke={drawing.color}
            strokeWidth={thicknessToPx(drawing.thickness)}
            tension={0.4}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {drawing?.type === "arrow" && (
          <Arrow
            points={drawing.points}
            stroke={drawing.color}
            fill={drawing.color}
            strokeWidth={thicknessToPx(drawing.thickness)}
            pointerLength={10}
            pointerWidth={10}
          />
        )}
        {drawing?.type === "danger" && (
          <Circle
            x={drawing.x}
            y={drawing.y}
            radius={drawing.radius}
            fill={drawing.color}
            opacity={0.25}
            stroke={drawing.color}
            strokeWidth={1.5}
          />
        )}
      </Layer>
      {fogOfWar && (
        <Layer x={stagePos.x / effectiveScale} y={stagePos.y / effectiveScale} listening={false}>
          <Group>
            <Rect
              x={0}
              y={0}
              width={LOGICAL_SIZE}
              height={LOGICAL_SIZE}
              fill="#000000"
              opacity={0.72}
            />
            {/* Cada fuente de visión abre su polígono real: los muros y los
                arbustos dejan sombra en vez del círculo perfecto de antes. */}
            {state.elements.map((el) => {
              if (!("team" in el) || el.team !== team) return null;
              const faelight = el.type === "ward" ? getFaelight(el.x, el.y) : null;
              if (faelight && el.type === "ward") {
                return (
                  <Group key={`fog-${el.id}`}>
                    <KImage
                      image={faelightMasks.get(faelight) ?? undefined}
                      width={1000}
                      height={1000}
                      globalCompositeOperation="destination-out"
                      perfectDrawEnabled={false}
                    />
                    <Line
                      points={visionPolygon(
                        el.x,
                        el.y,
                        wardVisionRange(el.kind) * FAELIGHT_WARD_VISION_MULTIPLIER,
                        true,
                        variant,
                      )}
                      closed
                      fill="#000"
                      globalCompositeOperation="destination-out"
                      perfectDrawEnabled={false}
                    />
                  </Group>
                );
              }
              const radius =
                el.type === "champion"
                  ? SIGHT.champion
                  : el.type === "ward"
                    ? wardVisionRange(el.kind)
                    : el.type === "minion"
                      ? SIGHT.minion
                      : el.type === "turret"
                        ? SIGHT.turret
                        : 0;
              if (!radius) return null;
              return (
                <Line
                  key={`fog-${el.id}`}
                  points={visionPolygon(el.x, el.y, radius, el.type === "ward", variant)}
                  closed
                  fill="#000"
                  globalCompositeOperation="destination-out"
                  perfectDrawEnabled={false}
                />
              );
            })}
          </Group>
        </Layer>
      )}
      {/* El origen se confirma de inmediato, sin obligar a marcar B primero. */}
      {movement.origin && !movement.destination && (
        <Layer x={stagePos.x / effectiveScale} y={stagePos.y / effectiveScale} listening={false}>
          <Group x={movement.origin.x} y={movement.origin.y} scaleX={iconScale} scaleY={iconScale}>
            <Circle radius={16} stroke="#4ADE80" strokeWidth={2} opacity={0.7} />
            <Circle radius={11} fill="#4ADE80" stroke="#fff" strokeWidth={2} />
            <KText
              x={-11}
              y={-7}
              width={22}
              align="center"
              text="A"
              fontSize={13}
              fontStyle="bold"
              fill="#101016"
            />
            <KText
              x={20}
              y={-7}
              width={70}
              text="Origin"
              fontSize={12}
              fontStyle="bold"
              fill="#fff"
              shadowColor="#000"
              shadowBlur={4}
            />
          </Group>
        </Layer>
      )}
      {/* Ruta A→B — encima de la niebla: es una medición, no parte del dibujo */}
      {plan && route && movement.origin && movement.destination && (
        <Layer x={stagePos.x / effectiveScale} y={stagePos.y / effectiveScale} listening={false}>
          {/* Alternativa: salir de la fuente tras retroceder. Se marca en violeta
              y se resalta solo cuando es la opción rápida. */}
          <Line
            points={plan.recall.route.flatMap((p) => [p.x, p.y])}
            stroke="rgba(5, 12, 17, .6)"
            strokeWidth={6 * iconScale}
            lineCap="round"
            lineJoin="round"
          />
          <Line
            points={plan.recall.route.flatMap((p) => [p.x, p.y])}
            stroke="#A78BFA"
            opacity={plan.faster === "recall" ? 0.95 : 0.4}
            strokeWidth={2.5 * iconScale}
            dash={[3 * iconScale, 6 * iconScale]}
            lineCap="round"
            lineJoin="round"
          />
          <Line
            points={route.route.flatMap((p) => [p.x, p.y])}
            stroke="rgba(5, 12, 17, .82)"
            strokeWidth={7 * iconScale}
            lineCap="round"
            lineJoin="round"
          />
          <Line
            points={route.route.flatMap((p) => [p.x, p.y])}
            stroke="#51D6E7"
            opacity={plan.faster === "walk" ? 1 : 0.5}
            strokeWidth={3 * iconScale}
            dash={[8 * iconScale, 5 * iconScale]}
            lineCap="round"
            lineJoin="round"
          />
          {plan.recall.homeguardEndpointPoint &&
            plan.recall.homeguardEndpointUnits < plan.recall.distanceGameUnits - 1 && (
              <Group
                x={plan.recall.homeguardEndpointPoint.x}
                y={plan.recall.homeguardEndpointPoint.y}
                scaleX={iconScale}
                scaleY={iconScale}
              >
                <Circle radius={8} fill="#0B1723" stroke="#F5C84B" strokeWidth={2} />
                <KText
                  x={-10}
                  y={-5}
                  width={20}
                  align="center"
                  text="HG"
                  fontSize={8}
                  fontStyle="bold"
                  fill="#F5C84B"
                />
              </Group>
            )}
          {(
            [
              [movement.origin, "A", "#4ADE80"],
              [movement.destination, "B", "#F5C84B"],
              [FOUNTAIN[team], "F", "#C89B3C"],
            ] as const
          ).map(([p, label, fill]) => (
            <Group key={label} x={p.x} y={p.y} scaleX={iconScale} scaleY={iconScale}>
              <Circle radius={10} fill={fill} stroke="#fff" strokeWidth={2} />
              <KText
                x={-10}
                y={-6}
                width={20}
                align="center"
                text={label}
                fontSize={11}
                fontStyle="bold"
                fill="#101016"
              />
            </Group>
          ))}
          <Group
            x={movement.destination.x}
            y={movement.destination.y}
            scaleX={iconScale}
            scaleY={iconScale}
          >
            <Rect
              x={14}
              y={-22}
              width={128}
              height={44}
              fill="rgba(5,12,17,.85)"
              cornerRadius={4}
            />
            <KText
              x={14}
              y={-16}
              width={128}
              align="center"
              text={`${route.seconds.toFixed(1)} s walking`}
              fontSize={12}
              fontStyle="bold"
              fill={plan.faster === "walk" ? "#51D6E7" : "#7C8BA1"}
            />
            <KText
              x={14}
              y={2}
              width={128}
              align="center"
              text={`${plan.recall.seconds.toFixed(1)} s with recall`}
              fontSize={12}
              fontStyle="bold"
              fill={plan.faster === "recall" ? "#A78BFA" : "#8B7BC6"}
            />
          </Group>
        </Layer>
      )}
    </Stage>
  );
}

function cursorForTool(tool: string, hasChampion: boolean): string {
  if (hasChampion) return "copy";
  switch (tool) {
    case "select":
      return "default";
    case "pencil":
    case "arrow":
    case "danger":
      return "crosshair";
    case "text":
      return "text";
    case "ward":
    case "minion":
      return "copy";
    case "eraser":
      return "crosshair";
    case "marquee":
      return "crosshair";
    case "route":
      return "crosshair";
    default:
      return "default";
  }
}

// Distance from a point to a segment (used for pencil/arrow hit-testing).
function distPointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function hitRoute(
  route: { x: number; y: number }[],
  p: { x: number; y: number },
  tol: number,
): boolean {
  return route.some(
    (to, i) =>
      i > 0 && distPointToSegment(p.x, p.y, route[i - 1].x, route[i - 1].y, to.x, to.y) <= tol,
  );
}

// Returns true if the given point is within `tol` map-units of the element.
// Tolerance is added to native widths/radii so even thin strokes/small icons
// are easy to hit with the eraser.
function hitTest(el: AnyElement, p: { x: number; y: number }, tol: number): boolean {
  switch (el.type) {
    case "pencil": {
      const w = thicknessToPx(el.thickness) / 2 + tol;
      const pts = el.points;
      if (pts.length < 2) return false;
      if (pts.length === 2) {
        return Math.hypot(p.x - pts[0], p.y - pts[1]) <= w;
      }
      for (let i = 0; i < pts.length - 2; i += 2) {
        if (distPointToSegment(p.x, p.y, pts[i], pts[i + 1], pts[i + 2], pts[i + 3]) <= w) {
          return true;
        }
      }
      return false;
    }
    case "arrow": {
      const w = thicknessToPx(el.thickness) / 2 + tol;
      const [x1, y1, x2, y2] = el.points;
      return distPointToSegment(p.x, p.y, x1, y1, x2, y2) <= w;
    }
    case "text": {
      // Text isn't measured here — use a generous box around the anchor.
      return Math.abs(p.x - el.x) <= 60 + tol && Math.abs(p.y - el.y) <= 14 + tol;
    }
    case "danger": {
      return Math.hypot(p.x - el.x, p.y - el.y) <= el.radius + tol;
    }
    case "monster":
    case "ward":
    case "minion":
    case "turret":
    case "champion": {
      const r = el.type === "champion" ? 24 : el.type === "turret" ? 14 : 12;
      return Math.hypot(p.x - el.x, p.y - el.y) <= r + tol;
    }
    default:
      return false;
  }
}
