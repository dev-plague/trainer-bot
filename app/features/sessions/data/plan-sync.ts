import { and, eq } from "drizzle-orm";
import { db } from "~/shared/db/client";
import { exerciseLog } from "./schema";

/** Refleja un cambio del plan en los ejercicios aún pendientes de la sesión. */
export async function updatePendingLogsForPlanExercise(planExerciseId: string, exerciseId: string) {
  await db
    .update(exerciseLog)
    .set({ exerciseId })
    .where(and(eq(exerciseLog.planExerciseId, planExerciseId), eq(exerciseLog.status, "pending")));
}
