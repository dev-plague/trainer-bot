import type { EquivalenceGroup } from "~/features/exercises";
import {
  type PlanExercisePrescription,
  type PlanWarning,
  type SharedDayPrescription,
  samePrescription,
} from "~/features/plans";

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
  changing: "Cambiando…",
  changeConfirmed: (name: string) => `Listo: ahora haces «${name}».`,
  changeError: "No pude cambiar el ejercicio. Inténtalo otra vez.",
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
  nextSession: "Tu próxima sesión",
  continueSession: "Continúa donde quedaste",
  startDay: "Empezar este día",
  exercisesCount: (count: number) => `${count} ejercicios`,
  mobilitySummary: (warmup: number, cooldown: number) =>
    `Calentamiento ${warmup} min · Enfriamiento ${cooldown} min`,
  completed: "Completado",
  completedDay: "Completaste este día",
  sharedDayLabel: "Base del día",
  weekCompleteTitle: "Semana cumplida",
  weekCompleteBody:
    "Completaste todos los días de este plan. Descansa y vuelve cuando quieras empezar otra semana.",
  rir: {
    trigger: "¿Qué significa?",
    title: "Repeticiones en reserva (RIR)",
    body: "El RIR es cuántas repeticiones más podrías hacer cuando terminas la serie. Nos sirve para entrenar cerca del esfuerzo, sin llegar al fallo.",
    example:
      "Si te digo «deja unas 4 repeticiones sin hacer», termina la serie cuando sientas que aún podrías hacer 4 más.",
  },
  timedOption: "Por tiempo",
  optionEquipment: "Equipo",
};

export function rirText(rir: number): string {
  const reserve = Math.max(1, Math.round(rir));

  if (reserve === 1) return "Deja 1 repetición sin hacer";

  return `Deja unas ${reserve} repeticiones sin hacer`;
}

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

      return `${prescription.sets} × ${label} reps · ${rirText(prescription.rir)} · ${prescription.restSeconds} s de descanso`;
    }
    case "isometric":
      return `${prescription.sets} × ${prescription.seconds.min}-${prescription.seconds.max} s · ${prescription.restSeconds} s de descanso`;
    case "cardio":
      return `${prescription.minutes} min · ${plansText.intensities[prescription.intensity]}`;
    case "mobility": {
      const seconds =
        prescription.seconds.min === prescription.seconds.max
          ? String(prescription.seconds.min)
          : `${prescription.seconds.min}-${prescription.seconds.max}`;

      return `${prescription.sets} × ${seconds} s · ${prescription.restSeconds} s de descanso`;
    }
  }
}

/**
 * Lo que va en cada tarjeta cuando la cabecera ya muestra la prescripción
 * común del día: si el ejercicio repite lo mismo, la tarjeta no lo repite.
 */
export function prescriptionDetailText(
  prescription: PlanExercisePrescription["prescription"],
  shared: SharedDayPrescription | null,
): string | null {
  if (shared && samePrescription(prescription, shared)) return null;

  return prescriptionText(prescription);
}

export function warningText(warning: PlanWarning): string {
  switch (warning.code) {
    case "missing_pattern": {
      const group = warning.detail
        ? (plansText.groups[warning.detail as EquivalenceGroup] ?? warning.detail)
        : "ese patrón";

      return `No encontré ejercicios de ${group} para tu equipo; ese patrón quedó fuera.`;
    }
    case "missing_mobility":
      return warning.detail === "warmup"
        ? "No encontré movilidad de calentamiento compatible con tus limitaciones. Puedes calentar caminando unos minutos."
        : "No encontré movilidad de enfriamiento compatible con tus limitaciones. Puedes terminar con respiraciones lentas.";
    case "session_too_short":
      return `El día ${warning.detail ?? ""} quedó corto: menos de 10 minutos de trabajo.`;
    case "equipment_limited":
      return "Tu equipo limitó algunas opciones; ajusté el plan a lo que tienes.";
  }
}
