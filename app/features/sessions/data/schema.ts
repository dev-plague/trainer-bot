import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "~/features/auth/data/schema";
import { exercise } from "~/features/exercises/data/schema";
import { planDay, planExercise } from "~/features/plans/data/schema";

export const workoutSessionStatusEnum = pgEnum("workout_session_status", [
  "in_progress",
  "completed",
  "abandoned",
]);

export const exerciseLogStatusEnum = pgEnum("exercise_log_status", ["pending", "done", "skipped"]);

export const workoutSession = pgTable(
  "workout_session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planDayId: text("plan_day_id")
      .notNull()
      .references(() => planDay.id, { onDelete: "cascade" }),
    status: workoutSessionStatusEnum("status").notNull().default("in_progress"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [index("workout_session_user_status_idx").on(table.userId, table.status)],
);

export const exerciseLog = pgTable(
  "exercise_log",
  {
    id: text("id").primaryKey(),
    workoutSessionId: text("workout_session_id")
      .notNull()
      .references(() => workoutSession.id, { onDelete: "cascade" }),
    planExerciseId: text("plan_exercise_id")
      .notNull()
      .references(() => planExercise.id, { onDelete: "cascade" }),
    /** Ejercicio realmente ejecutado: puede ser la regresión del planificado. */
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercise.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    status: exerciseLogStatusEnum("status").notNull().default("pending"),
    /** Series ya completadas de este ejercicio; permite retomar a media serie. */
    setsCompleted: integer("sets_completed").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    note: text("note"),
  },
  (table) => [
    uniqueIndex("exercise_log_session_position_idx").on(table.workoutSessionId, table.position),
  ],
);
