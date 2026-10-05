import assert from "node:assert/strict";
import { handleEditorKeyDown } from "./use-editor-shortcuts.ts";
import { useEditorStore } from "../stores/editorStore.ts";

function press(key: string, modifiers: Partial<KeyboardEvent> = {}) {
  let prevented = false;
  handleEditorKeyDown({
    key,
    preventDefault: () => {
      prevented = true;
    },
    ...modifiers,
  } as KeyboardEvent);
  return prevented;
}

useEditorStore.getState().setMovementPoint({ x: 200, y: 800 });
assert.equal(press("z", { ctrlKey: true }), true);
assert.equal(useEditorStore.getState().movement.origin, null);
assert.equal(press("Z", { ctrlKey: true, shiftKey: true }), true);
assert.deepEqual(useEditorStore.getState().movement.origin, { x: 200, y: 800 });
press("z", { metaKey: true });
press("y", { metaKey: true });
assert.deepEqual(useEditorStore.getState().movement.origin, { x: 200, y: 800 });
assert.equal(press("g"), true);
assert.equal(useEditorStore.getState().tool, "marquee");
assert.equal(press("p", { altKey: true }), false);
for (const tagName of ["INPUT", "TEXTAREA", "SELECT"]) {
  assert.equal(press("p", { target: { tagName } as unknown as EventTarget }), false);
}
assert.equal(press("p", { target: { isContentEditable: true } as unknown as EventTarget }), false);
assert.equal(useEditorStore.getState().tool, "marquee");
console.log("OK · editor shortcuts, redo and editable controls");
