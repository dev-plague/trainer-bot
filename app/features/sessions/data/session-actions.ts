import { and, asc, desc, eq } from "drizzle-orm";

import { exercise } from "~/features/exercises/data/schema";
import { plan, planDay } from "~/features/plans/data/schema";
import { db } from "~/shared/db/client";
import { exerciseLog, workoutSession } from "./schema";

async function findOwnedSession(userId: string, sessionId: string) {
  const [session] = await db
    .select()
    .from(workoutSession)
    .where(and(eq(workoutSession.id, sessionId), eq(workoutSession.userId, userId)))
    .limit(1);

  return session ?? null;
}

async function findCurrentLog(sessionId: string) {
  const [current] = await db
    .select({ id: exerciseLog.id })
    .from(exerciseLog)
    .where(and(eq(exerciseLog.workoutSessionId, sessionId), eq(exerciseLog.status, "pending")))
    .orderBy(asc(exerciseLog.position))
    .limit(1);

  return current ?? null;
}

/** Marca el primer ejercicio pendiente como hecho y completa la sesión si era el último. */
export async function completeCurrentExercise(userId: string, sessionId: string): Promise<boolean> {
  const session = await findOwnedSession(userId, sessionId);

  if (session?.status !== "in_progress") return false;

  const current = await findCurrentLog(sessionId);

  if (!current) return false;

  await db.transaction(async (tx) => {
    await tx
      .update(exerciseLog)
      .set({ status: "done", completedAt: new Date() })
      .where(eq(exerciseLog.id, current.id));

    const [remaining] = await tx
      .select({ id: exerciseLog.id })
      .from(exerciseLog)
      .where(and(eq(exerciseLog.workoutSessionId, sessionId), eq(exerciseLog.status, "pending")))
      .limit(1);

    if (!remaining) {
      await tx
        .update(workoutSession)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(workoutSession.id, sessionId));
    }
  });

  return true;
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
    .set({ exerciseId: current.regressionId })
    .where(eq(exerciseLog.id, current.logId));

  return true;
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
