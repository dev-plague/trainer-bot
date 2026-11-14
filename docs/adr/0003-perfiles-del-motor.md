# ADR 0003 — Perfiles del motor como datos tipados

- **Estado:** aceptado
- **Fecha:** 2026-11-12
- **Decisión relacionada:** #55

## Contexto

El motor de planes necesita traducir cada objetivo a series, repeticiones, RIR, descanso y
cardio. Son números que un profesional debe poder revisar y que cambiarán con la evidencia o
con el feedback. Si viven repartidos en condicionales dentro del motor, revisarlos exige leer
código y cambiarlos exige buscar cada número.

## Decisión

Los perfiles objetivo × nivel son **constantes tipadas** validadas con Zod, cada una con su
campo `fuente`. El motor es lógica pura que recibe el perfil y aplica la cascada de equipo.
La especificación canónica es
[`docs/product/motor-de-planes.md`](../product/motor-de-planes.md). Cualquier cambio de
valores sube `engine_version`, para que los planes guardados sigan siendo legibles con las
reglas con las que se generaron.

## Alternativas consideradas

- **Condicionales por objetivo.** Rápido al principio, pero imposible de revisar por alguien
  que no programa y fácil de desincronizar entre ramas del código.
- **YAML o JSON externo.** Separa los datos, pero pierde tipos y obliga a validar a mano;
  Zod sobre TypeScript da la misma separación con tipos reales.
- **Motor de reglas genérico.** Demasiada infraestructura para cuatro perfiles y una cascada
  de cuatro pasos.
- **Tabla en la base de datos.** Permite cambiar reglas sin desplegar, pero el MVP no tiene
  panel de administración ni motivo para hacerlo; además complica el determinismo.

## Consecuencias

- Cambiar un número exige PR, cita de la fuente, actualización de la especificación y subida
  de `engine_version`.
- Los tests comprueban que ningún plan sale del perfil, no que un número concreto sea el
  correcto; la revisión profesional cubre lo segundo.
- Un profesional puede revisar la tabla sin leer TypeScript.
- Riesgo aceptado: los valores iniciales no están validados por un profesional todavía.

## Cuándo se revisa

- Tras la revisión por un fisioterapeuta o licenciado en deporte.
- Si cambian las directrices de la OMS o del ACSM.
- Si se añade un objetivo nuevo o se modifica la cascada de equipo.
