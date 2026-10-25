# ADR 0001 · Monorepo con paquetes puros

**Estado:** aceptada · 2026-10-23

## Contexto

El motor de cruce es la pieza de más valor y la que más cambiará. Debe poder probarse sin base de datos ni navegador, y reutilizarse en un worker, una Edge Function o una app móvil.

## Decisión

Monorepo pnpm + Turborepo. `packages/domain` y `packages/matching` no dependen de React, Next.js ni Supabase. La app web depende de ellos, nunca al revés. Los paquetes internos se consumen como TypeScript fuente (`transpilePackages`), sin paso de build.

## Consecuencias

- Las reglas de negocio tienen pruebas rápidas y deterministas.
- Un cambio en el dominio se nota en todos los consumidores en el mismo PR.
- Si un paquete se publica fuera del repo, habrá que añadirle build.
