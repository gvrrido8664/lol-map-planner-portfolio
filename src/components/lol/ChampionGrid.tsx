import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { Champion, ChampionRole, fetchChampions } from "@/lib/champions";
import { cn } from "@/lib/utils";

const ROLES: { id: ChampionRole | "ALL"; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "TOP", label: "Top" },
  { id: "JUNGLE", label: "Jng" },
  { id: "MIDDLE", label: "Mid" },
  { id: "BOTTOM", label: "Adc" },
  { id: "SUPPORT", label: "Sup" },
];

type Props = {
  selectedAlias: string | null;
  onSelect: (champion: Champion | null) => void;
};

export function ChampionGrid({ selectedAlias, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<ChampionRole | "ALL">("ALL");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["champions"],
    queryFn: fetchChampions,
    staleTime: 1000 * 60 * 60,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.filter((c) => {
      if (role !== "ALL" && !c.roles.includes(role)) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.alias.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [data, query, role]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search champion…"
          className="w-full rounded-md border border-border bg-card py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="mb-2 flex gap-1">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            className={cn(
              "flex-1 rounded px-1 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors",
              role === r.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {isError && (
          <p className="text-center text-xs text-destructive">Failed to load champions</p>
        )}
        <div className="grid grid-cols-4 gap-1">
          {filtered.map((c) => {
            const active = selectedAlias === c.alias;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(active ? null : c)}
                title={c.name}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-md border-2 border-transparent transition-all hover:border-primary/60",
                  active && "border-primary shadow-[0_0_0_1px_var(--color-primary)]",
                )}
              >
                <img
                  src={c.iconUrl}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/70 px-1 py-0.5 text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
