import assert from "node:assert/strict";
import { useEditorStore } from "./editorStore.ts";

const A = { x: 200, y: 800 };
const B = { x: 700, y: 300 };

useEditorStore.getState().setMovementPoint(A);
useEditorStore.getState().setMovementPoint(B);
useEditorStore.getState().undo();
assert.deepEqual(
  {
    origin: useEditorStore.getState().movement.origin,
    destination: useEditorStore.getState().movement.destination,
  },
  { origin: A, destination: null },
);
useEditorStore.getState().undo();
assert.equal(useEditorStore.getState().movement.origin, null);
useEditorStore.getState().redo();
assert.deepEqual(useEditorStore.getState().movement.origin, A);
useEditorStore.getState().redo();
assert.deepEqual(useEditorStore.getState().movement.destination, B);

console.log("OK · route points support undo and redo");

// Browser storage stand-ins: an old snapshot must survive hydration and reload.
const disk = new Map<string, string>();
const session = new Map<string, string>();
const storage = (data: Map<string, string>) => ({
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => data.set(key, value),
  removeItem: (key: string) => data.delete(key),
});
Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage(disk) });
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: storage(session),
});
const saved = {
  ...useEditorStore.getState().state,
  title: "Saved Ocean",
  map: { element: "ocean", baron: "allSeeing" },
};
session.set("lolmap:current", JSON.stringify({ savedAt: 1, state: saved }));
useEditorStore.getState().hydrate();
assert.deepEqual(
  useEditorStore.getState().state,
  saved,
  "Recover the previous session without a time limit",
);
useEditorStore.getState().persist();
session.clear();
useEditorStore.setState({ state: { ...saved, title: "Unsaved" } } as Parameters<
  typeof useEditorStore.setState
>[0]);
useEditorStore.getState().hydrate();
assert.deepEqual(
  useEditorStore.getState().state,
  saved,
  "Restore persisted strategy after closing the tab",
);
disk.set("lolmap:strategy", "invalid JSON");
assert.doesNotThrow(() => useEditorStore.getState().hydrate());
console.log("OK · durable strategy persistence, session migration and corrupt storage");
