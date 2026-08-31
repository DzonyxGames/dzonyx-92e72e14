import { authErrorResponse, requireIdentity } from "@/server/auth";
import {
  payPalSubscriptionPublicConfig,
  payPalSubscriptionState,
} from "@/server/paypal";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const identity = await requireIdentity(request);
    if (!payPalSubscriptionState().enabled) {
      return Response.json(
        { error: "PayPal subscriptions are not configured." },
        { status: 503 },
      );
    }
    return Response.json({
      ...payPalSubscriptionPublicConfig(),
      userId: identity.userId,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
