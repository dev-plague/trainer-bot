import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";

import { exercise } from "~/features/exercises/data/schema";
import { db } from "~/shared/db/client";
import type { GeneratedPlan, PlanRequest } from "../domain/contract";
import { plan, planDay, planExercise } from "./schema";

/**
 * Guarda el plan en una transacción: archiva el activo anterior y escribe
 * días y ejercicios con su orden. Falla si un slug no existe en el catálogo.
 */
export async function saveGeneratedPlan(
  userId: string,
  request: PlanRequest,
  generated: GeneratedPlan,
): Promise<string> {
  const slugs = [
    ...new Set(generated.days.flatMap((day) => day.exercises.map((item) => item.exerciseSlug))),
  ];

  const rows =
    slugs.length > 0
      ? await db
          .select({ id: exercise.id, slug: exercise.slug })
          .from(exercise)
          .where(inArray(exercise.slug, slugs))
      : [];

  const idBySlug = new Map(rows.map((row) => [row.slug, row.id]));
  const missing = slugs.filter((slug) => !idBySlug.has(slug));

  if (missing.length > 0) {
    throw new Error(`Ejercicios no encontrados en el catálogo: ${missing.join(", ")}`);
  }

  return db.transaction(async (tx) => {
    await tx
      .update(plan)
      .set({ status: "archived" })
      .where(and(eq(plan.userId, userId), eq(plan.status, "active")));

    const planId = randomUUID();

    await tx.insert(plan).values({
      id: planId,
      userId,
      status: "active",
      goal: request.goal,
      experienceLevel: request.level,
      daysPerWeek: request.daysPerWeek,
      sessionMinutes: request.sessionMinutes,
      place: request.place,
      equipment: request.equipment,
      limitations: request.limitations,
      mode: request.mode,
      inputsSnapshot: request,
      engineVersion: generated.engineVersion,
      warnings: generated.warnings,
    });

    for (const day of generated.days) {
      const dayId = randomUUID();

      await tx.insert(planDay).values({
        id: dayId,
        planId,
        dayIndex: day.dayIndex,
        category: day.category,
        isRest: day.isRest,
      });

      if (day.exercises.length > 0) {
        await tx.insert(planExercise).values(
          day.exercises.map((item, position) => ({
            id: randomUUID(),
            planDayId: dayId,
            exerciseId: idBySlug.get(item.exerciseSlug) as string,
            position,
            prescription: item.prescription,
          })),
        );
      }
    }

    return planId;
  });
}
