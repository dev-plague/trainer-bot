import { exercise } from "~/features/exercises/data/schema";
import { db } from "~/shared/db/client";
import type { CandidateExercise } from "../domain/generate";

/** Catálogo completo como datos: el motor no sabe que existe una base. */
export async function loadCandidateExercises(): Promise<CandidateExercise[]> {
  return db
    .select({
      slug: exercise.slug,
      place: exercise.place,
      level: exercise.level,
      equipment: exercise.equipment,
      equivalenceGroup: exercise.equivalenceGroup,
      mobilityPhase: exercise.mobilityPhase,
      primaryMuscles: exercise.primaryMuscles,
      measure: exercise.measure,
      contraindications: exercise.contraindications,
      isComplex: exercise.isComplex,
    })
    .from(exercise);
}
