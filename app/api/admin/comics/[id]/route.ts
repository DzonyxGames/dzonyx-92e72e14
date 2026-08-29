import { getDatabase } from "@/db";
import { authErrorResponse, requireAdmin } from "@/server/auth";
import { getComicById } from "@/server/comics";
import { slugify, storageUnavailable } from "@/server/storage";
import {
  integerInRange,
  optionalText,
  requiredText,
  validationResponse,
} from "@/server/validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const existing = await getComicById(id);
    if (!existing) {
      return Response.json({ error: "Comic not found." }, { status: 404 });
    }
    const input = (await request.json()) as Record<string, unknown>;
    let title: string;
    let collectionName: string;
    let issueNumber: number;
    let priceEurCents: number;
    let priceUsdCents: number;
    try {
      title = requiredText(input.title, "Title", 120);
      collectionName = requiredText(
        input.collectionName,
        "Collection name",
        120,
      );
      issueNumber = integerInRange(
        input.issueNumber,
        "Issue number",
        1,
        999,
      );
      priceEurCents = integerInRange(
        input.priceEurCents,
        "EUR price",
        0,
        50000,
      );
      priceUsdCents = integerInRange(
        input.priceUsdCents,
        "USD price",
        0,
        50000,
      );
    } catch (error) {
      const response = validationResponse(error);
      if (response) return response;
      throw error;
    }
    if ((priceEurCents === 0) !== (priceUsdCents === 0)) {
      return Response.json(
        { error: "Set both prices to zero for a free issue." },
        { status: 400 },
      );
    }
    const requestedStatus =
      input.status === "published" ? "published" : "draft";
    if (
      requestedStatus === "published" &&
      (!existing.coverAssetId || existing.pageCount < 1)
    ) {
      return Response.json(
        { error: "Add a cover and at least one page before publishing." },
        { status: 400 },
      );
    }
    const description = optionalText(input.description, 1000);
    const slug = slugify(collectionName + "-" + issueNumber);
    await getDatabase()
      .prepare(
        "UPDATE comics SET slug = ?, title = ?, collection_name = ?, " +
          "issue_number = ?, description = ?, price_eur_cents = ?, " +
          "price_usd_cents = ?, included_in_pass = ?, status = ?, " +
          "updated_at = ? WHERE id = ?",
      )
      .bind(
        slug,
        title,
        collectionName,
        issueNumber,
        description,
        priceEurCents,
        priceUsdCents,
        input.includedInPass === true ? 1 : 0,
        requestedStatus,
        Date.now(),
        id,
      )
      .run();
    return Response.json({ ok: true });
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
