import { Swords } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";

export function EditorHeader() {
  const { state, setTitle } = useEditorStore();
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-sidebar px-4">
      <div className="flex items-center gap-2">
        <Swords className="h-5 w-5 text-primary" />
        <span className="font-display text-lg font-semibold tracking-wide text-foreground">
          LoL Map Planner
        </span>
      </div>
      <div className="mx-2 h-6 w-px bg-border" />
      <input
        value={state.title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Strategy title…"
        className="min-w-0 max-w-md flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground hover:border-border focus:border-primary focus:bg-card focus:outline-none"
      />
    </header>
  );
}
