import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "~/features/auth/data/schema";
import { exercise } from "~/features/exercises/data/schema";
import type { Equipment } from "~/features/exercises/domain/equipment";
import { EXERCISE_LEVELS, EXERCISE_PLACES } from "~/features/exercises/domain/exercise-seed";
import type {
  PlanDayCategory,
  PlanExercisePrescription,
  PlanRequest,
  PlanWarning,
} from "../domain/contract";
import { PLAN_GOALS } from "../domain/profiles";

export const planGoalEnum = pgEnum("plan_goal", PLAN_GOALS);
export const planStatusEnum = pgEnum("plan_status", ["active", "archived"]);
export const planModeEnum = pgEnum("plan_mode", ["strict", "flexible"]);
export const planPlaceEnum = pgEnum("plan_place", EXERCISE_PLACES);
export const planLevelEnum = pgEnum("plan_level", EXERCISE_LEVELS);

export const plan = pgTable(
  "plan",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: planStatusEnum("status").notNull().default("active"),
    goal: planGoalEnum("goal").notNull(),
    experienceLevel: planLevelEnum("experience_level").notNull(),
    daysPerWeek: integer("days_per_week").notNull(),
    sessionMinutes: integer("session_minutes").notNull(),
    place: planPlaceEnum("place").notNull(),
    equipment: text("equipment").array().$type<Equipment[]>().notNull(),
    limitations: text("limitations").notNull().default(""),
    mode: planModeEnum("mode").notNull(),
    inputsSnapshot: jsonb("inputs_snapshot").$type<PlanRequest>().notNull(),
    engineVersion: text("engine_version").notNull(),
    warnings: jsonb("warnings").$type<PlanWarning[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("plan_user_id_idx").on(table.userId),
    uniqueIndex("plan_one_active_per_user_idx").on(table.userId).where(sql`status = 'active'`),
  ],
);

export const planDay = pgTable(
  "plan_day",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id")
      .notNull()
      .references(() => plan.id, { onDelete: "cascade" }),
    dayIndex: integer("day_index").notNull(),
    category: text("category").$type<PlanDayCategory>().notNull(),
    isRest: boolean("is_rest").notNull().default(false),
  },
  (table) => [uniqueIndex("plan_day_plan_index_idx").on(table.planId, table.dayIndex)],
);

export const planExercise = pgTable(
  "plan_exercise",
  {
    id: text("id").primaryKey(),
    planDayId: text("plan_day_id")
      .notNull()
      .references(() => planDay.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercise.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    prescription: jsonb("prescription").$type<PlanExercisePrescription["prescription"]>().notNull(),
  },
  (table) => [
    uniqueIndex("plan_exercise_day_position_idx").on(table.planDayId, table.position),
    index("plan_exercise_exercise_id_idx").on(table.exerciseId),
  ],
);
