# Motor de cruce

`@rb/matching` compara una denuncia con un registro de persona sin identificar y devuelve un puntaje de 0 a 100 con la lista de razones. Es una función pura: mismo input, mismo resultado, sin red ni base de datos.

## Filtros duros (descartan el par)

| Regla | Motivo |
| --- | --- |
| Sexo distinto | Dato confiable en ambos lados |
| Registro ya vinculado a otro caso | Ya resuelto |
| Registro más de 6 h antes de la desaparición | Imposible; las 6 h cubren relojes y reportes imprecisos |
| Edad fuera del rango estimado ± 5 años | La edad avanza entre la desaparición y el registro |
| Estatura con más de 20 cm de diferencia | Margen amplio para errores de medición |

## Puntos

| Factor | Condición | Puntos |
| --- | --- | --- |
| Edad | Dentro del rango estimado | 28 |
| | Dentro de ± 5 años | 12 |
| Estatura | ± 4 cm | 15 |
| | ± 9 cm | 7 |
| Señas | Cada código exacto (`tatuaje:rosa:antebrazo_der`) | 26 |
| | Mismo tipo y zona, otro motivo | 10 |
| | Ambos tienen señas y ninguna coincide | −10 |
| | Máximo | 32 |
| Tiempo | ≤ 7 días después | 15 |
| | ≤ 30 días | 8 |
| | ≤ 90 días | 3 |
| Distancia | ≤ 35 km | 10 |
| | ≤ 110 km | 5 |

Umbrales: desde **55** se muestra al operador; desde **75** es prioridad alta. Los valores viven en `src/config.ts`.

## Por qué reglas y no un modelo de aprendizaje automático

- **Explicable:** un fiscal tiene que poder decir por qué revisó a esa persona.
- **Auditable:** los pesos están en el código y cambian con revisión.
- **Sin datos de entrenamiento:** no existe un histórico etiquetado en el país, y no se debe crear con datos reales sin un marco legal.

## Señas codificadas

Las instituciones describen la misma seña con palabras distintas. El catálogo `tipo:motivo:zona` (`packages/domain/src/marks.ts`) obliga a codificar al capturar, y el texto libre queda aparte. Es la mejora de mayor impacto en la calidad del cruce.

## Cómo cambiar un peso

1. Edita `DEFAULT_CONFIG`.
2. Añade o ajusta una prueba en `test/score.test.ts` que muestre el efecto.
3. Actualiza esta tabla.
4. Corre `pnpm test`: las pruebas de `@rb/seed` verifican que los cuatro casos ancla siguen encontrando su registro.

## Siguiente nivel

- **Biometría:** cuando existan, huellas (consulta a la JCE) y ADN (INACIF) reemplazan la mayoría de estas reglas; el motor pasa a ser el prefiltro que decide qué comparar.
- **Fotos:** comparación de rostro solo entre la foto aportada por la familia y fotos de registros NN, nunca contra cámaras en vivo.
