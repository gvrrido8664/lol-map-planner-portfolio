import { Map as MapIcon } from "lucide-react";
import { MapConditionsPanel } from "./MapConditionsPanel";
import { ELEMENTS, BARON_FORMS } from "@/lib/map-variants";
import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { EditorHeader } from "@/components/lol/EditorHeader";
import { ToolPalette } from "@/components/lol/ToolPalette";
import { StylePicker } from "@/components/lol/StylePicker";
import { TeamToggle } from "@/components/lol/TeamToggle";
import { WardKindPicker } from "@/components/lol/WardKindPicker";
import { ChampionGrid } from "@/components/lol/ChampionGrid";
import { CanvasToolbar } from "@/components/lol/CanvasToolbar";
import { MovementPanel } from "@/components/lol/MovementPanel";

import { MapCanvas } from "@/components/lol/MapCanvas";
import { useEditorStore } from "@/stores/editorStore";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import type { Champion } from "@/lib/champions";

export function EditorPage() {
  const { hydrate, setTool, tool, state } = useEditorStore();
  useEditorShortcuts();
  const [mapPanelOpen, setMapPanelOpen] = useState(false);
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);
  const [size, setSize] = useState({ w: 600, h: 600 });
  const stageWrap = useRef<HTMLDivElement | null>(null);

  // Restore the last saved strategy without discarding it on reload.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Observe canvas container size
  useEffect(() => {
    const el = stageWrap.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.max(200, r.width), h: Math.max(200, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <EditorHeader />

      <div className="flex min-h-0 flex-1">
        {/* LEFT PANEL */}
        <aside className="hidden w-[240px] shrink-0 flex-col gap-4 border-r border-border bg-sidebar p-3 md:flex">
          <section>
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Tools
            </h3>
            <ToolPalette />
          </section>
          <StylePicker />
          <section>
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Team side
            </h3>
            <TeamToggle />
          </section>
          <WardKindPicker />
          <section className="flex min-h-0 flex-1 flex-col">
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Champions
            </h3>
            <ChampionGrid
              selectedAlias={selectedChampion?.alias ?? null}
              onSelect={setSelectedChampion}
            />
          </section>
        </aside>

        {/* CENTER — CANVAS */}
        <main className="relative flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_center,_oklch(0.22_0.04_250)_0%,_oklch(0.14_0.03_250)_100%)]">
          <div className="pointer-events-auto absolute left-1/2 top-3 z-10 max-w-[calc(100%-24px)] -translate-x-1/2 overflow-x-auto">
            <CanvasToolbar />
          </div>
          {selectedChampion && (
            <div className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-md border border-primary bg-card/95 px-3 py-1 text-xs text-primary shadow">
              Click on the map to place <strong>{selectedChampion.name}</strong> · Esc to cancel
            </div>
          )}
          <div className="pointer-events-none absolute bottom-28 left-3 z-20 flex max-w-[calc(100%-24px)] flex-col items-start gap-1 md:bottom-3">
            <button
              type="button"
              aria-expanded={mapPanelOpen}
              aria-controls="map-conditions-panel"
              onClick={() => setMapPanelOpen((open) => !open)}
              className="pointer-events-auto flex min-h-10 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            >
              <MapIcon className="size-4 text-primary" /> Map & objectives
            </button>
            {(state.map.element !== "base" || state.map.baron !== "hunting") && (
              <span className="rounded bg-background/95 px-2 py-1 text-[11px] text-foreground">
                {ELEMENTS[state.map.element].name} · {BARON_FORMS[state.map.baron].name}
              </span>
            )}
          </div>
          {mapPanelOpen && (
            <div
              id="map-conditions-panel"
              className="pointer-events-none absolute right-3 top-16 bottom-44 z-30 flex md:bottom-16"
            >
              <MapConditionsPanel onClose={() => setMapPanelOpen(false)} />
            </div>
          )}
          {/* Simulador de recorrido: panel flotante con scroll propio */}
          {tool === "route" && !mapPanelOpen && (
            <div className="pointer-events-none absolute right-3 top-3 bottom-3 z-20 flex">
              <MovementPanel onClose={() => setTool("select")} />
            </div>
          )}
          <div ref={stageWrap} className="min-h-0 flex-1">
            <ClientOnly fallback={<div className="h-full w-full" />}>
              <MapCanvas
                width={size.w}
                height={size.h}
                selectedChampion={selectedChampion}
                onPlaceChampion={() => setSelectedChampion(null)}
              />
            </ClientOnly>
          </div>

          {/* Mobile tools strip */}
          <div className="border-t border-border bg-sidebar p-2 md:hidden">
            <ToolPalette />
          </div>
        </main>
      </div>
    </div>
  );
}
