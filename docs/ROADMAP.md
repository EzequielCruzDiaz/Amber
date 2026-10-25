# Hoja de ruta

## Hecho (v0.1)

- [x] Monorepo con dominio, motor de cruce y generador de escenarios, todo con pruebas
- [x] Esquema PostGIS con RLS por rol, triggers de transición y auditoría, probado en CI
- [x] App web: mapa operativo, lista de casos, detalle con cruce explicado, confirmación por Fiscalía
- [x] Modo mock sin base de datos y modo Supabase con el mismo código de UI

## Siguiente (v0.2 · demo completa)

- [ ] Formulario para registrar un paciente NN o un detenido sin identificar, con catálogo de señas
- [ ] Cruce inverso: worker que escucha `nuevo_registro` (pg-boss o Edge Function) y guarda coincidencias en `matches`
- [ ] Formulario de denuncia con validación Zod y alerta de menor automática
- [ ] Simulación de turno (reloj, eventos programados) como en la demo publicada
- [ ] Inicio de sesión con enlace mágico y pantalla de admin para asignar roles
- [ ] Estado `localizado_vivo_reservado` para adultos que no autorizan informar su paradero
- [ ] Pruebas de extremo a extremo con Playwright para los tres roles

## Después (v0.3 · listo para mostrar a instituciones)

- [ ] Panel de cifras reales con ingesta de agregados públicos (`packages/ingest`)
- [ ] Exportación de datos abiertos por provincia
- [ ] Modo sin conexión para agentes en campo (PWA)
- [ ] Contrato de datos (OpenAPI) para que una institución publique sus registros NN
- [ ] Revisión de seguridad externa y estudio de impacto en privacidad

## Piloto (con instituciones)

Ver el informe institucional: acuerdos firmados → piloto en el Gran Santo Domingo → expansión → biometría.
