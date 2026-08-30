import { getDatabase } from "@/db";
import { authErrorResponse, requireAdmin } from "@/server/auth";
import { listAllComics } from "@/server/comics";
import { safeId, slugify, storageUnavailable } from "@/server/storage";
import {
  integerInRange,
  optionalText,
  requiredText,
  validationResponse,
} from "@/server/validation";

export const dynamic = "force-dynamic";

function parseComicInput(input: Record<string, unknown>) {
  const title = requiredText(input.title, "Title", 120);
  const collectionName = requiredText(
    input.collectionName,
    "Collection name",
    120,
  );
  const issueNumber = integerInRange(
    input.issueNumber,
    "Issue number",
    1,
    999,
  );
  const priceEurCents = integerInRange(
    input.priceEurCents,
    "EUR price",
    0,
    50000,
  );
  const priceUsdCents = integerInRange(
    input.priceUsdCents,
    "USD price",
    0,
    50000,
  );
  if ((priceEurCents === 0) !== (priceUsdCents === 0)) {
    throw new Error("FREE_PRICE_MISMATCH");
  }
  return {
    title,
    collectionName,
    issueNumber,
    description: optionalText(input.description, 1000),
    priceEurCents,
    priceUsdCents,
    includedInPass: input.includedInPass === true,
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return Response.json({ comics: await listAllComics() });
  } catch (error) {
    if (storageUnavailable(error)) {
      return Response.json(
        { error: "Comic storage has not been connected yet." },
        { status: 503 },
      );
    }
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const raw = (await request.json()) as Record<string, unknown>;
    let input;
    try {
      input = parseComicInput(raw);
    } catch (error) {
      if (error instanceof Error && error.message === "FREE_PRICE_MISMATCH") {
        return Response.json(
          { error: "Set both prices to zero for a free issue." },
          { status: 400 },
        );
      }
      const response = validationResponse(error);
      if (response) return response;
      throw error;
    }
    const id = safeId();
    const now = Date.now();
    const slug = slugify(input.collectionName + "-" + input.issueNumber);
    await getDatabase()
      .prepare(
        "INSERT INTO comics " +
          "(id, slug, title, collection_name, issue_number, description, " +
          "price_eur_cents, price_usd_cents, included_in_pass, status, " +
          "created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)",
      )
      .bind(
        id,
        slug,
        input.title,
        input.collectionName,
        input.issueNumber,
        input.description,
        input.priceEurCents,
        input.priceUsdCents,
        input.includedInPass ? 1 : 0,
        now,
        now,
      )
      .run();
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE constraint failed")) {
      return Response.json(
        { error: "That collection already has this issue number." },
        { status: 409 },
      );
    }
    if (storageUnavailable(error)) {
      return Response.json(
        { error: "Comic storage has not been connected yet." },
        { status: 503 },
      );
    }
    return authErrorResponse(error);
  }
}
