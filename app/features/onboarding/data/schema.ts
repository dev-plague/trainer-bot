import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "../../auth/data/schema";
import type { ConsentKind } from "../domain/consents";

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
