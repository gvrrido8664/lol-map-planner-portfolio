import { X } from "lucide-react";
import {
  BARON_FORMS,
  ELEMENTS,
  MONSTERS,
  type BaronForm,
  type ElementalRift,
  type MonsterKind,
} from "@/lib/map-variants";
import { objectiveIcon } from "@/lib/objective-assets";
import { useEditorStore } from "@/stores/editorStore";

export function MapConditionsPanel({ onClose }: { onClose: () => void }) {
  const { state, setMapVariant, placeMonster, removeElement, showFaelights, toggleFaelights } =
    useEditorStore();
  const selectClass =
    "w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground";
  const labelClass = "flex flex-col gap-1 text-[11px] text-muted-foreground";

  return (
    <aside
      aria-label="Map conditions"
      className="pointer-events-auto flex max-h-[calc(100%-1.5rem)] w-[300px] flex-col overflow-hidden rounded-lg border border-border bg-card/95 shadow-xl backdrop-blur"
    >
      <header className="flex items-start justify-between border-b border-border px-3 py-2">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Environment
          </span>
          <h2 className="text-sm font-semibold text-foreground">Map & Objectives</h2>
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

      <div className="flex flex-col gap-2 overflow-y-auto p-3">
        <details open className="rounded-md border border-border bg-background/40">
          <summary className="cursor-pointer select-none px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Terrain Variants
          </summary>
          <div className="flex flex-col gap-3 border-t border-border p-2">
            <label className={labelClass}>
              Elemental Rift
              <select
                value={state.map.element}
                onChange={(e) => setMapVariant({ element: e.target.value as ElementalRift })}
                className={selectClass}
              >
                {Object.entries(ELEMENTS).map(([id, element]) => (
                  <option key={id} value={id}>
                    {element.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Baron Pit
              <select
                value={state.map.baron}
                onChange={(e) => setMapVariant({ baron: e.target.value as BaronForm })}
                className={selectClass}
              >
                {Object.entries(BARON_FORMS).map(([id, form]) => (
                  <option key={id} value={id}>
                    {form.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showFaelights}
                onChange={toggleFaelights}
                className="size-3.5 accent-primary"
              />
              Show Faelights
            </label>
          </div>
        </details>

        <details open className="rounded-md border border-border bg-background/40">
          <summary className="cursor-pointer select-none px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Epic Monsters
          </summary>
          <div className="flex flex-col gap-2 border-t border-border p-2">
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(MONSTERS).map(([kind, monster]) => {
                const active = state.elements.some(
                  (el) => el.type === "monster" && el.kind === kind,
                );
                return (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={active}
                    title={monster.name}
                    onClick={() => placeMonster(kind as MonsterKind)}
                    className={`flex min-h-9 items-center gap-2 rounded-md border px-2 py-1 text-left text-[11px] focus-visible:outline-2 focus-visible:outline-ring ${active ? "border-primary bg-primary/15 text-foreground" : "border-border hover:bg-muted"}`}
                  >
                    <img
                      src={objectiveIcon(monster.icon)}
                      alt=""
                      width={18}
                      height={18}
                      className="size-4 shrink-0 object-contain"
                    />
                    {monster.name}
                  </button>
                );
              })}
            </div>

            {state.elements.filter((el) => el.type === "monster").length > 0 && (
              <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
                {state.elements
                  .filter((el) => el.type === "monster")
                  .map(
                    (el) =>
                      el.type === "monster" && (
                        <div
                          key={el.id}
                          className="flex items-center justify-between gap-2 rounded bg-background px-2 py-1 text-[11px]"
                        >
                          <span className="flex items-center gap-1.5">
                            <img
                              src={objectiveIcon(MONSTERS[el.kind].icon)}
                              alt=""
                              width={12}
                              height={12}
                              className="size-3 shrink-0 object-contain opacity-70"
                            />
                            {MONSTERS[el.kind].name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeElement(el.id)}
                            aria-label={`Remove ${MONSTERS[el.kind].name}`}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ),
                  )}
              </div>
            )}
          </div>
        </details>
      </div>
    </aside>
  );
}
