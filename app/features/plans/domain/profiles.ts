import type { ExerciseLevel } from "~/features/exercises";

export const PLAN_GOALS = ["general_health", "fat_loss", "strength", "endurance"] as const;
export type PlanGoal = (typeof PLAN_GOALS)[number];

export type Range = {
  min: number;
  max: number;
};

export type CardioProfile = {
  sessionsPerWeek: Range;
  intensity: "light" | "moderate" | "light_moderate";
  weeklyMinutes: number | null;
  progression: "weekly_minutes" | "time";
};

/**
 * Perfil de un objetivo. Los números son puntos de partida revisables, no
 * verdades: ver docs/product/motor-de-planes.md.
 */
export type PlanProfile = {
  goal: PlanGoal;
  strengthDaysPerWeek: Range;
  sets: Range;
  reps: Range;
  rir: Range;
  restSeconds: Range;
  cardio: CardioProfile;
  source: string;
};

const ACSM = "ACSM's Guidelines for Exercise Testing and Prescription, 11.ª ed.";
const WHO = "OMS, Directrices sobre actividad física y hábitos sedentarios (2020)";

export const PLAN_PROFILES: Record<PlanGoal, PlanProfile> = {
  general_health: {
    goal: "general_health",
    strengthDaysPerWeek: { min: 2, max: 3 },
    sets: { min: 2, max: 2 },
    reps: { min: 10, max: 15 },
    rir: { min: 3, max: 4 },
    restSeconds: { min: 60, max: 90 },
    cardio: {
      sessionsPerWeek: { min: 2, max: 3 },
      intensity: "light_moderate",
      weeklyMinutes: 150,
      progression: "weekly_minutes",
    },
    source: `${ACSM}; ${WHO}`,
  },
  fat_loss: {
    goal: "fat_loss",
    strengthDaysPerWeek: { min: 2, max: 3 },
    sets: { min: 2, max: 3 },
    reps: { min: 10, max: 15 },
    rir: { min: 2, max: 3 },
    restSeconds: { min: 45, max: 75 },
    cardio: {
      sessionsPerWeek: { min: 2, max: 3 },
      intensity: "moderate",
      weeklyMinutes: null,
      progression: "weekly_minutes",
    },
    source: `${ACSM}; ${WHO}`,
  },
  strength: {
    goal: "strength",
    strengthDaysPerWeek: { min: 3, max: 3 },
    sets: { min: 2, max: 3 },
    reps: { min: 8, max: 12 },
    rir: { min: 2, max: 3 },
    restSeconds: { min: 90, max: 120 },
    cardio: {
      sessionsPerWeek: { min: 1, max: 2 },
      intensity: "light",
      weeklyMinutes: null,
      progression: "weekly_minutes",
    },
    source: `${ACSM}; ${WHO}`,
  },
  endurance: {
    goal: "endurance",
    strengthDaysPerWeek: { min: 2, max: 2 },
    sets: { min: 1, max: 2 },
    reps: { min: 12, max: 15 },
    rir: { min: 3, max: 3 },
    restSeconds: { min: 45, max: 60 },
    cardio: {
      sessionsPerWeek: { min: 3, max: 5 },
      intensity: "moderate",
      weeklyMinutes: null,
      progression: "time",
    },
    source: `${ACSM}; ${WHO}`,
  },
};

export type LevelModifier = {
  sets: number;
  rir: number;
  restSeconds: number;
  allowComplex: boolean;
};

/** Deltas exactos del nivel. El principiante nunca recibe ejercicios complejos. */
export const LEVEL_MODIFIERS: Record<ExerciseLevel, LevelModifier> = {
  beginner: { sets: -1, rir: 1, restSeconds: 15, allowComplex: false },
  intermediate: { sets: 0, rir: 0, restSeconds: 0, allowComplex: true },
  advanced: { sets: 0, rir: 0, restSeconds: 0, allowComplex: true },
};

export type EffectiveProfile = PlanProfile & {
  allowComplex: boolean;
};

const MAX_RIR = 5;
const MIN_RIR = 2;

export function profileFor(goal: PlanGoal, level: ExerciseLevel): EffectiveProfile {
  const base = PLAN_PROFILES[goal];
  const modifier = LEVEL_MODIFIERS[level];

  const adjust = (range: Range, delta: number, floor = 0, ceiling = Number.POSITIVE_INFINITY) => ({
    min: Math.min(ceiling, Math.max(floor, range.min + delta)),
    max: Math.min(ceiling, Math.max(floor, range.max + delta)),
  });

  return {
    ...base,
    sets: adjust(base.sets, modifier.sets, 1),
    rir: adjust(base.rir, modifier.rir, MIN_RIR, MAX_RIR),
    restSeconds: adjust(base.restSeconds, modifier.restSeconds, 30),
    allowComplex: modifier.allowComplex,
  };
}
