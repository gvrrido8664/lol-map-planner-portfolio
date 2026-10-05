import assert from "node:assert/strict";
import {
  DEFAULT_MAP,
  ELEMENTS,
  BARON_FORMS,
  MONSTERS,
  normalizeMapVariant,
} from "./map-variants.ts";
import {
  wallMaskSnapshot,
  bushMaskSnapshot,
  terrainChanges,
  visionPolygon,
  findRoute,
  lineIsWalkable,
  isWall,
  FAELIGHTS,
  faelightAt,
} from "./rift.ts";
import { useEditorStore } from "../stores/editorStore.ts";
import { CUSTOM_PATCHES } from "./terrain-data.ts";

assert.deepEqual(normalizeMapVariant({ element: "__proto__", baron: "invalid" }), DEFAULT_MAP);
assert.deepEqual(normalizeMapVariant(null), DEFAULT_MAP);
const base = wallMaskSnapshot();
const baseBushes = bushMaskSnapshot();
const mountain = { ...DEFAULT_MAP, element: "mountain" as const };
const added = wallMaskSnapshot(mountain);
assert.ok(
  added.some((v, i) => v && !base[i]),
  "Mountain adds solid terrain",
);
assert.deepEqual(wallMaskSnapshot(), base, "Variants do not mutate the base mask");
assert.deepEqual(bushMaskSnapshot({ ...DEFAULT_MAP, element: "cloud" }), baseBushes);
assert.ok(
  bushMaskSnapshot({ ...DEFAULT_MAP, element: "ocean" }).reduce((a, b) => a + b, 0) >
    baseBushes.reduce((a, b) => a + b, 0),
);

for (const baron of ["territorial", "allSeeing"] as const) {
  const variant = { ...DEFAULT_MAP, baron };
  const changes = terrainChanges(variant);
  assert.ok(changes.some((v) => v === 1));
  if (baron === "allSeeing") assert.ok(changes.some((v) => v === 2));
  const walls = wallMaskSnapshot(variant);
  const corrections = new Uint8Array(walls.length);
  for (const key of ["base:hunting:wall", `base:${baron}:wall`]) {
    const spans = CUSTOM_PATCHES[key] ?? [];
    for (let i = 0; i < spans.length; i += 3)
      corrections.fill(spans[i + 2], spans[i], spans[i] + spans[i + 1]);
  }
  for (let i = 0; i < changes.length; i++) {
    const expected = corrections[i] || changes[i];
    if (expected) assert.equal(walls[i], expected === 1 ? 1 : 0);
  }
}

// Loading maps in a different order must never change their collision or brush.
const freshModule = "./rift.ts?reverse-order";
const fresh = await import(freshModule);
for (const element of Object.keys(ELEMENTS).reverse() as (keyof typeof ELEMENTS)[]) {
  for (const baron of Object.keys(BARON_FORMS) as (keyof typeof BARON_FORMS)[]) {
    const variant = { element, baron };
    assert.deepEqual(
      wallMaskSnapshot(variant),
      fresh.wallMaskSnapshot(variant),
      `${element}/${baron} walls depend on visit order`,
    );
    assert.deepEqual(
      bushMaskSnapshot(variant),
      fresh.bushMaskSnapshot(variant),
      `${element}/${baron} brush depends on visit order`,
    );
  }
}

// Same origin/radius across variants must not share cached vision.
assert.notDeepEqual(
  visionPolygon(320, 340, 1350, false),
  visionPolygon(320, 340, 1350, false, { ...DEFAULT_MAP, baron: "allSeeing" }),
);
for (const element of Object.keys(ELEMENTS) as (keyof typeof ELEMENTS)[]) {
  for (const baron of Object.keys(BARON_FORMS) as (keyof typeof BARON_FORMS)[]) {
    const variant = { element, baron };
    const route = findRoute({ x: 340, y: 295 }, { x: 450, y: 400 }, true, [], variant);
    assert.ok(route.length >= 2);
    assert.ok(route.every((p) => !isWall(p.x, p.y, variant)));
    assert.ok(
      route.slice(1).every((p, i) => lineIsWalkable(route[i], p, [], variant)),
      `${element}/${baron} route crosses a wall`,
    );
  }
}
const delayed = FAELIGHTS.find((f) => f.postTransform)!;
assert.equal(faelightAt(delayed.x, delayed.y, false), null);
assert.equal(faelightAt(delayed.x, delayed.y, true), delayed);

const store = () => useEditorStore.getState();
store().setMapVariant(mountain);
store().undo();
assert.deepEqual(store().state.map, DEFAULT_MAP);
store().redo();
assert.deepEqual(store().state.map, mountain);
store().placeMonster("elder");
assert.equal(store().state.map.element, "mountain", "Elder does not reset the elemental Rift");
assert.equal(
  store().state.elements.filter((e) => e.type === "monster" && MONSTERS[e.kind].x > 500).length,
  1,
);
store().placeMonster("herald");
assert.equal(
  store().state.elements.filter((e) => e.type === "monster" && MONSTERS[e.kind].x < 500).length,
  1,
);
const herald = store().state.elements.find((e) => e.type === "monster" && e.kind === "herald")!;
store().updateElement(herald.id, { x: 400, y: 400 });
store().undo();
assert.equal(
  (store().state.elements.find((e) => e.id === herald.id) as { x: number }).x,
  MONSTERS.herald.x,
);
store().removeElement(herald.id);
store().undo();
assert.ok(store().state.elements.some((e) => e.id === herald.id));
console.log("OK · 21 terrain combinations, vision, Faelights, epic monsters and undo/redo");
