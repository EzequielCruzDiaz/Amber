# ADR 0003 · Motor de cruce por reglas explicables

**Estado:** aceptada · 2026-10-23

## Contexto

Un puntaje alto lleva a un fiscal a contactar a una familia. Esa decisión debe poder justificarse, y no existen datos históricos etiquetados para entrenar un modelo.

## Decisión

Filtros duros + suma de puntos por factor, con pesos en configuración y cada punto acompañado de una etiqueta legible. Ninguna coincidencia cierra un caso: solo prioriza qué revisar.

## Consecuencias

- Se puede explicar cada resultado y auditar cada cambio de pesos.
- La precisión depende de la calidad de captura, de ahí el catálogo de señas codificadas.
- Un modelo estadístico o biométrico podrá sumarse como un factor más, con su propia ADR.
