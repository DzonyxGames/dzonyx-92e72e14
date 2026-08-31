import { getDatabase } from "@/db";
import { defaultStoreSettings } from "@/lib/types";
import { storageUnavailable } from "@/server/storage";
import {
  payPalCheckoutState,
  payPalSubscriptionState,
} from "@/server/paypal";

type SettingsRow = {
  pass_name: string;
  pass_eur_cents: number;
  pass_usd_cents: number;
};

export const dynamic = "force-dynamic";

export async function GET() {
  const checkout = payPalCheckoutState();
  const subscription = payPalSubscriptionState();
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
            paymentsEnabled: checkout.enabled,
            subscriptionsEnabled: subscription.enabled,
          }
        : {
            ...defaultStoreSettings,
            paymentsEnabled: checkout.enabled,
            subscriptionsEnabled: subscription.enabled,
          },
      storageReady: true,
      checkoutEnvironment: checkout.environment,
    });
  } catch (error) {
    if (storageUnavailable(error)) {
      return Response.json({
        settings: {
          ...defaultStoreSettings,
          paymentsEnabled: checkout.enabled,
          subscriptionsEnabled: subscription.enabled,
        },
        storageReady: false,
        checkoutEnvironment: checkout.environment,
      });
    }
    return Response.json(
      {
        settings: {
          ...defaultStoreSettings,
          paymentsEnabled: checkout.enabled,
          subscriptionsEnabled: subscription.enabled,
        },
        error: "Store settings unavailable.",
      },
      { status: 500 },
    );
  }
}
