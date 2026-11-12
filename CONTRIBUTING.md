# Contribuir a Trainerbot

Antes de escribir código, lee el [brief de producto](docs/product/brief.md) (el **qué** y el
**por qué**), [AGENTS.md](AGENTS.md) (reglas y stack) y [docs/architecture.md](docs/architecture.md)
(el **cómo**). Si algo no cuadra entre esos documentos, la PR correcta es la que los alinea,
no la que ignora la contradicción.

## Flujo

```text
issue → rama → PR → CI verde → revisión → merge por dev-plague
```

1. **Issue primero.** Toda tarea parte de un issue creado con una plantilla. Si el issue no
   existe, no hay rama.
2. **Rama** desde `main` actualizado:

   | Prefijo | Uso |
   |---|---|
   | `feat/<n>-descripcion` | Funcionalidad nueva |
   | `fix/<n>-descripcion` | Corrección de un fallo |
   | `docs/<n>-descripcion` | Documentación, ADR, brief |
   | `chore/<n>-descripcion` | Tooling, dependencias, CI |

   `<n>` es el número del issue. Sin espacios, en minúsculas, con guiones.

3. **Commits** convencionales y en español, en imperativo: `feat:`, `fix:`, `docs:`,
   `refactor:`, `test:`, `chore:`. Un commit por cambio con sentido, no uno por archivo.
4. **PR** con la plantilla completada y `Closes #<n>`. Título con el mismo prefijo del
   commit principal.
5. **CI verde.** No se silencia un check fallido, ni se comenta un test, ni se relaja el
   lint para "avanzar".
6. **Merge manual de dev-plague.** Nunca hagas merge, ni push directo a `main`, ni fuerces
   el cierre de una PR con checks rojos.

## Comandos

Se confirman al crear el scaffolding (iteración 1):

```bash
bun install          # instalar dependencias
bun run dev          # servidor de desarrollo
bun run typecheck    # verificación de tipos
bun run lint         # lint y formato
bun run test         # pruebas (Vitest)
bun run build        # build de producción
bun run db:generate  # generar migración con drizzle-kit
bun run db:migrate   # aplicar migraciones
bun run db:seed      # cargar catálogo de ejercicios
docker compose up    # app + PostgreSQL para desarrollo
```

**Lint y formato** corren con Biome, y las pruebas con Vitest (ver
[ADR 0002](docs/adr/0002-calidad-y-pruebas.md)). No hay pruebas de navegador en el MVP: los
flujos críticos se revisan a mano en móvil y escritorio.

**Nunca uses `bun --bun react-router ...`.** Bun ignora `NODE_OPTIONS` y el CLI de React
Router 8.3+ falla al relanzarse. Bun instala y ejecuta scripts; Node corre el framework. Ver
[docs/research/viabilidad-stack.md](docs/research/viabilidad-stack.md).

## Reglas que un revisor siempre mira

- **Sin pesos en kg.** La intensidad se expresa con RIR o RPE. Esto incluye textos de
  ejemplo, seeds y pruebas.
- **Avisos de seguridad intactos.** El mensaje de la §3.10 del brief no se suaviza ni se
  mueve a un lugar donde no se lea.
- **IMC solo para mayores de 18** y nunca como cifra "ideal" única.
- **Cada ejercicio nuevo lleva `fuente`.** Sin fuente, no entra al catálogo.
- **Nombre preferido**, no el de la cuenta, en saludos y mensajes.
- **Textos en `app/content/`**, no dentro de los componentes.
- **`domain/` sin React, sin Drizzle, sin red.** Si una función pura importa `react`, dejó de
  ser dominio.

## Dependencias

Antes de añadir una dependencia, justifícala en la PR: qué resuelve, qué alternativa simple
existe y cuánto pesa. Si cambia una decisión de arquitectura, va con un ADR.

Las versiones se fijan en `package.json` y se actualizan por PR con CI verde. No se activa
actualización automática sin decidirlo antes.

## Secretos y datos

- Nada de secretos en el repo: ni `.env`, ni claves, ni tokens en capturas o logs.
- Un secreto que llegó a un commit se considera comprometido: se rota y se avisa en el issue.
- No se copian datos reales de personas a seeds, pruebas ni issues.
- Los datos de salud son sensibles (Ley 1581 de 2012): solo lo necesario y con consentimiento.

## Revisión

Una PR está lista cuando:

- enlaza su issue y explica el **por qué**, no solo el qué;
- pasa typecheck, lint, tests y build;
- no introduce funcionalidad fuera del alcance del MVP (§2 del brief);
- actualiza brief o ADR si cambió una decisión;
- deja el repositorio mejor de como estaba: sin código muerto, sin TODOs sin issue.

## Configuración de GitHub

Ya aplicada en `dev-plague/trainer-bot`:

- `main` protegida: PR obligatoria, rama actualizada antes de mergear y estos checks en
  verde: `Detectar scaffolding`, `Typecheck`, `Lint`, `Tests` y `Build`.
- Sin force push ni borrado de `main`.
- Solo squash merge; la rama se borra al mergear.
- Sin merge automático.
- `enforce_admins` desactivado a propósito: dev-plague puede saltarse la protección en una
  emergencia y lo deja anotado en el issue.

Si algo cambia, se actualiza esta sección en la misma PR que lo cambie.
