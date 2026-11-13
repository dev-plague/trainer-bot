# ADR 0002 — Calidad de código y pruebas

- **Estado:** aceptado
- **Fecha:** 2026-11-12
- **Decisión relacionada:** #23

## Contexto

`AGENTS.md` exige lint, formato y pruebas, pero no elige herramientas. El equipo es una
persona más un agente: cada minuto de configuración se resta a construir producto, y la señal
tiene que ser rápida y difícil de ignorar. El MVP es mobile first y se valida a mano pantalla
por pantalla.

## Decisión

- **Biome 2.6** para lint y formato: un solo binario, un solo `biome.json`, sin cadena de
  plugins. `bun run lint` revisa y `bun run format` corrige.
- **Vitest 5.1** para pruebas. Prioridad en `domain/`; cuando una regla de negocio se pueda
  romper en pantalla, se prueba el componente con Testing Library.
- **Sin pruebas de navegador (Playwright) en el MVP.** Los flujos críticos se revisan a mano
  en móvil y escritorio, y queda registrado en el checklist de la PR.
- **CI:** typecheck, lint, tests y build en cada PR. Nunca con `bun --bun`.

## Alternativas consideradas

- **ESLint 9 + Prettier.** Más reglas disponibles y más ecosistema, a cambio de dos
  configuraciones, más dependencias y arranque más lento. Todavía se puede adoptar si aparece
  una regla que Biome no cubra.
- **Sin linter, solo TypeScript.** El tipado no detecta imports muertos, variables sin usar
  ni formato inconsistente.
- **Playwright desde el día uno.** Añade navegador, servidor y datos de prueba a cada PR por
  un flujo que todavía cambia cada semana. El costo supera el beneficio hasta que haya un
  flujo estable y una regresión que se repita.
- **Solo pruebas unitarias de UI (jsdom).** No valida el comportamiento real del navegador;
  útil para reglas, insuficiente para layout.

## Consecuencias

- Algunas reglas de ESLint no existen en Biome. Se acepta la pérdida; si una necesidad real
  aparece (por ejemplo, orden de imports), se evalúa en ese momento y se anota.
- El formato cambia una vez al adoptar Biome. A partir de ahí, un PR con formato distinto
  falla en CI en vez de discutirse en revisión.
- Sin E2E, la verificación móvil depende de disciplina. Si dos PR seguidas rompen lo mismo,
  este ADR se revisa y se añade Playwright.
- Las pruebas de integración contra PostgreSQL se activan en CI con un `service` cuando exista
  el esquema; no hoy.

## Cuándo se revisa

- Si una regla de Biome bloquea trabajo legítimo o falta una que necesitemos de verdad.
- Si una regresión que Playwright habría detectado llega a `main` dos veces.
- Cuando exista un flujo de usuario estable que justifique automatizar el navegador.
