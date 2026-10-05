import { WardKind, useEditorStore } from "@/stores/editorStore";
import { cn } from "@/lib/utils";

const WARDS: { id: WardKind; label: string; color: string }[] = [
  { id: "ward", label: "Ward", color: "bg-yellow-400" },
  { id: "pink", label: "Pink ward", color: "bg-pink-500" },
];

export function StrategyPanel() {
  const { state, setNotes, tool, wardKind, setWardKind } = useEditorStore();

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <section className="flex min-h-0 flex-1 flex-col">
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Notes
        </h3>
        <textarea
          value={state.notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your notes here…"
          className="min-h-[200px] flex-1 resize-none rounded-md border border-border bg-card p-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </section>

      {tool === "ward" && (
        <section>
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Ward type
          </h3>
          <div className="flex gap-1.5">
            {WARDS.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setWardKind(w.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 text-[11px] transition-colors",
                  wardKind === w.id && "border-primary bg-primary/15",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", w.color)} />
                {w.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-md border border-border bg-muted/30 p-2 text-[11px] text-muted-foreground">
        <p className="mb-1 font-semibold text-foreground">Tip</p>
        <p>
          Pick a champion from the left panel, then click the map to place it. Hold{" "}
          <kbd className="rounded bg-background px-1 font-mono">Space</kbd> to pan.
        </p>
      </section>
    </div>
  );
}
