import { getDatabase } from "@/db";
import { authErrorResponse, requireIdentity } from "@/server/auth";
import { canReadComic, getComicById } from "@/server/comics";
import {
  createPayPalOrder,
  payPalCheckoutState,
  type PayPalCurrency,
} from "@/server/paypal";
import { storageUnavailable } from "@/server/storage";

export const dynamic = "force-dynamic";

function selectedCurrency(value: unknown): PayPalCurrency | null {
  return value === "EUR" || value === "USD" ? value : null;
}

export async function POST(request: Request) {
  try {
    const identity = await requireIdentity(request);
    if (!payPalCheckoutState().enabled) {
      return Response.json(
        { error: "PayPal Sandbox checkout is not configured yet." },
        { status: 503 },
      );
    }

    const input = (await request.json()) as Record<string, unknown>;
    const comicId =
      typeof input.comicId === "string" ? input.comicId.trim() : "";
    const currency = selectedCurrency(input.currency);
    if (!comicId || !currency) {
      return Response.json(
        { error: "Choose an issue and payment currency." },
        { status: 400 },
      );
    }

    const comic = await getComicById(comicId);
    if (!comic || comic.status !== "published") {
      return Response.json({ error: "Issue not found." }, { status: 404 });
    }
    if (await canReadComic(identity, comic)) {
      return Response.json(
        { error: "This issue is already in your library." },
        { status: 409 },
      );
    }

    const amountCents =
      currency === "EUR" ? comic.priceEurCents : comic.priceUsdCents;
    if (amountCents <= 0) {
      return Response.json(
        { error: "This issue does not require payment." },
        { status: 400 },
      );
    }

    const merchantReference = crypto.randomUUID();
    const origin = new URL(request.url).origin;
    const order = await createPayPalOrder({
      amountCents,
      cancelUrl: `${origin}/checkout/cancelled`,
      comicId: comic.id,
      currency,
      merchantReference,
      returnUrl: `${origin}/checkout/complete`,
      title: `${comic.collectionName} #${comic.issueNumber}: ${comic.title}`,
    });
    const now = Date.now();
    await getDatabase()
      .prepare(
        "INSERT INTO payment_orders " +
          "(id, merchant_reference, clerk_user_id, comic_id, currency, " +
          "amount_cents, status, capture_id, created_at, updated_at) " +
          "VALUES (?, ?, ?, ?, ?, ?, 'created', NULL, ?, ?)",
      )
      .bind(
        order.id,
        merchantReference,
        identity.userId,
        comic.id,
        currency,
        amountCents,
        now,
        now,
      )
      .run();

    return Response.json({ approvalUrl: order.approvalUrl });
  } catch (error) {
    if (storageUnavailable(error)) {
      return Response.json(
        { error: "Checkout storage is not connected yet." },
        { status: 503 },
      );
    }
    return authErrorResponse(error);
  }
}
