import type { EquivalenceGroup } from "~/features/exercises";
import type { CandidateExercise, ExerciseContext } from "./generate";
import { isExerciseAvailable } from "./generate";

export type SubstitutionTarget = {
  slug: string;
  equivalenceGroup: EquivalenceGroup;
};

/**
 * Opciones válidas para cambiar un ejercicio en modo flexible: mismo grupo,
 * compatibles con lugar, equipo, nivel y limitaciones, y distintas a la actual.
 */
export function availableSubstitutes(
  current: SubstitutionTarget,
  catalog: readonly CandidateExercise[],
  context: ExerciseContext,
): CandidateExercise[] {
  return catalog
    .filter(
      (exercise) =>
        exercise.slug !== current.slug &&
        exercise.equivalenceGroup === current.equivalenceGroup &&
        isExerciseAvailable(exercise, context),
    )
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
