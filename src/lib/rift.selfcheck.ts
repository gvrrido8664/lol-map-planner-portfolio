// Comprobación de la geometría/física portada. Sin framework:
//   bun src/lib/rift.selfcheck.ts   (o  node --experimental-strip-types ...)
import assert from "node:assert/strict";
import {
  bushCount,
  bushMaskSnapshot,
  DEFAULT_MOVEMENT,
  DEFAULT_TURRETS,
  FAELIGHTS,
  FAELIGHT_INNER_RADIUS,
  FAELIGHT_TRIGGER_RADIUS,
  FAELIGHT_VISION_SCORE_MULTIPLIER,
  FAELIGHT_WARD_VISION_MULTIPLIER,
  LOGICAL_SIZE,
  bushAt,
  findRoute,
  faelightAt,
  faelightVisionPolygon,
  faelightVisionMask,
  snapWardToFaelight,
  homeguardBonus,
  homeguardEndpoint,
  jungleEntryDistance,
  isWall,
  lineIsWalkable,
  movementSpeedAt,
  pointInPolygon,
  routeInfo,
  routeLength,
  FOUNTAIN,
  walkVersusRecall,
  RECALL_SECONDS,
  EMPOWERED_RECALL_SECONDS,
  SIGHT,
  softCapMovementSpeed,
  toGameUnits,
  toLogical,
  travelTime,
  visionPolygon,
  isWardWall,
  reachableFrom,
} from "./rift.ts";

const area = (poly: number[]) => {
  let a = 0;
  for (let i = 0, n = poly.length / 2; i < n; i++) {
    const j = (i + 1) % n;
    a += poly[2 * i] * poly[2 * j + 1] - poly[2 * j] * poly[2 * i + 1];
  }
  return Math.abs(a) / 2;
};

// --- unidades ---
assert.equal(Math.round(toGameUnits(toLogical(5000))), 5000);
assert.equal(Math.round(toLogical(14870)), LOGICAL_SIZE);

// --- Faelights ---
assert.equal(FAELIGHTS.filter((faelight) => !faelight.postTransform).length, 8);
assert.equal(FAELIGHTS.filter((faelight) => faelight.postTransform).length, 4);
assert.deepEqual([FAELIGHTS[6].x, FAELIGHTS[7].x], [657.3, 810.7]);
assert.deepEqual([FAELIGHTS[10].x, FAELIGHTS[11].x], [623.4, 869.6]);
assert.ok(
  FAELIGHTS.every((faelight) => pointInPolygon(faelight.region, faelight.x, faelight.y)),
  "cada Faelight debe quedar dentro de su propia región",
);
assert.equal(FAELIGHT_VISION_SCORE_MULTIPLIER, 1.25);
assert.equal(FAELIGHT_WARD_VISION_MULTIPLIER, 1.25);
assert.equal(faelightAt(FAELIGHTS[0].x, FAELIGHTS[0].y), FAELIGHTS[0]);
assert.equal(faelightAt(FAELIGHTS[8].x, FAELIGHTS[8].y), null);
assert.equal(faelightAt(FAELIGHTS[8].x, FAELIGHTS[8].y, true), FAELIGHTS[8]);
const blinked = snapWardToFaelight(FAELIGHTS[0].x + FAELIGHT_TRIGGER_RADIUS - 0.01, FAELIGHTS[0].y);
assert.ok(Math.abs(blinked.x - FAELIGHTS[0].x - FAELIGHT_INNER_RADIUS) < 0.001);
const alreadyInside = snapWardToFaelight(FAELIGHTS[0].x + 1, FAELIGHTS[0].y);
assert.equal(alreadyInside.x, FAELIGHTS[0].x + 1);
assert.ok(FAELIGHTS.every(({ region }) => region.length >= 8 && region.length % 2 === 0));
for (const faelight of FAELIGHTS) {
  const visible = faelightVisionPolygon(faelight);
  assert.equal(visible.length, 720);
  for (let i = 0; i < visible.length; i += 2) {
    assert.equal(isWall(visible[i], visible[i + 1]), false);
    assert.equal(pointInPolygon(faelight.region, visible[i], visible[i + 1]), true);
  }
}
for (let index = 0; index < FAELIGHTS.length; index++) {
  const mask = faelightVisionMask(index);
  assert.equal(mask?.length, LOGICAL_SIZE ** 2);
  assert.ok(mask?.some(Boolean), `la Faelight ${index + 1} debe tener visión pintada`);
}
assert.equal(faelightVisionMask(FAELIGHTS.length), null);

// --- muros ---
assert.equal(isWall(-5, 500), true, "fuera del mapa es muro");
assert.equal(isWall(500, 500), false, "el centro de mid es transitable");
assert.equal(isWall(150, 850), false, "la base azul es transitable");
assert.equal(isWall(500, 300), true, "el muro sobre el foso de Barón está marcado");
assert.equal(isWall(813, 319), false, "el hueco pintado a mano en la jungla roja");

// --- paredes solo-ward (moradas, horneadas en ward-wall-data.ts) ---
const openArea = (x: number, y: number, ward: boolean) =>
  area(visionPolygon(x, y, SIGHT.ward, ward));
assert.equal(isWardWall(813, 319), true, "la pared morada del lado rojo sigue ahi");
assert.equal(isWall(813, 319), false, "pero no bloquea a campeones ni al movimiento");
assert.equal(isWardWall(174, 667), true, "y su espejo en el lado azul tambien");
assert.equal(isWall(174, 667), false);
assert.equal(isWardWall(500, 500), false, "el centro de mid sigue despejado");
assert.ok(
  openArea(806, 325, true) < openArea(806, 325, false),
  "una ward junto a la pared morada ve menos que un campeon",
);

// Lo que queda al otro lado de una pared deja de estar iluminado.
const strip = new Uint8Array(LOGICAL_SIZE ** 2);
strip.fill(1, 100 * LOGICAL_SIZE, 101 * LOGICAL_SIZE); // fila 100 entera
strip[100 * LOGICAL_SIZE + 50] = 0; // cortada en x=50
const lit = reachableFrom(strip, 10, 100);
assert.equal(lit[100 * LOGICAL_SIZE + 40], 1);
assert.equal(lit[100 * LOGICAL_SIZE + 60], 0, "tras el corte ya no se ve");

// --- arbustos ---
assert.equal(bushCount(), 39, "los 39 arbustos de la Grieta");
const bushPixels = bushMaskSnapshot().reduce((sum, p) => sum + p, 0);
assert.equal(bushPixels, 27044, "la máscara de arbustos horneada");
assert.equal(bushAt(500, 470), 0, "mid abierto no es arbusto");

// --- radios exactos (wiki: campeón/torreta 1350, súbdito 1200, ward 900) ---
assert.deepEqual(
  { ...SIGHT },
  { champion: 1350, turret: 1350, minion: 1200, ward: 900, controlWard: 900 },
);
// En campo abierto el polígono llega justo al radio: ni más ni menos.
for (const range of [SIGHT.champion, SIGHT.minion, SIGHT.ward]) {
  const poly = visionPolygon(500, 500, range);
  let max = 0;
  for (let i = 0; i < poly.length; i += 2) {
    max = Math.max(max, Math.hypot(poly[i] - 500, poly[i + 1] - 500));
  }
  assert.ok(
    Math.abs(toGameUnits(max) - range) < 1,
    `el alcance máximo debe ser ${range} u, es ${toGameUnits(max).toFixed(0)}`,
  );
}

// --- visión ---
// Campo abierto ve más que una esquina encajonada entre muros.
const open = visionPolygon(500, 500, 1350);
const boxed = visionPolygon(60, 500, 1350);
assert.ok(area(open) > area(boxed), "los muros recortan la visión");
// Dentro de un arbusto: el propio arbusto no tapa, así que su centro se ve.
// Se descartan los pocos arbustos pegados a roca cuyo centro cae en la máscara
// de muros: allí la visión se corta por el muro, no por el arbusto.
const bushSpot = (() => {
  const pixels = bushMaskSnapshot();
  for (let i = 0; i < pixels.length; i++) {
    const x = i % LOGICAL_SIZE;
    const y = Math.floor(i / LOGICAL_SIZE);
    if (pixels[i] && !isWall(x, y) && bushAt(x + 1, y) === bushAt(x, y)) return { x, y };
  }
  throw new Error("sin arbusto usable");
})();
const fromInside = visionPolygon(bushSpot.x, bushSpot.y, 900);
assert.ok(
  pointInPolygon(fromInside, bushSpot.x + 1, bushSpot.y),
  "se ve dentro del propio arbusto",
);
// Desde fuera, ese mismo arbusto sí proyecta sombra: menos área que sin él.
assert.ok(area(visionPolygon(500, 500, 900)) < area(visionPolygon(500, 500, 1350)));

// --- velocidad ---
assert.equal(softCapMovementSpeed(400), 400, "sin tope por debajo de 415");
assert.equal(softCapMovementSpeed(500), 480, "segundo tope: 475 + 10*0.5");
assert.equal(softCapMovementSpeed(200), 210, "suelo blando");
assert.equal(homeguardBonus("early", 0), 80);
assert.equal(homeguardBonus("early", 4), 40);
assert.equal(homeguardBonus("late", 0), 150);
assert.equal(homeguardBonus("late", 4), 65);
assert.equal(homeguardBonus("none", 1), 0);
assert.equal(homeguardBonus("homestart", 0), 175);
assert.equal(homeguardBonus("homestart", 15), 0);
assert.equal(DEFAULT_MOVEMENT.homeguard, "early", "Pre-14 Homeguard is active by default");
const noHomeguard = { ...DEFAULT_MOVEMENT, homeguard: "none" as const };
assert.equal(movementSpeedAt({ ...noHomeguard, baseMs: 325, bootsFlat: 45 }), 370);
assert.equal(
  movementSpeedAt({ ...noHomeguard, baseMs: 300, movementSpeedShard: true }),
  307.5,
  "la mini runa añade 2,5% de velocidad de movimiento",
);
// Objetos: suma plana y porcentual, y Cazador incesante son +8 por acumulación.
assert.equal(
  movementSpeedAt({
    ...noHomeguard,
    baseMs: 300,
    items: [{ id: "i", name: "x", flat: 0, pct: 5 }],
    relentlessStacks: 2,
  }),
  (300 + 16) * 1.05,
);
// Tensión: su resistencia a ralentización solo cuenta mientras dura la runa.
const tenacity = {
  ...noHomeguard,
  baseMs: 400,
  slowPct: 50,
  runeBurstPct: 0,
  runeBurstDuration: 4,
  runeSlowResist: 50,
};
assert.ok(
  movementSpeedAt(tenacity, 1) > movementSpeedAt(tenacity, 5),
  "al acabar la runa frena más",
);
assert.equal(
  movementSpeedAt({ ...noHomeguard, baseMs: 300, slowPct: 50, slowResistPct: 50 }),
  225,
  "la tenacidad de ralentización recorta el frenazo a la mitad",
);

// --- tiempo ---
const flat = { ...noHomeguard, baseMs: 400 };
assert.ok(Math.abs(travelTime(4000, flat) - 10) < 0.01, "a velocidad constante t = d/v");
assert.equal(travelTime(0, flat), 0);
assert.ok(
  travelTime(4000, { ...flat, homeguard: "late" }) < travelTime(4000, flat),
  "Guardián acorta el trayecto",
);
assert.ok(
  travelTime(4000, { ...flat, homeguard: "late" }, 1000) >
    travelTime(4000, { ...flat, homeguard: "late" }),
  "Homeguard termina al alcanzar su endpoint espacial",
);

// --- rutas ---
const straight = findRoute({ x: 500, y: 500 }, { x: 520, y: 520 });
assert.equal(straight.length, 2, "campo abierto: recta directa");
// Mid a mid en diagonal sí es recto: el carril está despejado.
assert.equal(findRoute({ x: 250, y: 750 }, { x: 750, y: 250 }).length, 2, "mid está despejado");
// De la base azul a la torre exterior top enemiga hay que rodear la jungla.
const A = { x: 150, y: 850 };
const B = { x: 293, y: 74 };
const cross = routeInfo(A, B, DEFAULT_MOVEMENT);
assert.ok(cross.route.length > 2, "la ruta rodea los muros");
assert.ok(
  cross.distanceGameUnits > toGameUnits(Math.hypot(B.x - A.x, B.y - A.y)),
  "rodear es más largo que la recta",
);
assert.ok(
  cross.seconds > 20 && cross.seconds < 120,
  `tiempo del cruce: ${cross.seconds.toFixed(1)}s`,
);
// Sin evitar muros, la ruta es la recta.
assert.equal(findRoute(A, B, false).length, 2);

// --- andar vs retroceder ---
// Desde la torre exterior top enemiga hasta la base azul: retroceder gana.
const backHome = walkVersusRecall(B, { x: 200, y: 800 }, DEFAULT_MOVEMENT, "blue");
assert.equal(backHome.faster, "recall", "volver a casa desde el otro lado del mapa: mejor recall");
assert.ok(backHome.recall.seconds > RECALL_SECONDS, "el recall incluye su canalización");
// Dos pasos en la misma calle: andar gana, el recall no compensa el canal.
const shortHop = walkVersusRecall({ x: 250, y: 750 }, { x: 350, y: 650 }, DEFAULT_MOVEMENT, "blue");
assert.equal(shortHop.faster, "walk", "un tramo corto no compensa retroceder");
// El Guardián solo cuenta al salir de la fuente: con A lejos de base no debe
// acortar el tramo directo, pero sí el que sale de la fuente.
const far = { x: 700, y: 300 };
const plain = walkVersusRecall(far, { x: 500, y: 500 }, DEFAULT_MOVEMENT, "blue");
const guarded = walkVersusRecall(
  far,
  { x: 500, y: 500 },
  { ...DEFAULT_MOVEMENT, homeguard: "late" },
  "blue",
);
assert.equal(guarded.homeguardOnWalk, false, "A no está en base");
assert.equal(guarded.walk.seconds, plain.walk.seconds, "el Guardián no toca el tramo directo");
assert.ok(guarded.recall.seconds < plain.recall.seconds, "pero sí el que sale de la fuente");
// Si A sí está en la fuente, entonces el tramo directo lo aprovecha.
const fromBase = walkVersusRecall(
  FOUNTAIN.blue,
  { x: 500, y: 500 },
  { ...DEFAULT_MOVEMENT, homeguard: "late" },
  "blue",
);
assert.equal(fromBase.homeguardOnWalk, true);
assert.ok(
  homeguardEndpoint({ x: 293, y: 74 }, DEFAULT_MOVEMENT, "blue") > 0,
  "el endpoint early queda en la calle elegida",
);
assert.equal(
  jungleEntryDistance([FOUNTAIN.blue, { x: 123, y: 846 }, { x: 72, y: 302 }], 0),
  Infinity,
  "seguir por la calle conserva Homeguard",
);
assert.ok(
  jungleEntryDistance([FOUNTAIN.blue, { x: 350, y: 700 }], 0) < Infinity,
  "el desvío hacia jungla corta Homeguard automáticamente",
);
const topWithHomeguard = { ...DEFAULT_MOVEMENT, homeguard: "late" as const };
const topShortcut = findRoute(FOUNTAIN.blue, B);
const topShortcutDistance = toGameUnits(routeLength(topShortcut));
assert.ok(
  walkVersusRecall(FOUNTAIN.blue, B, topWithHomeguard, "blue").walk.seconds <=
    travelTime(topShortcutDistance, topWithHomeguard, jungleEntryDistance(topShortcut, 0)),
  "se elige la ruta más rápida después de considerar el corte por jungla",
);
const upperJungle = { x: 255, y: 56 };
const upperShortcut = findRoute(FOUNTAIN.blue, upperJungle);
assert.ok(
  walkVersusRecall(FOUNTAIN.blue, upperJungle, topWithHomeguard, "blue").walk
    .homeguardEndpointUnits > jungleEntryDistance(upperShortcut, 0),
  "se avanza por top antes de usar el mejor acceso a la jungla superior",
);
assert.equal(
  walkVersusRecall(FOUNTAIN.blue, { x: 500, y: 100 }, topWithHomeguard, "blue").walk.homeguardLane,
  1,
  "se comparan las tres calles: mid puede ganar aunque top sea la más cercana",
);
const lowerJungle = { x: 840, y: 700 };
const directLower = findRoute(FOUNTAIN.blue, lowerJungle, true, DEFAULT_TURRETS);
const directLowerDistance = toGameUnits(routeLength(directLower));
const directLowerCutoff = jungleEntryDistance(directLower, 2);
const bestLower = walkVersusRecall(FOUNTAIN.blue, lowerJungle, topWithHomeguard, "blue").walk;
assert.ok(
  bestLower.route
    .slice(1)
    .every((point, i) => lineIsWalkable(bestLower.route[i], point, DEFAULT_TURRETS)),
  "la ruta elegida rodea todas las torres",
);
assert.ok(
  bestLower.homeguardEndpointUnits > directLowerCutoff &&
    bestLower.seconds < travelTime(directLowerDistance, topWithHomeguard, directLowerCutoff),
  "se prefiere seguir por bot y entrar tarde a jungla cuando conserva Homeguard y tarda menos",
);
const nearbyLower = walkVersusRecall(
  FOUNTAIN.blue,
  { x: 850, y: 680 },
  topWithHomeguard,
  "blue",
).walk;
assert.ok(
  Math.abs(bestLower.seconds - nearbyLower.seconds) < 2,
  "mover B ligeramente no provoca un salto entre accesos de jungla",
);
assert.ok(bestLower.homeguardLane !== undefined, "la ruta optimizada identifica su calle");
const lowerSpatialEndpoint = homeguardEndpoint(
  lowerJungle,
  topWithHomeguard,
  "blue",
  [],
  bestLower.homeguardLane,
  DEFAULT_TURRETS,
);
for (let i = 1; i < bestLower.route.length - 1; i++) {
  if (!lineIsWalkable(bestLower.route[i - 1], bestLower.route[i + 1], DEFAULT_TURRETS)) continue;
  const withoutBreak = [...bestLower.route.slice(0, i), ...bestLower.route.slice(i + 1)];
  const distance = toGameUnits(routeLength(withoutBreak));
  const cutoff = Math.min(
    lowerSpatialEndpoint,
    jungleEntryDistance(withoutBreak, bestLower.homeguardLane),
  );
  assert.ok(
    travelTime(distance, topWithHomeguard, cutoff) > bestLower.seconds,
    "todo quiebre restante conserva Homeguard o rodea un obstáculo",
  );
}
assert.ok(
  homeguardEndpoint({ x: 293, y: 74 }, { ...DEFAULT_MOVEMENT, homeguard: "late" }, "blue", [
    { x: 293, y: 74, team: "red" },
  ]) > homeguardEndpoint({ x: 293, y: 74 }, DEFAULT_MOVEMENT, "blue"),
  "una oleada avanzada extiende el endpoint post-14",
);
assert.ok(
  fromBase.walk.seconds <
    walkVersusRecall(FOUNTAIN.blue, { x: 500, y: 500 }, DEFAULT_MOVEMENT, "blue").walk.seconds,
);

// El recall mejorado nunca puede ser más lento que el normal.
const normal = walkVersusRecall(B, { x: 200, y: 800 }, DEFAULT_MOVEMENT, "blue", false);
const empowered = walkVersusRecall(B, { x: 200, y: 800 }, DEFAULT_MOVEMENT, "blue", true);
assert.ok(empowered.recall.seconds < normal.recall.seconds);
assert.equal(
  +(normal.recall.seconds - empowered.recall.seconds).toFixed(2),
  RECALL_SECONDS - EMPOWERED_RECALL_SECONDS,
);

console.log(
  `OK · ${bushCount()} arbustos · base azul → top enemigo ${cross.distanceGameUnits.toFixed(0)} u en ${cross.seconds.toFixed(1)} s`,
);
