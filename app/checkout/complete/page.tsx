import type { Metadata } from "next";
import { CheckoutComplete } from "@/components/checkout-complete";

export const metadata: Metadata = {
  title: "Confirming payment",
  description: "Confirm a Dzonyx PayPal checkout.",
};

export const dynamic = "force-dynamic";

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  return (
    <main id="main-content" className="checkout-page shell">
      <CheckoutComplete orderId={token ?? ""} />
    </main>
  );
}
