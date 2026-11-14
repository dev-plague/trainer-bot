# Viabilidad y riesgos del stack

> **Estado:** aplicado · **Fecha de verificación:** 2026-11-12 · **Issue:** #1

Este documento confirmó, con fuentes, las tres preguntas abiertas del brief (§5): la
compatibilidad de Bun con React Router v8, el estado real de Drizzle 1.0 y el runtime que
usaríamos en desarrollo y producción. Las versiones se consultaron en el registro de npm el
2026-11-12; el stack se instaló y rige el MVP desde entonces (ver `package.json`).

## 1. Versiones estables verificadas

| Pieza | Versión | Publicada | Fuente |
|---|---|---|---|
| React / React DOM | 19.3.1 | 2026-10-14 | `registry.npmjs.org/react/latest` |
| React Router / `@react-router/dev` | 8.5.1 | 2026-10-27 | `registry.npmjs.org/react-router/latest` |
| Vite | 8.3.8 | 2026-11-11 | `registry.npmjs.org/vite/latest` |
| `@vitejs/plugin-react` | 6.3.0 | 2026-11-09 | `registry.npmjs.org/@vitejs/plugin-react/latest` |
| Drizzle ORM | **0.45.4** | 2026-10-08 | `registry.npmjs.org/drizzle-orm/latest` |
| drizzle-kit | **0.31.11** | 2026-09-21 | `registry.npmjs.org/drizzle-kit/latest` |
| Better Auth | 1.7.22 | 2026-11-12 | `registry.npmjs.org/better-auth/latest` |
| Tailwind CSS | 4.3.5 | 2026-11-06 | `registry.npmjs.org/tailwindcss/latest` |
| Zod | 4.6.7 | 2026-10-12 | `registry.npmjs.org/zod/latest` |
| Vitest | 5.1.0 | 2026-11-02 | `registry.npmjs.org/vitest/latest` |
| TypeScript | 7.0.2 | 2026-07-08 | `registry.npmjs.org/typescript/latest` |
| `@hugeicons/react` | 1.1.10 (MIT) | 2026-08-21 | `registry.npmjs.org/@hugeicons/react/latest` |

Notas de compatibilidad declaradas por los paquetes:

- `react-router` y `@react-router/dev` exigen **Node ≥ 22.22.0** y React ≥ 19.2.7.
- `@react-router/dev` acepta **Vite ^7 o ^8** y TypeScript `^5.1 || ^6 || ^7`.
- `vitest` 5.1.0 exige Node `^22.12 || ^24 || >=26`.
- `react-router-dom` se quedó en 7.18.5: en v8 el paquete no existe, como dice `AGENTS.md`.

Entorno local medido: Bun 1.4.2 (reporta `process.versions.node = 26.3.0`) y Node 26.13.0.

## 2. Bun: gestor de paquetes sí, runtime del servidor no (por ahora)

**Decisión: Bun como gestor de paquetes y ejecutor de scripts; Node como runtime
de React Router y del servidor.**

Lo verificado:

- `bun install` y `bun run <script>` funcionan: el ejecutable de `@react-router/dev` es un
  `bin.cjs` con shebang de Node, así que `bun run dev` arranca Node.
- `bun --bun react-router dev` **se rompe desde React Router 8.3.0**. Bun 1.4 ignora
  `NODE_OPTIONS` por completo, y React Router 8.3+ se relanza a sí mismo con
  `--conditions=development` a través de esa variable. El hijo no recibe la condición,
  intenta reiniciarse otra vez y muere con
  `restartWithMergedOptions() was called, but the process has already been restarted`.
  Issue abierto: [oven-sh/bun#40316](https://github.com/oven-sh/bun/issues/40316).
- Servir producción con Bun es posible (`Bun.serve`, p. ej. vía
  `react-router-hono-server`, que pide Bun ≥ 1.4 y React Router ≥ 8.3), pero añade una
  dependencia y una capa de adaptación que el MVP no necesita.

Consecuencias prácticas:

- Scripts normales (`bun run dev`, `bun run build`) sin `--bun`. La bandera se prohíbe en
  `AGENTS.md` y en la revisión de PR.
- Docker usa **Node 22.22+** (imagen `node:22` o superior) para el servidor; Bun queda para
  instalar dependencias y correr scripts en desarrollo y CI.
- Si Bun arregla #40316 y queremos `Bun.serve`, se decide en un ADR aparte, no aquí.

## 3. Drizzle ORM: la 1.0 todavía no es estable

El `dist-tag latest` de `drizzle-orm` es **0.45.4** y el de `drizzle-kit` **0.31.11**. La
1.0 existe solo como `1.0.0-rc.5` (etiqueta `rc`) y decenas de builds beta por rama.

**Decisión: usar 0.45.4 / 0.31.11 en el MVP.** Adoptar una RC fija antes de tener
esquema es asumir migraciones de una versión que aún cambia; el brief pedía confirmarlo, no
forzarlo. El acceso a datos queda aislado en `data/`, así que el salto a 1.0 será local a esa
capa cuando 1.0 llegue a `latest`.

## 4. Better Auth

`better-auth` 1.7.22 soporta PostgreSQL y Bun/Node, y expone el adaptador de Drizzle en
`better-auth/adapters/drizzle` (export confirmado en el paquete). Existe además el paquete
separado `@better-auth/drizzle-adapter@1.7.22`, que la documentación más reciente muestra
como instalación recomendada.

**Decisión:** usar el export incluido (`better-auth/adapters/drizzle`) para no
añadir una dependencia más, e importar `betterAuth` desde `better-auth/minimal` para no
arrastrar el código de proveedores que no usamos. Si al integrar la documentación vigente
exige el paquete separado, se cambia en esa PR y se anota en el ADR 0001.

Flujo de esquema: `bun x auth@latest generate` produce las tablas de auth en Drizzle;
después `drizzle-kit generate` y `drizzle-kit migrate` versionan todo junto. El CLI de Better
Auth no aplica migraciones con el adaptador de Drizzle (solo con Kysely), así que la fuente
de verdad son nuestras migraciones.

## 5. Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Alguien usa `bun --bun` y rompe el dev server | Media | Medio | Prohibido en `AGENTS.md`; CI corre con Node; nota en `CONTRIBUTING.md` |
| Drizzle 1.0 sale y rompe APIs al migrar | Media | Medio | Quedarse en 0.45.x; SQL y consultas solo en `data/`; migración en una PR propia |
| React Router 8.x cambia APIs entre minors | Media | Medio | Versión fijada; actualizaciones por PR con CI; no usar APIs marcadas como inestables |
| Better Auth mueve la ruta del adaptador | Media | Bajo | Una sola importación centralizada en `features/auth/data` |
| TypeScript 7 (compilador nativo) rompe algún plugin | Baja | Bajo | Fijar 7.0.2; 6.0.3 es alternativa válida para React Router |
| Node < 22.22 en Docker o CI | Baja | Alto | Fijar versión en Dockerfile y CI; `engines` en `package.json` |
| Catálogo de iconos gratuitos insuficiente | Baja | Bajo | Elegir iconos existentes antes de diseñar pantallas; sin assets de terceros |
| PostgreSQL local distinto de producción | Baja | Medio | docker-compose con la misma versión mayor que producción desde el día uno |

## 6. Lo que este documento no resuelve

- Plataforma de despliegue y versión exacta de PostgreSQL en producción: decididas en
  [`docs/deployment.md`](../deployment.md) (VPS con Dokploy y PostgreSQL 18).
- Si conviene un monorepo o un solo paquete (el MVP cabe en uno; ver `docs/architecture.md`).
- Rendimiento del motor con un catálogo grande: hoy son 52 entradas y no hay medición con
  volúmenes mayores.

## 7. Fuentes

- Registro de npm (consultas `/<paquete>/latest` y `dist-tags`), 2026-11-12.
- [oven-sh/bun#40316 — NODE_OPTIONS ignorado, rompe `react-router dev` en RR 8.3+](https://github.com/oven-sh/bun/issues/40316)
- [remix-run/react-router#14876 — soporte de Vite 8](https://github.com/remix-run/react-router/pull/14876)
- [Better Auth — adaptador de Drizzle](https://better-auth.com/docs/adapters/drizzle)
- [Better Auth — instalación](https://better-auth.com/docs/installation)
- [react-router-hono-server — matriz de runtimes (Bun)](https://cdn.jsdelivr.net/npm/react-router-hono-server@4.1.3/README.md)
