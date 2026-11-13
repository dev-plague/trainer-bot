export type { ExerciseDetail } from "./data/exercises";
export type { Equipment } from "./domain/equipment";
export { EQUIPMENT } from "./domain/equipment";
export type {
  EquivalenceGroup,
  ExerciseLevel,
  ExercisePlace,
  MobilityPhase,
  SeedExercise,
} from "./domain/exercise-seed";
export {
  EQUIVALENCE_GROUPS,
  EXERCISE_LEVELS,
  EXERCISE_PLACES,
  exerciseSeedSchema,
  exerciseSlugSchema,
  MOBILITY_PHASES,
  validateSeed,
} from "./domain/exercise-seed";
export type { BodyRegion, ExerciseMeasure } from "./domain/muscles";
export { bodyRegionOfMuscle } from "./domain/muscles";
