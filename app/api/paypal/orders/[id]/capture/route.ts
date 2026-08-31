import { getDatabase } from "@/db";
import { authErrorResponse, requireIdentity } from "@/server/auth";
import { capturePayPalOrder } from "@/server/paypal";
import { storageUnavailable } from "@/server/storage";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

type PaymentOrderRow = {
  id: string;
  merchant_reference: string;
  clerk_user_id: string;
  comic_id: string;
  currency: "EUR" | "USD";
  amount_cents: number;
  status: "created" | "completed" | "failed" | "refunded";
  capture_id: string | null;
};

function cents(value: string | undefined) {
  if (!value || !/^\d+\.\d{2}$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

export async function POST(request: Request, context: Context) {
  try {
    const identity = await requireIdentity(request);
    const { id } = await context.params;
    if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      return Response.json({ error: "Invalid PayPal order." }, { status: 400 });
    }

    const order = await getDatabase()
      .prepare(
        "SELECT id, merchant_reference, clerk_user_id, comic_id, currency, " +
          "amount_cents, status, capture_id FROM payment_orders " +
          "WHERE id = ? AND clerk_user_id = ? LIMIT 1",
      )
      .bind(id, identity.userId)
      .first<PaymentOrderRow>();
    if (!order) {
      return Response.json({ error: "Checkout not found." }, { status: 404 });
    }
    if (order.status === "completed") {
      return Response.json({ ok: true, comicId: order.comic_id });
    }
    if (order.status !== "created") {
      return Response.json(
        { error: "This checkout can no longer be completed." },
        { status: 409 },
      );
    }

    const captured = await capturePayPalOrder(order.id);
    const unit = captured.purchase_units?.[0];
    const capture = unit?.payments?.captures?.find(
      (item) => item.status === "COMPLETED",
    );
    const valid =
      captured.status === "COMPLETED" &&
      unit?.reference_id === order.comic_id &&
      unit?.custom_id === order.merchant_reference &&
      unit?.amount?.currency_code === order.currency &&
      cents(unit?.amount?.value) === Number(order.amount_cents) &&
      capture?.id &&
      capture.amount?.currency_code === order.currency &&
      cents(capture.amount?.value) === Number(order.amount_cents);

    if (!valid || !capture?.id) {
      await getDatabase()
        .prepare(
          "UPDATE payment_orders SET status = 'failed', updated_at = ? " +
            "WHERE id = ? AND status = 'created'",
        )
        .bind(Date.now(), order.id)
        .run();
      return Response.json(
        { error: "PayPal could not verify the completed payment." },
        { status: 502 },
      );
    }

    const now = Date.now();
    await getDatabase().batch([
      getDatabase()
        .prepare(
          "UPDATE payment_orders SET status = 'completed', capture_id = ?, " +
            "updated_at = ? WHERE id = ? AND status = 'created'",
        )
        .bind(capture.id, now, order.id),
      getDatabase()
        .prepare(
          "INSERT OR IGNORE INTO entitlements " +
            "(id, clerk_user_id, comic_id, kind, status, provider_reference, " +
            "expires_at, created_at, updated_at) " +
            "VALUES (?, ?, ?, 'purchase', 'active', ?, NULL, ?, ?)",
        )
        .bind(
          crypto.randomUUID(),
          identity.userId,
          order.comic_id,
          capture.id,
          now,
          now,
        ),
    ]);

    return Response.json({ ok: true, comicId: order.comic_id });
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
