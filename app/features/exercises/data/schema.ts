import {
  type AnyPgColumn,
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import type { Equipment } from "../domain/equipment";
import type { EquivalenceGroup, ExerciseLevel, ExercisePlace } from "../domain/exercise-seed";
import { EXERCISE_MEASURES, type ExerciseMeasure, type MuscleGroup } from "../domain/muscles";

export const exercisePlaceEnum = pgEnum("exercise_place", ["home", "gym", "outdoor"]);
export const exerciseLevelEnum = pgEnum("exercise_level", ["beginner", "intermediate", "advanced"]);
export const exerciseMeasureEnum = pgEnum("exercise_measure", EXERCISE_MEASURES);

export const exercise = pgTable(
  "exercise",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    primaryMuscles: text("primary_muscles").array().$type<MuscleGroup[]>().notNull(),
    secondaryMuscles: text("secondary_muscles")
      .array()
      .$type<MuscleGroup[]>()
      .notNull()
      .default([]),
    equipment: text("equipment").array().$type<Equipment[]>().notNull().default([]),
    place: exercisePlaceEnum("place").$type<ExercisePlace>().notNull(),
    level: exerciseLevelEnum("level").$type<ExerciseLevel>().notNull(),
    measure: exerciseMeasureEnum("measure").$type<ExerciseMeasure>().notNull().default("reps"),
    tips: text("tips").array().notNull(),
    contraindications: text("contraindications").array().notNull().default([]),
    equivalenceGroup: text("equivalence_group").$type<EquivalenceGroup>().notNull(),
    regressionId: text("regression_id").references((): AnyPgColumn => exercise.id, {
      onDelete: "set null",
    }),
    isComplex: boolean("is_complex").notNull().default(false),
    source: text("source").notNull(),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("exercise_equivalence_group_idx").on(table.equivalenceGroup)],
);
