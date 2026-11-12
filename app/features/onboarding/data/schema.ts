import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "../../auth/data/schema";
import type { AddressForm } from "../domain/address-form";
import type { ConsentKind } from "../domain/consents";

export const addressFormEnum = pgEnum("address_form", ["neutral", "feminine", "masculine"]);

export const consent = pgTable(
  "consent",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind").$type<ConsentKind>().notNull(),
    version: text("version").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("consent_user_kind_version_idx").on(table.userId, table.kind, table.version),
  ],
);

export const profile = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  preferredName: text("preferred_name").notNull(),
  addressForm: addressFormEnum("address_form").$type<AddressForm>().notNull().default("neutral"),
  birthDate: date("birth_date"),
  heightCm: integer("height_cm"),
  weightKg: numeric("weight_kg", { precision: 5, scale: 1 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
