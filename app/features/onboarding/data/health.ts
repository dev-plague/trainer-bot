import { eq } from "drizzle-orm";

import { db } from "~/shared/db/client";
import type { ParqAnswers } from "../domain/parq";
import { healthScreening } from "./schema";

export async function getScreening(userId: string) {
  const rows = await db
    .select()
    .from(healthScreening)
    .where(eq(healthScreening.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}

export type SaveScreeningInput = {
  userId: string;
  answers: ParqAnswers;
  version: string;
  needsMedicalClearance: boolean;
};

export async function saveScreening(input: SaveScreeningInput) {
  await db
    .insert(healthScreening)
    .values({
      userId: input.userId,
      answers: input.answers,
      questionnaireVersion: input.version,
      needsMedicalClearance: input.needsMedicalClearance,
    })
    .onConflictDoUpdate({
      target: healthScreening.userId,
      set: {
        answers: input.answers,
        questionnaireVersion: input.version,
        needsMedicalClearance: input.needsMedicalClearance,
        answeredAt: new Date(),
      },
    });
}
