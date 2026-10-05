// Run: node --experimental-strip-types src/lib/ocean-pit.selfcheck.ts
import assert from "node:assert/strict";
import { bushAt, bushMaskSnapshot, wallMaskSnapshot } from "./rift.ts";

for (const baron of ["hunting", "territorial", "allSeeing"] as const) {
  const variant = { element: "ocean" as const, baron };
  for (const [x, y] of [
    [298, 216],
    [230, 242],
    [334, 420],
  ]) {
    assert.ok(bushAt(x, y, variant), `Saved Ocean brush missing at ${x},${y}: ${baron}`);
  }
  assert.equal(bushAt(325, 391, variant), 0, "Detached brush fragment must stay erased");
  const bushes = bushMaskSnapshot(variant),
    walls = wallMaskSnapshot(variant);
  assert.ok(
    bushes.every((value, i) => !value || !walls[i]),
    `Brush overlaps ${baron} walls`,
  );
}

console.log("OK · saved Ocean brush in three Baron forms and wall clipping");
