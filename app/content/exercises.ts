import type { Equipment, MobilityPhase } from "~/features/exercises";
import type { MuscleGroup } from "~/features/exercises/domain/muscles";

export const exercisesText = {
  back: "Volver",
  muscles: "Músculos principales",
  secondaryMuscles: "También trabaja",
  equipment: "Equipo",
  noEquipment: "Sin equipo",
  equipmentLabels: {
    mancuernas: "Mancuernas",
    bandas: "Banda elástica",
    "barra-de-dominadas": "Barra de dominadas",
    "banco-o-silla": "Banco o silla",
    cuerda: "Cuerda",
    "gimnasio-completo": "Gimnasio completo",
  } satisfies Record<Equipment, string>,
  muscleLabels: {
    chest: "Pectoral",
    back: "Espalda",
    shoulders: "Hombros",
    biceps: "Bíceps",
    triceps: "Tríceps",
    quads: "Cuádriceps",
    hamstrings: "Isquiotibiales",
    glutes: "Glúteos",
    calves: "Gemelos",
    core: "Core",
  } satisfies Record<MuscleGroup, string>,
  mobilityPhases: {
    warmup: "Calentamiento",
    cooldown: "Enfriamiento",
  } satisfies Record<MobilityPhase, string>,
  tips: "Cómo hacerlo",
  contraindications: "Ten cuidado si tienes",
  regression: "Si te cuesta o no te sientes cómodo, prueba esta versión",
  source: "Fuente",
  places: {
    home: "En casa",
    gym: "Gimnasio",
    outdoor: "Al aire libre",
  },
  levels: {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
  },
};

export function equipmentLabel(key: string): string {
  return exercisesText.equipmentLabels[key as Equipment] ?? key;
}

export function muscleLabel(key: string): string {
  return exercisesText.muscleLabels[key as MuscleGroup] ?? key;
}
