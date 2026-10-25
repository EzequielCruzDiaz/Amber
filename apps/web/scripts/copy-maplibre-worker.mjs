// Copia el web worker de MapLibre a /public para servirlo desde el mismo origen.
// El bundler de Next.js no resuelve la URL del worker que MapLibre construye por
// su cuenta, así que el mapa no dibuja capas sin esto. Corre en predev y prebuild,
// por lo que el archivo siempre coincide con la versión instalada.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const src = join(
  dirname(require.resolve("maplibre-gl/package.json")),
  "dist",
  "maplibre-gl-worker.mjs",
);
const destDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "vendor");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, join(destDir, "maplibre-gl-worker.mjs"));
