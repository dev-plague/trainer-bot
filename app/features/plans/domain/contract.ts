import { z } from "zod";

import {
  EQUIPMENT,
  EXERCISE_LEVELS,
  EXERCISE_PLACES,
  type ExerciseLevel,
} from "~/features/exercises";
import { PLAN_GOALS, type PlanGoal, type Range } from "./profiles";

export const PLAN_MODES = ["strict", "flexible"] as const;
export type PlanMode = (typeof PLAN_MODES)[number];

export const MIN_DAYS_PER_WEEK = 2;
export const MAX_DAYS_PER_WEEK = 5;
export const MIN_SESSION_MINUTES = 20;
export const MAX_SESSION_MINUTES = 120;

/** Subir esta versión cuando cambien perfiles o reglas del motor. */
export const ENGINE_VERSION = "3";

export const planRequestSchema = z.object({
  goal: z.enum(PLAN_GOALS),
  level: z.enum(EXERCISE_LEVELS),
  daysPerWeek: z.number().int().min(MIN_DAYS_PER_WEEK).max(MAX_DAYS_PER_WEEK),
  sessionMinutes: z.number().int().min(MIN_SESSION_MINUTES).max(MAX_SESSION_MINUTES),
  place: z.enum(EXERCISE_PLACES),
  equipment: z.array(z.enum(EQUIPMENT)).default([]),
  limitations: z.string().trim().max(300).default(""),
  mode: z.enum(PLAN_MODES),
});

export type PlanRequest = z.infer<typeof planRequestSchema>;

export const PLAN_WARNING_CODES = [
  "missing_pattern",
  "missing_mobility",
  "session_too_short",
  "equipment_limited",
] as const;
export type PlanWarningCode = (typeof PLAN_WARNING_CODES)[number];

/** Avisos tipados: la UI decide el texto; el motor solo explica qué pasó. */
export type PlanWarning = {
  code: PlanWarningCode;
  detail?: string;
};

export type PlanExercisePrescription = {
  exerciseSlug: string;
  prescription:
    | {
        kind: "strength";
        sets: number;
        reps: Range;
        rir: number;
        restSeconds: number;
      }
    | {
        kind: "isometric";
        sets: number;
        seconds: Range;
        restSeconds: number;
      }
    | {
        kind: "cardio";
        minutes: number;
        intensity: "light" | "moderate" | "light_moderate";
      }
    | {
        kind: "mobility";
        sets: number;
        seconds: Range;
        restSeconds: number;
      };
};

export const PLAN_DAY_CATEGORIES = [
  "full_body",
  "upper",
  "lower",
  "push_quads",
  "pull_posterior",
  "legs_shoulders_core",
  "cardio",
] as const;
export type PlanDayCategory = (typeof PLAN_DAY_CATEGORIES)[number];

export type PlanDay = {
  dayIndex: number;
  category: PlanDayCategory;
  isRest: boolean;
  exercises: PlanExercisePrescription[];
};

export type GeneratedPlan = {
  engineVersion: string;
  goal: PlanGoal;
  level: ExerciseLevel;
  mode: PlanMode;
  days: PlanDay[];
  warnings: PlanWarning[];
};
