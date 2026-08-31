import "server-only";
import { getDatabase } from "@/db";
import {
  getPayPalSubscription,
  isConfiguredSubscriptionPlan,
  type PayPalSubscription,
} from "@/server/paypal";

function entitlementId(subscriptionId: string) {
  return `paypal-subscription:${subscriptionId}`;
}

export async function activateSubscription(
  subscription: PayPalSubscription,
  expectedUserId?: string,
) {
  if (!isConfiguredSubscriptionPlan(subscription.plan_id)) {
    throw new Error("The subscription uses an unknown PayPal plan.");
  }
  if (subscription.status !== "ACTIVE") {
    throw new Error("The PayPal subscription is not active yet.");
  }
  if (!subscription.custom_id) {
    throw new Error("The subscription is missing its Dzonyx user.");
  }
  if (expectedUserId && subscription.custom_id !== expectedUserId) {
    throw new Error("This subscription belongs to another Dzonyx account.");
  }

  const now = Date.now();
  await getDatabase()
    .prepare(
      "INSERT INTO entitlements " +
        "(id, clerk_user_id, comic_id, kind, status, provider_reference, " +
        "expires_at, created_at, updated_at) VALUES (?, ?, NULL, " +
        "'subscription', 'active', ?, NULL, ?, ?) " +
        "ON CONFLICT(id) DO UPDATE SET clerk_user_id = excluded.clerk_user_id, " +
        "status = 'active', provider_reference = excluded.provider_reference, " +
        "expires_at = NULL, updated_at = excluded.updated_at",
    )
    .bind(
      entitlementId(subscription.id),
      subscription.custom_id,
      subscription.id,
      now,
      now,
    )
    .run();
}

export async function confirmSubscription(
  subscriptionId: string,
  userId: string,
  expectedPlanId: string,
) {
  const subscription = await getPayPalSubscription(subscriptionId);
  if (subscription.plan_id !== expectedPlanId) {
    throw new Error("The PayPal plan does not match this checkout.");
  }
  await activateSubscription(subscription, userId);
  return subscription;
}

export async function revokeSubscription(
  subscriptionId: string,
  status: "revoked" | "expired",
) {
  const now = Date.now();
  await getDatabase()
    .prepare(
      "UPDATE entitlements SET status = ?, expires_at = ?, updated_at = ? " +
        "WHERE id = ? OR provider_reference = ?",
    )
    .bind(
      status,
      now,
      now,
      entitlementId(subscriptionId),
      subscriptionId,
    )
    .run();
}
