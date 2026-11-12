import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "~/shared/db/client";
import { CONSENT_VERSION, type ConsentKind } from "../domain/consents";
import { consent } from "./schema";

export async function getAcceptedConsents(userId: string) {
  return db
    .select({ kind: consent.kind, version: consent.version })
    .from(consent)
    .where(eq(consent.userId, userId));
}

export async function recordConsents(userId: string, kinds: readonly ConsentKind[]) {
  if (kinds.length === 0) return;

  await db
    .insert(consent)
    .values(
      kinds.map((kind) => ({
        id: randomUUID(),
        userId,
        kind,
        version: CONSENT_VERSION,
      })),
    )
    .onConflictDoNothing();
}
