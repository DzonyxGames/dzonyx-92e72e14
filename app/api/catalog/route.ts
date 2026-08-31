import { listPublishedComics } from "@/server/comics";
import { storageUnavailable } from "@/server/storage";
import { payPalCheckoutState } from "@/server/paypal";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkout = payPalCheckoutState();
  try {
    return Response.json({
      comics: await listPublishedComics(),
      storageReady: true,
      paymentsEnabled: checkout.enabled,
      checkoutEnvironment: checkout.environment,
    });
  } catch (error) {
    if (storageUnavailable(error)) {
      return Response.json({
        comics: [],
        storageReady: false,
        paymentsEnabled: false,
        checkoutEnvironment: checkout.environment,
      });
    }
    return Response.json(
      { comics: [], error: "The catalogue could not be loaded." },
      { status: 500 },
    );
  }
}
