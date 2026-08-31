import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const comics = sqliteTable(
  "comics",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    collectionName: text("collection_name").notNull(),
    issueNumber: integer("issue_number").notNull(),
    description: text("description").notNull().default(""),
    priceEurCents: integer("price_eur_cents").notNull().default(50),
    priceUsdCents: integer("price_usd_cents").notNull().default(50),
    includedInPass: integer("included_in_pass", { mode: "boolean" })
      .notNull()
      .default(false),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    coverAssetId: text("cover_asset_id"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("comics_slug_unique").on(table.slug),
    uniqueIndex("comics_collection_issue_unique").on(
      table.collectionName,
      table.issueNumber,
    ),
    index("comics_status_updated_idx").on(table.status, table.updatedAt),
  ],
);

export const assets = sqliteTable(
  "assets",
  {
    id: text("id").primaryKey(),
    comicId: text("comic_id")
      .notNull()
      .references(() => comics.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["cover", "page"] }).notNull(),
    objectKey: text("object_key").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    position: integer("position"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("assets_object_key_unique").on(table.objectKey),
    uniqueIndex("assets_comic_position_unique").on(
      table.comicId,
      table.position,
    ),
    index("assets_comic_kind_idx").on(table.comicId, table.kind),
  ],
);

export const entitlements = sqliteTable(
  "entitlements",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    comicId: text("comic_id").references(() => comics.id, {
      onDelete: "cascade",
    }),
    kind: text("kind", { enum: ["purchase", "subscription"] }).notNull(),
    status: text("status", { enum: ["active", "revoked", "expired"] })
      .notNull()
      .default("active"),
    providerReference: text("provider_reference"),
    expiresAt: integer("expires_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("entitlements_user_status_idx").on(
      table.clerkUserId,
      table.status,
    ),
    index("entitlements_comic_user_idx").on(
      table.comicId,
      table.clerkUserId,
    ),
    uniqueIndex("entitlements_provider_reference_unique").on(
      table.providerReference,
    ),
  ],
);

export const paymentOrders = sqliteTable(
  "payment_orders",
  {
    id: text("id").primaryKey(),
    merchantReference: text("merchant_reference").notNull(),
    clerkUserId: text("clerk_user_id").notNull(),
    comicId: text("comic_id")
      .notNull()
      .references(() => comics.id, { onDelete: "restrict" }),
    currency: text("currency", { enum: ["EUR", "USD"] }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    status: text("status", {
      enum: ["created", "completed", "failed", "refunded"],
    })
      .notNull()
      .default("created"),
    captureId: text("capture_id"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("payment_orders_merchant_reference_unique").on(
      table.merchantReference,
    ),
    uniqueIndex("payment_orders_capture_id_unique").on(table.captureId),
    index("payment_orders_user_status_idx").on(
      table.clerkUserId,
      table.status,
    ),
  ],
);

export const storeSettings = sqliteTable("store_settings", {
  id: text("id").primaryKey(),
  passName: text("pass_name").notNull().default("Dzonyx Universe Pass"),
  passEurCents: integer("pass_eur_cents").notNull().default(200),
  passUsdCents: integer("pass_usd_cents").notNull().default(250),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql.raw("(unixepoch() * 1000)")),
});
