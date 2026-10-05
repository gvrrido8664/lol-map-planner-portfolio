import { WardKind, useEditorStore } from "@/stores/editorStore";
import { cn } from "@/lib/utils";

const WARDS: { id: WardKind; label: string; title: string; color: string }[] = [
  {
    id: "ward",
    label: "Stealth",
    title: "Stealth Ward · 900 vision range",
    color: "bg-yellow-400",
  },
  { id: "pink", label: "Control", title: "Control Ward · 900 vision range", color: "bg-pink-500" },
];

export function WardKindPicker() {
  const { wardKind, setWardKind } = useEditorStore();
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Ward type
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {WARDS.map((w) => (
          <button
            key={w.id}
            type="button"
            title={w.title}
            onClick={() => setWardKind(w.id)}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-md border border-border bg-card px-1 py-2 text-[10px] leading-none transition-colors hover:border-primary/60 hover:text-foreground",
              wardKind === w.id && "border-primary bg-primary/15",
            )}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", w.color)} />
            <span className="whitespace-nowrap">{w.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
