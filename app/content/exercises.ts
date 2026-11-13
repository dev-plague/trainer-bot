import type { Equipment } from "~/features/exercises";

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
