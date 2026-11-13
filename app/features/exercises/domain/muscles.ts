export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

/** Tren del cuerpo al que pertenece un grupo muscular; `core` no decide tren. */
export const LOWER_BODY_MUSCLES = ["quads", "hamstrings", "glutes", "calves"] as const;
export const UPPER_BODY_MUSCLES = ["chest", "back", "shoulders", "biceps", "triceps"] as const;

export type BodyRegion = "lower" | "upper";

export function bodyRegionOfMuscle(muscle: MuscleGroup): BodyRegion | null {
  if ((LOWER_BODY_MUSCLES as readonly MuscleGroup[]).includes(muscle)) return "lower";
  if ((UPPER_BODY_MUSCLES as readonly MuscleGroup[]).includes(muscle)) return "upper";

  return null;
}

/** Cómo se prescribe: repeticiones o tiempo (isométricos). */
export const EXERCISE_MEASURES = ["reps", "seconds"] as const;
export type ExerciseMeasure = (typeof EXERCISE_MEASURES)[number];
