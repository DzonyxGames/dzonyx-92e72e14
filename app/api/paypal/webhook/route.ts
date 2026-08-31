import {
  getPayPalSubscription,
  verifyPayPalWebhook,
} from "@/server/paypal";
import {
  activateSubscription,
  revokeSubscription,
} from "@/server/paypal-subscriptions";
import { storageUnavailable } from "@/server/storage";

export const dynamic = "force-dynamic";

type PayPalWebhookEvent = {
  event_type?: string;
  resource?: { id?: string };
};

export async function POST(request: Request) {
  try {
    const event = (await request.json()) as PayPalWebhookEvent;
    const verified = await verifyPayPalWebhook(
      request,
      event as unknown as Record<string, unknown>,
    );
    if (!verified) {
      return Response.json({ error: "Invalid PayPal signature." }, { status: 400 });
    }

    const subscriptionId = event.resource?.id;
    if (!subscriptionId) return Response.json({ ok: true, ignored: true });

    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const subscription = await getPayPalSubscription(subscriptionId);
        await activateSubscription(subscription);
        break;
      }
      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.SUSPENDED":
        await revokeSubscription(subscriptionId, "revoked");
        break;
      case "BILLING.SUBSCRIPTION.EXPIRED":
        await revokeSubscription(subscriptionId, "expired");
        break;
      default:
        return Response.json({ ok: true, ignored: true });
    }
    return Response.json({ ok: true });
  } catch (error) {
    if (storageUnavailable(error)) {
      return Response.json(
        { error: "Subscription storage is not connected." },
        { status: 503 },
      );
    }
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
