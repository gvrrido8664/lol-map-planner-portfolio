import { useEditorStore } from "@/stores/editorStore";
import { cn } from "@/lib/utils";

export function TeamToggle() {
  const { team, setTeam } = useEditorStore();
  return (
    <div className="flex rounded-md border border-border p-0.5">
      <button
        type="button"
        onClick={() => setTeam("blue")}
        className={cn(
          "flex-1 rounded px-2 py-1 text-xs font-medium transition-colors",
          team === "blue"
            ? "bg-team-blue text-white"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Ally
      </button>
      <button
        type="button"
        onClick={() => setTeam("red")}
        className={cn(
          "flex-1 rounded px-2 py-1 text-xs font-medium transition-colors",
          team === "red" ? "bg-team-red text-white" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Enemy
      </button>
    </div>
  );
}
