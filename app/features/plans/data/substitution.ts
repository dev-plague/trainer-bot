import { and, eq, inArray, sql } from "drizzle-orm";

import { exercise } from "~/features/exercises/data/schema";
import { updatePendingLogsForPlanExercise } from "~/features/sessions";
import { db } from "~/shared/db/client";
import type { PlanMode } from "../domain/contract";
import { availableSubstitutes } from "../domain/substitution";
import { categoryFocus } from "../domain/templates";
import { loadCandidateExercises } from "./catalog";
import { plan, planDay, planExercise } from "./schema";

export type SubstitutionOption = {
  slug: string;
  name: string;
};

export type SubstitutionView = {
  planExerciseId: string;
  mode: PlanMode;
  current: { slug: string; name: string };
  options: SubstitutionOption[];
};

export async function getSubstitutionView(
  userId: string,
  planExerciseId: string,
): Promise<SubstitutionView | null> {
  const [row] = await db
    .select({
      planExerciseId: planExercise.id,
      slug: exercise.slug,
      name: exercise.name,
      group: exercise.equivalenceGroup,
      category: planDay.category,
      mode: plan.mode,
      place: plan.place,
      equipment: plan.equipment,
      level: plan.experienceLevel,
      limitations: plan.limitations,
    })
    .from(planExercise)
    .innerJoin(planDay, eq(planDay.id, planExercise.planDayId))
    .innerJoin(plan, eq(plan.id, planDay.planId))
    .innerJoin(exercise, eq(exercise.id, planExercise.exerciseId))
    .where(
      and(eq(planExercise.id, planExerciseId), eq(plan.userId, userId), eq(plan.status, "active")),
    )
    .limit(1);

  if (!row) return null;

  const catalog = await loadCandidateExercises();
  const candidates = availableSubstitutes(
    { slug: row.slug, equivalenceGroup: row.group },
    catalog,
    {
      place: row.place,
      equipment: row.equipment,
      level: row.level,
      limitations: row.limitations,
    },
    categoryFocus(row.category),
  );

  const names =
    candidates.length > 0
      ? await db
          .select({ slug: exercise.slug, name: exercise.name })
          .from(exercise)
          .where(
            inArray(
              exercise.slug,
              candidates.map((item) => item.slug),
            ),
          )
      : [];

  const nameBySlug = new Map(names.map((item) => [item.slug, item.name]));

  return {
    planExerciseId,
    mode: row.mode,
    current: { slug: row.slug, name: row.name },
    options: candidates.map((item) => ({
      slug: item.slug,
      name: nameBySlug.get(item.slug) ?? item.slug,
    })),
  };
}

/**
 * Cambia el ejercicio de un plan flexible y refleja el cambio en los logs
 * pendientes de una sesión en curso. El original se guarda una sola vez.
 */
export async function substitutePlanExercise(
  userId: string,
  planExerciseId: string,
  newSlug: string,
): Promise<boolean> {
  const view = await getSubstitutionView(userId, planExerciseId);

  if (view?.mode !== "flexible") return false;
  if (!view.options.some((option) => option.slug === newSlug)) return false;

  const [target] = await db
    .select({ id: exercise.id })
    .from(exercise)
    .where(eq(exercise.slug, newSlug))
    .limit(1);

  if (!target) return false;

  await db
    .update(planExercise)
    .set({
      exerciseId: target.id,
      originalExerciseId: sql`coalesce(${planExercise.originalExerciseId}, ${planExercise.exerciseId})`,
    })
    .where(eq(planExercise.id, planExerciseId));

  await updatePendingLogsForPlanExercise(planExerciseId, target.id);

  return true;
}
