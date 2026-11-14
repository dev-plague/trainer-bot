# ADR 0004 — Segmentación de días por grupos musculares

- **Estado:** aceptado
- **Fecha:** 2026-11-13
- **Decisión relacionada:** #77

## Contexto

El motor generaba cuerpo completo para 2-3 días y torso/pierna para 4-5. Todos los planes de
tres días salían iguales y no había forma de atacar grupos distintos. La referencia aportada
por dev-plague propone empuje + cuádriceps, tirón + cadena posterior y piernas + hombros +
core.

Las reglas de volumen no cambian: siguen saliendo de los perfiles del objetivo y del
modificador de nivel. La segmentación solo decide **qué patrones y grupos** cubre cada día.

## Decisión

1. Cada ejercicio declara músculos principales y secundarios en un vocabulario cerrado
   (`chest`, `back`, `shoulders`, `biceps`, `triceps`, `quads`, `hamstrings`, `glutes`,
   `calves`, `core`).
2. El motor usa **plantillas de día** tipadas: una lista de huecos (patrón + foco muscular).
3. La plantilla depende de los días elegidos:
   - 2: cuerpo completo A/B con ejercicios distintos.
   - 3: empuje + cuádriceps · tirón + cadena posterior · piernas + hombros + core.
   - 4: torso A · pierna A · torso B · pierna B.
   - 5: las tres primeras de 3 días + torso accesorio + cardio.
4. El foco solo ordena candidatos dentro del patrón; si no hay coincidencia, la cascada sigue
   con el patrón. Nunca se relaja la seguridad.
5. La variación A/B rota entre ejercicios del mismo nivel de forma determinista. Si el equipo
   no ofrece alternativas, se repite el único válido.
6. El cardio se mantiene al final de los días de fuerza si sobran al menos 10 minutos, y ocupa
   el quinto día cuando hay cinco.
7. Los isométricos se prescriben en segundos y la fuerza con rangos de repeticiones.

## Alternativas consideradas

- **Cuerpo completo siempre.** Simple, pero monótono y con días idénticos; no resuelve el
  problema reportado.
- **Que la persona elija el split.** Da control, pero añade una decisión más al formulario y
  sale del alcance del MVP; la segmentación por días cubre el caso.
- **Asignar ejercicios por músculo sin plantillas.** Genera días sin estructura (tres
  empujes y ningún tirón). Las plantillas garantizan cobertura de patrones.
- **Volumen de la rutina de referencia.** Se descarta: choca con «nadie entrena al fallo» y
  con los topes por perfil/nivel.

## Consecuencias

- El catálogo crece para cubrir gemelos, isométricos y variantes de empuje/tirón.
- La invariante «cada patrón tiene un ejercicio sin equipo» se mantiene y se prueba.
- Con equipo muy limitado, A y B pueden compartir ejercicios; es preferible a inventar
  opciones inseguras.
- Los planes guardados antes del cambio conservan prescripciones con un número fijo de reps;
  la UI las sigue mostrando.
- Cambiar plantillas o focos exige subir `engine_version`.

## Cuándo se revisa

- Tras la revisión profesional del catálogo y del motor.
- Si aparecen quejas de variedad o de duración de sesión.
- Si se añaden nuevos objetivos o equipos.
