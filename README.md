# Red de Búsqueda RD

Demostración de un sistema que conecta denuncias de personas desaparecidas con los registros de personas sin identificar que ya existen en otras instituciones: pacientes NN en hospitales, detenidos sin documentos y cuerpos en patología forense. Incluye capas operativas del 911 (incidentes, alertas de menores, búsqueda de prófugos) y vistas distintas según el rol de quien consulta.

> **Todos los casos, nombres, registros e instituciones de este repositorio son ficticios.** Las cifras reales del problema están citadas en `docs/ARQUITECTURA.md`.

Autor: Ezequiel.

## Por qué

Entre enero de 2022 y febrero de 2026 la Policía Nacional recibió 3,313 denuncias de desaparición en República Dominicana. Muchas se resuelven tarde porque la persona ya estaba registrada en otra institución que nadie consultó. Este proyecto demuestra que el cruce es técnicamente sencillo si las instituciones comparten datos con reglas claras.

## Arranque rápido (sin base de datos)

```bash
pnpm install
cp .env.example apps/web/.env.local   # DATA_SOURCE=mock
pnpm dev                              # http://localhost:3000
```

Cambia de rol arriba a la derecha (Público, Operador 911, Fiscalía) para ver cómo cambia lo que se muestra. Abre un caso para ver el cruce explicado y confirmar una identidad como Fiscalía.

## Con Supabase local

```bash
pnpm db:start        # requiere Docker; imprime URL y anon key
pnpm db:reset        # migraciones + datos ficticios
# en apps/web/.env.local: DATA_SOURCE=supabase y las claves impresas
pnpm dev
```

Los usuarios nuevos entran con rol `publico`. Para probar otros roles, cambia `profiles.role` desde Supabase Studio (http://127.0.0.1:54323).

## Estructura

```
apps/web            Next.js 16 · MapLibre · Tailwind 4
packages/domain     tipos, esquemas Zod, reglas de privacidad
packages/matching   motor de cruce explicable (puro, con pruebas)
packages/seed       escenario ficticio determinista → supabase/seed.sql
supabase/           migraciones PostGIS, RLS, auditoría, pruebas de permisos
docs/               arquitectura, motor, seguridad, librerías, negocio, roadmap, ADRs
```

## Calidad

```bash
pnpm check           # Biome + TypeScript + Vitest
```

El CI corre además `pnpm audit`, el build de producción y las migraciones con la prueba de permisos sobre Postgres + PostGIS.

## Documentación

- [Arquitectura](docs/ARQUITECTURA.md)
- [Motor de cruce](docs/MOTOR-CRUCE.md)
- [Seguridad y privacidad](docs/SEGURIDAD.md)
- [Librerías elegidas](docs/LIBRERIAS.md)
- [Modelos de negocio](docs/NEGOCIO.md)
- [Hoja de ruta](docs/ROADMAP.md)
- [Decisiones de arquitectura (ADR)](docs/adr/)
