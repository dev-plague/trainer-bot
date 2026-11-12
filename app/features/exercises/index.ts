export type { ExerciseDetail } from "./data/exercises";
export { getExerciseBySlug } from "./data/exercises";
export type {
  EquivalenceGroup,
  ExerciseLevel,
  ExercisePlace,
  SeedExercise,
} from "./domain/exercise-seed";
export {
  EQUIVALENCE_GROUPS,
  EXERCISE_LEVELS,
  EXERCISE_PLACES,
  exerciseSeedSchema,
  exerciseSlugSchema,
  validateSeed,
} from "./domain/exercise-seed";
