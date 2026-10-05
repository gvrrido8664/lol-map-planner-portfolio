# Arquitectura
`src/routes/index.tsx` monta el editor; `EditorPage` combina paneles y canvas. `src/stores/editorStore.ts` es el estado compartido y el historial de acciones. `src/components/lol/MapCanvas.tsx` traduce elementos en nodos Konva. `src/lib/rift.ts` aplica geometría, muros, arbustos, rutas y velocidad. `map-variants.ts` define combinaciones de terreno; `terrain-data.ts` contiene deltas y correcciones locales. Los cambios de mapa pasan por el store para conservar undo/redo.

Los catálogos de campeones/items son datos públicos remotos. La estrategia se conserva en almacenamiento del navegador: no se transmite a un servidor de cuentas. El build incluye cliente y servidor de TanStack para Cloudflare; no se ejecutó despliegue.
