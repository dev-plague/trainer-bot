import { and, asc, desc, eq } from "drizzle-orm";

import { exercise } from "~/features/exercises/data/schema";
import { plan, planDay, planExercise } from "~/features/plans/data/schema";
import { db } from "~/shared/db/client";
import { completeSetStep, restSecondsFor, totalSetsFor } from "../domain/session-progress";
import { exerciseLog, workoutSession } from "./schema";

async function findOwnedSession(userId: string, sessionId: string) {
  const [session] = await db
    .select()
    .from(workoutSession)
    .where(and(eq(workoutSession.id, sessionId), eq(workoutSession.userId, userId)))
    .limit(1);

  return session ?? null;
}

export type CompleteSetResult =
  | {
      ok: true;
      setsDone: number;
      totalSets: number;
      exerciseDone: boolean;
      sessionDone: boolean;
      restSeconds: number;
    }
  | { ok: false };

/**
 * Marca una serie del ejercicio actual. La última serie cierra el ejercicio y,
 * si era el último pendiente, completa la sesión. El progreso queda persistido
 * para poder retomar la sesión donde se quedó.
 */
export async function completeSet(userId: string, sessionId: string): Promise<CompleteSetResult> {
  const session = await findOwnedSession(userId, sessionId);

  if (session?.status !== "in_progress") return { ok: false };

  const [current] = await db
    .select({
      id: exerciseLog.id,
      setsDone: exerciseLog.setsCompleted,
      prescription: planExercise.prescription,
    })
    .from(exerciseLog)
    .innerJoin(planExercise, eq(planExercise.id, exerciseLog.planExerciseId))
    .where(and(eq(exerciseLog.workoutSessionId, sessionId), eq(exerciseLog.status, "pending")))
    .orderBy(asc(exerciseLog.position))
    .limit(1);

  if (!current) return { ok: false };

  const step = completeSetStep(current.setsDone, totalSetsFor(current.prescription));
  let sessionDone = false;

  await db.transaction(async (tx) => {
    await tx
      .update(exerciseLog)
      .set({
        setsCompleted: step.setsDone,
        ...(step.exerciseDone ? { status: "done" as const, completedAt: new Date() } : {}),
      })
      .where(eq(exerciseLog.id, current.id));

    if (!step.exerciseDone) return;

    const [remaining] = await tx
      .select({ id: exerciseLog.id })
      .from(exerciseLog)
      .where(and(eq(exerciseLog.workoutSessionId, sessionId), eq(exerciseLog.status, "pending")))
      .limit(1);

    if (!remaining) {
      sessionDone = true;

      await tx
        .update(workoutSession)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(workoutSession.id, sessionId));
    }
  });

  return {
    ok: true,
    setsDone: step.setsDone,
    totalSets: step.totalSets,
    exerciseDone: step.exerciseDone,
    sessionDone,
    restSeconds: restSecondsFor(current.prescription),
  };
}

export type SkipStepResult = { ok: true; sessionDone: boolean; restSeconds: 0 } | { ok: false };

/**
 * Omite el paso actual si es movilidad (calentamiento o enfriamiento). El
 * bloque sigue en el plan, pero la persona puede saltárselo.
 */
export async function skipCurrentExercise(
  userId: string,
  sessionId: string,
): Promise<SkipStepResult> {
  const session = await findOwnedSession(userId, sessionId);

  if (session?.status !== "in_progress") return { ok: false };

  const [current] = await db
    .select({
      logId: exerciseLog.id,
      mobilityPhase: exercise.mobilityPhase,
    })
    .from(exerciseLog)
    .innerJoin(exercise, eq(exercise.id, exerciseLog.exerciseId))
    .where(and(eq(exerciseLog.workoutSessionId, sessionId), eq(exerciseLog.status, "pending")))
    .orderBy(asc(exerciseLog.position))
    .limit(1);

  if (!current?.mobilityPhase) return { ok: false };

  let sessionDone = false;

  await db.transaction(async (tx) => {
    await tx
      .update(exerciseLog)
      .set({ status: "skipped", completedAt: new Date() })
      .where(eq(exerciseLog.id, current.logId));

    const [remaining] = await tx
      .select({ id: exerciseLog.id })
      .from(exerciseLog)
      .where(and(eq(exerciseLog.workoutSessionId, sessionId), eq(exerciseLog.status, "pending")))
      .limit(1);

    if (!remaining) {
      sessionDone = true;

      await tx
        .update(workoutSession)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(workoutSession.id, sessionId));
    }
  });

  return { ok: true, sessionDone, restSeconds: 0 };
}

/**
 * Cambia el ejercicio actual por su regresión. Solo si es complejo, tiene
 * regresión y la sesión sigue en curso.
 */
export async function applyRegression(userId: string, sessionId: string): Promise<boolean> {
  const session = await findOwnedSession(userId, sessionId);

  if (session?.status !== "in_progress") return false;

  const [current] = await db
    .select({
      logId: exerciseLog.id,
      isComplex: exercise.isComplex,
      regressionId: exercise.regressionId,
    })
    .from(exerciseLog)
    .innerJoin(exercise, eq(exercise.id, exerciseLog.exerciseId))
    .where(and(eq(exerciseLog.workoutSessionId, sessionId), eq(exerciseLog.status, "pending")))
    .orderBy(asc(exerciseLog.position))
    .limit(1);

  if (!current?.isComplex || !current.regressionId) return false;

  await db
    .update(exerciseLog)
    .set({ exerciseId: current.regressionId, setsCompleted: 0 })
    .where(eq(exerciseLog.id, current.logId));

  return true;
}

/** Días del plan activo que ya tienen una sesión completada. */
export async function getCompletedDayIndices(userId: string, planId: string): Promise<number[]> {
  const rows = await db
    .selectDistinct({ dayIndex: planDay.dayIndex })
    .from(workoutSession)
    .innerJoin(planDay, eq(planDay.id, workoutSession.planDayId))
    .where(
      and(
        eq(workoutSession.userId, userId),
        eq(workoutSession.status, "completed"),
        eq(planDay.planId, planId),
      ),
    );

  return rows.map((row) => row.dayIndex).sort((a, b) => a - b);
}

export async function getInProgressSessionForUser(userId: string) {
  const [row] = await db
    .select({
      id: workoutSession.id,
      dayIndex: planDay.dayIndex,
    })
    .from(workoutSession)
    .innerJoin(planDay, eq(planDay.id, workoutSession.planDayId))
    .innerJoin(plan, eq(plan.id, planDay.planId))
    .where(
      and(
        eq(workoutSession.userId, userId),
        eq(workoutSession.status, "in_progress"),
        eq(plan.status, "active"),
      ),
    )
    .orderBy(desc(workoutSession.startedAt))
    .limit(1);

  return row ?? null;
}
