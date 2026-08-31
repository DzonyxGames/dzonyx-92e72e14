"use client";

import Link from "next/link";
import { useAuth } from "@clerk/react";
import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authenticatedFetch, responseMessage } from "@/lib/auth-fetch";
import { formatMoney, type ComicRecord } from "@/lib/types";

export function PurchaseComicButton({
  comic,
  sandboxMode,
}: {
  comic: ComicRecord;
  sandboxMode: boolean;
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [busy, setBusy] = useState<"EUR" | "USD" | null>(null);
  const [error, setError] = useState("");

  async function beginCheckout(currency: "EUR" | "USD") {
    setBusy(currency);
    setError("");
    try {
      const response = await authenticatedFetch(getToken, "/api/paypal/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comicId: comic.id, currency }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      const data = (await response.json()) as { approvalUrl?: string };
      if (!data.approvalUrl) throw new Error("PayPal checkout is unavailable.");
      window.location.assign(data.approvalUrl);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "PayPal checkout is unavailable.",
      );
      setBusy(null);
    }
  }

  if (!isLoaded) {
    return (
      <Button disabled variant="outline">
        <Loader2 className="animate-spin" aria-hidden="true" />
        Loading
      </Button>
    );
  }

  if (!isSignedIn) {
    return (
      <Button asChild variant="outline">
        <Link href="/sign-in">
          <CreditCard aria-hidden="true" />
          Sign in to buy
        </Link>
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CreditCard aria-hidden="true" />
          {sandboxMode ? "Test purchase" : "Buy issue"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {sandboxMode ? "Test with PayPal Sandbox" : "Buy this issue"}
          </DialogTitle>
          <DialogDescription>
            Choose the currency shown at PayPal. Dzonyx verifies the final
            amount on the server before adding the issue to your library.
          </DialogDescription>
        </DialogHeader>
        {sandboxMode ? (
          <p className="checkout-notice">
            Sandbox uses test money only. No real charge will be made.
          </p>
        ) : null}
        {error ? <p className="checkout-error">{error}</p> : null}
        <DialogFooter className="checkout-actions">
          <Button
            onClick={() => beginCheckout("EUR")}
            disabled={Boolean(busy)}
          >
            {busy === "EUR" ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : null}
            Pay {formatMoney(comic.priceEurCents, "EUR")}
          </Button>
          <Button
            onClick={() => beginCheckout("USD")}
            disabled={Boolean(busy)}
            variant="outline"
          >
            {busy === "USD" ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : null}
            Pay {formatMoney(comic.priceUsdCents, "USD")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
