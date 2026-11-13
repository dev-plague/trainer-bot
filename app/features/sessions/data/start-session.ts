import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { plan, planDay, planExercise } from "~/features/plans/data/schema";
import { db } from "~/shared/db/client";
import { exerciseLog, workoutSession } from "./schema";

/**
 * Crea (o reutiliza) la sesión de un día del plan activo. Devuelve el id o
 * `null` si el día no es de esta persona o no tiene ejercicios.
 */
export async function startSessionForDay(
  userId: string,
  planDayId: string,
): Promise<string | null> {
  const [day] = await db
    .select({ id: planDay.id })
    .from(planDay)
    .innerJoin(plan, eq(plan.id, planDay.planId))
    .where(and(eq(planDay.id, planDayId), eq(plan.userId, userId), eq(plan.status, "active")))
    .limit(1);

  if (!day) return null;

  const [existing] = await db
    .select({ id: workoutSession.id })
    .from(workoutSession)
    .where(
      and(
        eq(workoutSession.userId, userId),
        eq(workoutSession.planDayId, planDayId),
        eq(workoutSession.status, "in_progress"),
      ),
    )
    .limit(1);

  if (existing) return existing.id;

  const plannedExercises = await db
    .select({ id: planExercise.id, exerciseId: planExercise.exerciseId })
    .from(planExercise)
    .where(eq(planExercise.planDayId, planDayId))
    .orderBy(planExercise.position);

  if (plannedExercises.length === 0) return null;

  const sessionId = randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(workoutSession).values({
      id: sessionId,
      userId,
      planDayId,
      status: "in_progress",
    });

    await tx.insert(exerciseLog).values(
      plannedExercises.map((item, position) => ({
        id: randomUUID(),
        workoutSessionId: sessionId,
        planExerciseId: item.id,
        exerciseId: item.exerciseId,
        position,
        status: "pending" as const,
      })),
    );
  });

  return sessionId;
}
