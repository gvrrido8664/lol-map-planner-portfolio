import { create } from "zustand";
import {
  DEFAULT_MOVEMENT,
  DEFAULT_TURRETS,
  type MovementItem,
  type MovementStats,
} from "../lib/rift.ts";

import {
  DEFAULT_MAP,
  MONSTERS,
  normalizeMapVariant,
  type MapVariant,
  type MonsterKind,
} from "../lib/map-variants.ts";

export type Tool =
  | "select"
  | "pan"
  | "pencil"
  | "arrow"
  | "text"
  | "ward"
  | "danger"
  | "minion"
  | "marquee"
  | "eraser"
  | "route";

export type TeamSide = "blue" | "red";
export type Thickness = "S" | "M" | "L" | "XL";
export type GamePhase = "early" | "mid" | "late" | "full";

export type CanvasPoint = { x: number; y: number };
type BaseEl = { id: string };

export type PencilElement = BaseEl & {
  type: "pencil";
  points: number[]; // flat [x,y,x,y,...]
  color: string;
  thickness: Thickness;
};

export type ArrowElement = BaseEl & {
  type: "arrow";
  points: [number, number, number, number]; // x1,y1,x2,y2
  color: string;
  thickness: Thickness;
};

export type TextElement = BaseEl & {
  type: "text";
  x: number;
  y: number;
  text: string;
  color: string;
};

export type WardKind = "ward" | "pink";

export type WardElement = BaseEl & {
  type: "ward";
  x: number;
  y: number;
  team: TeamSide;
  kind: WardKind;
};

export type DangerElement = BaseEl & {
  type: "danger";
  x: number;
  y: number;
  radius: number;
  color: string;
};

export type ChampionElement = BaseEl & {
  type: "champion";
  x: number;
  y: number;
  championId: number;
  alias: string;
  name: string;
  iconUrl: string;
  team: TeamSide;
};

export type MinionWaveElement = BaseEl & {
  type: "minion";
  x: number;
  y: number;
  team: TeamSide;
};

export type TurretElement = BaseEl & {
  type: "turret";
  x: number;
  y: number;
  team: TeamSide;
};

export type MonsterElement = BaseEl & { type: "monster"; kind: MonsterKind; x: number; y: number };

export type AnyElement =
  | MonsterElement
  | PencilElement
  | ArrowElement
  | TextElement
  | WardElement
  | DangerElement
  | ChampionElement
  | MinionWaveElement
  | TurretElement;

export type StrategyState = {
  map: MapVariant;
  title: string;
  phase: GamePhase;
  tags: string[];
  notes: string;
  elements: AnyElement[];
};

const STORAGE_KEY = "lolmap:strategy";
const HISTORY_LIMIT = 50;

const PRESET_COLORS = [
  "#C89B3C", // gold
  "#F8F8F2",
  "#000000",
  "#5BC0EB",
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#A855F7",
  "#F59E0B",
];

const initial: StrategyState = {
  map: DEFAULT_MAP,
  title: "Untitled Strategy",
  phase: "early",
  tags: [],
  notes: "",
  elements: [
    { id: "epic-baron", type: "monster", kind: "baron", x: MONSTERS.baron.x, y: MONSTERS.baron.y },
    {
      id: "epic-dragon",
      type: "monster",
      kind: "dragon",
      x: MONSTERS.dragon.x,
      y: MONSTERS.dragon.y,
    },
  ],
};

type EditorStore = {
  // strategy
  state: StrategyState;
  // tool config
  tool: Tool;
  color: string;
  thickness: Thickness;
  team: TeamSide;
  wardKind: WardKind;
  selectedId: string | null;
  multiSelectedIds: string[];
  presets: string[];
  fogOfWar: boolean;
  showBushes: boolean;
  showTerrain: boolean;
  /** Un único interruptor para las doce Faelights. */
  showFaelights: boolean;
  /** Comparación andar/retroceder: canaliza 4 s en vez de 8 s. */
  empoweredRecall: boolean;
  // Ruta A→B: es una medición sobre el mapa y no se guarda con la estrategia,
  // pero sus puntos sí participan en undo/redo.
  movement: {
    origin: CanvasPoint | null;
    destination: CanvasPoint | null;
    stats: MovementStats;
  };
  // history
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  // actions
  setMapVariant: (patch: Partial<MapVariant>) => void;
  placeMonster: (kind: MonsterKind) => void;
  setTool: (t: Tool) => void;
  setColor: (c: string) => void;
  setThickness: (t: Thickness) => void;
  setTeam: (t: TeamSide) => void;
  setWardKind: (k: WardKind) => void;
  setSelected: (id: string | null) => void;
  setMultiSelected: (ids: string[]) => void;
  moveElementsBy: (ids: string[], dx: number, dy: number) => void;
  setFogOfWar: (v: boolean) => void;
  toggleFogOfWar: () => void;
  toggleBushes: () => void;
  toggleTerrain: () => void;
  toggleFaelights: () => void;
  setEmpoweredRecall: (v: boolean) => void;
  /** Alterna: primer clic fija A, segundo B, el siguiente empieza de nuevo. */
  setMovementPoint: (p: CanvasPoint) => void;
  setMovementStats: (patch: Partial<MovementStats>) => void;
  addMovementItem: (item: MovementItem) => void;
  removeMovementItem: (id: string) => void;
  resetMovement: () => void;
  setTitle: (title: string) => void;
  setPhase: (phase: GamePhase) => void;
  setNotes: (notes: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  // element ops (each pushes history)
  addElement: (el: AnyElement) => void;
  updateElement: (id: string, patch: Partial<AnyElement>) => void;
  removeElement: (id: string) => void;
  clearAll: () => void;
  clearDrawings: () => void;
  // history
  undo: () => void;
  redo: () => void;
  // persistence
  hydrate: () => void;
  persist: () => void;
  // turret preset
  turretPreset: { x: number; y: number; team: TeamSide }[];
  toggleTurrets: () => void;
  resetTurretPreset: () => void;
};

const TURRET_PRESET_KEY = "lolmap:turret-preset";

type HistorySnapshot = {
  state: StrategyState;
  movement: { origin: CanvasPoint | null; destination: CanvasPoint | null };
};

// Derived from in-game turret coords (map size 14870, origin bottom-left).
// normX = gameX/14.87 ; normY = (14870-gameY)/14.87
const DEFAULT_TURRET_PRESET: { x: number; y: number; team: TeamSide }[] = DEFAULT_TURRETS;

function loadTurretPreset(): { x: number; y: number; team: TeamSide }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TURRET_PRESET_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p) =>
        p &&
        typeof p.x === "number" &&
        typeof p.y === "number" &&
        (p.team === "blue" || p.team === "red"),
    );
  } catch {
    return [];
  }
}

function saveTurretPreset(preset: { x: number; y: number; team: TeamSide }[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TURRET_PRESET_KEY, JSON.stringify(preset));
  } catch {
    /* ignore */
  }
}

function loadInitial(): StrategyState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem("lolmap:current");
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as { savedAt?: number; state?: StrategyState };
    if (
      !parsed ||
      typeof parsed.savedAt !== "number" ||
      !parsed.state ||
      !Array.isArray(parsed.state.elements)
    ) {
      return initial;
    }
    const merged = { ...initial, ...parsed.state, map: normalizeMapVariant(parsed.state.map) };
    // Filter out removed element types from older saved states.
    merged.elements = (merged.elements ?? []).filter(
      (e) =>
        e &&
        (e.type !== "monster" || Object.hasOwn(MONSTERS, e.kind)) &&
        (e as { type?: string }).type !== "ping" &&
        !((e as { type?: string }).type === "ward" && (e as { kind?: string }).kind === "farsight"),
    );
    return merged;
  } catch {
    return initial;
  }
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  state: initial,
  tool: "pencil",
  color: PRESET_COLORS[0],
  thickness: "M",
  team: "blue",
  wardKind: "ward",
  selectedId: null,
  multiSelectedIds: [],
  presets: PRESET_COLORS,
  fogOfWar: false,
  showBushes: false,
  showTerrain: false,
  showFaelights: false,
  empoweredRecall: false,
  movement: { origin: null, destination: null, stats: DEFAULT_MOVEMENT },
  past: [],
  future: [],
  turretPreset: [],

  setMapVariant: (patch) => {
    const next = normalizeMapVariant({ ...get().state.map, ...patch });
    if (next.element === get().state.map.element && next.baron === get().state.map.baron) return;
    pushHistory(get, set);
    set((s) => ({ state: { ...s.state, map: next } }));
    get().persist();
  },
  placeMonster: (kind) => {
    if (!Object.hasOwn(MONSTERS, kind)) return;
    const monster = MONSTERS[kind];
    const id = makeId("epic");
    pushHistory(get, set);
    set((s) => {
      const isPreBaron = kind === "grubs" || kind === "herald";
      return {
        state: {
          ...s.state,
          map: isPreBaron ? { ...s.state.map, baron: "hunting" } : s.state.map,
          elements: [
            ...s.state.elements.filter(
              (el) => el.type !== "monster" || MONSTERS[el.kind].x < 500 !== monster.x < 500,
            ),
            { id, type: "monster", kind, x: monster.x, y: monster.y },
          ],
        },
        selectedId: id,
        multiSelectedIds: [],
        tool: "select",
      };
    });
    get().persist();
  },
  toggleTurrets: () => {
    const { state, turretPreset } = get();
    const hasAny = state.elements.some((e) => e.type === "turret");
    if (hasAny) {
      pushHistory(get, set);
      set((s) => ({
        state: {
          ...s.state,
          elements: s.state.elements.filter((e) => e.type !== "turret"),
        },
        selectedId: null,
      }));
      get().persist();
      return;
    }
    if (turretPreset.length === 0) return;
    pushHistory(get, set);
    const newTurrets: AnyElement[] = turretPreset.map((p) => ({
      id: makeId("tu"),
      type: "turret",
      x: p.x,
      y: p.y,
      team: p.team,
    }));
    set((s) => ({
      state: { ...s.state, elements: [...s.state.elements, ...newTurrets] },
    }));
    get().persist();
  },

  resetTurretPreset: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(TURRET_PRESET_KEY);
      } catch {
        /* ignore */
      }
    }
    saveTurretPreset(DEFAULT_TURRET_PRESET);
    pushHistory(get, set);
    set((s) => ({
      state: {
        ...s.state,
        elements: s.state.elements.filter((e) => e.type !== "turret"),
      },
      turretPreset: DEFAULT_TURRET_PRESET,
      selectedId: null,
    }));
    get().persist();
  },

  setTool: (t) => set({ tool: t, selectedId: null, multiSelectedIds: [] }),
  setColor: (c) => set({ color: c }),
  setThickness: (t) => set({ thickness: t }),
  setTeam: (t) => set({ team: t }),
  setWardKind: (k) => set({ wardKind: k }),
  setSelected: (id) => set({ selectedId: id }),
  setMultiSelected: (ids) => set({ multiSelectedIds: ids }),
  moveElementsBy: (ids, dx, dy) => {
    if (ids.length === 0 || (dx === 0 && dy === 0)) return;
    pushHistory(get, set);
    const idSet = new Set(ids);
    set((s) => ({
      state: {
        ...s.state,
        elements: s.state.elements.map((e) => {
          if (!idSet.has(e.id)) return e;
          if ("x" in e && "y" in e && typeof e.x === "number" && typeof e.y === "number") {
            return { ...e, x: e.x + dx, y: e.y + dy } as AnyElement;
          }
          return e;
        }),
      },
    }));
    get().persist();
  },
  setFogOfWar: (v) => set({ fogOfWar: v }),
  toggleFogOfWar: () => set((s) => ({ fogOfWar: !s.fogOfWar })),
  toggleBushes: () => set((s) => ({ showBushes: !s.showBushes })),
  toggleTerrain: () => set((s) => ({ showTerrain: !s.showTerrain })),
  toggleFaelights: () => set((s) => ({ showFaelights: !s.showFaelights })),
  setEmpoweredRecall: (v) => set({ empoweredRecall: v }),
  setMovementPoint: (p) => {
    pushHistory(get, set);
    set((s) => ({
      movement:
        s.movement.origin && !s.movement.destination
          ? { ...s.movement, destination: p }
          : { ...s.movement, origin: p, destination: null },
    }));
  },
  setMovementStats: (patch) =>
    set((s) => ({ movement: { ...s.movement, stats: { ...s.movement.stats, ...patch } } })),
  addMovementItem: (item) =>
    set((s) =>
      s.movement.stats.items.some((i) => i.id === item.id)
        ? s
        : {
            movement: {
              ...s.movement,
              stats: { ...s.movement.stats, items: [...s.movement.stats.items, item] },
            },
          },
    ),
  removeMovementItem: (id) =>
    set((s) => ({
      movement: {
        ...s.movement,
        stats: { ...s.movement.stats, items: s.movement.stats.items.filter((i) => i.id !== id) },
      },
    })),
  resetMovement: () => {
    if (!get().movement.origin && !get().movement.destination) return;
    pushHistory(get, set);
    set((s) => ({ movement: { ...s.movement, origin: null, destination: null } }));
  },

  setTitle: (title) => {
    pushHistory(get, set);
    set((s) => ({ state: { ...s.state, title } }));
    get().persist();
  },
  setPhase: (phase) => {
    pushHistory(get, set);
    set((s) => ({ state: { ...s.state, phase } }));
    get().persist();
  },
  setNotes: (notes) => {
    set((s) => ({ state: { ...s.state, notes } }));
    get().persist();
  },
  addTag: (tag) => {
    const t = tag.trim();
    if (!t) return;
    pushHistory(get, set);
    set((s) =>
      s.state.tags.includes(t) ? s : { state: { ...s.state, tags: [...s.state.tags, t] } },
    );
    get().persist();
  },
  removeTag: (tag) => {
    pushHistory(get, set);
    set((s) => ({ state: { ...s.state, tags: s.state.tags.filter((x) => x !== tag) } }));
    get().persist();
  },

  addElement: (el) => {
    pushHistory(get, set);
    set((s) => ({ state: { ...s.state, elements: [...s.state.elements, el] } }));
    get().persist();
  },
  updateElement: (id, patch) => {
    pushHistory(get, set);
    set((s) => ({
      state: {
        ...s.state,
        elements: s.state.elements.map((e) =>
          e.id === id ? ({ ...e, ...patch } as AnyElement) : e,
        ),
      },
    }));
    get().persist();
  },
  removeElement: (id) => {
    pushHistory(get, set);
    set((s) => ({
      state: { ...s.state, elements: s.state.elements.filter((e) => e.id !== id) },
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
    get().persist();
  },
  // Borrar también limpia la ruta A→B: es una marca sobre el mapa, y dejarla
  // colgando tras un "borrar todo" confundía.
  clearAll: () => {
    pushHistory(get, set);
    set((s) => ({
      state: { ...s.state, elements: [] },
      selectedId: null,
      movement: { ...s.movement, origin: null, destination: null },
    }));
    get().persist();
  },
  clearDrawings: () => {
    pushHistory(get, set);
    set((s) => ({
      state: {
        ...s.state,
        elements: s.state.elements.filter((e) => e.type === "champion"),
      },
      selectedId: null,
      movement: { ...s.movement, origin: null, destination: null },
    }));
    get().persist();
  },

  undo: () => {
    const { past, state, future, movement } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      state: previous.state,
      movement: { ...movement, ...previous.movement },
      future: [snapshot(state, movement), ...future].slice(0, HISTORY_LIMIT),
      selectedId: null,
    });
    get().persist();
  },
  redo: () => {
    const { past, state, future, movement } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      past: [...past, snapshot(state, movement)].slice(-HISTORY_LIMIT),
      state: next.state,
      movement: { ...movement, ...next.movement },
      future: future.slice(1),
      selectedId: null,
    });
    get().persist();
  },

  hydrate: () => {
    const loaded = loadInitial();
    // Always use hardcoded defaults; ignore any stale stored override.
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(TURRET_PRESET_KEY);
      } catch {
        /* ignore */
      }
    }
    set({ state: loaded, past: [], future: [], turretPreset: DEFAULT_TURRET_PRESET });
  },
  persist: () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ savedAt: Date.now(), state: get().state }),
      );
    } catch {
      /* ignore */
    }
  },
}));

function pushHistory(get: () => EditorStore, set: (partial: Partial<EditorStore>) => void) {
  const { state, movement, past } = get();
  set({
    past: [...past, snapshot(state, movement)].slice(-HISTORY_LIMIT),
    future: [],
  });
}

function snapshot(state: StrategyState, movement: EditorStore["movement"]): HistorySnapshot {
  return { state, movement: { origin: movement.origin, destination: movement.destination } };
}

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function thicknessToPx(t: Thickness): number {
  return t === "S" ? 2 : t === "M" ? 4 : t === "L" ? 7 : 24;
}
