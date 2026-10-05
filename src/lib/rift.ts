// ============================================================
// GEOMETRÍA Y FÍSICA DE SUMMONER'S RIFT
// Portado del editor anterior (canvas plano) a este editor.
// Todo vive en el espacio lógico 1000x1000; las distancias de juego se
// convierten con toGameUnits/toLogical. Funciones puras salvo la caché de
// visión — las verifica rift.selfcheck.ts.
// ============================================================
// Extensión explícita para que rift.selfcheck.ts pueda correr con node.
import { BUSH_RUNS, LOGICAL_SIZE, WALL_RUNS } from "./rift-data.ts";
import { FAELIGHT_VISION_RUNS } from "./faelight-vision-data.ts";
import { WARD_WALL_RUNS } from "./ward-wall-data.ts";

import { DEFAULT_MAP, type MapVariant } from "./map-variants.ts";
import { TERRAIN_PATCHES, CUSTOM_PATCHES } from "./terrain-data.ts";

export { LOGICAL_SIZE };

/** Ancho de la Grieta en unidades de juego. */
export const RIFT_UNITS = 14870;

export const toLogical = (gameUnits: number) => (gameUnits * LOGICAL_SIZE) / RIFT_UNITS;
export const toGameUnits = (logical: number) => (logical * RIFT_UNITS) / LOGICAL_SIZE;

/** Radios de visión reales (wiki oficial), en unidades de juego. */
export const SIGHT = {
  champion: 1350,
  turret: 1350,
  minion: 1200,
  ward: 900,
  controlWard: 900,
} as const;

export type Point = { x: number; y: number };
export type Faelight = Point & { region: number[]; postTransform?: true };

export const FAELIGHT_VISION_SCORE_MULTIPLIER = 1.25;
export const FAELIGHT_WARD_VISION_MULTIPLIER = 1.25;
export const FAELIGHT_INNER_RADIUS = toLogical(75);
export const FAELIGHT_TRIGGER_RADIUS = toLogical(225);
export const FAELIGHTS: Faelight[] = [
  {
    x: 189.7,
    y: 656.1,
    region: [
      144.1, 630.5, 147, 583.6, 288.2, 583.6, 314.1, 601.2, 319.9, 607, 319.9, 624.6, 161.4, 697.9,
      144.1, 697.9,
    ],
  },
  {
    x: 343.7,
    y: 805.8,
    region: [
      320.1, 769.9, 325.8, 747.9, 331.4, 739.4, 337.1, 730.9, 388.1, 679, 405.1, 679, 410.8, 681.8,
      427.8, 690.3, 521.2, 769.9, 521.2, 789.8, 518.4, 821, 405.1, 864, 373.9, 864, 320.1, 786.9,
    ],
  },
  {
    x: 681.6,
    y: 593.5,
    region: [
      565, 594.3, 584.7, 571.4, 618.6, 537.1, 635.6, 537.1, 658.2, 545.7, 669.5, 557.1, 678, 565.7,
      686.4, 585.7, 686.4, 602.9, 683.6, 608.6, 655.4, 648.6, 652.5, 651.4, 635.6, 651.4, 624.3,
      648.6, 601.7, 642.9, 593.2, 640, 587.6, 637.1, 584.7, 634.3, 573.4, 622.9, 565, 614.3,
    ],
  },
  {
    x: 334.1,
    y: 422,
    region: [
      315.3, 400, 318.2, 394.3, 329.5, 377.1, 346.6, 351.4, 352.3, 342.9, 380.7, 342.9, 392, 345.7,
      397.7, 348.6, 420.5, 368.6, 423.3, 371.4, 426.1, 374.3, 437.5, 388.6, 437.5, 405.7, 434.7,
      408.6, 431.8, 411.4, 411.9, 428.6, 394.9, 442.9, 380.7, 454.3, 363.6, 454.3, 332.4, 440,
      315.3, 417.1,
    ],
  },
  {
    x: 229.7,
    y: 239.2,
    region: [
      158.2, 229.5, 161, 226.6, 183.6, 206.8, 214.7, 206.8, 240.1, 212.5, 245.8, 218.1, 254.2,
      226.6, 262.7, 238, 293.8, 289, 293.8, 305.9, 291, 322.9, 282.5, 334.3, 271.2, 348.4, 268.4,
      351.3, 262.7, 356.9, 242.9, 356.9, 214.7, 325.8, 158.2, 252.1,
    ],
  },
  {
    x: 777,
    y: 737.8,
    region: [
      705.1, 682.7, 707.9, 677.1, 730.3, 648.7, 741.6, 637.4, 758.4, 637.4, 769.7, 648.7, 778.1,
      657.2, 786.5, 668.6, 794.9, 685.6, 797.8, 694.1, 797.8, 753.5, 794.9, 756.4, 786.5, 759.2,
      769.7, 759.2, 761.2, 756.4, 747.2, 750.7, 741.6, 747.9, 738.8, 745, 705.1, 702.5,
    ],
  },
  {
    x: 657.3,
    y: 193.9,
    region: [
      478.9, 149.7, 484.5, 144.1, 495.8, 135.6, 585.9, 121.5, 616.9, 121.5, 670.4, 183.6, 673.2,
      203.4, 673.2, 220.3, 670.4, 226, 656.3, 251.4, 625.4, 271.2, 580.3, 271.2, 484.5, 214.7,
      478.9, 169.5,
    ],
  },
  {
    x: 810.7,
    y: 341.3,
    region: [
      666.7, 377.8, 669.5, 372.2, 672.3, 369.3, 796.6, 323.9, 813.6, 323.9, 816.4, 326.7, 836.2,
      355.1, 836.2, 397.7, 666.7, 397.7,
    ],
  },
  {
    x: 359.8,
    y: 131.2,
    postTransform: true,
    region: [
      277.6, 148.6, 283.3, 137.1, 294.6, 125.7, 300.3, 120, 337.1, 100, 359.8, 97.1, 376.8, 97.1,
      475.9, 100, 498.6, 114.3, 501.4, 117.1, 501.4, 188.6, 478.8, 188.6, 277.6, 174.3,
    ],
  },
  {
    x: 162.8,
    y: 350.8,
    postTransform: true,
    region: [
      109.8, 383.3, 121.4, 302.6, 124.3, 291.1, 130.1, 282.4, 179.2, 282.4, 228.3, 340.1, 228.3,
      357.3, 222.5, 363.1, 156.1, 403.5, 109.8, 403.5,
    ],
  },
  {
    x: 623.4,
    y: 855.6,
    postTransform: true,
    region: [
      479.9, 778.1, 500, 778.1, 706.9, 821.3, 727, 855.9, 727, 876.1, 574.7, 884.7, 511.5, 884.7,
      505.7, 879, 485.6, 858.8, 479.9, 853,
    ],
  },
  {
    x: 869.6,
    y: 603.4,
    postTransform: true,
    region: [
      785.1, 492.8, 788, 487, 871.1, 487, 876.8, 492.8, 885.4, 585.5, 885.4, 602.9, 865.3, 649.3,
      822.3, 649.3, 785.1, 571,
    ],
  },
];

export const DEFAULT_TURRETS: (Point & { team: "blue" | "red" })[] = [
  { x: 72.15, y: 302.39, team: "blue" },
  { x: 85.04, y: 712.27, team: "blue" },
  { x: 108.4, y: 550.39, team: "blue" },
  { x: 250.87, y: 750.23, team: "blue" },
  { x: 342.74, y: 677.2, team: "blue" },
  { x: 395.77, y: 571.69, team: "blue" },
  { x: 706, y: 929.54, team: "blue" },
  { x: 467.44, y: 898.05, team: "blue" },
  { x: 291.9, y: 912.68, team: "blue" },
  { x: 123.13, y: 846.27, team: "blue" },
  { x: 152.1, y: 877.02, team: "blue" },
  { x: 293.61, y: 74.3, team: "red" },
  { x: 535.2, y: 105.17, team: "red" },
  { x: 703.87, y: 89.5, team: "red" },
  { x: 602.82, y: 429.96, team: "red" },
  { x: 657.02, y: 323.5, team: "red" },
  { x: 746.81, y: 251.13, team: "red" },
  { x: 928.98, y: 696.05, team: "red" },
  { x: 893.65, y: 449.13, team: "red" },
  { x: 912.7, y: 293.6, team: "red" },
  { x: 845.29, y: 126.3, team: "red" },
  { x: 875.07, y: 157.23, team: "red" },
];

const TURRET_ROUTE_RADIUS = 16;

export const dist = (ax: number, ay: number, bx: number, by: number) =>
  Math.hypot(bx - ax, by - ay);

export function faelightAt(x: number, y: number, transformed = false): Faelight | null {
  return (
    FAELIGHTS.find(
      (faelight) =>
        (!faelight.postTransform || transformed) &&
        dist(x, y, faelight.x, faelight.y) <= FAELIGHT_TRIGGER_RADIUS,
    ) ?? null
  );
}

/** A placement in the outer ring blinks to the same angle on the 75u ring. */
export function snapWardToFaelight(x: number, y: number, transformed = false): Point {
  const faelight = faelightAt(x, y, transformed);
  if (!faelight) return { x, y };
  const distance = dist(x, y, faelight.x, faelight.y);
  if (distance <= FAELIGHT_INNER_RADIUS) return { x, y };
  const scale = FAELIGHT_INNER_RADIUS / distance;
  return {
    x: faelight.x + (x - faelight.x) * scale,
    y: faelight.y + (y - faelight.y) * scale,
  };
}

// ---------- Muros ----------
// La máscara llega en RLE (longitudes alternas empezando por transitable) y se
// expande una sola vez al primer uso: 1 MB de Uint8Array frente a los 50 kB del
// módulo, así que no vale la pena tenerla siempre en memoria si nadie la mira.

const wallMasks = new Map<string, Uint8Array>();
const terrainKey = (variant: MapVariant) => `${variant.element}:${variant.baron}`;

export function terrainChanges(variant: MapVariant): Uint8Array {
  const changes = new Uint8Array(LOGICAL_SIZE ** 2);
  for (const key of [variant.element === "mountain" ? "mountain" : "", variant.baron]) {
    const spans = TERRAIN_PATCHES[key] ?? [];
    for (let i = 0; i < spans.length; i += 3)
      changes.fill(spans[i + 2], spans[i], spans[i] + spans[i + 1]);
  }
  return changes;
}

function paintCircle(target: Uint8Array, x: number, y: number, radius: number, value: number) {
  const minX = Math.max(0, Math.floor(x - radius));
  const maxX = Math.min(LOGICAL_SIZE - 1, Math.ceil(x + radius));
  const minY = Math.max(0, Math.floor(y - radius));
  const maxY = Math.min(LOGICAL_SIZE - 1, Math.ceil(y + radius));
  const r2 = radius * radius;
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      if ((px - x) ** 2 + (py - y) ** 2 <= r2) target[py * LOGICAL_SIZE + px] = value;
    }
  }
}

function mask(variant: MapVariant = DEFAULT_MAP): Uint8Array {
  const key = terrainKey(variant);
  const cached = wallMasks.get(key);
  if (cached) return cached;
  const m = new Uint8Array(LOGICAL_SIZE * LOGICAL_SIZE);
  let i = 0;
  let value = 0;
  for (const run of WALL_RUNS) {
    if (value) m.fill(1, i, i + run);
    i += run;
    value ^= 1;
  }
  const changes = terrainChanges(variant);
  for (let p = 0; p < m.length; p++) {
    if (changes[p]) m[p] = changes[p] === 1 ? 1 : 0;
  }

  const customKeys = [
    `${variant.element}:hunting:wall`,
    `base:${variant.baron}:wall`,
    `${variant.element}:${variant.baron}:wall`,
  ];
  for (const customKey of customKeys) {
    const customSpans = CUSTOM_PATCHES[customKey] ?? [];
    for (let i = 0; i < customSpans.length; i += 3) {
      const offset = customSpans[i];
      const len = customSpans[i + 1];
      const val = customSpans[i + 2];
      m.fill(val === 1 ? 1 : 0, offset, offset + len);
    }
  }

  wallMasks.set(key, m);
  return m;
}

export function wallMaskSnapshot(variant: MapVariant = DEFAULT_MAP): Uint8Array {
  return mask(variant).slice();
}

/** Fuera del mapa cuenta como muro: nada se mueve ni ve más allá del borde. */
export function isWall(x: number, y: number, variant: MapVariant = DEFAULT_MAP): boolean {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= LOGICAL_SIZE || iy >= LOGICAL_SIZE) return true;
  return mask(variant)[iy * LOGICAL_SIZE + ix] === 1;
}

// ---------- Paredes solo-ward ----------
// Horneadas en ward-wall-data.ts: cortan la visión de las wards y su región
// Faelight, pero no la de campeones/torretas/súbditos ni el movimiento.
// Como los muros, se expanden del RLE al primer uso.
let wardWallMask: Uint8Array | null = null;

function wardWalls(): Uint8Array {
  if (wardWallMask) return wardWallMask;
  const m = new Uint8Array(LOGICAL_SIZE * LOGICAL_SIZE);
  let i = 0;
  let value = 0;
  for (const run of WARD_WALL_RUNS) {
    if (value) m.fill(1, i, i + run);
    i += run;
    value ^= 1;
  }
  wardWallMask = m;
  return m;
}

export function wardWallMaskSnapshot(): Uint8Array {
  return wardWalls().slice();
}

/** Muro tal y como lo ve una ward: los de siempre más los morados. */
export function isWardWall(x: number, y: number, variant: MapVariant = DEFAULT_MAP): boolean {
  if (isWall(x, y, variant)) return true;
  return wardWalls()[Math.round(y) * LOGICAL_SIZE + Math.round(x)] === 1;
}

/**
 * Recorta una máscara a lo que de verdad se alcanza desde (x,y) sin saltar
 * huecos: tras abrir una pared solo-ward, lo que queda al otro lado se apaga.
 */
export function reachableFrom(visible: Uint8Array, x: number, y: number): Uint8Array {
  const out = new Uint8Array(visible.length);
  const start = Math.round(y) * LOGICAL_SIZE + Math.round(x);
  if (!visible[start]) return out;
  const stack = [start];
  out[start] = 1;
  while (stack.length) {
    const i = stack.pop()!;
    const column = i % LOGICAL_SIZE;
    for (const next of [
      column > 0 ? i - 1 : -1,
      column < LOGICAL_SIZE - 1 ? i + 1 : -1,
      i - LOGICAL_SIZE,
      i + LOGICAL_SIZE,
    ]) {
      if (next < 0 || next >= visible.length || out[next] || !visible[next]) continue;
      out[next] = 1;
      stack.push(next);
    }
  }
  return out;
}

let turretMaskKey = "";
let turretMask = new Uint8Array(LOGICAL_SIZE * LOGICAL_SIZE);

const routeBlocked = (turrets: Point[], variant: MapVariant = DEFAULT_MAP) => {
  const walls = mask(variant);
  const key = turrets.map(({ x, y }) => `${x},${y}`).join(";");
  if (key !== turretMaskKey) {
    turretMask = new Uint8Array(LOGICAL_SIZE * LOGICAL_SIZE);
    for (const turret of turrets)
      paintCircle(turretMask, turret.x, turret.y, TURRET_ROUTE_RADIUS, 1);
    turretMaskKey = key;
  }
  return (x: number, y: number) => {
    const ix = Math.round(x);
    const iy = Math.round(y);
    return (
      ix < 0 ||
      iy < 0 ||
      ix >= LOGICAL_SIZE ||
      iy >= LOGICAL_SIZE ||
      walls[iy * LOGICAL_SIZE + ix] === 1 ||
      turretMask[iy * LOGICAL_SIZE + ix] === 1
    );
  };
};

function segmentIsWalkable(
  a: Point,
  b: Point,
  blocked: (x: number, y: number) => boolean,
): boolean {
  const length = dist(a.x, a.y, b.x, b.y);
  for (let d = 0; d <= length; d += 1.5) {
    const t = length ? d / length : 0;
    if (blocked(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false;
  }
  return !blocked(b.x, b.y);
}

/** ¿Hay línea recta transitable entre dos puntos? */
export function lineIsWalkable(
  a: Point,
  b: Point,
  turrets: Point[] = [],
  variant: MapVariant = DEFAULT_MAP,
): boolean {
  return segmentIsWalkable(a, b, routeBlocked(turrets, variant));
}

// ---------- Arbustos ----------
// Máscara RLE horneada. Cada arbusto es una mancha conexa y lleva su propio
// número, porque desde dentro de un arbusto se ve todo él pero no el de al lado.
const bushMasks = new Map<string, Uint16Array>();

function bushes(variant: MapVariant = DEFAULT_MAP): Uint16Array {
  const key = `${variant.element === "ocean" ? "ocean" : "base"}:${terrainKey(variant)}`;
  const cached = bushMasks.get(key);
  if (cached) return cached;
  const painted = new Uint8Array(LOGICAL_SIZE * LOGICAL_SIZE);
  let i = 0;
  let value = 0;
  for (const run of BUSH_RUNS) {
    if (value) painted.fill(1, i, i + run);
    i += run;
    value ^= 1;
  }

  if (variant.element === "ocean") {
    // ponytail: 7 logical pixels of jungle brush growth; replace with Riot grass polygons when available.
    const original = painted.slice();
    for (let y = 180; y < 820; y++)
      for (let x = 170; x < 830; x++) {
        if (original[y * LOGICAL_SIZE + x]) paintCircle(painted, x, y, 7, 1);
      }
    paintCircle(painted, 614, 670, 13, 1);
    paintCircle(painted, 719, 708, 13, 1);
  }
  if (variant.element !== "base" || variant.baron !== "hunting") {
    const walls = mask(variant);
    const changes = terrainChanges(variant);
    for (let p = 0; p < painted.length; p++)
      if (changes[p] === 1 || (variant.element === "ocean" && walls[p])) painted[p] = 0;
  }

  const customKeys = [
    `${variant.element}:hunting:bush`,
    `base:${variant.baron}:bush`,
    `${variant.element}:${variant.baron}:bush`,
  ];
  for (const customKey of customKeys) {
    const customSpans = CUSTOM_PATCHES[customKey] ?? [];
    for (let i = 0; i < customSpans.length; i += 3) {
      const offset = customSpans[i];
      const len = customSpans[i + 1];
      const val = customSpans[i + 2];
      painted.fill(val === 1 ? 1 : 0, offset, offset + len);
    }
  }
  // Ocean's saved brush is shared by Baron forms; their walls must still clip it.
  if (variant.element === "ocean") {
    const walls = mask(variant);
    for (let p = 0; p < painted.length; p++) if (walls[p]) painted[p] = 0;
  }
  // Etiquetado de manchas conexas: 0 = sin arbusto, 1..n = arbusto n.
  const labels = new Uint16Array(painted.length);
  let next = 1;
  const stack: number[] = [];
  for (let seed = 0; seed < painted.length; seed++) {
    if (!painted[seed] || labels[seed]) continue;
    const label = next++;
    labels[seed] = label;
    stack.push(seed);
    while (stack.length) {
      const index = stack.pop()!;
      const column = index % LOGICAL_SIZE;
      for (const near of [
        column > 0 ? index - 1 : -1,
        column < LOGICAL_SIZE - 1 ? index + 1 : -1,
        index - LOGICAL_SIZE,
        index + LOGICAL_SIZE,
      ]) {
        if (near < 0 || near >= painted.length || labels[near] || !painted[near]) continue;
        labels[near] = label;
        stack.push(near);
      }
    }
  }
  bushMasks.set(key, labels);
  return labels;
}

/** Máscara 0/1 para pintarla en pantalla. */
export function bushMaskSnapshot(variant: MapVariant = DEFAULT_MAP): Uint8Array {
  const labels = bushes(variant);
  const out = new Uint8Array(labels.length);
  for (let i = 0; i < labels.length; i++) out[i] = labels[i] ? 1 : 0;
  return out;
}

/** Cuántos arbustos tiene la máscara (manchas conexas). */
export function bushCount(): number {
  const labels = bushes();
  let max = 0;
  for (const label of labels) if (label > max) max = label;
  return max;
}

export function pointInPolygon(points: number[], x: number, y: number): boolean {
  let inside = false;
  const n = points.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const ax = points[2 * i];
    const ay = points[2 * i + 1];
    const bx = points[2 * j];
    const by = points[2 * j + 1];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

/** Número del arbusto que contiene el punto; 0 si no hay ninguno. */
export function bushAt(x: number, y: number, variant: MapVariant = DEFAULT_MAP): number {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= LOGICAL_SIZE || iy >= LOGICAL_SIZE) return 0;
  return bushes(variant)[iy * LOGICAL_SIZE + ix];
}

/** Región especial del Faelight recortada por paredes, pero no por arbustos. */
export function faelightVisionPolygon(
  faelight: Faelight,
  variant: MapVariant = DEFAULT_MAP,
): number[] {
  const rays = 360;
  let maxRadius = 0;
  for (let i = 0; i < faelight.region.length; i += 2) {
    maxRadius = Math.max(
      maxRadius,
      dist(faelight.x, faelight.y, faelight.region[i], faelight.region[i + 1]),
    );
  }

  const points: number[] = [];
  for (let i = 0; i < rays; i++) {
    const angle = (i * Math.PI * 2) / rays;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let x = faelight.x;
    let y = faelight.y;
    for (let distance = 1.5; distance <= maxRadius; distance += 1.5) {
      const nextX = faelight.x + dx * distance;
      const nextY = faelight.y + dy * distance;
      if (isWall(nextX, nextY, variant) || !pointInPolygon(faelight.region, nextX, nextY)) break;
      x = nextX;
      y = nextY;
    }
    points.push(x, y);
  }
  return points;
}

/** Máscara final de las doce regiones Faelight pintadas manualmente. */
export function faelightVisionMask(index: number): Uint8Array | null {
  const runs = FAELIGHT_VISION_RUNS[index];
  if (!runs) return null;
  const pixels = new Uint8Array(LOGICAL_SIZE * LOGICAL_SIZE);
  let offset = 0;
  let value = 0;
  for (const length of runs) {
    if (value) pixels.fill(1, offset, offset + length);
    offset += length;
    value ^= 1;
  }
  return pixels;
}

// ---------- Visión ----------
const RAYS = 180;
const RAY_STEP = 1.5;

/**
 * Polígono de visión real desde un punto: los muros la cortan y los arbustos
 * también, salvo el arbusto en el que está el propio observador (que queda
 * revelado desde dentro). Devuelve puntos planos [x,y,...] para Konva.
 */
function computeVision(
  x: number,
  y: number,
  radius: number,
  ward: boolean,
  variant: MapVariant,
): number[] {
  // El arbusto propio no tapa; cualquier otro sí.
  const inside = bushAt(x, y, variant);
  const blocked = (px: number, py: number) => {
    if (ward ? isWardWall(px, py, variant) : isWall(px, py, variant)) return true;
    const bush = bushAt(px, py, variant);
    return bush !== 0 && bush !== inside;
  };

  const out: number[] = [];
  for (let i = 0; i < RAYS; i++) {
    const angle = (i * Math.PI * 2) / RAYS;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let reach = radius;
    for (let d = RAY_STEP; d <= radius; d += RAY_STEP) {
      if (blocked(x + dx * d, y + dy * d)) {
        reach = d - RAY_STEP;
        break;
      }
    }
    out.push(x + dx * reach, y + dy * reach);
  }
  return out;
}

// Cada polígono son ~11k muestras: sin caché, cualquier render de React que no
// mueva nada volvería a trazar todos los rayos de todas las wards.
const visionCache = new Map<string, number[]>();

/** `ward` añade las paredes moradas, que solo bloquean la visión de las wards. */
export function visionPolygon(
  x: number,
  y: number,
  radiusGameUnits: number,
  ward = false,
  variant: MapVariant = DEFAULT_MAP,
): number[] {
  const radius = toLogical(radiusGameUnits);
  const key = `${variant.element}:${variant.baron}:${Math.round(x * 2)}:${Math.round(y * 2)}:${Math.round(radius)}:${ward ? "w" : ""}`;
  const hit = visionCache.get(key);
  if (hit) return hit;
  const poly = computeVision(x, y, radius, ward, variant);
  if (visionCache.size > 400) visionCache.clear();
  visionCache.set(key, poly);
  return poly;
}

// ============================================================
// MOVIMIENTO
// ============================================================
export type Homeguard = "none" | "homestart" | "early" | "late";

/** Objeto con velocidad de movimiento (plana y/o porcentual). */
export type MovementItem = { id: string; name: string; flat: number; pct: number };

export type MovementStats = {
  terrain?: MapVariant;
  championId: string;
  baseMs: number;
  level: number;
  bootsFlat: number;
  items: MovementItem[];
  /** Runa Celeridad: +7% a todas las bonificaciones de velocidad. */
  celerity: boolean;
  movementSpeedShard: boolean;
  magicalFootwear: boolean;
  waterwalking: boolean;
  relentlessStacks: number;
  approachPct: number;
  /** Runa temporal: % y duración; Tensión además da resistencia a ralentización. */
  runeBurstPct: number;
  runeBurstDuration: number;
  runeSlowResist: number;
  homeguard: Homeguard;
  ghost: boolean;
  /** Activo de objeto: % temporal, duración y plano permanente. */
  itemBurstPct: number;
  itemBurstDuration: number;
  itemFlat: number;
  customFlat: number;
  customPct: number;
  customBurstPct: number;
  customBurstDuration: number;
  slowPct: number;
  slowResistPct: number;
  /** Si es falso la ruta va en línea recta atravesando muros. */
  avoidWalls: boolean;
};

export const DEFAULT_MOVEMENT: MovementStats = {
  championId: "",
  baseMs: 335,
  level: 1,
  bootsFlat: 0,
  items: [],
  celerity: false,
  movementSpeedShard: false,
  magicalFootwear: false,
  waterwalking: false,
  relentlessStacks: 0,
  approachPct: 0,
  runeBurstPct: 0,
  runeBurstDuration: 0,
  runeSlowResist: 0,
  homeguard: "early",
  ghost: false,
  itemBurstPct: 0,
  itemBurstDuration: 0,
  itemFlat: 0,
  customFlat: 0,
  customPct: 0,
  customBurstPct: 0,
  customBurstDuration: 0,
  slowPct: 0,
  slowResistPct: 0,
  avoidWalls: true,
};

/** Los dos topes blandos y el suelo blando del juego. */
export function softCapMovementSpeed(speed: number): number {
  if (speed > 490) return 475 + (speed - 490) * 0.5;
  if (speed > 415) return 415 + (speed - 415) * 0.8;
  if (speed < 220) return 110 + speed * 0.5;
  return speed;
}

/** El bono de Guardián decae linealmente durante los primeros 4 s. */
export function homeguardBonus(kind: Homeguard, time: number): number {
  if (kind === "homestart") return time < 15 ? 175 : 0;
  const values = kind === "early" ? [80, 40] : kind === "late" ? [150, 65] : [0, 0];
  return values[0] + (values[1] - values[0]) * Math.min(1, Math.max(0, time / 4));
}

/** Velocidad efectiva a los `time` segundos de empezar el recorrido. */
export function movementSpeedAt(
  m: MovementStats,
  time = 0,
  distanceGameUnits = 0,
  homeguardEndpointUnits = Infinity,
): number {
  const itemFlat = (m.items || []).reduce((sum, item) => sum + (+item.flat || 0), 0);
  const itemPct = (m.items || []).reduce((sum, item) => sum + (+item.pct || 0), 0);
  let flat =
    (+m.bootsFlat || 0) +
    itemFlat +
    (+m.customFlat || 0) +
    (+m.itemFlat || 0) +
    (m.magicalFootwear ? 10 : 0) +
    (m.waterwalking ? 10 : 0) +
    8 * (+m.relentlessStacks || 0);
  let pct =
    itemPct +
    (m.movementSpeedShard ? 2.5 : 0) +
    (+m.customPct || 0) +
    (+m.approachPct || 0) +
    homeguardBonus(distanceGameUnits < homeguardEndpointUnits ? m.homeguard : "none", time);
  // Fantasmal escala con el nivel y dura 10 s.
  if (m.ghost && time < 10) {
    pct += 24 + (24 * (Math.max(1, Math.min(18, +m.level || 1)) - 1)) / 17;
  }
  if (time < (+m.runeBurstDuration || 0)) pct += +m.runeBurstPct || 0;
  if (time < (+m.itemBurstDuration || 0)) pct += +m.itemBurstPct || 0;
  if (time < (+m.customBurstDuration || 0)) pct += +m.customBurstPct || 0;
  if (m.celerity) {
    flat *= 1.07;
    pct = pct * 1.07 + 1;
  }
  // La resistencia de Tensión solo cuenta mientras dura la runa.
  const resist = Math.max(
    0,
    Math.min(
      100,
      (+m.slowResistPct || 0) + (time < (+m.runeBurstDuration || 0) ? +m.runeSlowResist || 0 : 0),
    ),
  );
  const slow = Math.max(0, Math.min(99, +m.slowPct || 0)) * (1 - resist / 100);
  return softCapMovementSpeed(((+m.baseMs || 0) + flat) * (1 + pct / 100) * (1 - slow / 100));
}

/**
 * Tiempo en segundos para recorrer una distancia en unidades de juego.
 * Se integra a pasos de 20 ms porque la velocidad cambia con el tiempo
 * (Guardián decae, Fantasmal caduca, las ráfagas terminan).
 */
export function travelTime(
  distanceGameUnits: number,
  m: MovementStats,
  homeguardEndpointUnits = Infinity,
): number {
  if (!(distanceGameUnits > 0)) return 0;
  let travelled = 0;
  let time = 0;
  const dt = 0.02;
  while (travelled < distanceGameUnits && time < 600) {
    const speed = Math.max(1, movementSpeedAt(m, time, travelled, homeguardEndpointUnits));
    const step = speed * dt;
    if (travelled + step >= distanceGameUnits) {
      return time + (distanceGameUnits - travelled) / speed;
    }
    travelled += step;
    time += dt;
  }
  return time;
}

// ---------- Ruta A* sobre la máscara de muros ----------
const GRID_STEP = 4;

function simplifyRoute(route: Point[], turrets: Point[], variant: MapVariant): Point[] {
  const simplified: Point[] = [route[0]];
  for (let i = 1; i < route.length;) {
    let far = i;
    while (
      far + 1 < route.length &&
      lineIsWalkable(simplified[simplified.length - 1], route[far + 1], turrets, variant)
    )
      far++;
    simplified.push(route[far]);
    i = far + 1;
  }
  return simplified;
}

/** Camino más corto evitando muros; si no lo hay, la recta directa. */
export function findRoute(
  start: Point,
  end: Point,
  avoidWalls = true,
  turrets: Point[] = [],
  variant: MapVariant = DEFAULT_MAP,
): Point[] {
  if (!avoidWalls) return [start, end];
  const blocked = routeBlocked(turrets, variant);
  if (lineIsWalkable(start, end, turrets, variant)) return [start, end];

  const width = Math.ceil(LOGICAL_SIZE / GRID_STEP);
  const height = width;
  const point = (i: number): Point => ({
    x: (i % width) * GRID_STEP,
    y: Math.floor(i / width) * GRID_STEP,
  });
  // Los extremos pueden caer sobre un muro (clic impreciso): se busca en
  // anillos crecientes la casilla transitable más cercana.
  const nodeAt = (p: Point): number => {
    const gx = Math.max(0, Math.min(width - 1, Math.round(p.x / GRID_STEP)));
    const gy = Math.max(0, Math.min(height - 1, Math.round(p.y / GRID_STEP)));
    let best = -1;
    let bestD = Infinity;
    for (let radius = 0; radius <= 12 && best < 0; radius++) {
      for (let y = Math.max(0, gy - radius); y <= Math.min(height - 1, gy + radius); y++) {
        for (let x = Math.max(0, gx - radius); x <= Math.min(width - 1, gx + radius); x++) {
          if (radius && Math.max(Math.abs(x - gx), Math.abs(y - gy)) !== radius) continue;
          const px = x * GRID_STEP;
          const py = y * GRID_STEP;
          const d = dist(px, py, p.x, p.y);
          if (!blocked(px, py) && d < bestD) {
            best = y * width + x;
            bestD = d;
          }
        }
      }
    }
    return best;
  };

  const startNode = nodeAt(start);
  const endNode = nodeAt(end);
  if (startNode < 0 || endNode < 0) return [start, end];

  const total = width * height;
  const score = new Float64Array(total).fill(Infinity);
  score[startNode] = 0;
  const cameFrom = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);

  const heap: { id: number; priority: number }[] = [];
  const push = (id: number, priority: number) => {
    let i = heap.push({ id, priority }) - 1;
    while (i) {
      const p = (i - 1) >> 1;
      if (heap[p].priority <= priority) break;
      heap[i] = heap[p];
      i = p;
    }
    heap[i] = { id, priority };
  };
  const pop = () => {
    const root = heap[0];
    const tail = heap.pop()!;
    if (heap.length) {
      let i = 0;
      for (;;) {
        let child = i * 2 + 1;
        if (child >= heap.length) break;
        if (child + 1 < heap.length && heap[child + 1].priority < heap[child].priority) child++;
        if (heap[child].priority >= tail.priority) break;
        heap[i] = heap[child];
        i = child;
      }
      heap[i] = tail;
    }
    return root;
  };

  const endPoint = point(endNode);
  const startPoint = point(startNode);
  push(startNode, dist(startPoint.x, startPoint.y, endPoint.x, endPoint.y));
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  while (heap.length) {
    const current = pop().id;
    if (closed[current]) continue;
    if (current === endNode) break;
    closed[current] = 1;
    const cx = current % width;
    const cy = Math.floor(current / width);
    for (const [dx, dy] of directions) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const px = nx * GRID_STEP;
      const py = ny * GRID_STEP;
      if (blocked(px, py)) continue;
      // Thin terrain edges can fall between grid nodes; validate the entire step.
      if (!segmentIsWalkable(point(current), { x: px, y: py }, blocked)) continue;
      // Sin cortar esquinas: en diagonal las dos casillas contiguas deben estar libres.
      if (
        dx &&
        dy &&
        (blocked((cx + dx) * GRID_STEP, cy * GRID_STEP) ||
          blocked(cx * GRID_STEP, (cy + dy) * GRID_STEP))
      ) {
        continue;
      }
      const next = ny * width + nx;
      const nextScore = score[current] + GRID_STEP * (dx && dy ? Math.SQRT2 : 1);
      if (nextScore >= score[next]) continue;
      cameFrom[next] = current;
      score[next] = nextScore;
      push(next, nextScore + dist(px, py, endPoint.x, endPoint.y));
    }
  }
  if (cameFrom[endNode] < 0 && startNode !== endNode) return [start, end];

  const raw: Point[] = [];
  for (let at = endNode; at >= 0; at = cameFrom[at]) {
    raw.push(point(at));
    if (at === startNode) break;
  }
  raw.reverse();
  if (!blocked(start.x, start.y)) raw[0] = start;
  if (!blocked(end.x, end.y)) raw[raw.length - 1] = end;

  return simplifyRoute(raw, turrets, variant);
}

export function routeLength(route: Point[]): number {
  let length = 0;
  for (let i = 1; i < route.length; i++) {
    length += dist(route[i - 1].x, route[i - 1].y, route[i].x, route[i].y);
  }
  return length;
}

function pointAlongRoute(route: Point[], distanceGameUnits: number): Point {
  let remaining = toLogical(distanceGameUnits);
  for (let i = 1; i < route.length; i++) {
    const start = route[i - 1];
    const end = route[i];
    const length = dist(start.x, start.y, end.x, end.y);
    if (remaining <= length) {
      const ratio = length ? remaining / length : 0;
      return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
    }
    remaining -= length;
  }
  return route[route.length - 1];
}

/** Ruta + distancia en unidades de juego + tiempo en segundos. */
export function routeInfo(
  start: Point,
  end: Point,
  m: MovementStats,
  homeguardEndpointUnits = Infinity,
  turrets: Point[] = [],
) {
  const route = findRoute(start, end, m.avoidWalls, turrets, m.terrain);
  const distanceGameUnits = toGameUnits(routeLength(route));
  const effectiveEndpoint = Math.min(distanceGameUnits, homeguardEndpointUnits);
  return {
    route,
    homeguardLane: undefined as number | undefined,
    distanceGameUnits,
    homeguardEndpointUnits: effectiveEndpoint,
    homeguardEndpointPoint:
      m.homeguard !== "none" && effectiveEndpoint > 0
        ? pointAlongRoute(route, effectiveEndpoint)
        : null,
    seconds: travelTime(distanceGameUnits, m, homeguardEndpointUnits),
  };
}

// ---------- Andar vs retroceder ----------
/** Fuentes (punto de reaparición), medidas sobre este mapa en espacio lógico. */
export const FOUNTAIN: Record<"blue" | "red", Point> = {
  blue: { x: 36, y: 962 },
  red: { x: 958, y: 40 },
};

/** Retroceso: 0,5 s de conjuro + 8 s de canalización (wiki). */
export const RECALL_SECONDS = 8.5;
/** Retroceso mejorado (tras derribar una torreta, Guardián...): 0,5 + 4 s. */
export const EMPOWERED_RECALL_SECONDS = 4.5;

/**
 * Radio alrededor de la fuente en el que se considera que el trayecto empieza
 * en base. ponytail: aproximación — Riot no publica el tamaño de la plataforma;
 * si algún día hace falta afinarlo, se mide sobre el mapa como las fuentes.
 */
export const FOUNTAIN_RADIUS = 1000;

type HomeguardTarget = { x: number; y: number; team: "blue" | "red" };

const OUTER_TURRETS: Record<"blue" | "red", Point[]> = {
  blue: [
    { x: 72.15, y: 302.39 },
    { x: 395.77, y: 571.69 },
    { x: 706, y: 929.54 },
  ],
  red: [
    { x: 293.61, y: 74.3 },
    { x: 602.82, y: 429.96 },
    { x: 928.98, y: 696.05 },
  ],
};

// Centros de las tres calles, desde la base azul hasta la roja. Salir de su
// margen transitable cuenta como entrada a jungla para Homeguard.
const LANES: Point[][] = [
  [
    FOUNTAIN.blue,
    { x: 123, y: 846 },
    { x: 85, y: 712 },
    { x: 72, y: 302 },
    { x: 90, y: 100 },
    { x: 294, y: 74 },
    { x: 535, y: 105 },
    { x: 845, y: 126 },
    FOUNTAIN.red,
  ],
  [
    FOUNTAIN.blue,
    { x: 152, y: 877 },
    { x: 251, y: 750 },
    { x: 396, y: 572 },
    { x: 603, y: 430 },
    { x: 747, y: 251 },
    { x: 845, y: 126 },
    FOUNTAIN.red,
  ],
  [
    FOUNTAIN.blue,
    { x: 152, y: 877 },
    { x: 292, y: 913 },
    { x: 706, y: 930 },
    { x: 900, y: 900 },
    { x: 929, y: 696 },
    { x: 894, y: 449 },
    { x: 875, y: 157 },
    FOUNTAIN.red,
  ],
];

const pointSegmentDistance = (p: Point, a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)),
  );
  return dist(p.x, p.y, a.x + dx * t, a.y + dy * t);
};

const inLane = (point: Point, lane: number) => {
  const path = LANES[lane];
  for (let i = 1; i < path.length; i++) {
    if (pointSegmentDistance(point, path[i - 1], path[i]) <= 48) return true;
  }
  return false;
};

/** Distancia hasta el primer punto donde una ruta abandona su calle. */
export function jungleEntryDistance(route: Point[], lane: number): number {
  let travelled = 0;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1];
    const b = route[i];
    const length = dist(a.x, a.y, b.x, b.y);
    const steps = Math.max(1, Math.ceil(length / 6));
    for (let step = 1; step <= steps; step++) {
      const logical = travelled + (length * step) / steps;
      const point = {
        x: a.x + ((b.x - a.x) * step) / steps,
        y: a.y + ((b.y - a.y) * step) / steps,
      };
      if (!inLane(point, lane)) return toGameUnits(logical);
    }
    travelled += length;
  }
  return Infinity;
}

const laneRoutes = (
  destination: Point,
  m: MovementStats,
  team: "blue" | "red",
  lane: number,
  turrets: Point[],
) => {
  const path = team === "blue" ? LANES[lane] : [...LANES[lane]].reverse();
  let closestSegment = 0;
  for (let i = 1; i < path.length; i++) {
    if (
      pointSegmentDistance(destination, path[i - 1], path[i]) <
      pointSegmentDistance(destination, path[closestSegment], path[closestSegment + 1])
    )
      closestSegment = i - 1;
  }
  const accesses: Point[] = [];
  for (let i = 1; i <= Math.min(path.length - 1, closestSegment + 2); i++) {
    if (i === closestSegment + 1) {
      const a = path[i - 1];
      const b = path[i];
      for (let step = 1; step <= 8; step++)
        accesses.push({ x: a.x + ((b.x - a.x) * step) / 8, y: a.y + ((b.y - a.y) * step) / 8 });
    } else {
      accesses.push(path[i]);
    }
  }
  const prefix: Point[] = [FOUNTAIN[team]];
  const routes: Point[][] = [];
  // Se prueban ocho salidas dentro del tramo más cercano para que un pequeño
  // movimiento de B no salte entre accesos y pierda una ruta mejor.
  for (const waypoint of accesses) {
    const laneLeg = findRoute(
      prefix[prefix.length - 1],
      waypoint,
      m.avoidWalls,
      turrets,
      m.terrain,
    );
    prefix.push(...laneLeg.slice(1));
    const jungleLeg = findRoute(
      prefix[prefix.length - 1],
      destination,
      m.avoidWalls,
      turrets,
      m.terrain,
    );
    routes.push([...prefix, ...jungleLeg.slice(1)]);
  }
  return routes;
};

const closestLane = (point: Point, team: "blue" | "red") => {
  const outers = OUTER_TURRETS[team];
  let lane = 0;
  for (let i = 1; i < outers.length; i++) {
    if (
      dist(point.x, point.y, outers[i].x, outers[i].y) <
      dist(point.x, point.y, outers[lane].x, outers[lane].y)
    )
      lane = i;
  }
  return lane;
};

/** Distancia espacial hasta el corte de Homeguard para la calle de destino. */
export function homeguardEndpoint(
  destination: Point,
  m: MovementStats,
  team: "blue" | "red",
  minions: HomeguardTarget[] = [],
  laneOverride?: number,
  turrets: Point[] = [],
): number {
  if (m.homeguard === "none") return 0;
  const lane = laneOverride ?? closestLane(destination, team);
  const outer = OUTER_TURRETS[team][lane];
  const routeDistance = (point: Point) =>
    toGameUnits(routeLength(findRoute(FOUNTAIN[team], point, m.avoidWalls, turrets, m.terrain)));
  const outerDistance = routeDistance(outer);
  if (m.homeguard === "homestart") return outerDistance;
  const outerEndpoint = Math.max(0, outerDistance - 500);
  if (m.homeguard !== "late") return outerEndpoint;
  const waveTarget = minions
    .filter((minion) => closestLane(minion, team) === lane)
    .sort(
      (a, b) =>
        dist(FOUNTAIN[team].x, FOUNTAIN[team].y, b.x, b.y) -
        dist(FOUNTAIN[team].x, FOUNTAIN[team].y, a.x, a.y),
    )[0];
  const wave = waveTarget ? routeDistance(waveTarget) : 0;
  return Math.max(outerEndpoint, wave - 2000);
}

/** ¿El punto está en la fuente de ese bando (y por tanto sale de base)? */
export function startsAtFountain(p: Point, team: "blue" | "red"): boolean {
  return dist(p.x, p.y, FOUNTAIN[team].x, FOUNTAIN[team].y) <= toLogical(FOUNTAIN_RADIUS);
}

/**
 * Compara ir andando de A a B contra retroceder en A y salir de la fuente.
 * El Guardián solo se activa al salir de la fuente: se aplica siempre al tramo
 * que sale de base y al tramo directo únicamente si A está en la propia base.
 */
export function walkVersusRecall(
  origin: Point,
  destination: Point,
  m: MovementStats,
  team: "blue" | "red",
  empoweredRecall = false,
  minions: HomeguardTarget[] = [],
  turrets: Point[] = DEFAULT_TURRETS,
) {
  if (!turrets.length) turrets = DEFAULT_TURRETS;
  const homeguardOnWalk = m.homeguard !== "none" && startsAtFountain(origin, team);
  const walkStats: MovementStats = homeguardOnWalk ? m : { ...m, homeguard: "none" };
  const bestFromBase = (stats: MovementStats) => {
    if (!stats.avoidWalls || stats.homeguard === "none")
      return routeInfo(FOUNTAIN[team], destination, stats, 0, turrets);
    const shortest = findRoute(FOUNTAIN[team], destination, true, turrets, stats.terrain);
    const endpoints = [0, 1, 2].map((lane) =>
      homeguardEndpoint(destination, stats, team, minions, lane, turrets),
    );
    const candidates = [0, 1, 2].flatMap((lane) => [
      { route: shortest, lane },
      ...laneRoutes(destination, stats, team, lane, turrets).map((route) => ({ route, lane })),
    ]);
    const evaluate = (route: Point[], lane: number) => {
      const distanceGameUnits = toGameUnits(routeLength(route));
      const effectiveEndpoint = Math.min(endpoints[lane], jungleEntryDistance(route, lane));
      return {
        route,
        homeguardLane: lane,
        distanceGameUnits,
        homeguardEndpointUnits: Math.min(distanceGameUnits, effectiveEndpoint),
        homeguardEndpointPoint:
          stats.homeguard !== "none" && effectiveEndpoint > 0
            ? pointAlongRoute(route, Math.min(distanceGameUnits, effectiveEndpoint))
            : null,
        seconds: travelTime(distanceGameUnits, stats, effectiveEndpoint),
      };
    };
    return candidates
      .map(({ route, lane }) => {
        let result = evaluate(route, lane);
        for (let i = 1; i < result.route.length - 1;) {
          if (!lineIsWalkable(result.route[i - 1], result.route[i + 1], turrets, stats.terrain)) {
            i++;
            continue;
          }
          const shorter = evaluate(
            [...result.route.slice(0, i), ...result.route.slice(i + 1)],
            lane,
          );
          if (shorter.seconds <= result.seconds) result = shorter;
          else i++;
        }
        return result;
      })
      .reduce((best, candidate) => (candidate.seconds < best.seconds ? candidate : best));
  };
  const walk = homeguardOnWalk
    ? bestFromBase(walkStats)
    : routeInfo(origin, destination, walkStats, 0, turrets);
  const recallStats: MovementStats = m.homeguard === "homestart" ? { ...m, homeguard: "none" } : m;
  const fromBase = bestFromBase(recallStats);
  const channel = empoweredRecall ? EMPOWERED_RECALL_SECONDS : RECALL_SECONDS;
  const recall = { ...fromBase, channel, seconds: channel + fromBase.seconds };
  return {
    walk,
    walkStats,
    homeguardOnWalk,
    recall,
    faster: recall.seconds < walk.seconds ? ("recall" as const) : ("walk" as const),
    savedSeconds: Math.abs(walk.seconds - recall.seconds),
  };
}
