import type { Metadata } from "next";
import Link from "next/link";
import { CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  description: "Return to the Dzonyx catalogue.",
};

export default function CheckoutCancelledPage() {
  return (
    <main id="main-content" className="checkout-page shell">
      <div className="reader-message checkout-status">
        <CircleX aria-hidden="true" />
        <h1>Checkout cancelled</h1>
        <p>No payment was completed and your library was not changed.</p>
        <Button asChild variant="outline">
          <Link href="/catalogue">Back to catalogue</Link>
        </Button>
      </div>
    </main>
  );
}
