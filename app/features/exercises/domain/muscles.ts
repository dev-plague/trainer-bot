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

/** Cómo se prescribe: repeticiones o tiempo (isométricos). */
export const EXERCISE_MEASURES = ["reps", "seconds"] as const;
export type ExerciseMeasure = (typeof EXERCISE_MEASURES)[number];
