import type { EquivalenceGroup } from "~/features/exercises";
import type { PlanExercisePrescription, PlanWarning } from "~/features/plans";

export const plansText = {
  formTitle: "Armemos tu plan",
  formSubtitle: "Con esto elijo ejercicios y volumen. Puedes volver a generarlo cuando quieras.",
  fields: {
    goal: "Objetivo",
    level: "Nivel",
    days: "Días por semana",
    minutes: "Minutos por sesión",
    place: "Dónde entrenas",
    equipment: "Equipo disponible",
    mode: "Modo",
    limitations: "Lesiones o limitaciones",
  },
  goals: {
    general_health: "Salud general",
    fat_loss: "Perder grasa",
    strength: "Fuerza y músculo",
    endurance: "Resistencia",
  },
  goalNotes: {
    fat_loss:
      "Perder grasa depende sobre todo de la alimentación, que está fuera de mi alcance. No prometo reducción localizada.",
  },
  levels: {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
  },
  places: {
    home: "En casa",
    gym: "Gimnasio",
    outdoor: "Al aire libre",
  },
  modes: {
    strict: "Estricto: el plan queda fijo",
    flexible: "Flexible: puedo cambiar ejercicios equivalentes",
  },
  modesShort: {
    strict: "Estricto",
    flexible: "Flexible",
  },
  equipmentHelp: "Marca solo lo que tengas. El peso corporal no hay que marcarlo.",
  limitationsLabel: "Lesiones o limitaciones (opcional)",
  limitationsPlaceholder: "Ej.: molestia en la rodilla derecha, dolor de hombro…",
  limitationsHelp:
    "Lo uso para excluir ejercicios contraindicados. No sustituye una valoración médica.",
  submit: "Generar plan",
  generating: "Generando plan…",
  formError: "Revisa los campos marcados.",
  planTitle: "Tu plan",
  planSubtitle: "Este es el plan que voy a seguir contigo.",
  meta: {
    goal: "Objetivo",
    mode: "Modo",
    days: "Días",
    minutes: "Minutos",
  },
  dayLabel: "Día",
  regenerate: "Crear un plan nuevo",
  change: "Cambiar",
  substituteTitle: "Cambiar ejercicio",
  substituteSubtitle:
    "Solo aparecen ejercicios del mismo tipo que puedas hacer con tu equipo y sin chocar con tus limitaciones.",
  currentLabel: "Ahora",
  optionsLabel: "Opciones",
  noOptions: "No hay otra opción compatible con tu equipo y tus limitaciones.",
  apply: "Usar este",
  cancel: "Cancelar",
  emptyDay: "Este día quedó sin ejercicios.",
  types: {
    strength: "Fuerza",
    isometric: "Isométrico",
    cardio: "Cardio",
    mobility: "Movilidad",
  },
  categories: {
    full_body: "Cuerpo completo",
    upper: "Torso",
    lower: "Pierna",
    push_quads: "Empuje y cuádriceps",
    pull_posterior: "Tirón y cadena posterior",
    legs_shoulders_core: "Piernas, hombros y core",
    cardio: "Cardio",
  },
  intensities: {
    light: "ligero",
    moderate: "moderado",
    light_moderate: "ligero-moderado",
  },
  groups: {
    squat: "sentadilla",
    lunge: "zancada",
    push: "empuje",
    pull: "tirón",
    hinge: "bisagra de cadera",
    core: "core",
    cardio: "cardio",
    calves: "gemelos",
    mobility: "movilidad",
  } satisfies Record<EquivalenceGroup, string>,
  warningsTitle: "Ajustes que hice",
  today: "Sesión de hoy",
  continueSession: "Continúa donde quedaste",
  nextSession: "Tu próximo entrenamiento",
  startDay: "Empezar este día",
  exercisesCount: (count: number) => `${count} ejercicios`,
};

export function prescriptionText(prescription: PlanExercisePrescription["prescription"]): string {
  switch (prescription.kind) {
    case "strength": {
      // Compatibilidad con planes guardados antes de las repeticiones por rango.
      const reps = prescription.reps as { min: number; max: number } | number;
      const label =
        typeof reps === "number"
          ? String(reps)
          : reps.min === reps.max
            ? String(reps.min)
            : `${reps.min}-${reps.max}`;

      return `${prescription.sets} × ${label} reps · RIR ${prescription.rir} · ${prescription.restSeconds} s de descanso`;
    }
    case "isometric":
      return `${prescription.sets} × ${prescription.seconds.min}-${prescription.seconds.max} s · ${prescription.restSeconds} s de descanso`;
    case "cardio":
      return `${prescription.minutes} min · ${plansText.intensities[prescription.intensity]}`;
    case "mobility":
      return `${prescription.sets} × ${prescription.reps} reps`;
  }
}

export function warningText(warning: PlanWarning): string {
  switch (warning.code) {
    case "missing_pattern": {
      const group = warning.detail
        ? (plansText.groups[warning.detail as EquivalenceGroup] ?? warning.detail)
        : "ese patrón";

      return `No encontré ejercicios de ${group} para tu equipo; ese patrón quedó fuera.`;
    }
    case "session_too_short":
      return `El día ${warning.detail ?? ""} quedó corto: menos de 10 minutos de trabajo.`;
    case "equipment_limited":
      return "Tu equipo limitó algunas opciones; ajusté el plan a lo que tienes.";
  }
}
