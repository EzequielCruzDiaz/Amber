# Seguridad y privacidad

El sistema maneja datos de salud, de justicia y de menores. Su legitimidad depende de los límites que se le pongan desde el diseño.

## Roles

| Rol | Ve | Puede |
| --- | --- | --- |
| `publico` | Fichas activas con nombre corto, edad y municipio (`public_cases()`); alertas de menores activas; cifras por provincia | Nada más |
| `operador` | Casos completos, registros de hospital y detención, incidentes 911, todas las alertas | Registrar casos y registros, enviar coincidencias a verificación |
| `fiscalia` | Todo lo anterior + patología forense + auditoría | Confirmar identidades y cerrar casos |
| `admin` | Todo | Asignar roles |

Las reglas viven en dos lugares que deben coincidir:

- **Base de datos** (`supabase/migrations/…_security.sql`): RLS por tabla y triggers que bloquean transiciones. Es la barrera real.
- **Dominio** (`packages/domain/src/privacy.ts`): las mismas reglas para que la UI no ofrezca acciones que la base de datos negaría, y para el modo mock.

`supabase/tests/rls_smoke.sql` comprueba que un operador no ve forense, no cierra casos ni confirma, que el público no ve tablas y que la consulta de cruce queda auditada. El CI la corre en cada cambio.

## Salvaguardas

1. **Finalidad cerrada.** Datos de salud y detención solo para identificar a una persona desaparecida o sin identificar.
2. **Consulta, no copia.** En producción cada institución conserva sus datos; la red pregunta y guarda solo la coincidencia.
3. **Cada lectura sensible se audita** (`log_access`). Cada escritura, por trigger.
4. **Quien no quiere ser encontrado.** Una persona adulta localizada con vida decide si se informa su paradero a quien la denunció. Protege a víctimas que huyeron de un agresor. *Pendiente de implementar: estado `localizado_vivo_reservado`.*
5. **Retiro de fichas.** Al cerrar el caso, la ficha pública desaparece (la función pública solo muestra localizados de los últimos 7 días, para el aviso de "apareció").
6. **Prófugos separados.** Comparte mapa, no permisos ni datos de salud.
7. **Sin reconocimiento facial masivo.**

## Prácticas en el código

- Nunca la service role key en la app web; solo el cliente con la sesión del usuario.
- Variables de entorno validadas con Zod al arrancar (`apps/web/src/lib/env.ts`).
- Entradas de Server Actions validadas con Zod; errores de permiso devueltos como mensaje, no como excepción sin manejar.
- Cabeceras de seguridad en `next.config.ts`; `robots: noindex` mientras sea demo.
- `pnpm audit` en CI. Versiones fijadas exactas; pnpm bloquea scripts de instalación salvo los aprobados en `pnpm-workspace.yaml`.

## Marco legal a revisar con asesoría

- Ley 172-13 de protección de datos personales.
- Ley 136-03, Código de protección de niños, niñas y adolescentes (difusión de datos de menores).
- Proyecto de ley de Alerta Amber (pendiente en el Congreso desde 2022).
