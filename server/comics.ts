import "server-only";
import { getDatabase } from "@/db";
import type { ComicRecord } from "@/lib/types";
import type { DzonyxIdentity } from "./auth";

type ComicRow = {
  id: string;
  slug: string;
  title: string;
  collection_name: string;
  issue_number: number;
  description: string;
  price_eur_cents: number;
  price_usd_cents: number;
  included_in_pass: number;
  status: "draft" | "published";
  cover_asset_id: string | null;
  page_count: number;
  created_at: number;
  updated_at: number;
};

const selectComics =
  "SELECT c.id, c.slug, c.title, c.collection_name, c.issue_number, " +
  "c.description, c.price_eur_cents, c.price_usd_cents, " +
  "c.included_in_pass, c.status, c.cover_asset_id, c.created_at, " +
  "c.updated_at, COUNT(a.id) AS page_count " +
  "FROM comics c LEFT JOIN assets a ON a.comic_id = c.id AND a.kind = 'page' ";

function mapComic(row: ComicRow): ComicRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    collectionName: row.collection_name,
    issueNumber: Number(row.issue_number),
    description: row.description,
    priceEurCents: Number(row.price_eur_cents),
    priceUsdCents: Number(row.price_usd_cents),
    includedInPass: Boolean(row.included_in_pass),
    status: row.status,
    coverAssetId: row.cover_asset_id,
    pageCount: Number(row.page_count),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export async function listPublishedComics() {
  const result = await getDatabase()
    .prepare(
      selectComics +
        "WHERE c.status = 'published' GROUP BY c.id " +
        "ORDER BY c.collection_name COLLATE NOCASE ASC, c.issue_number ASC",
    )
    .all<ComicRow>();
  return result.results.map(mapComic);
}

export async function listAllComics() {
  const result = await getDatabase()
    .prepare(
      selectComics +
        "GROUP BY c.id ORDER BY c.updated_at DESC, c.created_at DESC",
    )
    .all<ComicRow>();
  return result.results.map(mapComic);
}

export async function getComicById(id: string) {
  const row = await getDatabase()
    .prepare(selectComics + "WHERE c.id = ? GROUP BY c.id LIMIT 1")
    .bind(id)
    .first<ComicRow>();
  return row ? mapComic(row) : null;
}

export async function canReadComic(
  identity: DzonyxIdentity,
  comic: ComicRecord,
) {
  if (identity.isAdmin) return true;
  if (comic.status !== "published") return false;
  if (comic.priceEurCents === 0 && comic.priceUsdCents === 0) return true;

  const now = Date.now();
  const entitlement = await getDatabase()
    .prepare(
      "SELECT id FROM entitlements " +
        "WHERE clerk_user_id = ? AND status = 'active' " +
        "AND (expires_at IS NULL OR expires_at > ?) " +
        "AND ((kind = 'purchase' AND comic_id = ?) " +
        "OR (kind = 'subscription' AND ? = 1)) LIMIT 1",
    )
    .bind(
      identity.userId,
      now,
      comic.id,
      comic.includedInPass ? 1 : 0,
    )
    .first<{ id: string }>();
  return Boolean(entitlement);
}
