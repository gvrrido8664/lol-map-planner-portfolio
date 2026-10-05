// Hand-traced planning contours from public/mapas/mapa-ocean.jpg, in 1000x1000 coordinates.
// Only these three local areas are replaced; all other saved painting is preserved.
import fs from "node:fs";
import { CUSTOM_PATCHES } from "../src/lib/terrain-data.ts";

const regions = [
  {
    box: [274, 190, 322, 247],
    points: [
      [278, 207],
      [284, 200],
      [296, 194],
      [308, 195],
      [313, 201],
      [310, 213],
      [305, 224],
      [304, 237],
      [299, 241],
      [291, 231],
      [285, 224],
      [278, 222],
    ],
  },
  {
    box: [208, 222, 251, 266],
    points: [
      [219, 233],
      [228, 226],
      [238, 228],
      [245, 237],
      [245, 247],
      [238, 256],
      [228, 260],
      [217, 254],
      [212, 244],
      [214, 237],
    ],
  },
  {
    box: [304, 387, 348, 443],
    points: [
      [320, 397],
      [327, 395],
      [335, 400],
      [341, 411],
      [342, 422],
      [336, 432],
      [325, 439],
      [314, 439],
      [307, 434],
      [311, 428],
      [321, 424],
      [324, 418],
      [320, 411],
      [315, 406],
    ],
  },
];
function inside(x, y, points) {
  let yes = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i],
      [bx, by] = points[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) yes = !yes;
  }
  return yes;
}
const mask = new Uint8Array(1000000);
const key = "ocean:hunting:bush";
const spans = CUSTOM_PATCHES[key];
if (!spans?.length) throw new Error("Missing saved Ocean painting; refusing to replace it");
for (let i = 0; i < spans.length; i += 3)
  mask.fill(spans[i + 2], spans[i], spans[i] + spans[i + 1]);
for (const {
  box: [x0, y0, x1, y1],
  points,
} of regions)
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) mask[y * 1000 + x] = inside(x + 0.5, y + 0.5, points) ? 1 : 2;
const encoded = [];
let start = 0,
  value = mask[0];
for (let i = 1; i <= mask.length; i++) {
  const next = i === mask.length ? 0 : mask[i];
  if (next === value) continue;
  if (value) encoded.push(start, i - start, value);
  start = i;
  value = next;
}
const updated = { ...CUSTOM_PATCHES, [key]: encoded };
const path = "src/lib/terrain-data.ts";
const source = fs.readFileSync(path, "utf8");
fs.writeFileSync(
  path,
  source.replace(
    /export const CUSTOM_PATCHES: Record<string, number\[\]> = \{.*?\};/s,
    `export const CUSTOM_PATCHES: Record<string, number[]> = ${JSON.stringify(updated)};`,
  ),
);
console.log("Saved three Ocean brush contours; other patches preserved.");
