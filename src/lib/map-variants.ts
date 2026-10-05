export const ELEMENTS = {
  base: {
    name: "Base Rift",
    color: "#C89B3C",
    effect: "Original terrain, before the second elemental drake is defeated.",
  },
  infernal: {
    name: "Infernal",
    color: "#F59E0B",
    effect:
      "Infernal Cinders appear in changing locations. Current Infernal terrain does not destroy walls.",
  },
  mountain: {
    name: "Mountain",
    color: "#D6B78A",
    effect:
      "New rock formations narrow jungle paths and the dragon approach. Routes and vision respect the added walls.",
  },
  ocean: {
    name: "Ocean",
    color: "#34D399",
    effect:
      "Jungle brush grows; extra brush, Honeyfruit and water appear. The planner uses approximate expanded brush for vision.",
  },
  cloud: {
    name: "Cloud",
    color: "#D2E9ED",
    effect:
      "Wind zones around buff camps and the dragon pit increase movement speed. Dashed zones are planning references.",
  },
  hextech: {
    name: "Hextech",
    color: "#67C7FF",
    effect:
      "Three pairs of Hexgates connect the map. Links show approximate entrances; walking estimates do not use portals.",
  },
  chemtech: {
    name: "Chemtech",
    color: "#B6DE54",
    effect:
      "Plants are empowered: longer Blast Cone jumps, shielding fruit and enhanced Scryer’s Blooms. There is no camouflage gas.",
  },
} as const;

export const BARON_FORMS = {
  hunting: {
    name: "Hunting · original pit",
    effect: "The Hunting Baron leaves the pit unchanged.",
  },
  territorial: {
    name: "Territorial · front wall",
    effect: "A wall divides the approach in front of the pit.",
  },
  allSeeing: {
    name: "All-Seeing · side tunnels",
    effect: "The front closes and two side entrances create a tunnel.",
  },
} as const;

export type ElementalRift = keyof typeof ELEMENTS;
export type BaronForm = keyof typeof BARON_FORMS;
export type MapVariant = { element: ElementalRift; baron: BaronForm };
export const DEFAULT_MAP: MapVariant = { element: "base", baron: "hunting" };

export function normalizeMapVariant(value: unknown): MapVariant {
  const input = value as Partial<MapVariant> | null;
  return {
    element: input?.element && Object.hasOwn(ELEMENTS, input.element) ? input.element : "base",
    baron: input?.baron && Object.hasOwn(BARON_FORMS, input.baron) ? input.baron : "hunting",
  };
}

export const MONSTERS = {
  baron: {
    name: "Baron Nashor",
    icon: "baron",
    x: 336.7,
    y: 295.8,
    condition: "First spawn at 20:00. Choose the pit form separately.",
  },
  herald: {
    name: "Rift Herald",
    icon: "riftherald",
    x: 331.5,
    y: 302.5,
    condition: "Occupies the northern pit before Baron.",
  },
  grubs: {
    name: "Void Grubs",
    icon: "grub",
    x: 336.7,
    y: 295.8,
    condition: "Early northern-pit objective. This marker represents the camp.",
  },
  dragon: {
    name: "Elemental drake",
    icon: "dragon",
    x: 663.5,
    y: 703.2,
    condition: "Use before the dragon element is known.",
  },
  infernal: {
    name: "Infernal Drake",
    icon: "dragon_infernal",
    x: 663.5,
    y: 703.2,
    condition: "An elemental drake; placing it does not transform the map.",
  },
  mountain: {
    name: "Mountain Drake",
    icon: "dragon_mountain",
    x: 663.5,
    y: 703.2,
    condition: "An elemental drake; placing it does not transform the map.",
  },
  ocean: {
    name: "Ocean Drake",
    icon: "dragon_ocean",
    x: 663.5,
    y: 703.2,
    condition: "An elemental drake; placing it does not transform the map.",
  },
  cloud: {
    name: "Cloud Drake",
    icon: "dragon_cloud",
    x: 663.5,
    y: 703.2,
    condition: "An elemental drake; placing it does not transform the map.",
  },
  hextech: {
    name: "Hextech Drake",
    icon: "dragon_hextech",
    x: 663.5,
    y: 703.2,
    condition: "An elemental drake; placing it does not transform the map.",
  },
  chemtech: {
    name: "Chemtech Drake",
    icon: "dragon_chemtech",
    x: 663.5,
    y: 703.2,
    condition: "An elemental drake; placing it does not transform the map.",
  },
  elder: {
    name: "Elder Dragon",
    icon: "dragon_elder",
    x: 663.5,
    y: 703.2,
    condition: "Available after a team claims Dragon Soul. Existing terrain stays unchanged.",
  },
} as const;
export type MonsterKind = keyof typeof MONSTERS;

// ponytail: reference coordinates, not the game's navigation/plant spawn data.
// Replace with a versioned navgrid/locator export for frame-accurate simulation.
export const HEXGATES = [
  [
    { x: 190, y: 760 },
    { x: 265, y: 570 },
  ],
  [
    { x: 810, y: 240 },
    { x: 735, y: 430 },
  ],
  [
    { x: 430, y: 245 },
    { x: 570, y: 755 },
  ],
] as const;
export const WIND_ZONES = [
  { x: 260, y: 470, radius: 83 },
  { x: 525, y: 730, radius: 83 },
  { x: 740, y: 530, radius: 83 },
  { x: 475, y: 270, radius: 83 },
  { x: 663.5, y: 703.2, radius: 53 },
] as const;

export const MAP_SOURCES = [
  {
    title: "Riot · 2026 objectives and Faelights",
    url: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-26-1-notes/",
  },
  {
    title: "Riot · Baron forms",
    url: "https://www.leagueoflegends.com/en-us/news/game-updates/2024-gameplay-preview/",
  },
  {
    title: "Riot · Infernal terrain",
    url: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-14-1-notes/",
  },
  {
    title: "Riot · Chemtech plants",
    url: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-12-22-notes/",
  },
  {
    title: "Riot · Hexgates",
    url: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-11-23-notes/",
  },
  {
    title: "Riot · Elemental transformation",
    url: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-9-23-notes/",
  },
];
