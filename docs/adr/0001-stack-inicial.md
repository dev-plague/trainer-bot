# ADR 0001 — Stack inicial

- **Estado:** propuesto
- **Fecha:** 2026-11-12
- **Decisión relacionada:** #1, #4

## Contexto

Es una app web mobile first, de una sola persona y con un agente de IA como colaborador. El
producto es determinista: formularios, reglas y un catálogo curado; nada de IA en tiempo de
ejecución. El brief (§5) ya fija la mayoría de las piezas y pide confirmar tres cosas:
compatibilidad de Bun con React Router v8, si Drizzle 1.0 es estable y el runtime de
respaldo con Node.

Un equipo chico no puede sostener dos formas de hacer lo mismo. La prioridad es **una**
manera obvia de construir cada cosa y poder migrar de versión sin reescribir.

## Decisión

| Área | Decisión |
|---|---|
| UI | React 19.3 + React DOM 19.3 |
| Lenguaje | TypeScript 7.0 (compilador nativo); 6.0.3 como alternativa si algo se rompe |
| Framework | React Router 8.5 en modo framework (Vite 8.3, `@vitejs/plugin-react` 6.3). Import desde `react-router` |
| Paquetes y scripts | Bun 1.4 |
| Runtime de la app y del CLI | Node 22.22+ (Docker y CI) |
| Base de datos | PostgreSQL |
| ORM | Drizzle ORM 0.45 + drizzle-kit 0.31 (la 1.0 está en RC) |
| Autenticación | Better Auth 1.7 con adaptador de Drizzle |
| Estilos | Tailwind CSS 4.3 + shadcn/ui |
| Iconos | `@hugeicons/react` 1.1 (MIT) |
| Validación | Zod 4.6 |
| Pruebas | Vitest 5.1 |
| Contenedores | Docker multi-stage + docker-compose con PostgreSQL |

Detalle y fuentes en [`docs/research/viabilidad-stack.md`](../research/viabilidad-stack.md).

Las versiones concretas se fijan en `package.json` al crear el scaffolding y se actualizan
por PR, con CI verde. No hay actualización automática ni "siempre la última".

## Alternativas consideradas

- **Next.js.** Trae router, RSC y despliegue propios; el brief y `AGENTS.md` piden React
  Router en modo framework. Adoptar Next sería reescribir el stack, no elegirlo.
- **Remix.** Ya es React Router v7/v8; usarlo por separado duplicaría el framework.
- **Prisma.** Excelente, pero añade generación de cliente y su propio lenguaje de esquema.
  Drizzle es SQL-first, más chico, y Better Auth lo soporta con adaptador.
- **Autenticación propia.** Riesgo de seguridad y de mantenimiento sin beneficio: Better Auth
  cubre correo y contraseña con sesiones en PostgreSQL.
- **Bun como runtime del servidor.** `bun --bun react-router dev` falla desde React Router
  8.3 porque Bun ignora `NODE_OPTIONS` ([oven-sh/bun#40316](https://github.com/oven-sh/bun/issues/40316)).
  Usar `Bun.serve` vía `react-router-hono-server` es posible, pero es una dependencia extra
  que el MVP no necesita.
- **Drizzle 1.0 RC.** La `latest` sigue en 0.45.4; empezar en una RC es asumir migraciones de
  APIs que aún cambian.
- **Monorepo.** El MVP es una app y un servidor: un solo paquete alcanza y evita tooling.
- **Tailwind 3.** Tailwind 4 ya es estable y su configuración CSS-first simplifica el setup.

## Consecuencias

- **Runtime partido**: Bun instala y corre scripts; Node ejecuta React Router y el servidor.
  Hay que explicarlo en cada incorporación y prohibir `--bun` en revisión.
- **Drizzle 0.45 tiene fecha de vencimiento**: cuando 1.0 llegue a `latest`, el salto se hace
  en una PR que toca solo `data/` y sus migraciones.
- **React Router 8 es joven**: entre minors puede mover APIs. Fijamos versión y actualizamos
  a mano con pruebas; sin `^` en las dependencias del framework.
- **Better Auth es dueño del esquema de auth**: al actualizarlo hay que volver a correr su
  CLI y revisar el diff de las migraciones.
- **Tailwind 4 no usa `tailwind.config.js`** por defecto: la configuración vive en CSS y hay
  que documentarlo para quien venga de Tailwind 3.
- **shadcn/ui no es una dependencia**: los componentes se copian al repo y pasan a ser
  nuestros; se actualizan a mano.
- **TypeScript 7 es un compilador nuevo**: si algún plugin del ecosistema falla, 6.0.3 es un
  destino válido sin cambiar código.

## Cuándo se revisa

- Cuando Drizzle 1.0 salga como `latest`.
- Cuando se cierre Bun #40316 y queramos evaluar `Bun.serve` en producción.
- Antes del primer despliegue, para fijar plataforma y versión de PostgreSQL.
- Si React Router 9 cambia el modo framework.
