# Red de Búsqueda RD — guía para asistentes de código

Demo de un sistema que cruza denuncias de personas desaparecidas con registros de personas sin identificar (hospitales, destacamentos, patología forense), con capas operativas del 911. **Todos los datos son ficticios.**

## Comandos

- `pnpm install` — instalar (pnpm 12, Node 22).
- `pnpm dev` — app web en modo mock, sin base de datos: http://localhost:3000
- `pnpm check` — lint + tipos + pruebas. Correr antes de cada commit.
- `pnpm seed` — regenerar `supabase/seed.sql` desde `@rb/seed`.
- `pnpm db:start` / `pnpm db:reset` — Supabase local (requiere Docker). `db:reset` aplica migraciones y seed.
- Prueba de permisos: `psql "$DATABASE_URL" -f supabase/tests/rls_smoke.sql`

## Mapa del repo

- `packages/domain` — tipos y esquemas Zod, catálogo de señas, reglas de visibilidad por rol. Sin dependencias de UI ni BD.
- `packages/matching` — motor de cruce. Funciones puras. Toda regla nueva lleva prueba en `test/`.
- `packages/seed` — escenario ficticio determinista (semilla) y exportación a SQL.
- `apps/web` — Next.js 16 (App Router). El acceso a datos pasa SIEMPRE por `src/lib/data` (`Repository`).
- `supabase/migrations` — esquema, RLS, auditoría, funciones. Nunca editar una migración ya aplicada; crear una nueva.
- `docs/` — arquitectura, motor de cruce, seguridad, librerías, negocio, roadmap y ADRs.

## Reglas que no se rompen

1. **Nada de datos reales de personas** en el repo, en seeds, en pruebas ni en capturas. Los nombres salen de Faker.
2. **La base de datos impone los permisos (RLS).** La app refleja las reglas de `packages/domain/src/privacy.ts` pero nunca es la única barrera. Toda tabla nueva: `enable row level security` + políticas + caso en `rls_smoke.sql`.
3. **El sistema propone, una persona decide.** Ningún código cierra un caso o confirma una identidad automáticamente. Solo `fiscalia`/`admin` confirman (trigger en BD).
4. **El motor de cruce es explicable.** Cada punto sale de un `Factor` con etiqueta legible. No introducir modelos opacos sin una ADR.
5. **Nunca usar la service role key en la app web.** Solo en scripts de servidor.
6. **La vista pública nunca muestra** ubicación exacta, estatura, señas, circunstancias ni casos de personas fallecidas.
7. Cambios de pesos del motor → actualizar `docs/MOTOR-CRUCE.md` y las pruebas.

## Convenciones

- TypeScript estricto (`noUncheckedIndexedAccess`). Biome para lint y formato.
- Idioma del dominio y la UI: español. Identificadores de código en inglés salvo términos del dominio (`en_busqueda`, `forense`).
- Coordenadas siempre `[lng, lat]` (GeoJSON/PostGIS).
- Fechas: ISO 8601 con zona; mostrar en `America/Santo_Domingo`.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`…).

## Próximos pasos sugeridos

Ver `docs/ROADMAP.md`. Lo más valioso ahora: el cruce inverso (escuchar `nuevo_registro` y calcular coincidencias contra casos abiertos) y el formulario para registrar un paciente NN.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
