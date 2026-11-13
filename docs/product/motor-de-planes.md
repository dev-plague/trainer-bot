# Motor de planes — reglas de dominio

> **Estado:** vigente · **Fecha:** 2026-11-12 · **Decisión:** dev-plague · **Issue:** #55
>
> Documento canónico de los perfiles y la cascada del motor. El brief (§3.11) lo resume y
> enlaza; el [ADR 0003](../adr/0003-perfiles-del-motor.md) explica por qué son datos tipados.
> Los números son **puntos de partida razonables, no verdades**: deben revisarse con un
> profesional (fisioterapeuta o licenciado en deporte) antes del lanzamiento.

## Principio general

Las reglas del motor son **datos tipados**, no lógica dispersa en el código. Así el motor es
testeable y un profesional puede revisar los números sin leer TypeScript.

- Los perfiles viven como constantes tipadas, validadas con Zod, cada una con su campo `fuente`.
- La generación del plan es **lógica pura** en `features/plans/domain/` (sin React ni base de datos).
- Los valores de este documento se revisan con un profesional antes del lanzamiento.

## 1. Objetivo → volumen e intensidad

### 1.1 Cuatro objetivos, cada uno como un perfil

Todos los perfiles comparten los mismos parámetros: días de fuerza, series × repeticiones,
repeticiones en reserva (RIR), descanso y carga de cardio.

| Objetivo | Fuerza | Series × reps | RIR | Descanso | Cardio |
|---|---|---|---|---|---|
| Salud general | 2-3 días, cuerpo completo | 2 × 10-15 | 3-4 | 60-90 s | Ligero/moderado, sumando de forma progresiva hasta 150 min/semana |
| Perder grasa | 2-3 días, cuerpo completo | 2-3 × 10-15 | 2-3 | 45-75 s | Moderado, 2-3 días |
| Fuerza / músculo | 3 días, cuerpo completo o torso/pierna | 2-3 × 8-12 | 2-3 | 90-120 s | Ligero, 1-2 días |
| Resistencia | 2 días, complementaria | 1-2 × 12-15 | 3 | 45-60 s | Mayoría del plan, progresión por tiempo |

Cada perfil lleva `fuente`: OMS para el cardio, ACSM para la fuerza.

### 1.2 Reglas de aplicación

1. **El nivel es un modificador, no un perfil aparte.** Un principiante tiene una serie menos,
   1-2 RIR más, más descanso y **nunca** recibe ejercicios marcados como complejos.
2. **Nadie entrena al fallo en el MVP.** El RIR mínimo es 2.
3. **Cardio por "prueba del habla"**: moderado = puedes hablar pero no cantar. No se pide
   medir pulso.
4. **Tiempo → cantidad de ejercicios.** El costo de un ejercicio es
   `series × (tiempo de la serie + descanso)`. Se resta el calentamiento y el enfriamiento
   (unos 5 min cada uno) y se añaden ejercicios hasta llenar el tiempo disponible.
5. **Cobertura antes que cantidad.** Primero se cubren los patrones de movimiento (empuje,
   tirón, pierna, bisagra de cadera, core) y solo después se rellena.
6. **Reparto por días.** Hasta 3 días: todos de cuerpo completo. Con 4 o 5 días: alternar
   torso/pierna o sumar días de cardio.
7. **Honestidad con "perder grasa".** Ese resultado depende sobre todo de la alimentación,
   que está fuera de alcance. Trainerbot debe decirlo y no prometer reducción localizada.
8. **Sin kilos.** La intensidad se comunica siempre con esfuerzo percibido o RIR
   (brief, §3.8).

## 2. El equipo disponible no alcanza para completar un día

### 2.1 Invariante del catálogo

**Cada patrón de movimiento debe tener al menos un ejercicio sin equipo**, para cada nivel
aplicable. Se verifica con un test en el CI: si el catálogo rompe la invariante, el build falla.
Así un día nunca queda imposible de armar por falta de opciones.

El test vive en `app/features/exercises/domain/catalog-invariant.test.ts` y comprueba, además,
que cada grupo de equivalencia tenga al menos dos ejercicios.

### 2.2 Equipo simplificado

Lista cerrada: `ninguno`, `mancuernas`, `bandas`, `barra de dominadas`, `banco o silla`,
`cuerda`, `gimnasio completo`. "Gimnasio completo" implica todo lo anterior. `ninguno` admite
objetos de casa que no son equipo de entrenamiento, como una toalla.

### 2.3 Cascada por cada hueco del día

0. **Antes de la cascada**, filtrar los ejercicios incompatibles con las lesiones o
   limitaciones declaradas.

Luego, para cada patrón de movimiento que falte cubrir, probar en orden:

1. Otro ejercicio del mismo **grupo de equivalencia** que use el equipo disponible.
2. Una **regresión o progresión** del mismo patrón, respetando el nivel.
3. La **versión de peso corporal** del patrón.
4. Si el patrón no se puede cubrir, **sustituirlo por un patrón cercano o dejarlo fuera**.
   Nunca inventar ejercicios inseguros. Se registra un aviso.

### 2.4 Reglas adicionales

- **Mejor una sesión corta que inflar el volumen.** No se superan los topes del perfil para
  llenar el tiempo. Si sobra tiempo, se añade movilidad o cardio, no series extra.
- **Mínimo útil**: si la sesión queda por debajo de unos 20 minutos, se comunica a la persona
  con honestidad.

### 2.5 Avisos al usuario

El motor devuelve el plan junto con una lista de `avisos` tipada. La UI los muestra con el
tono cercano y sincero de Trainerbot. Ejemplo:

> "Con tu equipo no pude incluir un ejercicio de tirón; te dejé uno de peso corporal para
> la espalda. Una barra de dominadas te abriría más opciones."

## 3. Pruebas obligatorias (Vitest)

- Cada combinación objetivo × nivel produce un plan válido (series, reps y RIR dentro del perfil).
- El presupuesto de tiempo se respeta y nunca se supera el volumen máximo del perfil.
- Un principiante nunca recibe ejercicios marcados como complejos.
- Cada paso de la cascada: sustitución por equivalencia, por regresión, por peso corporal
  y omisión con aviso.
- Las lesiones declaradas excluyen los ejercicios contraindicados **antes** de la cascada.
- Invariante del catálogo: todo patrón de movimiento tiene un ejercicio sin equipo.
- Casos límite: equipo `ninguno`, tiempo mínimo, 5 días por semana.

## 4. Pendientes al implementar E5

Estos puntos no se resolvieron en la decisión y hay que cerrarlos al escribir el motor:

1. **Normalizar el equipo del seed.** El catálogo todavía usa etiquetas ("Banda elástica",
   "Barra", "Polea") y no las claves de la lista cerrada. Al escribir el motor se mapean a
   `mancuernas`, `bandas`, `barra-de-dominadas`, `cuerda`, etc., y se tipa el campo.
2. **Persistencia de avisos.** El plan debe guardar sus `avisos` para que sobrevivan a una
   recarga; se añade la columna al modelo en la PR de persistencia.
3. **Deltas exactos del nivel.** La regla dice "una serie menos, 1-2 RIR más, más descanso";
   los números concretos se fijan en los perfiles y se prueban.

## 5. Fuentes

- OMS, *Directrices sobre actividad física y hábitos sedentarios* (2020), para el volumen de
  actividad aeróbica y de fortalecimiento.
- ACSM, *Guidelines for Exercise Testing and Prescription*, 11.ª ed., para fuerza, RIR y
  descansos.
