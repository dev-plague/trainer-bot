import type { EquivalenceGroup, MobilityPhase } from "~/features/exercises/domain/exercise-seed";
import type { MuscleGroup } from "~/features/exercises/domain/muscles";
import type { CandidateExercise, ExerciseContext } from "./generate";
import { isExerciseAvailable } from "./generate";

export type SubstitutionTarget = {
  slug: string;
  equivalenceGroup: EquivalenceGroup;
  mobilityPhase: MobilityPhase | null;
};

/**
 * Opciones válidas para cambiar un ejercicio en modo flexible: mismo grupo,
 * compatibles con lugar, equipo, nivel y limitaciones, y distintas a la actual.
 */
export function availableSubstitutes(
  current: SubstitutionTarget,
  catalog: readonly CandidateExercise[],
  context: ExerciseContext,
  focus?: readonly MuscleGroup[],
): CandidateExercise[] {
  return catalog
    .filter(
      (exercise) =>
        exercise.slug !== current.slug &&
        exercise.equivalenceGroup === current.equivalenceGroup &&
        exercise.mobilityPhase === current.mobilityPhase &&
        (focus === undefined || exercise.primaryMuscles.some((muscle) => focus.includes(muscle))) &&
        isExerciseAvailable(exercise, context),
    )
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
