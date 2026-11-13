import { z } from "zod";

import { EQUIPMENT } from "./equipment";
import { EXERCISE_MEASURES, MUSCLE_GROUPS } from "./muscles";

export const EXERCISE_PLACES = ["home", "gym", "outdoor"] as const;
export type ExercisePlace = (typeof EXERCISE_PLACES)[number];

export const EXERCISE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type ExerciseLevel = (typeof EXERCISE_LEVELS)[number];

/** Bloque de la sesión al que pertenece una entrada de movilidad. */
export const MOBILITY_PHASES = ["warmup", "cooldown"] as const;
export type MobilityPhase = (typeof MOBILITY_PHASES)[number];

/**
 * Grupos que el modo flexible puede intercambiar. El nombre describe el patrón,
 * no el músculo: dos ejercicios del mismo grupo cumplen la misma función.
 */
export const EQUIVALENCE_GROUPS = [
  "squat",
  "lunge",
  "push",
  "pull",
  "hinge",
  "core",
  "cardio",
  "calves",
  "mobility",
] as const;
export type EquivalenceGroup = (typeof EQUIVALENCE_GROUPS)[number];

export const exerciseSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe ir en minúsculas y con guiones");

const slug = exerciseSlugSchema;

const textList = z.array(z.string().trim().min(1, "El texto no puede estar vacío"));

export const exerciseSeedSchema = z.object({
  slug,
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  primaryMuscles: z.array(z.enum(MUSCLE_GROUPS)).min(1, "Indica al menos un músculo principal"),
  secondaryMuscles: z.array(z.enum(MUSCLE_GROUPS)).default([]),
  equipment: z.array(z.enum(EQUIPMENT)).default([]),
  place: z.enum(EXERCISE_PLACES),
  level: z.enum(EXERCISE_LEVELS),
  tips: textList.min(1, "Agrega al menos un consejo de ejecución"),
  contraindications: textList.default([]),
  equivalenceGroup: z.enum(EQUIVALENCE_GROUPS),
  /** Solo la movilidad declara fase; el resto del catálogo no la usa. */
  mobilityPhase: z.enum(MOBILITY_PHASES).optional(),
  measure: z.enum(EXERCISE_MEASURES).default("reps"),
  regressionSlug: slug.optional(),
  isComplex: z.boolean().default(false),
  source: z
    .string({ error: "Cada ejercicio necesita una fuente" })
    .trim()
    .min(1, "Cada ejercicio necesita una fuente"),
  sourceUrl: z.url().optional(),
});

export type SeedExercise = z.infer<typeof exerciseSeedSchema>;

export type SeedValidationResult = {
  exercises: SeedExercise[];
  byGroup: Map<EquivalenceGroup, SeedExercise[]>;
};

/**
 * Valida el seed completo: forma, slugs únicos, regresiones existentes y
 * complejos con regresión. Falla con un mensaje que dice qué ejercicio arreglar.
 */
export function validateSeed(raw: readonly unknown[]): SeedValidationResult {
  const exercises = raw.map((item, index) => {
    const parsed = exerciseSeedSchema.safeParse(item);

    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "ejercicio"}: ${issue.message}`)
        .join("; ");

      throw new Error(`Ejercicio #${index + 1} inválido — ${detail}`);
    }

    return parsed.data;
  });

  const slugs = new Set<string>();

  for (const exercise of exercises) {
    if (slugs.has(exercise.slug)) {
      throw new Error(`Slug duplicado: ${exercise.slug}`);
    }

    slugs.add(exercise.slug);
  }

  for (const exercise of exercises) {
    if (exercise.regressionSlug === exercise.slug) {
      throw new Error(`La regresión de ${exercise.slug} no puede ser él mismo`);
    }

    if (exercise.regressionSlug && !slugs.has(exercise.regressionSlug)) {
      throw new Error(`Regresión inexistente para ${exercise.slug}: ${exercise.regressionSlug}`);
    }

    if (exercise.isComplex && !exercise.regressionSlug) {
      throw new Error(`El ejercicio complejo ${exercise.slug} necesita una regresión`);
    }

    if (exercise.equivalenceGroup === "mobility" && !exercise.mobilityPhase) {
      throw new Error(`La movilidad ${exercise.slug} necesita fase warmup o cooldown`);
    }

    if (exercise.equivalenceGroup !== "mobility" && exercise.mobilityPhase) {
      throw new Error(`Solo la movilidad puede declarar fase: ${exercise.slug}`);
    }
  }

  const byGroup = new Map<EquivalenceGroup, SeedExercise[]>();

  for (const exercise of exercises) {
    const group = byGroup.get(exercise.equivalenceGroup) ?? [];
    group.push(exercise);
    byGroup.set(exercise.equivalenceGroup, group);
  }

  return { exercises, byGroup };
}
