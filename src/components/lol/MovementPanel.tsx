import { useEffect, useState } from "react";
import { LocateFixed, Plus, X } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { movementSpeedAt, walkVersusRecall, type Homeguard, type MovementItem } from "@/lib/rift";
import { loadMovementData, type MovementData } from "@/lib/ddragon";
import { cn } from "@/lib/utils";

// Botas por defecto: si Data Dragon no responde, el panel sigue siendo usable.
const FALLBACK_BOOTS = [
  { id: "0", name: "No boots", flat: 0 },
  { id: "b25", name: "Boots (+25)", flat: 25 },
  { id: "b45", name: "Upgraded boots (+45)", flat: 45 },
  { id: "b55", name: "Boots of Swiftness (+55)", flat: 55 },
];

// [%, duración, resistencia a ralentización]
const RUNE_BURSTS: { label: string; value: [number, number, number] }[] = [
  { label: "None", value: [0, 0, 0] },
  { label: "Fleet Footwork — melee (+20%, 1 s)", value: [20, 1, 0] },
  { label: "Fleet Footwork — ranged (+15%, 1 s)", value: [15, 1, 0] },
  { label: "Phase Rush — melee (+48%, 4 s)", value: [48, 4, 50] },
  { label: "Phase Rush — ranged (+36%, 4 s)", value: [36, 4, 50] },
  { label: "Nimbus Cloak (+15%, 2 s)", value: [15, 2, 0] },
  { label: "Nimbus Cloak (+30%, 2 s)", value: [30, 2, 0] },
  { label: "Nimbus Cloak (+45%, 2 s)", value: [45, 2, 0] },
];

// [%, duración, plano]
const ITEM_BURSTS: { label: string; value: [number, number, number] }[] = [
  { label: "None", value: [0, 0, 0] },
  { label: "Shurelya (+30%, 4 s)", value: [30, 4, 0] },
  { label: "Youmuu (+20%, 6 s)", value: [20, 6, 0] },
  { label: "Dead Man's Plate (+20 flat)", value: [0, 0, 20] },
  { label: "Mejai's with 10+ stacks (+10%)", value: [10, 999, 0] },
  { label: "Zephyr with 5 stacks (+25%)", value: [25, 999, 0] },
];

const HOMEGUARD: { id: Homeguard; label: string }[] = [
  { id: "homestart", label: "Homestart · 0:00–0:55" },
  { id: "early", label: "Homeguard · 0:20–13:59" },
  { id: "late", label: "Homeguard · 14:00+ / turret destroyed" },
];

const fieldClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground";
const labelClass = "flex flex-col gap-1 text-[11px] text-muted-foreground";

function Section({
  title,
  open,
  children,
}: {
  title: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={open} className="rounded-md border border-border bg-background/40">
      <summary className="cursor-pointer select-none px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </summary>
      <div className="flex flex-col gap-2 border-t border-border p-2">{children}</div>
    </details>
  );
}

function Num({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={fieldClass}
        {...rest}
      />
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary"
      />
      {label}
    </label>
  );
}

export function MovementPanel({ onClose }: { onClose: () => void }) {
  const {
    movement,
    setMovementStats,
    resetMovement,
    addMovementItem,
    removeMovementItem,
    team,
    state,
    empoweredRecall,
    setEmpoweredRecall,
  } = useEditorStore();
  const { origin, destination, stats } = movement;
  const [data, setData] = useState<MovementData | null>(null);
  const [pendingItem, setPendingItem] = useState("");

  useEffect(() => {
    let alive = true;
    loadMovementData().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, []);

  const comparison =
    origin && destination
      ? walkVersusRecall(
          origin,
          destination,
          { ...stats, terrain: state.map },
          team,
          empoweredRecall,
          state.elements.filter((el) => el.type === "minion"),
          state.elements.filter((el) => el.type === "turret"),
        )
      : null;
  const info = comparison?.walk ?? null;
  const boots = data?.boots.length
    ? [{ id: "0", name: "No boots", flat: 0 }, ...data.boots]
    : FALLBACK_BOOTS;
  const status = !origin
    ? "Mark the origin point on the map."
    : !destination
      ? "Now mark the destination."
      : !info
        ? ""
        : stats.avoidWalls
          ? `Walkable route · ${info.route.length - 1} segment${info.route.length === 2 ? "" : "s"}`
          : "Straight-line comparison";

  return (
    <aside className="pointer-events-auto flex max-h-[calc(100%-1.5rem)] w-[300px] flex-col overflow-hidden rounded-lg border border-border bg-card/95 shadow-xl backdrop-blur">
      <header className="flex items-start justify-between border-b border-border px-3 py-2">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Simulator
          </span>
          <h2 className="text-sm font-semibold text-foreground">Travel time</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* El contenido scrollea: la lista de ajustes es más alta que el panel. */}
      <div className="flex flex-col gap-2 overflow-y-auto p-3">
        <div className="rounded-md border border-border bg-background/40 p-2.5">
          <Check
            label="Calculate a route that avoids walls"
            checked={stats.avoidWalls}
            onChange={(v) => setMovementStats({ avoidWalls: v })}
          />
        </div>

        <p className="rounded border border-border bg-background/60 px-2 py-1.5 text-[11px] text-muted-foreground">
          {status}
        </p>

        <div className="grid grid-cols-3 gap-1.5 text-center">
          {[
            { value: info ? `${info.seconds.toFixed(2)} s` : "—", label: "time" },
            { value: info ? `${Math.round(info.distanceGameUnits)} u` : "—", label: "distance" },
            {
              // La velocidad de salida del tramo directo: si el Guardián no
              // aplica (A no sale de base), aquí tampoco debe contarse.
              value: `${Math.round(movementSpeedAt(comparison?.walkStats ?? stats))}`,
              label: "initial MS",
            },
          ].map((tile) => (
            <div key={tile.label} className="rounded border border-border bg-background/60 py-1.5">
              <div className="text-sm font-bold text-primary">{tile.value}</div>
              <div className="text-[10px] text-muted-foreground">{tile.label}</div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={resetMovement}
          className="flex items-center justify-center gap-2 rounded bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          Mark new route
        </button>

        {/* ¿Compensa retroceder? Se compara ir andando contra canalizar el
            retroceso en A y salir de la fuente del bando elegido. */}
        {comparison && (
          <div className="flex flex-col gap-1.5 rounded-md border border-border bg-background/40 p-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Walk or recall
              </span>
              <span className="text-[10px] text-muted-foreground">
                {team === "blue" ? "blue" : "red"} base
              </span>
            </div>

            {(
              [
                {
                  key: "walk" as const,
                  label: "Walking A → B",
                  seconds: comparison.walk.seconds,
                  detail:
                    stats.homeguard !== "none" && !comparison.homeguardOnWalk
                      ? `${Math.round(comparison.walk.distanceGameUnits)} u · no Homeguard (A is not at base)`
                      : `${Math.round(comparison.walk.distanceGameUnits)} u`,
                },
                {
                  key: "recall" as const,
                  label: "Recall + from base",
                  seconds: comparison.recall.seconds,
                  detail: `${comparison.recall.channel} s channel + ${comparison.recall.seconds - comparison.recall.channel > 0 ? (comparison.recall.seconds - comparison.recall.channel).toFixed(1) : "0"} s · ${Math.round(comparison.recall.distanceGameUnits)} u · ${comparison.recall.homeguardEndpointUnits > 0 ? `HG to ${Math.round(comparison.recall.homeguardEndpointUnits)} u` : "no Homeguard"}`,
                },
              ] as const
            ).map((option) => (
              <div
                key={option.key}
                className={cn(
                  "flex items-center justify-between rounded border px-2 py-1",
                  comparison.faster !== option.key && "border-border opacity-70",
                  comparison.faster === option.key &&
                    (option.key === "recall"
                      ? "border-violet-400/60 bg-violet-400/10"
                      : "border-cyan-400/60 bg-cyan-400/10"),
                )}
              >
                <div>
                  <div className="text-[11px] text-foreground">{option.label}</div>
                  <div className="text-[10px] text-muted-foreground">{option.detail}</div>
                </div>
                <div
                  className={cn(
                    "text-sm font-bold",
                    comparison.faster !== option.key && "text-muted-foreground",
                    comparison.faster === option.key &&
                      (option.key === "recall" ? "text-violet-300" : "text-cyan-300"),
                  )}
                >
                  {option.seconds.toFixed(1)} s
                </div>
              </div>
            ))}

            <p className="text-[11px] text-foreground">
              {comparison.faster === "recall" ? "Recall is faster" : "Walking is faster"}: saves{" "}
              <strong
                className={comparison.faster === "recall" ? "text-violet-300" : "text-cyan-300"}
              >
                {comparison.savedSeconds.toFixed(1)} s
              </strong>
            </p>

            <label className={cn(labelClass, "border-t border-border pt-2")}>
              Homeguard timing
              <select
                value={stats.homeguard}
                onChange={(e) => setMovementStats({ homeguard: e.target.value as Homeguard })}
                className={fieldClass}
              >
                {HOMEGUARD.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.label}
                  </option>
                ))}
              </select>
            </label>

            <p className="text-[10px] leading-relaxed text-muted-foreground">
              {stats.homeguard === "homestart"
                ? "175% bonus MS for up to 15 s. It refreshes in fountain during the first 55 s."
                : stats.homeguard === "early"
                  ? "80% → 40% over 4 s, ending 500 u behind the allied outer turret."
                  : "150% → 65% over 4 s, ending about 2000 u before the furthest marked minion wave."}{" "}
              Entering jungle is detected automatically and ends the speed bonus. After 14:00 it
              also restores 12% missing health and mana every 0.5 s in spawn.
            </p>

            <Check
              label="Empowered Recall (4 s channel)"
              checked={empoweredRecall}
              onChange={setEmpoweredRecall}
            />
          </div>
        )}

        {(state.map.element === "cloud" ||
          state.map.element === "hextech" ||
          state.map.element === "chemtech") && (
          <p className="text-xs text-muted-foreground">
            Walking estimate: excludes wind bonuses, Hexgates and plant jumps.
          </p>
        )}
        <Section title="Champion and equipment" open>
          <label className={labelClass}>
            Champion
            <select
              value={stats.championId}
              onChange={(e) => {
                const champion = data?.champions.find((c) => c.id === e.target.value);
                setMovementStats({
                  championId: e.target.value,
                  ...(champion ? { baseMs: champion.movespeed } : {}),
                });
              }}
              className={fieldClass}
            >
              <option value="">Custom</option>
              {data?.champions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.movespeed} MS
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <Num
              label="Base movement speed"
              value={stats.baseMs}
              min={250}
              max={450}
              onChange={(v) => setMovementStats({ baseMs: v })}
            />
            <Num
              label="Level"
              value={stats.level}
              min={1}
              max={18}
              onChange={(v) => setMovementStats({ level: v })}
            />
          </div>

          <label className={labelClass}>
            Boots
            <select
              value={String(stats.bootsFlat)}
              onChange={(e) => setMovementStats({ bootsFlat: Number(e.target.value) || 0 })}
              className={fieldClass}
            >
              {boots.map((b) => (
                <option key={b.id} value={b.flat}>
                  {b.name}
                  {b.flat ? ` (+${b.flat} MS)` : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-1.5">
            <select
              value={pendingItem}
              onChange={(e) => setPendingItem(e.target.value)}
              className={fieldClass}
            >
              <option value="">Add movement speed item…</option>
              {data?.items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (
                  {[i.flat ? `+${i.flat}` : "", i.pct ? `+${i.pct}%` : ""]
                    .filter(Boolean)
                    .join(", ")}
                  )
                </option>
              ))}
            </select>
            <button
              type="button"
              title="Add item"
              onClick={() => {
                const item = data?.items.find((i) => i.id === pendingItem);
                if (item) addMovementItem(item);
              }}
              className="rounded border border-border px-2 text-muted-foreground hover:border-primary/60 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {stats.items.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {stats.items.map((item: MovementItem) => (
                <span
                  key={item.id}
                  className="flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] text-foreground"
                >
                  {item.name} (
                  {[item.flat ? `+${item.flat}` : "", item.pct ? `+${item.pct}%` : ""]
                    .filter(Boolean)
                    .join(" · ")}
                  )
                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeMovementItem(item.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Section>

        <Section title="Runes and conditions">
          <Check
            label="Celerity"
            checked={stats.celerity}
            onChange={(v) => setMovementStats({ celerity: v })}
          />
          <Check
            label="Movement Speed Shard (+2.5%)"
            checked={stats.movementSpeedShard}
            onChange={(v) => setMovementStats({ movementSpeedShard: v })}
          />
          <Check
            label="Magical Footwear (+10)"
            checked={stats.magicalFootwear}
            onChange={(v) => setMovementStats({ magicalFootwear: v })}
          />
          <Check
            label="Waterwalking (+10, in river)"
            checked={stats.waterwalking}
            onChange={(v) => setMovementStats({ waterwalking: v })}
          />
          <label className={labelClass}>
            Relentless Hunter
            <span className="text-primary">
              {stats.relentlessStacks} stack{stats.relentlessStacks === 1 ? "" : "s"}
            </span>
            <input
              type="range"
              min={0}
              max={5}
              value={stats.relentlessStacks}
              onChange={(e) => setMovementStats({ relentlessStacks: Number(e.target.value) })}
              className="accent-primary"
            />
          </label>
          <label className={labelClass}>
            Approach Velocity
            <select
              value={String(stats.approachPct)}
              onChange={(e) => setMovementStats({ approachPct: Number(e.target.value) })}
              className={fieldClass}
            >
              <option value="0">Inactive</option>
              <option value="7.5">Impaired target (+7.5%)</option>
              <option value="15">Target impaired by you (+15%)</option>
            </select>
          </label>
          <label className={labelClass}>
            Temporary rune effect
            <select
              value={`${stats.runeBurstPct},${stats.runeBurstDuration},${stats.runeSlowResist}`}
              onChange={(e) => {
                const [pct, duration, resist] = e.target.value.split(",").map(Number);
                setMovementStats({
                  runeBurstPct: pct,
                  runeBurstDuration: duration,
                  runeSlowResist: resist,
                });
              }}
              className={fieldClass}
            >
              {RUNE_BURSTS.map((r) => (
                <option key={r.label} value={r.value.join(",")}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <Check
            label="Ghost (based on level, 10 s)"
            checked={stats.ghost}
            onChange={(v) => setMovementStats({ ghost: v })}
          />
          <label className={labelClass}>
            Item active / condition
            <select
              value={`${stats.itemBurstPct},${stats.itemBurstDuration},${stats.itemFlat}`}
              onChange={(e) => {
                const [pct, duration, flat] = e.target.value.split(",").map(Number);
                setMovementStats({
                  itemBurstPct: pct,
                  itemBurstDuration: duration,
                  itemFlat: flat,
                });
              }}
              className={fieldClass}
            >
              {ITEM_BURSTS.map((i) => (
                <option key={i.label} value={i.value.join(",")}>
                  {i.label}
                </option>
              ))}
            </select>
          </label>
        </Section>
      </div>
    </aside>
  );
}
