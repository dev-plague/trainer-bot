import { eq } from "drizzle-orm";

import { db } from "~/shared/db/client";
import { exercise } from "./schema";

export type ExerciseDetail = typeof exercise.$inferSelect & {
  regression: { slug: string; name: string } | null;
};

export async function getExerciseBySlug(slug: string): Promise<ExerciseDetail | null> {
  const [row] = await db.select().from(exercise).where(eq(exercise.slug, slug)).limit(1);

  if (!row) return null;

  if (!row.regressionId) {
    return { ...row, regression: null };
  }

  const [regression] = await db
    .select({ slug: exercise.slug, name: exercise.name })
    .from(exercise)
    .where(eq(exercise.id, row.regressionId))
    .limit(1);

  return { ...row, regression: regression ?? null };
}
