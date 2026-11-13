# Trainerbot — Brief de producto

> **Estado:** vigente · **Última revisión:** 2026-11-12 · **Responsable:** dev-plague
>
> Este documento es la fuente de verdad del **qué** y el **por qué**. Cualquier cambio
> de alcance se hace por PR modificando este archivo (y, si es una decisión relevante,
> con un ADR en `docs/adr/`).

## 1. Problema y visión

Muchas personas quieren mejorar su físico y su salud, pero no se inscriben a un gimnasio
ni contratan un entrenador personal por vergüenza, falta de tiempo o de dinero.

Trainerbot es un entrenador personal sincero, cercano y con objetivos claros, que genera
un plan de entrenamiento ajustado a las necesidades de cada persona y la acompaña a
integrar el ejercicio en su rutina diaria.

**Trainerbot NO es una IA.** Es un programa determinista: recibe datos por formularios y
aplica reglas sobre un catálogo curado de ejercicios. No hay chat ni LLM. La interfaz debe
dejar esto claro para no generar falsas expectativas.

La aplicación es web, **mobile first** y responsive (debe verse bien también en desktop).

## 2. Alcance del MVP

**Criterio de éxito:** una persona nueva puede (1) registrarse y aceptar los avisos,
(2) indicar cómo quiere que Trainerbot se dirija a ella, (3) completar el formulario,
(4) ver su IMC explicado, (5) generar un plan y (6) completar una sesión ejercicio por
ejercicio.

**Fuera de alcance del MVP:** IA o chat, nutrición, pagos, funciones sociales, videos,
notificaciones, PWA/offline, gamificación, multi-idioma (solo se centralizan los textos en
un archivo), progresión automática entre semanas, login social y recuperación de contraseña
(requiere un proveedor de correo).

## 3. Funcionalidades

### 3.1 Cuenta y autenticación
- La autenticación se implementa **con Better Auth**. No se escribe auth propia.
- MVP: correo y contraseña, con sesiones persistidas en PostgreSQL vía el adaptador de Drizzle.
- Las tablas de Better Auth conviven con las del dominio; el esquema se genera con su CLI
  y se versiona con las migraciones de Drizzle.
- Verificar siempre la documentación vigente de Better Auth antes de integrarla.

### 3.2 Trato personalizado
- En el onboarding, Trainerbot **pregunta cómo quiere la persona que se le llame** (nombre
  o apodo preferido). Es obligatorio y editable luego desde el perfil.
- Opcional: forma de trato en español (neutra, masculina o femenina). Por defecto, neutra,
  y los textos de la interfaz deben poder escribirse sin depender del género cuando sea posible.
- Todos los saludos y mensajes usan ese nombre preferido, no el de la cuenta.

### 3.3 Tono cercano
- Saludo según la hora **local del cliente** (Buenos días / Buenas tardes / Buenas noches),
  calculado en el navegador, no en el servidor.

### 3.4 Cuestionario de salud previo
- Cuestionario tipo PAR-Q (dolor de pecho, mareos, embarazo, condiciones cardíacas, etc.).
- Si alguna respuesta indica riesgo, Trainerbot recomienda consultar a un médico antes de
  generar el plan.

### 3.5 Índice de masa corporal (IMC)
- Solo para mayores de 18 años (para menores se usan percentiles; fuera del MVP). El MVP no
  atiende a menores: si el onboarding detecta menos de 18 años, se detiene con un mensaje
  claro y no guarda el perfil ni genera plan.
- Calcularlo, explicar qué es y sus límites (no distingue músculo de grasa).
- Mostrar el rango saludable para su estatura y una **meta intermedia realista**.
  Nunca una cifra "ideal" única.
- No debe empujar hacia abajo a quien ya está en rango normal.

### 3.6 Formulario del plan
Objetivo, nivel de experiencia, días por semana, duración por sesión, lugar
(aire libre / gimnasio / casa), equipo disponible, lesiones o limitaciones y modo
(estricto o flexible).

El plan segmenta los días por grupos musculares y patrones según cuántos días elija la
persona (2 cuerpo completo A/B; 3 empuje + cuádriceps, tirón + cadena posterior, piernas +
hombros + core; 4 torso/pierna con variantes; 5 añade cardio). El detalle está en
[motor-de-planes.md](motor-de-planes.md) §1.3.

### 3.7 Modo estricto y modo flexible
- **Estricto:** plan semanal fijo, sin cambios.
- **Flexible:** cada día define una *categoría* (p. ej. fuerza de tren superior, cardio) y
  la persona puede cambiar un ejercicio por otro del mismo **grupo de equivalencia**
  (caminar, trotar, saltar la cuerda, peso corporal, etc.) que además encaje en el foco
  muscular de ese día.

### 3.8 Sesión guiada
Una pantalla por ejercicio con: nombre, músculos implicados, tips de ejecución y prevención
de lesiones, series y repeticiones (o tiempo en segundos para isométricos), y un botón
"Hecho, siguiente". Las repeticiones se muestran como rango (p. ej. 10-12).
- **Sin pesos en kg.** La intensidad se indica por esfuerzo percibido o repeticiones en
  reserva (p. ej. "termina con 2 repeticiones de reserva").
- La sesión abre con un calentamiento de 5 min y cierra con un enfriamiento de 5 min, ambos
  con pasos de movilidad reales. Se recomiendan y se pueden omitir; el motor no los elimina.
- El progreso de la sesión se guarda para poder retomarla.

### 3.9 Alternativa para ejercicios complejos
Botón "No me siento cómodo con este ejercicio o no lo ejecuto bien" que ofrece una
regresión (versión más fácil). Solo en ejercicios marcados como complejos
(dominada, flexión diamante, etc.).

### 3.10 Avisos de seguridad
- Aceptación explícita en el onboarding (se guarda la fecha).
- Línea fija en la pantalla de ejercicio y recordatorio al iniciar cada sesión.
- Mensaje: Trainerbot acompaña el proceso de cambio físico y personal, pero no es
  fisioterapeuta ni médico; ante cualquier molestia, acudir de inmediato a un especialista.

### 3.11 Reglas del motor de planes

El plan se genera con **perfiles por objetivo** (datos tipados con `fuente`), no con reglas
sueltas. La especificación completa —incluidos descansos, cascada de equipo, avisos y pruebas
obligatorias— está en [motor-de-planes.md](motor-de-planes.md).

| Objetivo | Fuerza | Series × reps | RIR | Cardio |
|---|---|---|---|---|
| Salud general | 2-3 días | 2 × 10-15 | 3-4 | Progresivo hasta 150 min/semana |
| Perder grasa | 2-3 días | 2-3 × 10-15 | 2-3 | Moderado, 2-3 días |
| Fuerza / músculo | 3 días | 2-3 × 8-12 | 2-3 | Ligero, 1-2 días |
| Resistencia | 2 días | 1-2 × 12-15 | 3 | Mayoría del plan, por tiempo |

Reglas que no se negocian:

- El nivel modifica el perfil (una serie menos, más RIR, más descanso); un principiante nunca
  recibe ejercicios complejos.
- Los días se segmentan por grupos musculares según cuántos elija la persona (ver §1.3 del
  documento del motor); los isométricos se prescriben en segundos.
- Cada sesión reserva 5 min de calentamiento y 5 de enfriamiento como pasos reales de
  movilidad elegidos por el foco del día. Ese tiempo se descuenta del trabajo principal; si
  no cabe, se recortan ejercicios principales, nunca el calentamiento ni el enfriamiento.
- Nadie entrena al fallo: RIR mínimo 2. La intensidad nunca se expresa en kilos.
- Si el equipo no alcanza, se prueba por orden: equivalencia con el equipo disponible,
  regresión o progresión, versión de peso corporal y, si nada encaja, se omite el patrón y se
  avisa. Nunca se inventa un ejercicio inseguro.
- Los números son un punto de partida y se revisan con un profesional antes del lanzamiento.

## 4. Catálogo de ejercicios

- Curado a mano, en base de datos, con seed versionado en git.
- Cada ejercicio: nombre, músculos, tips, nivel, equipo, lugar, grupo de equivalencia,
  regresión opcional, bandera "complejo", contraindicaciones y `fuente`
  (guía u organismo que lo respalda: OMS, ACSM, etc.).
- La movilidad declara además su fase (`warmup` o `cooldown`). Las entradas de calentamiento y
  enfriamiento son sin equipo y alimentan los bloques fijos de cada sesión.
- Las pautas generales de volumen se basan en guías de la OMS/ACSM.
- Sin imágenes ni videos copiados de terceros en el MVP.
- Idealmente, revisión previa al lanzamiento por un profesional (fisioterapeuta o
  licenciado en deporte).

## 5. Stack

Usar la **última versión estable** de cada pieza y verificarla al instalar
(React, React Router y Drizzle no manejan versiones LTS).

| Pieza | Decisión |
|---|---|
| UI | React 19.2+ |
| Lenguaje | TypeScript |
| Enrutamiento | React Router v8 en modo framework (Vite 7+). Importar desde `react-router`, no `react-router-dom` |
| Runtime / paquetes | Bun. Validar compatibilidad con Vite y React Router en la fase 0; respaldo: Node 22.22+ en Docker |
| Base de datos | PostgreSQL |
| ORM | Drizzle ORM + drizzle-kit (confirmar si la 1.0 ya es estable) |
| Autenticación | **Better Auth** (con adaptador de Drizzle) |
| UI kit | Tailwind + shadcn/ui |
| Iconos | HugeIcons (paquete gratuito) |
| Validación | Zod |
| Pruebas | Vitest |
| Contenedores | Docker multi-stage + docker-compose con Postgres para desarrollo |

Se aceptan propuestas de mejora, justificadas.

## 6. Arquitectura

- **Screaming Architecture por features:** `auth`, `onboarding`, `bmi`, `plans`,
  `exercises`, `sessions`. Cada feature con `domain/` (lógica pura en TS), `data/`
  (Drizzle) y `ui/`.
- El motor de planes es lógica pura y testeable, sin dependencias de UI ni de base de datos.
- No sobrearquitecturar: nada de DDD ni hexagonal completo.
- Los textos de la interfaz viven en un archivo centralizado.

## 7. Documentación

README, `AGENTS.md`, `CONTRIBUTING.md`, `docs/architecture.md` y ADRs cortos
(`docs/adr/`) por cada decisión relevante. Deben permitir que cualquier dev nuevo o
cualquier IA entienda la base, las normas y los lineamientos sin cambiar el paradigma.

## 8. Privacidad

Los datos de salud son sensibles (Ley 1581 de 2012, Colombia): pedir consentimiento,
recolectar solo lo necesario y ofrecer borrado de cuenta inmediato, con confirmación
explícita.

## 9. Flujo de trabajo en GitHub

- Repositorio: `dev-plague/trainer-bot`.
- Todo cambio sigue: **issue → rama → PR → CI verde → merge por dev-plague**.
- Commits convencionales; plantillas de issue y de PR.
- El autor de una PR no puede aprobarla en GitHub: si un agente usa la cuenta de
  dev-plague, el requisito es CI verde + merge manual.
- Si algo contradice este brief, se abre una PR que lo modifique; no se ignora.
