import { useEffect } from "react";
import { type Tool, useEditorStore } from "../stores/editorStore.ts";

const KEY_TO_TOOL: Record<string, Tool> = {
  s: "select",
  h: "pan",
  p: "pencil",
  a: "arrow",
  t: "text",
  w: "ward",
  d: "danger",
  m: "minion",
  r: "route",
  g: "marquee",
  e: "eraser",
};

export function handleEditorKeyDown(e: KeyboardEvent) {
  const { setTool, undo, redo, removeElement, selectedId } = useEditorStore.getState();
  const target = e.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable)
  ) {
    return;
  }
  const meta = e.ctrlKey || e.metaKey;
  if (meta && !e.shiftKey && e.key.toLowerCase() === "z") {
    e.preventDefault();
    undo();
    return;
  }
  if (meta && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
    e.preventDefault();
    redo();
    return;
  }
  if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
    e.preventDefault();
    removeElement(selectedId);
    return;
  }
  const tool = KEY_TO_TOOL[e.key.toLowerCase()];
  if (tool && !meta && !e.altKey) {
    e.preventDefault();
    setTool(tool);
  }
}

export function useEditorShortcuts() {
  useEffect(() => {
    window.addEventListener("keydown", handleEditorKeyDown);
    return () => window.removeEventListener("keydown", handleEditorKeyDown);
  }, []);
}
