// Datos de Data Dragon para el simulador de recorrido: velocidad base por
// campeón y objetos/botas que dan velocidad. Se pide una vez por sesión; si
// falla, el panel sigue funcionando con los valores manuales.
import type { MovementItem } from "./rift";

export type MovementChampion = { id: string; name: string; movespeed: number };
export type MovementData = {
  champions: MovementChampion[];
  boots: MovementItem[];
  items: MovementItem[];
};

const EMPTY: MovementData = { champions: [], boots: [], items: [] };

let cache: Promise<MovementData> | null = null;

export function loadMovementData(): Promise<MovementData> {
  if (!cache) cache = fetchMovementData().catch(() => EMPTY);
  return cache;
}

async function fetchMovementData(): Promise<MovementData> {
  const versions: string[] = await (
    await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
  ).json();
  const root = `https://ddragon.leagueoflegends.com/cdn/${versions[0]}/data/en_US`;
  const [championRes, itemRes] = await Promise.all([
    fetch(`${root}/champion.json`),
    fetch(`${root}/item.json`),
  ]);
  if (!championRes.ok || !itemRes.ok) throw new Error("Data Dragon unavailable");
  const [championData, itemData] = await Promise.all([championRes.json(), itemRes.json()]);

  const champions: MovementChampion[] = Object.values(
    championData.data as Record<string, { id: string; name: string; stats: { movespeed: number } }>,
  )
    .map((c) => ({ id: c.id, name: c.name, movespeed: c.stats.movespeed }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));

  const boots: MovementItem[] = [];
  const items: MovementItem[] = [];
  for (const [id, item] of Object.entries(
    itemData.data as Record<
      string,
      {
        name: string;
        maps?: Record<string, boolean>;
        gold?: { purchasable?: boolean };
        stats?: { FlatMovementSpeedMod?: number; PercentMovementSpeedMod?: number };
        tags?: string[];
      }
    >,
  )) {
    // Solo objetos comprables en la Grieta (mapa 11) que den velocidad.
    if (!item.maps?.["11"] || item.gold?.purchasable === false) continue;
    const flat = +(item.stats?.FlatMovementSpeedMod || 0);
    const pct = Math.round(+(item.stats?.PercentMovementSpeedMod || 0) * 100 * 10) / 10;
    if (!flat && !pct) continue;
    (item.tags?.includes("Boots") ? boots : items).push({ id, name: item.name, flat, pct });
  }
  boots.sort((a, b) => a.flat - b.flat || a.name.localeCompare(b.name, "en"));
  items.sort((a, b) => a.name.localeCompare(b.name, "en"));

  return { champions, boots, items };
}
