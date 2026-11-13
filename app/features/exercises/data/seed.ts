import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "~/shared/db/client";
import { validateSeed } from "../domain/exercise-seed";
import { exercise } from "./schema";
import { EXERCISES } from "./seed-data";

/**
 * Seed idempotente: actualiza por `slug` y resuelve las regresiones en una
 * segunda pasada para no chocar con la clave foránea.
 */
const { exercises } = validateSeed(EXERCISES);
const ids = new Map<string, string>();

for (const item of exercises) {
  const [row] = await db
    .insert(exercise)
    .values({
      id: randomUUID(),
      slug: item.slug,
      name: item.name,
      primaryMuscles: item.primaryMuscles,
      secondaryMuscles: item.secondaryMuscles,
      equipment: item.equipment,
      place: item.place,
      level: item.level,
      measure: item.measure,
      tips: item.tips,
      contraindications: item.contraindications,
      equivalenceGroup: item.equivalenceGroup,
      isComplex: item.isComplex,
      source: item.source,
      sourceUrl: item.sourceUrl ?? null,
      regressionId: null,
    })
    .onConflictDoUpdate({
      target: exercise.slug,
      set: {
        name: item.name,
        primaryMuscles: item.primaryMuscles,
        secondaryMuscles: item.secondaryMuscles,
        equipment: item.equipment,
        place: item.place,
        level: item.level,
        measure: item.measure,
        tips: item.tips,
        contraindications: item.contraindications,
        equivalenceGroup: item.equivalenceGroup,
        isComplex: item.isComplex,
        source: item.source,
        sourceUrl: item.sourceUrl ?? null,
        regressionId: null,
      },
    })
    .returning({ id: exercise.id, slug: exercise.slug });

  if (!row) {
    throw new Error(`No se pudo guardar el ejercicio ${item.slug}`);
  }

  ids.set(row.slug, row.id);
}

for (const item of exercises) {
  if (!item.regressionSlug) continue;

  const regressionId = ids.get(item.regressionSlug);

  if (!regressionId) {
    throw new Error(`Falta la regresión ${item.regressionSlug} de ${item.slug}`);
  }

  await db.update(exercise).set({ regressionId }).where(eq(exercise.slug, item.slug));
}

console.log(`Seed listo: ${exercises.length} ejercicios.`);
