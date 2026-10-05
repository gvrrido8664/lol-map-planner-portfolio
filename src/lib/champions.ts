// CommunityDragon champion data + icon URLs.
const CDRAGON_BASE = "https://raw.communitydragon.org/latest";

export type ChampionRole = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "SUPPORT";

export type Champion = {
  id: number;
  alias: string;
  name: string;
  iconUrl: string;
  roles: ChampionRole[];
};

type CDragonChampionSummary = {
  id: number;
  name: string;
  alias: string;
  squarePortraitPath: string;
  roles: string[];
};

// Canonical lane positions baked from Meraki Analytics data.
// Embedded to avoid CORS/large-fetch issues at runtime.
export const CHAMPION_POSITIONS: Record<string, ChampionRole[]> = {
  Aatrox: ["TOP"],
  Ahri: ["MIDDLE"],
  Akali: ["MIDDLE", "TOP"],
  Akshan: ["MIDDLE"],
  Alistar: ["SUPPORT"],
  Ambessa: ["TOP"],
  Amumu: ["JUNGLE", "SUPPORT"],
  Anivia: ["MIDDLE"],
  Annie: ["MIDDLE"],
  Aphelios: ["BOTTOM"],
  Ashe: ["BOTTOM", "SUPPORT"],
  AurelionSol: ["MIDDLE"],
  Aurora: ["MIDDLE", "TOP"],
  Azir: ["MIDDLE"],
  Bard: ["SUPPORT"],
  Belveth: ["JUNGLE"],
  Blitzcrank: ["SUPPORT"],
  Brand: ["JUNGLE", "MIDDLE", "SUPPORT"],
  Braum: ["SUPPORT"],
  Briar: ["JUNGLE"],
  Caitlyn: ["BOTTOM"],
  Camille: ["SUPPORT", "TOP"],
  Cassiopeia: ["MIDDLE"],
  Chogath: ["TOP"],
  Corki: ["MIDDLE"],
  Darius: ["TOP"],
  Diana: ["JUNGLE", "MIDDLE"],
  DrMundo: ["TOP"],
  Draven: ["BOTTOM"],
  Ekko: ["JUNGLE", "MIDDLE"],
  Elise: ["JUNGLE"],
  Evelynn: ["JUNGLE"],
  Ezreal: ["BOTTOM"],
  Fiddlesticks: ["JUNGLE"],
  Fiora: ["TOP"],
  Fizz: ["MIDDLE"],
  Galio: ["MIDDLE", "SUPPORT"],
  Gangplank: ["TOP"],
  Garen: ["TOP"],
  Gnar: ["TOP"],
  Gragas: ["JUNGLE", "MIDDLE", "TOP"],
  Graves: ["JUNGLE"],
  Gwen: ["JUNGLE", "TOP"],
  Hecarim: ["JUNGLE"],
  Heimerdinger: ["MIDDLE", "SUPPORT", "TOP"],
  Hwei: ["MIDDLE", "SUPPORT"],
  Illaoi: ["TOP"],
  Irelia: ["MIDDLE", "TOP"],
  Ivern: ["JUNGLE"],
  Janna: ["SUPPORT"],
  JarvanIV: ["JUNGLE"],
  Jax: ["JUNGLE", "TOP"],
  Jayce: ["MIDDLE", "TOP"],
  Jhin: ["BOTTOM"],
  Jinx: ["BOTTOM"],
  KSante: ["TOP"],
  Kaisa: ["BOTTOM"],
  Kalista: ["BOTTOM"],
  Karma: ["MIDDLE", "SUPPORT", "TOP"],
  Karthus: ["JUNGLE"],
  Kassadin: ["MIDDLE"],
  Katarina: ["MIDDLE"],
  Kayle: ["TOP"],
  Kayn: ["JUNGLE"],
  Kennen: ["TOP"],
  Khazix: ["JUNGLE"],
  Kindred: ["JUNGLE"],
  Kled: ["TOP"],
  KogMaw: ["BOTTOM"],
  Leblanc: ["MIDDLE"],
  LeeSin: ["JUNGLE"],
  Leona: ["SUPPORT"],
  Lillia: ["JUNGLE"],
  Lissandra: ["MIDDLE"],
  Lucian: ["BOTTOM"],
  Lulu: ["SUPPORT"],
  Lux: ["MIDDLE", "SUPPORT"],
  Malphite: ["MIDDLE", "SUPPORT", "TOP"],
  Malzahar: ["MIDDLE"],
  Maokai: ["JUNGLE", "SUPPORT"],
  MasterYi: ["JUNGLE"],
  Mel: ["MIDDLE", "SUPPORT"],
  Milio: ["SUPPORT"],
  MissFortune: ["BOTTOM"],
  Mordekaiser: ["TOP"],
  Morgana: ["SUPPORT"],
  Naafiri: ["MIDDLE"],
  Nami: ["SUPPORT"],
  Nasus: ["TOP"],
  Nautilus: ["SUPPORT"],
  Neeko: ["MIDDLE", "SUPPORT"],
  Nidalee: ["JUNGLE"],
  Nilah: ["BOTTOM"],
  Nocturne: ["JUNGLE"],
  Nunu: ["JUNGLE"],
  Olaf: ["TOP"],
  Orianna: ["MIDDLE"],
  Ornn: ["TOP"],
  Pantheon: ["JUNGLE", "MIDDLE", "SUPPORT", "TOP"],
  Poppy: ["JUNGLE", "TOP"],
  Pyke: ["SUPPORT"],
  Qiyana: ["MIDDLE"],
  Quinn: ["TOP"],
  Rakan: ["SUPPORT"],
  Rammus: ["JUNGLE"],
  RekSai: ["JUNGLE"],
  Rell: ["SUPPORT"],
  Renata: ["SUPPORT"],
  Renekton: ["TOP"],
  Rengar: ["JUNGLE", "TOP"],
  Riven: ["TOP"],
  Rumble: ["MIDDLE", "TOP"],
  Ryze: ["MIDDLE"],
  Samira: ["BOTTOM"],
  Sejuani: ["JUNGLE"],
  Senna: ["BOTTOM", "SUPPORT"],
  Seraphine: ["BOTTOM", "SUPPORT"],
  Sett: ["TOP"],
  Shaco: ["JUNGLE", "SUPPORT"],
  Shen: ["SUPPORT", "TOP"],
  Shyvana: ["JUNGLE"],
  Singed: ["TOP"],
  Sion: ["TOP"],
  Sivir: ["BOTTOM"],
  Skarner: ["JUNGLE", "TOP"],
  Smolder: ["BOTTOM", "MIDDLE", "TOP"],
  Sona: ["SUPPORT"],
  Soraka: ["SUPPORT"],
  Swain: ["BOTTOM", "MIDDLE", "SUPPORT"],
  Sylas: ["MIDDLE", "TOP"],
  Syndra: ["MIDDLE"],
  TahmKench: ["SUPPORT", "TOP"],
  Taliyah: ["JUNGLE", "MIDDLE"],
  Talon: ["JUNGLE"],
  Taric: ["MIDDLE", "SUPPORT"],
  Teemo: ["JUNGLE", "SUPPORT", "TOP"],
  Thresh: ["SUPPORT"],
  Tristana: ["BOTTOM", "MIDDLE"],
  Trundle: ["JUNGLE", "TOP"],
  Tryndamere: ["TOP"],
  TwistedFate: ["BOTTOM", "MIDDLE", "TOP"],
  Twitch: ["BOTTOM", "SUPPORT"],
  Udyr: ["JUNGLE", "TOP"],
  Urgot: ["TOP"],
  Varus: ["BOTTOM"],
  Vayne: ["BOTTOM", "TOP"],
  Veigar: ["MIDDLE", "SUPPORT"],
  Velkoz: ["MIDDLE", "SUPPORT"],
  Vex: ["MIDDLE"],
  Vi: ["JUNGLE"],
  Viego: ["JUNGLE"],
  Viktor: ["MIDDLE"],
  Vladimir: ["MIDDLE", "TOP"],
  Volibear: ["JUNGLE", "TOP"],
  Warwick: ["JUNGLE", "TOP"],
  MonkeyKing: ["JUNGLE", "TOP"],
  Xayah: ["BOTTOM"],
  Xerath: ["MIDDLE", "SUPPORT"],
  XinZhao: ["JUNGLE"],
  Yasuo: ["BOTTOM", "MIDDLE", "TOP"],
  Yone: ["MIDDLE", "TOP"],
  Yorick: ["TOP"],
  Yunara: ["BOTTOM"],
  Yuumi: ["SUPPORT"],
  Zac: ["JUNGLE", "SUPPORT", "TOP"],
  Zed: ["JUNGLE", "MIDDLE"],
  Zeri: ["BOTTOM"],
  Ziggs: ["BOTTOM", "MIDDLE"],
  Zilean: ["SUPPORT"],
  Zoe: ["MIDDLE"],
  Zyra: ["SUPPORT"],
};

export function championIconFromPath(path: string): string {
  const lower = path.toLowerCase().replace("/lol-game-data/assets/", "");
  return `${CDRAGON_BASE}/plugins/rcp-be-lol-game-data/global/default/${lower}`;
}

export async function fetchChampions(): Promise<Champion[]> {
  const res = await fetch(
    `${CDRAGON_BASE}/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json`,
  );
  if (!res.ok) throw new Error(`Failed to load champions: ${res.status}`);
  const data: CDragonChampionSummary[] = await res.json();
  return data
    .filter((c) => c.id > 0 && !c.alias.startsWith("Jade_"))
    .map((c) => ({
      id: c.id,
      alias: c.alias,
      name: c.name,
      iconUrl: championIconFromPath(c.squarePortraitPath),
      roles: CHAMPION_POSITIONS[c.alias] ?? [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

import summonersRift from "@/assets/summoners-rift.jpg";
export const SUMMONERS_RIFT_MAP_URL = summonersRift;
