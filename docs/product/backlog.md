# Backlog del MVP

> **Estado:** propuesta · **Issue:** #7 · **Última revisión:** 2026-11-12
>
> Parte el alcance del [brief](brief.md) en épicas. Cada tarea está pensada para **una PR**.
> Las épicas se crearán como issues con etiqueta `epic` cuando este documento se apruebe.

## Orden recomendado

```text
E0 Fundaciones
 └─ E1 Cuenta y consentimiento
     └─ E2 Onboarding y trato
         ├─ E3 IMC
         └─ E4 Catálogo de ejercicios
             └─ E5 Motor de planes
                 └─ E6 Sesión guiada
                     └─ E7 Modo flexible
```

E4 puede empezar en paralelo con E2/E3 en cuanto exista el esquema base: el catálogo no
depende de la cuenta. Todo lo demás respeta el orden anterior.

## Definición de terminado (aplica a todas las tareas)

- Una PR pequeña, con su issue y sus criterios de aceptación cumplidos.
- Tests de la lógica de `domain/` que toque; sin tests de UI salvo que una regla de negocio
  se pueda romper en pantalla.
- Typecheck, lint, tests y build en verde.
- Textos en `app/content/`; sin kg; avisos de seguridad intactos.
- Si cambió una decisión, brief o ADR actualizados en la misma PR.

---

## E0 — Fundaciones técnicas

**Objetivo:** que cualquier tarea posterior se pueda construir y desplegar sin rehacer bases.

**Criterios de aceptación:** `bun install && bun run dev` levanta la app con PostgreSQL en
Docker; `typecheck`, `lint`, `test` y `build` pasan; CI corre esos cuatro checks en cada PR.

| Tarea | Tamaño | Cómo se verifica |
|---|---|---|
| Scaffolding de React Router 8 en modo framework con TypeScript estricto, Vite, Tailwind 4 y shadcn/ui | M | `bun run dev` abre la pantalla inicial; `bun run build` genera `build/client` y `build/server` |
| Configurar Vitest con un test de humo en `domain/` | S | `bun run test` corre y falla si se rompe el test |
| `docker-compose.yml` con PostgreSQL y `.env.example` | S | `docker compose up` levanta la base; la app conecta |
| Cliente Drizzle + `drizzle.config.ts` + migración inicial | M | `bun run db:generate` produce una migración; `db:migrate` la aplica en limpio |
| Better Auth con correo y contraseña y tablas generadas por su CLI | M | Registro y login manuales contra la base local; las tablas viajan en migraciones |
| Shell de la app: layout mobile first, navegación y `app/content/` base | S | Se ve bien a 360 px y en escritorio |
| Activar el workflow de CI (issue #6) con los checks ya existentes | S | Un PR de prueba muestra typecheck, lint, test y build en verde |

## E1 — Cuenta y consentimiento

**Objetivo:** que una persona pueda crear su cuenta y aceptar los avisos antes de dar datos
de salud.

**Criterios de aceptación:** registro con correo y contraseña, sesión persistente, avisos de
seguridad aceptados con fecha y consentimiento de datos guardado; rutas privadas protegidas.

| Tarea | Tamaño | Cómo se verifica |
|---|---|---|
| Registro con correo y contraseña, validado con Zod | M | Cuenta nueva aparece en la base; correo repetido da error legible |
| Inicio y cierre de sesión, y protección de rutas privadas | M | Sin sesión, una ruta privada redirige a login; con sesión, entra |
| Pantalla de avisos de seguridad con aceptación explícita y fecha | S | No se puede continuar sin aceptar; la fecha queda en `consent` |
| Consentimiento de tratamiento de datos de salud | S | Se guarda `kind = health_data` con versión del texto |
| Recuperación de contraseña | S | Envío y uso del enlace; si no hay proveedor de correo, se decide y se documenta antes |
| Borrado de cuenta con datos asociados | M | Tras borrar, no queda fila en `user`, `profile`, `health_screening` ni `plan` |

> El borrado depende de una decisión de producto (inmediato o con plazo de gracia). Ver §6 de
> [`docs/data-model.md`](../data-model.md).

## E2 — Onboarding y trato

**Objetivo:** conocer a la persona y dirigirse a ella como pidió.

**Criterios de aceptación:** nombre preferido obligatorio, forma de trato opcional con neutral
por defecto, cuestionario de salud interpretado y perfil editable.

| Tarea | Tamaño | Cómo se verifica |
|---|---|---|
| Pedir y guardar el nombre preferido | S | El onboarding no avanza sin él; se puede editar en el perfil |
| Forma de trato (neutra / femenina / masculina), neutral por defecto | S | Se guarda y los textos base no dependen del género |
| Datos del perfil: fecha de nacimiento, estatura y peso opcional | M | Validación de rangos; menor de 18 se detecta aquí |
| Cuestionario PAR-Q con preguntas y versión | M | Respuestas válidas se guardan; una respuesta de riesgo marca `needs_medical_clearance` |
| Pantalla de resultado del cuestionario con recomendación de consultar a un médico | S | Con riesgo, se muestra la recomendación y no se genera plan |
| Saludo según la hora del cliente, con el nombre preferido | S | Tests de límites (mañana/tarde/noche) en `domain/`; nunca usa el nombre de la cuenta |
| Edición del perfil y del trato desde una pantalla de ajustes | S | Los cambios se reflejan en el siguiente saludo |

## E3 — IMC

**Objetivo:** explicar el IMC sin convertirlo en un diagnóstico ni en una cifra ideal.

**Criterios de aceptación:** solo para mayores de 18, con rango saludable para la estatura,
meta intermedia realista y límites explicados.

| Tarea | Tamaño | Cómo se verifica |
|---|---|---|
| Cálculo puro del IMC y clasificación por rangos | S | Tests con casos límite y edades; menor de 18 no devuelve cifra |
| Rango saludable según estatura y meta intermedia | M | Tests de estatura baja/alta; la meta nunca es un único número "ideal" |
| Pantalla explicativa: qué es, qué no distingue y por qué no basta | S | Revisión de textos contra §3.5 del brief |
| Regla de tono: no empujar a bajar si ya está en rango normal | S | Test de la regla; revisión de los textos que la muestran |

## E4 — Catálogo de ejercicios

**Objetivo:** tener un catálogo curado, con fuente, que el motor pueda usar.

**Criterios de aceptación:** esquema de `exercise` migrado, seed versionado y validado,
grupos de equivalencia y regresiones definidos.

| Tarea | Tamaño | Cómo se verifica |
|---|---|---|
| Esquema `exercise` y migración | S | `db:migrate` en base limpia crea la tabla |
| Validador del seed con Zod, incluido `fuente` obligatoria | S | Un ejercicio sin fuente falla la validación |
| Seed inicial de ejercicios de peso corporal, cardio y gimnasio | L | `db:seed` es idempotente; cada fila tiene fuente |
| Grupos de equivalencia y reglas asociadas | M | Tests: un grupo tiene al menos 2 ejercicios intercambiables |
| Regresiones para ejercicios marcados como complejos | S | Cada complejo tiene regresión o una razón documentada para no tenerla |
| Pantalla de detalle de ejercicio (tips, músculos, contraindicaciones) | M | Se ve bien en móvil; sin imágenes de terceros |

## E5 — Motor de planes

**Objetivo:** generar un plan semanal determinista que respete objetivo, nivel, equipo,
lugar, tiempo y limitaciones.

**Criterios de aceptación:** misma entrada produce el mismo plan; sin kg; un plan generado
se puede leer aunque cambien las reglas.

| Tarea | Tamaño | Cómo se verifica |
|---|---|---|
| Contratos de entrada y salida con Zod y tipos del plan | M | Tests de validación con entradas inválidas |
| Reglas de volumen semanal basadas en OMS/ACSM | M | Tests por objetivo y días; documentadas con su fuente |
| Selección de ejercicios por lugar, equipo y nivel | L | Tests: gimnasio sin equipo no elige máquinas; casa no elige barra |
| Filtro por limitaciones y contraindicaciones | M | Test: una limitación de rodilla excluye ejercicios contraindicados |
| Asignación de categorías por día y modo estricto | M | Tests de 2 a 6 días; sin días repetidos incoherentes |
| Persistencia del plan con `inputs_snapshot` y `engine_version` | M | Se guarda y se relee igual después de reiniciar la app |
| Formulario del plan y pantalla semanal | L | Recorrido completo en móvil de 360 px; un plan activo por persona |
| Prueba de determinismo | S | Dos llamadas con la misma entrada producen planes idénticos |

## E6 — Sesión guiada

**Objetivo:** acompañar una sesión ejercicio por ejercicio, sin perderse.

**Criterios de aceptación:** una pantalla por ejercicio, progreso guardado y reanudable,
aviso de seguridad al iniciar.

| Tarea | Tamaño | Cómo se verifica |
|---|---|---|
| Crear `workout_session` desde un día del plan | M | Solo se crea para el plan activo del usuario |
| Pantalla de ejercicio: nombre, músculos, tips, series y reps | L | Se ve bien en móvil; no muestra pesos |
| Intensidad por RIR o RPE, nunca kg | S | Revisión de textos y de tipos; test de que no existe campo de peso |
| "Hecho, siguiente" con registro en `exercise_log` | M | El log queda con `done` y hora; el botón no permite saltar dos veces |
| Reanudar donde se quedó | M | Cerrar la pestaña y volver abre el primer ejercicio `pending` |
| Recordatorio del aviso de seguridad al iniciar | S | Se muestra antes del primer ejercicio de cada sesión |
| Cierre de sesión con resumen | S | Estado `completed` y resumen legible |
| Botón de regresión en ejercicios complejos | M | Solo aparece en `is_complex`; sustituye el ejercicio y registra el cambio |

## E7 — Modo flexible

**Objetivo:** dejar cambiar un ejercicio por otro equivalente sin romper el plan.

**Criterios de aceptación:** el cambio se ofrece solo dentro del mismo grupo de equivalencia,
se guarda y el plan flexible lo refleja.

| Tarea | Tamaño | Cómo se verifica |
|---|---|---|
| Regla pura de cambio permitido (mismo grupo, mismo lugar/equipo) | M | Tests: no se puede cambiar a otro grupo ni a equipo no disponible |
| Selector de ejercicios equivalentes en la pantalla del plan | M | Solo lista los válidos para esa persona y ese día |
| Persistencia del cambio y efecto en la sesión | M | El plan flexible muestra la sustitución y la sesión la usa |

---

## Fuera de alcance (no reabrir sin issue aprobado)

IA o chat, nutrición, pagos, funciones sociales, videos, notificaciones, PWA/offline,
gamificación, multi-idioma, progresión automática entre semanas, login social.

## Riesgos del plan

- **E4 depende de contenido curado**: el seed es el trabajo más lento y el que más revisión
  necesita. Si se retrasa, E5 puede avanzar con un catálogo mínimo de 15 ejercicios.
- **El motor es la pieza con más riesgo de sobreajuste**: se empieza con reglas explícitas y
  tests, no con heurísticas.
- **La revisión por un profesional** (fisioterapeuta o licenciado en deporte) debe ocurrir
  antes del lanzamiento, no después de construir el catálogo completo.
