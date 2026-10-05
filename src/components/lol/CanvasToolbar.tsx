import { useEffect, useState } from "react";
import {
  Undo2,
  Redo2,
  Trash2,
  Download,
  Keyboard,
  Eraser,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
} from "lucide-react";
import type Konva from "konva";
import { useEditorStore } from "@/stores/editorStore";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SHORTCUTS: { key: string; action: string }[] = [
  { key: "S", action: "Select" },
  { key: "H", action: "Pan (move map)" },
  { key: "P", action: "Pencil" },
  { key: "A", action: "Arrow" },
  { key: "T", action: "Text" },
  { key: "W", action: "Ward" },
  { key: "D", action: "Danger zone" },
  { key: "E", action: "Eraser" },
  { key: "F", action: "Toggle fog of war" },
  { key: "Ctrl/⌘ + Z", action: "Undo" },
  { key: "Ctrl/⌘ + Y", action: "Redo" },
  { key: "Del / Backspace", action: "Delete selected" },
  { key: "Space + drag", action: "Pan canvas" },
  { key: "Right-click + drag", action: "Pan canvas" },
  { key: "Mouse wheel", action: "Zoom" },
  { key: "Pinch (touch)", action: "Zoom" },
];

export function CanvasToolbar() {
  const { undo, redo, clearAll, clearDrawings, past, future, state, fogOfWar, toggleFogOfWar } =
    useEditorStore();
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmClearDrawings, setConfirmClearDrawings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen?.()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const exportPng = () => {
    const stage = (window as unknown as { __lolStage?: Konva.Stage }).__lolStage;
    if (!stage) return;
    const uri = stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });
    const link = document.createElement("a");
    link.download = `${(state.title || "strategy").replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.png`;
    link.href = uri;
    link.click();
  };

  return (
    <div className="pointer-events-auto flex w-max items-center gap-1 rounded-lg border border-border bg-card/95 p-1 shadow-lg backdrop-blur">
      <Button
        size="sm"
        variant="ghost"
        onClick={undo}
        disabled={past.length === 0}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={redo}
        disabled={future.length === 0}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-5 w-px bg-border" />
      <Button size="sm" variant="ghost" onClick={() => setConfirmClear(true)} title="Clear all">
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setConfirmClearDrawings(true)}
        title="Clear drawings (keep champions)"
      >
        <Eraser className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={exportPng} title="Export PNG">
        <Download className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-5 w-px bg-border" />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => (window as unknown as { __lolZoomOut?: () => void }).__lolZoomOut?.()}
        title="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => (window as unknown as { __lolZoomIn?: () => void }).__lolZoomIn?.()}
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => (window as unknown as { __lolZoomReset?: () => void }).__lolZoomReset?.()}
        title="Reset view"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-5 w-px bg-border" />
      <Button
        size="sm"
        variant={fogOfWar ? "default" : "ghost"}
        onClick={toggleFogOfWar}
        title="Toggle fog of war (F)"
      >
        {fogOfWar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" title="Shortcuts">
            <Keyboard className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>Speed up your workflow with these shortcuts.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
            {SHORTCUTS.map((s) => (
              <div
                key={s.key}
                className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-1.5"
              >
                <span className="text-muted-foreground">{s.action}</span>
                <kbd className="rounded bg-background px-1.5 py-0.5 text-xs font-mono text-foreground">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear the canvas?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes every element from the map — drawings, champions, wards, turrets — and
              the A→B route. You can undo it with Ctrl+Z.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAll();
                setConfirmClear(false);
              }}
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClearDrawings} onOpenChange={setConfirmClearDrawings}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear drawings?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes pencil strokes, arrows, text, wards, danger zones and the A→B route.
              Champions stay on the map. Undo with Ctrl+Z.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearDrawings();
                setConfirmClearDrawings(false);
              }}
            >
              Clear drawings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
