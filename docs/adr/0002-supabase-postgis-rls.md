# ADR 0002 · Supabase con PostGIS y permisos en la base de datos

**Estado:** aceptada · 2026-10-23

## Contexto

Los datos son sensibles y los roles ven cosas distintas. Si los permisos solo viven en la aplicación, un error en una pantalla expone datos de salud o de justicia.

## Decisión

Postgres con PostGIS vía Supabase. Row Level Security en todas las tablas; transiciones críticas (cerrar caso, confirmar identidad) bloqueadas por trigger; auditoría por trigger y por función `security definer`. La app usa siempre el cliente con la sesión del usuario.

## Consecuencias

- La barrera real está en un solo lugar y se prueba con SQL (`rls_smoke.sql`).
- Supabase es auto-hospedable (Apache-2.0), así que no ata a un proveedor.
- Las reglas se duplican en `packages/domain/privacy.ts` para la UI; deben mantenerse iguales (las pruebas de ambos lados lo vigilan).
