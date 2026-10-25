# Librerías elegidas

Criterios: código abierto con licencia permisiva, mantenimiento activo, sin dependencia de un proveedor de pago para funcionar, y que corran en la nube del Estado si el proyecto escala. Versiones fijadas exactas en cada `package.json` (consultadas en npm el 23 oct 2026).

| Necesidad | Elegida | Licencia | Por qué | Alternativa descartada |
| --- | --- | --- | --- | --- |
| Framework web | Next.js 16.4.3 | MIT | Server Components y Server Actions: los datos sensibles nunca pasan por el navegador sin filtrar | Remix (equipo más pequeño en RD conoce Next) |
| UI | React 19.3 | MIT | Tu stack | — |
| Mapa | MapLibre GL JS 6.13 | BSD-3 | Fork abierto de Mapbox GL, sin token ni cuota, WebGL rápido con miles de puntos | Leaflet (lento con muchas capas), Mapbox (licencia y costo) |
| Teselas base | OpenFreeMap (opcional) | Datos OSM (ODbL) | Gratis y sin clave; la demo funciona offline sin ellas | Google Maps (costo, términos) |
| Geometría | @turf/circle 7.4 | MIT | Radios de alertas en km reales | Cálculo manual |
| Base de datos | Supabase (Postgres + PostGIS) | Apache-2.0 | Autenticación, RLS y API listos; se puede auto-hospedar | Firebase (cerrado, sin SQL ni PostGIS) |
| Validación | Zod 4.6.7 | MIT | Un esquema sirve para tipos, formularios y entrada de la API | Yup, Valibot |
| Datos ficticios | @faker-js/faker 10.6 (locale `es`) | MIT | Nombres y variación realistas, deterministas con semilla | Listas a mano |
| Estilos | Tailwind CSS 4.3 | MIT | Tokens de color en `@theme`, sin CSS muerto | CSS Modules |
| Monorepo | pnpm 12 + Turborepo 2.11 | MIT | Paquetes internos y caché de tareas | Nx (más pesado) |
| Lint y formato | Biome 2.5 | MIT | Un binario reemplaza ESLint + Prettier, mucho más rápido | ESLint + Prettier |
| Pruebas | Vitest 5 | MIT | Rápido, compatible con TypeScript sin configuración | Jest |
| Lenguaje | TypeScript 6.0 | Apache-2.0 | Estable con Next.js 16 | TypeScript 7 (compilador nativo): migrar cuando Next.js lo soporte oficialmente |

## Decisiones tomadas durante la construcción

- **Sin wrapper de React para el mapa.** `apps/web/src/components/OperationsMap.tsx` usa MapLibre directamente con dos efectos (crear el mapa y actualizar datos). Menos dependencias y control total del ciclo de vida.
- **Worker de MapLibre servido localmente.** El bundler de Next.js no resuelve la URL del web worker de MapLibre 6; `scripts/copy-maplibre-worker.mjs` lo copia a `public/vendor/` en `predev`/`prebuild` y el componente llama `setWorkerUrl`.
- **Next.js 16.4.3 y Zod 4.6.7 en vez de las versiones previas:** `pnpm audit` reportó vulnerabilidades críticas en Next.js ≤ 16.4.0 y una alta en Zod < 4.6.6.

## Para más adelante

| Necesidad | Candidata |
| --- | --- |
| Tablero analítico | Apache ECharts u Observable Plot |
| Mapas de calor por zona | h3-js (celdas hexagonales) |
| App móvil para agentes | React Native + MapLibre Native |
| Pruebas de extremo a extremo | Playwright |
| Colas para el cruce inverso | pg-boss (colas sobre el mismo Postgres) |
| Teselas propias offline | PMTiles + Protomaps |
| Observabilidad | OpenTelemetry |
