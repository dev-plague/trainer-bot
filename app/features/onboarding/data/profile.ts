import { eq } from "drizzle-orm";

import { db } from "~/shared/db/client";
import type { AddressForm } from "../domain/address-form";
import { profile } from "./schema";

export async function getProfile(userId: string) {
  const rows = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);

  return rows[0] ?? null;
}

export type SaveProfileInput = {
  userId: string;
  preferredName: string;
  addressForm: AddressForm;
};

export async function saveProfile(input: SaveProfileInput) {
  await db
    .insert(profile)
    .values(input)
    .onConflictDoUpdate({
      target: profile.userId,
      set: {
        preferredName: input.preferredName,
        addressForm: input.addressForm,
        updatedAt: new Date(),
      },
    });
}
