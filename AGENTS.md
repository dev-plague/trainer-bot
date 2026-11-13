# AGENTS.md — Guía para agentes de IA y desarrolladores

Trainerbot es una app web mobile first que genera planes de entrenamiento mediante reglas
deterministas. **No es una IA.** Lee esto completo antes de tocar código.

## Antes de empezar

1. Lee `docs/product/brief.md`: es la fuente de verdad del producto (qué y por qué).
2. Lee `docs/architecture.md` y los ADRs en `docs/adr/` si vas a tocar estructura o dependencias.
3. Si algo es ambiguo o contradice el brief, **pregunta antes de asumir**. Si el brief debe
   cambiar, abre una PR que lo modifique; no lo ignores.

## Stack

React 19.2+, TypeScript, React Router v8 (modo framework), Bun, PostgreSQL, Drizzle ORM,
**Better Auth**, Tailwind + shadcn/ui, HugeIcons (gratuito), Zod, Vitest, Docker.

- Importa desde `react-router`, nunca `react-router-dom` (eliminado en v8).
- No escribas autenticación propia: usa Better Auth. Verifica su documentación vigente.
- Usa la última versión estable de cada dependencia. No existen versiones "LTS" de estas
  librerías. Antes de agregar una dependencia nueva, justifícala en la PR (o en un ADR si
  es relevante).

## Comandos

> Se completarán y confirmarán en la fase 0 del proyecto.

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

## Arquitectura

Screaming Architecture por features. Estructura objetivo:

```
app/
  features/
    auth/  onboarding/  bmi/  plans/  exercises/  sessions/
      domain/   # lógica pura en TS, sin React ni base de datos
      data/     # consultas y esquemas Drizzle
      ui/       # componentes y rutas de la feature
  shared/       # utilidades y componentes genuinamente transversales
  content/      # textos de la interfaz centralizados
docs/
  product/brief.md  architecture.md  adr/
```

Reglas:
- `domain/` no importa de `ui/` ni de `data/`. El motor de planes es lógica pura y testeable.
- Una feature no importa los internos de otra; solo su API pública (`index.ts`).
- No sobrearquitecturar: nada de DDD ni hexagonal completo. Prefiere lo simple.

## Reglas de dominio (no negociables)

- **Nunca** indiques pesos en kg. La intensidad se expresa por esfuerzo percibido o
  repeticiones en reserva.
- Trainerbot no es médico ni fisioterapeuta. Los avisos de seguridad del brief (sección 3.10)
  no se eliminan ni se debilitan.
- El IMC solo se calcula para mayores de 18 años y nunca se presenta como cifra "ideal" única.
- Todo ejercicio del catálogo requiere el campo `fuente`. No inventes ejercicios ni
  afirmaciones de efectividad sin respaldo.
- Los perfiles del motor de planes son datos tipados con `fuente`; no se cambian sin un PR
  que cite la fuente, actualice `docs/product/motor-de-planes.md` y suba `engine_version`.
- Los saludos y mensajes usan el **nombre preferido** que la persona eligió en el onboarding,
  no el nombre de la cuenta. El saludo según la hora se calcula en el cliente.
- Los textos de la interfaz van en `app/content/`, en español, con tono cercano y sincero.
  No los escribas directamente dentro de los componentes.

## Convenciones de código

- TypeScript estricto; sin `any` salvo justificación comentada.
- Valida toda entrada externa (formularios, parámetros) con Zod.
- Mobile first: diseña para móvil y verifica que escale bien a desktop.
- Componentes de UI con shadcn/ui; iconos solo del paquete gratuito de HugeIcons.
- Los cambios de esquema pasan siempre por migraciones de Drizzle; nunca edites la base a mano.
- Escribe pruebas para la lógica de `domain/` (motor de planes, IMC, reglas de equivalencia).

## Flujo de trabajo en Git

1. Todo trabajo parte de un **issue** de GitHub.
2. Crea una rama: `feat/<n>-descripcion`, `fix/<n>-descripcion` o `docs/<n>-descripcion`.
3. Commits convencionales: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
4. Abre una **PR** que referencie el issue (`Closes #n`), con la plantilla completada.
5. La PR debe pasar el CI (typecheck, lint, tests, build). **El merge lo hace dev-plague**;
   no hagas merge ni push directo a `main`.
6. Si tu cambio altera una decisión de arquitectura o de alcance, actualiza el brief o añade
   un ADR en la misma PR.

## Lo que NO debes hacer

- Introducir IA, chat o llamadas a LLM en el producto.
- Agregar funcionalidades fuera del alcance del MVP (brief, sección 2) sin issue aprobado.
- Copiar imágenes, videos o textos de terceros al catálogo.
- Guardar más datos personales de los necesarios o saltarte el consentimiento.
- Ignorar o silenciar fallos de CI, tipos o lint para "avanzar".
