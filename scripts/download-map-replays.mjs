// Run locally: node --env-file=.env.local scripts/download-map-replays.mjs
// Uses Riot only to find current-patch Summoner's Rift terrain references.
import fs from "node:fs/promises";
import { setTimeout } from "node:timers/promises";

const key = process.env.RIOT_API_KEY;
if (!key || key === "PEGA_TU_CLAVE_AQUI") throw new Error("Configure RIOT_API_KEY locally");
const output = "repeticiones";
await fs.mkdir(output, { recursive: true });
const manifestPath = `${output}/mapas.json`;
let manifest = [];
try {
  manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
let requests = 0;
async function api(path, platform = "americas") {
  if (++requests > 180) throw new Error("Search limit reached; progress saved");
  await setTimeout(1350);
  const response = await fetch(`https://${platform}.api.riotgames.com/lol/${path}`, {
    headers: { "X-Riot-Token": key },
    signal: AbortSignal.timeout(30000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Riot HTTP ${response.status}; progress saved`);
  return response.json();
}
const league = await api("league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5", "la2");
const seen = new Set(manifest.map((m) => m.matchId));
for (const player of league.entries) {
  if (!player.puuid) continue;
  const replays = await api(
    `match/v5/matches/by-puuid/${encodeURIComponent(player.puuid)}/replays`,
  );
  for (const url of replays?.matchFileURLs ?? []) {
    const matchId = new URL(url).pathname.match(/la2_\d+/i)?.[0].toUpperCase();
    if (!matchId || seen.has(matchId)) continue;
    seen.add(matchId);
    const match = await api(`match/v5/matches/${matchId}`);
    const info = match?.info;
    if (
      !info ||
      info.mapId !== 11 ||
      ![400, 420, 440].includes(info.queueId) ||
      !info.gameVersion.startsWith("16.19.")
    )
      continue;
    const timeline = await api(`match/v5/matches/${matchId}/timeline`);
    const dragons =
      timeline?.info?.frames
        .flatMap((f) => f.events)
        .filter(
          (e) =>
            e.type === "ELITE_MONSTER_KILL" &&
            e.monsterType === "DRAGON" &&
            e.monsterSubType !== "ELDER_DRAGON",
        ) ?? [];
    const element = dragons[2]?.monsterSubType;
    if (!element || manifest.some((m) => m.element === element)) continue;
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw new Error(`Replay download HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const filename = `${matchId}-${element}.rofl`;
    await fs.writeFile(`${output}/${filename}`, bytes);
    manifest.push({
      matchId,
      element,
      filename,
      gameVersion: info.gameVersion,
      durationSeconds: info.gameDuration,
      transformedAtSeconds: dragons[1].timestamp / 1000,
      thirdDragonKilledAtSeconds: dragons[2].timestamp / 1000,
      bytes: bytes.length,
      headerHex: bytes.subarray(0, 8).toString("hex"),
      baronForm: "unverified",
    });
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`Downloaded ${element}: ${matchId}, ${bytes.length} bytes (${manifest.length}/6)`);
    if (manifest.length >= 6) break;
  }
  console.log(`Search: ${requests} requests, ${seen.size} matches, ${manifest.length}/6 elements`);
  if (manifest.length >= 6) break;
}
console.log(
  "Finished. Baron forms must be checked inside the replay; no API key saved in outputs.",
);
