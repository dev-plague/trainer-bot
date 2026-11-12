# Arquitectura

> **Estado:** vigente · **Última revisión:** 2026-11-12
>
> Explica **cómo** se organiza el código. El **qué** y el **por qué** están en
> [`docs/product/brief.md`](product/brief.md); las reglas para agentes y devs en
> [`AGENTS.md`](../AGENTS.md). Las decisiones con alternativa se registran en `docs/adr/`.

## 1. Principio

Screaming Architecture por features: al abrir `app/features/` se ve el producto
(`auth`, `onboarding`, `bmi`, `plans`, `exercises`, `sessions`), no la infraestructura.
Dentro de cada feature hay tres capas y nada más:

| Capa | Contiene | Puede importar |
|---|---|---|
| `domain/` | Reglas puras en TypeScript: motor de planes, IMC, equivalencias. Sin React, sin Drizzle, sin red, sin `Date.now()` | Solo TypeScript y otras piezas de `domain/` |
| `data/` | Esquema Drizzle y consultas a PostgreSQL | Su `domain/`, `shared/db` |
| `ui/` | Rutas, componentes y formularios de la feature | Su `domain/`, su `data/`, `shared/`, `content/` |

No hay capas de repositorio, casos de uso, adaptadores ni inyección de dependencias. Si una
pieza necesita existir solo para "respetar la arquitectura", no se escribe.

## 2. Estructura

```text
app/
  root.tsx                 # shell de la app (HTML, providers)
  routes.ts                # registro de rutas de React Router
  features/
    auth/
      domain/              # reglas de sesión y permisos, sin Better Auth
      data/                # schema.ts generado por Better Auth + consultas
      server.ts            # instancia de Better Auth (la carga su CLI)
      ui/                  # login, registro y avisos
      index.ts             # API pública de la feature
    onboarding/
      domain/              # validaciones del cuestionario y del trato
      data/                # perfil, consentimientos, PAR-Q
      ui/                  # pasos del onboarding
      index.ts
    bmi/
      domain/              # cálculo y clasificación del IMC
      ui/                  # explicación y presentación
      index.ts
    plans/
      domain/              # motor de planes: reglas puras y testeables
      data/                # planes y días generados
      ui/                  # formulario y vista del plan
      index.ts
    exercises/
      domain/              # tipos del catálogo y reglas de equivalencia
      data/                # catálogo y seed
      ui/                  # detalle de ejercicio
      index.ts
    sessions/
      domain/              # progreso de una sesión (puro)
      data/                # sesiones y progreso
      ui/                  # pantalla guiada ejercicio por ejercicio
      index.ts
  shared/
    db/                    # cliente Drizzle y utilidades de conexión
    ui/                    # componentes shadcn/ui reutilizados
    lib/                   # utilidades sin conocimiento del dominio
  content/                 # textos de interfaz en español
  db/
    schema.ts              # barrel: reúne los esquemas de cada feature
drizzle/                   # migraciones generadas por drizzle-kit (versionadas)
docs/
  adr/  product/  research/
```

Reglas de dependencia:

1. `domain/` no importa de `ui/` ni de `data/`, nunca.
2. Una feature no importa los internos de otra; solo su `index.ts`. Si necesitas algo de
   otra feature y no está en su `index.ts`, la respuesta suele ser moverlo a `shared/` o
   exponerlo a propósito.
3. `shared/` no importa de `features/`. Si empieza a saber de planes o de IMC, ya no es
   compartido.
4. `content/` solo contiene textos; ningún componente, consulta ni regla.

Se hacen cumplir por convención, `index.ts` y revisión de PR. No se añade una herramienta de
fronteras hasta que haya un problema real.

## 3. Rutas

React Router v8 en modo framework: las rutas se declaran en `app/routes.ts` y los módulos
viven en la `ui/` de su feature, no en una carpeta `routes/` paralela.

```ts
// app/routes.ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("features/onboarding/ui/welcome.tsx"),
  route("plan", "features/plans/ui/plan-view.tsx"),
  route("sesion/:id", "features/sessions/ui/session-run.tsx"),
] satisfies RouteConfig;
```

- El nombre del archivo describe la pantalla (`plan-view.tsx`), no la URL.
- `loader` y `action` viven en el mismo módulo de ruta y delegan en `domain/` y `data/`.
- Toda entrada externa (params, formularios, body) se valida con Zod en el borde de la ruta.

## 4. Datos

- Un archivo `schema.ts` por feature, en su `data/`.
- `app/db/schema.ts` solo reexporta los esquemas; es el punto que lee `drizzle.config.ts`.
- El cliente Drizzle se crea una vez en `app/shared/db/client.ts`.
- Las migraciones se generan con `bun run db:generate` y se versionan en `drizzle/`. Nunca se
  edita la base a mano.
- Las tablas de Better Auth las genera su CLI dentro de `app/features/auth/data/schema.ts` y
  viajan en las mismas migraciones que el resto.

```ts
// app/db/schema.ts
export * from "../features/auth/data/schema";
export * from "../features/onboarding/data/schema";
export * from "../features/plans/data/schema";
```

Se usan rutas relativas a propósito: `drizzle-kit` y el CLI de Better Auth no pasan por
Vite ni resuelven el alias `~/`.

El esquema de auth se regenera con su CLI cuando cambian sus opciones o plugins:

```bash
bun x auth@latest generate \
  --config app/features/auth/server.ts \
  --output app/features/auth/data/schema.ts --yes
bun run db:generate
```

## 5. Textos e interfaz

- Todo texto visible vive en `app/content/`, en español, agrupado por feature
  (`content/onboarding.ts`, `content/plans.ts`, `content/common.ts`).
- Los saludos con hora se calculan en el cliente; el nombre que se usa es el **preferido**,
  no el de la cuenta.
- Iconos solo de `@hugeicons/react` (paquete gratuito, MIT). No se copian imágenes ni textos
  de terceros.

## 6. Runtime y comandos

- **Bun instala y ejecuta scripts; Node ejecuta React Router.** Nunca uses `bun --bun
  react-router ...`: desde React Router 8.3 el CLI se relanza con `NODE_OPTIONS`, que Bun
  ignora, y el dev server muere. Ver
  [`docs/research/viabilidad-stack.md`](research/viabilidad-stack.md).
- Docker y CI usan Node 22.22 o superior.
- **Despliegue:** un VPS propio con Dokploy, al final del proyecto. Hasta entonces no se
  escribe el Dockerfile de la app.
- Comandos (los `db:*` llegan con Drizzle):

```bash
bun install          # dependencias
bun run dev          # dev server (Node por debajo)
bun run typecheck
bun run lint
bun run test
bun run build
bun run db:generate
bun run db:migrate
bun run db:seed
docker compose up -d # PostgreSQL local en 5433
```

## 7. Pruebas

- `domain/` es la prioridad: motor de planes, IMC, equivalencias y reglas de progreso. Se
  prueban como funciones puras, con reloj y datos inyectados.
- `data/` se prueba con integración contra PostgreSQL cuando exista el esquema; no se
  simula la base para lógica que depende de SQL.
- `ui/` se prueba solo donde una regla de negocio se pueda romper en pantalla (por ejemplo,
  que nunca aparezca un peso en kg).

## 8. Qué no se hace

- DDD ni arquitectura hexagonal: no hay `entities`, `use-cases` ni `ports`.
- Carpetas `utils/` genéricas: si una utilidad no tiene dueño claro, va en
  `shared/lib/` con nombre específico.
- Barrel files por carpeta: solo el `index.ts` público de cada feature.
- Estado global antes de necesitarlo.
- Abstracciones de base de datos que el MVP no use.
