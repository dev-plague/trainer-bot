## Qué hace esta PR

<!-- Un párrafo. Explica el por qué, no solo los archivos tocados. -->

Closes #

## Tipo de cambio

- [ ] `feat` — funcionalidad nueva
- [ ] `fix` — corrección de un fallo
- [ ] `docs` — documentación, ADR o brief
- [ ] `refactor` — cambio interno sin cambiar comportamiento
- [ ] `test` — pruebas
- [ ] `chore` — tooling, dependencias, CI

## Cómo verificarlo

<!-- Pasos concretos: comandos, ruta de la pantalla, prueba que falla antes y pasa después. -->

## Checklist

- [ ] El issue está enlazado arriba y sigue abierto.
- [ ] Typecheck, lint, tests y build pasan en local.
- [ ] CI en verde (no silenciado).
- [ ] Sin cambios directos a `main`; el merge lo hace dev-plague.

### Reglas de dominio

- [ ] **No** se introduce ningún peso en kg (ni en datos, textos, seeds ni pruebas).
- [ ] Los avisos de seguridad (§3.10 del brief) siguen intactos y visibles.
- [ ] Si hay IMC: solo para mayores de 18 y sin cifra "ideal" única.
- [ ] Todo ejercicio nuevo del catálogo tiene `fuente`.
- [ ] Los saludos usan el nombre preferido, no el de la cuenta.
- [ ] Los textos de interfaz están en `app/content/`, no dentro de componentes.

### Datos y documentación

- [ ] Ningún secreto, `.env`, dato personal ni dato de salud real en el diff.
- [ ] Los cambios de esquema vienen con su migración de Drizzle.
- [ ] Si cambió una decisión de arquitectura o de alcance, actualicé el brief o añadí un ADR.
- [ ] `docs/architecture.md` sigue siendo cierto después de esta PR.

## Capturas o notas para la revisión

<!-- Opcional. Móvil primero; incluye escritorio si el cambio lo afecta. -->
