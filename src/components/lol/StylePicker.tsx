import { useEditorStore, Thickness } from "@/stores/editorStore";
import { cn } from "@/lib/utils";

const SIZES: { id: Thickness; label: string; dot: string }[] = [
  { id: "S", label: "S", dot: "h-1.5 w-1.5" },
  { id: "M", label: "M", dot: "h-2.5 w-2.5" },
  { id: "L", label: "L", dot: "h-4 w-4" },
];

export function StylePicker() {
  const { color, setColor, thickness, setThickness, presets } = useEditorStore();

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Color
        </p>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={cn(
                "h-6 w-6 rounded-md border-2 transition-transform hover:scale-110",
                color === c ? "border-primary" : "border-transparent",
              )}
              aria-label={`Color ${c}`}
            />
          ))}
          <label
            className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-2 border-border bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500"
            title="Custom color"
          >
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Size
        </p>
        <div className="flex gap-1.5">
          {SIZES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setThickness(s.id)}
              className={cn(
                "flex h-8 flex-1 items-center justify-center rounded-md border border-border bg-card transition-all hover:border-primary/60",
                thickness === s.id && "border-primary bg-primary/15",
              )}
              aria-label={`Size ${s.label}`}
            >
              <span
                className={cn("rounded-full bg-foreground", s.dot)}
                style={{ backgroundColor: color }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
