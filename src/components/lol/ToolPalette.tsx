import {
  MousePointer2,
  Map,
  Pencil,
  ArrowUpRight,
  Type,
  Eye,
  AlertTriangle,
  Eraser,
  Users,
  Castle,
  RotateCcw,
  BoxSelect,
  Footprints,
  Trees,
  Sparkles,
  Paintbrush,
  Leaf,
  Mountain,
  Pickaxe,
  Flame,
} from "lucide-react";
import { Tool, useEditorStore } from "@/stores/editorStore";
import { cn } from "@/lib/utils";

const TOOLS: {
  id: Tool;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
}[] = [
  { id: "pencil", label: "Pencil", icon: Pencil, shortcut: "P" },
  { id: "select", label: "Select", icon: MousePointer2, shortcut: "S" },
  { id: "pan", label: "Pan (move map)", icon: Map, shortcut: "H" },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight, shortcut: "A" },
  { id: "text", label: "Text", icon: Type, shortcut: "T" },
  { id: "ward", label: "Ward", icon: Eye, shortcut: "W" },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle, shortcut: "D" },
  { id: "minion", label: "Minion wave", icon: Users, shortcut: "M" },
  { id: "eraser", label: "Eraser", icon: Eraser, shortcut: "E" },
  { id: "marquee", label: "Group select (move multiple allies)", icon: BoxSelect, shortcut: "G" },
  { id: "route", label: "Route A→B (distance and travel time)", icon: Footprints, shortcut: "R" },
];

export function ToolPalette() {
  const {
    tool,
    setTool,
    toggleTurrets,
    resetTurretPreset,
    state,
    turretPreset,
    showBushes,
    toggleBushes,
    showFaelights,
    toggleFaelights,
  } = useEditorStore();
  const turretsActive = state.elements.some((e) => e.type === "turret");
  const canToggleTurrets = turretPreset.length > 0 || turretsActive;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-8 gap-1.5 md:grid-cols-4">
        {TOOLS.map(({ id, label, icon: Icon, shortcut }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTool(id)}
            title={shortcut ? `${label} (${shortcut})` : label}
            className={cn(
              "group flex aspect-square items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:border-primary/60 hover:text-foreground",
              tool === id &&
                "border-primary bg-primary/15 text-primary shadow-[0_0_0_1px_var(--color-primary)]",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <button
          type="button"
          onClick={toggleFaelights}
          title={
            showFaelights
              ? `${state.map.element === "base" ? 8 : 12} Faelights ON — click to hide`
              : `${state.map.element === "base" ? 8 : 12} Faelights OFF — click to show`
          }
          className={cn(
            "group flex aspect-square items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:border-primary/60 hover:text-foreground",
            showFaelights &&
              "border-primary bg-primary/15 text-primary shadow-[0_0_0_1px_var(--color-primary)]",
          )}
        >
          <Sparkles className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => toggleTurrets()}
          disabled={!canToggleTurrets}
          title={
            canToggleTurrets
              ? turretsActive
                ? "Turrets ON — click to remove all"
                : "Turrets OFF — click to place all"
              : "No turret preset saved yet"
          }
          className={cn(
            "group flex aspect-square items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:border-primary/60 hover:text-foreground",
            turretsActive &&
              "border-primary bg-primary/15 text-primary shadow-[0_0_0_1px_var(--color-primary)]",
            !canToggleTurrets &&
              "cursor-not-allowed opacity-40 hover:border-border hover:text-muted-foreground",
          )}
        >
          <Castle className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={toggleBushes}
          title={showBushes ? "Bushes visible — click to hide" : "Show bushes"}
          className={cn(
            "group flex aspect-square items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:border-primary/60 hover:text-foreground",
            showBushes &&
              "border-primary bg-primary/15 text-primary shadow-[0_0_0_1px_var(--color-primary)]",
          )}
        >
          <Trees className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => resetTurretPreset()}
          title="Reset turret positions to default"
          className="group flex aspect-square items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:border-primary/60 hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
