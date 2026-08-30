import { getDatabase } from "@/db";
import { defaultStoreSettings } from "@/lib/types";
import { storageUnavailable } from "@/server/storage";

type SettingsRow = {
  pass_name: string;
  pass_eur_cents: number;
  pass_usd_cents: number;
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const row = await getDatabase()
      .prepare(
        "SELECT pass_name, pass_eur_cents, pass_usd_cents " +
          "FROM store_settings WHERE id = 'store' LIMIT 1",
      )
      .first<SettingsRow>();
    return Response.json({
      settings: row
        ? {
            passName: row.pass_name,
            passEurCents: Number(row.pass_eur_cents),
            passUsdCents: Number(row.pass_usd_cents),
            paymentsEnabled: false as const,
          }
        : defaultStoreSettings,
      storageReady: true,
    });
  } catch (error) {
    if (storageUnavailable(error)) {
      return Response.json({
        settings: defaultStoreSettings,
        storageReady: false,
      });
    }
    return Response.json(
      { settings: defaultStoreSettings, error: "Store settings unavailable." },
      { status: 500 },
    );
  }
}
