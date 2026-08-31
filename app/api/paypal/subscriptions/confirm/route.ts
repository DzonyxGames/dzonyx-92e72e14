import { authErrorResponse, requireIdentity } from "@/server/auth";
import {
  isConfiguredSubscriptionPlan,
  payPalSubscriptionState,
} from "@/server/paypal";
import { confirmSubscription } from "@/server/paypal-subscriptions";
import { storageUnavailable } from "@/server/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const identity = await requireIdentity(request);
    if (!payPalSubscriptionState().enabled) {
      return Response.json(
        { error: "PayPal subscriptions are not configured." },
        { status: 503 },
      );
    }
    const input = (await request.json()) as Record<string, unknown>;
    const subscriptionId =
      typeof input.subscriptionId === "string" ? input.subscriptionId : "";
    const planId = typeof input.planId === "string" ? input.planId : "";
    if (!subscriptionId || !isConfiguredSubscriptionPlan(planId)) {
      return Response.json(
        { error: "Invalid subscription confirmation." },
        { status: 400 },
      );
    }
    const subscription = await confirmSubscription(
      subscriptionId,
      identity.userId,
      planId,
    );
    return Response.json({ ok: true, status: subscription.status });
  } catch (error) {
    if (storageUnavailable(error)) {
      return Response.json(
        { error: "Subscription storage is not connected." },
        { status: 503 },
      );
    }
    if (error instanceof Error && error.message.includes("subscription")) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
