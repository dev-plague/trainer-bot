import { and, asc, eq, inArray } from "drizzle-orm";

import type { Equipment, ExerciseLevel, ExercisePlace, MobilityPhase } from "~/features/exercises";
import { exercise } from "~/features/exercises/data/schema";
import type { MuscleGroup } from "~/features/exercises/domain/muscles";
import { db } from "~/shared/db/client";
import type {
  PlanDayCategory,
  PlanExercisePrescription,
  PlanMode,
  PlanWarning,
} from "../domain/contract";
import type { PlanGoal } from "../domain/profiles";
import { plan, planDay, planExercise } from "./schema";

export type ActivePlanExercise = {
  planExerciseId: string;
  slug: string;
  name: string;
  position: number;
  mobilityPhase: MobilityPhase | null;
  primaryMuscles: MuscleGroup[];
  prescription: PlanExercisePrescription["prescription"];
};

export type ActivePlanDay = {
  id: string;
  dayIndex: number;
  category: PlanDayCategory;
  exercises: ActivePlanExercise[];
};

export type ActivePlan = {
  id: string;
  goal: PlanGoal;
  level: ExerciseLevel;
  mode: PlanMode;
  daysPerWeek: number;
  sessionMinutes: number;
  place: ExercisePlace;
  equipment: Equipment[];
  limitations: string;
  warnings: PlanWarning[];
  engineVersion: string;
  days: ActivePlanDay[];
};

export async function getActivePlan(userId: string): Promise<ActivePlan | null> {
  const [row] = await db
    .select()
    .from(plan)
    .where(and(eq(plan.userId, userId), eq(plan.status, "active")))
    .limit(1);

  if (!row) return null;

  const days = await db
    .select()
    .from(planDay)
    .where(eq(planDay.planId, row.id))
    .orderBy(asc(planDay.dayIndex));

  const dayIds = days.map((day) => day.id);

  const rows =
    dayIds.length > 0
      ? await db
          .select({
            planExerciseId: planExercise.id,
            dayId: planExercise.planDayId,
            position: planExercise.position,
            prescription: planExercise.prescription,
            mobilityPhase: exercise.mobilityPhase,
            primaryMuscles: exercise.primaryMuscles,
            slug: exercise.slug,
            name: exercise.name,
          })
          .from(planExercise)
          .innerJoin(exercise, eq(exercise.id, planExercise.exerciseId))
          .where(inArray(planExercise.planDayId, dayIds))
          .orderBy(asc(planExercise.position))
      : [];

  const byDay = new Map<string, ActivePlanExercise[]>();

  for (const item of rows) {
    const list = byDay.get(item.dayId) ?? [];

    list.push({
      planExerciseId: item.planExerciseId,
      slug: item.slug,
      name: item.name,
      position: item.position,
      mobilityPhase: item.mobilityPhase,
      primaryMuscles: item.primaryMuscles,
      prescription: item.prescription,
    });
    byDay.set(item.dayId, list);
  }

  return {
    id: row.id,
    goal: row.goal,
    level: row.experienceLevel,
    mode: row.mode,
    daysPerWeek: row.daysPerWeek,
    sessionMinutes: row.sessionMinutes,
    place: row.place,
    equipment: row.equipment,
    limitations: row.limitations,
    warnings: row.warnings,
    engineVersion: row.engineVersion,
    days: days.map((day) => ({
      id: day.id,
      dayIndex: day.dayIndex,
      category: day.category,
      exercises: byDay.get(day.id) ?? [],
    })),
  };
}
