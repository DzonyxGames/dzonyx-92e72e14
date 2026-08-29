import { getDatabase } from "@/db";
import { authErrorResponse, requireAdmin } from "@/server/auth";
import { storageUnavailable } from "@/server/storage";
import {
  integerInRange,
  requiredText,
  validationResponse,
} from "@/server/validation";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const input = (await request.json()) as Record<string, unknown>;
    let passName: string;
    let passEurCents: number;
    let passUsdCents: number;
    try {
      passName = requiredText(input.passName, "Pass name", 80);
      passEurCents = integerInRange(
        input.passEurCents,
        "EUR price",
        0,
        50000,
      );
      passUsdCents = integerInRange(
        input.passUsdCents,
        "USD price",
        0,
        50000,
      );
    } catch (error) {
      const response = validationResponse(error);
      if (response) return response;
      throw error;
    }
    await getDatabase()
      .prepare(
        "INSERT INTO store_settings " +
          "(id, pass_name, pass_eur_cents, pass_usd_cents, updated_at) " +
          "VALUES ('store', ?, ?, ?, ?) " +
          "ON CONFLICT(id) DO UPDATE SET pass_name = excluded.pass_name, " +
          "pass_eur_cents = excluded.pass_eur_cents, " +
          "pass_usd_cents = excluded.pass_usd_cents, " +
          "updated_at = excluded.updated_at",
      )
      .bind(passName, passEurCents, passUsdCents, Date.now())
      .run();
    return Response.json({ ok: true });
  } catch (error) {
    if (storageUnavailable(error)) {
      return Response.json(
        { error: "Store settings have not been connected yet." },
        { status: 503 },
      );
    }
    return authErrorResponse(error);
  }
}
