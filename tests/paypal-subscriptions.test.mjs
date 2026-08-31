import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("subscription access is verified server-side", async () => {
  const [paypal, subscriptions, confirmRoute, webhook, readerAccess] =
    await Promise.all([
      readFile(new URL("../server/paypal.ts", import.meta.url), "utf8"),
      readFile(
        new URL("../server/paypal-subscriptions.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL(
          "../app/api/paypal/subscriptions/confirm/route.ts",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL("../app/api/paypal/webhook/route.ts", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../server/comics.ts", import.meta.url), "utf8"),
    ]);

  assert.match(confirmRoute, /requireIdentity/);
  assert.match(paypal, /verify-webhook-signature/);
  assert.match(subscriptions, /subscription\.status !== "ACTIVE"/);
  assert.match(subscriptions, /subscription\.custom_id !== expectedUserId/);
  assert.match(subscriptions, /isConfiguredSubscriptionPlan/);
  assert.match(webhook, /BILLING\.SUBSCRIPTION\.CANCELLED/);
  assert.match(webhook, /BILLING\.SUBSCRIPTION\.SUSPENDED/);
  assert.match(webhook, /BILLING\.SUBSCRIPTION\.EXPIRED/);
  assert.match(readerAccess, /kind = 'subscription'/);
});
