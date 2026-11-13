import { and, asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { exercise } from "~/features/exercises/data/schema";
import type { MuscleGroup } from "~/features/exercises/domain/muscles";
import type { PlanDayCategory, PlanExercisePrescription } from "~/features/plans";
import { planDay, planExercise } from "~/features/plans/data/schema";
import { db } from "~/shared/db/client";
import { exerciseLog, workoutSession } from "./schema";

const regressionExercise = alias(exercise, "regression_exercise");

export type SessionExercise = {
  logId: string;
  position: number;
  status: "pending" | "done" | "skipped";
  setsDone: number;
  prescription: PlanExercisePrescription["prescription"];
  slug: string;
  name: string;
  tips: string[];
  primaryMuscles: MuscleGroup[];
  isComplex: boolean;
  regression: { slug: string; name: string } | null;
};

export type SessionState = {
  id: string;
  status: "in_progress" | "completed" | "abandoned";
  dayIndex: number;
  category: PlanDayCategory;
  durationMinutes: number | null;
  exercises: SessionExercise[];
  currentIndex: number | null;
  doneCount: number;
  total: number;
};

export async function getSessionState(
  userId: string,
  sessionId: string,
): Promise<SessionState | null> {
  const [session] = await db
    .select()
    .from(workoutSession)
    .where(and(eq(workoutSession.id, sessionId), eq(workoutSession.userId, userId)))
    .limit(1);

  if (!session) return null;

  const [day] = await db
    .select({ dayIndex: planDay.dayIndex, category: planDay.category })
    .from(planDay)
    .where(eq(planDay.id, session.planDayId))
    .limit(1);

  const rows = await db
    .select({
      logId: exerciseLog.id,
      position: exerciseLog.position,
      status: exerciseLog.status,
      setsDone: exerciseLog.setsCompleted,
      prescription: planExercise.prescription,
      slug: exercise.slug,
      name: exercise.name,
      tips: exercise.tips,
      primaryMuscles: exercise.primaryMuscles,
      isComplex: exercise.isComplex,
      regressionSlug: regressionExercise.slug,
      regressionName: regressionExercise.name,
    })
    .from(exerciseLog)
    .innerJoin(planExercise, eq(planExercise.id, exerciseLog.planExerciseId))
    .innerJoin(exercise, eq(exercise.id, exerciseLog.exerciseId))
    .leftJoin(regressionExercise, eq(regressionExercise.id, exercise.regressionId))
    .where(eq(exerciseLog.workoutSessionId, session.id))
    .orderBy(asc(exerciseLog.position));

  const exercises: SessionExercise[] = rows.map((row) => ({
    logId: row.logId,
    position: row.position,
    status: row.status,
    setsDone: row.setsDone,
    prescription: row.prescription,
    slug: row.slug,
    name: row.name,
    tips: row.tips,
    primaryMuscles: row.primaryMuscles,
    isComplex: row.isComplex,
    regression:
      row.regressionSlug && row.regressionName
        ? { slug: row.regressionSlug, name: row.regressionName }
        : null,
  }));

  const currentIndex = exercises.findIndex((item) => item.status === "pending");
  const completedAt = session.completedAt;

  return {
    id: session.id,
    status: session.status,
    dayIndex: day?.dayIndex ?? 0,
    category: day?.category ?? "full_body",
    durationMinutes: completedAt
      ? Math.max(1, Math.round((completedAt.getTime() - session.startedAt.getTime()) / 60000))
      : null,
    exercises,
    currentIndex: currentIndex === -1 ? null : currentIndex,
    doneCount: exercises.filter((item) => item.status === "done").length,
    total: exercises.length,
  };
}
