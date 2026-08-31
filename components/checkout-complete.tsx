"use client";

import Link from "next/link";
import { useAuth } from "@clerk/react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { authenticatedFetch, responseMessage } from "@/lib/auth-fetch";

type CheckoutState = "waiting" | "processing" | "success" | "error";

export function CheckoutComplete({ orderId }: { orderId: string }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [state, setState] = useState<CheckoutState>("waiting");
  const [comicId, setComicId] = useState("");
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !orderId || started.current) return;
    started.current = true;
    setState("processing");
    authenticatedFetch(
      getToken,
      `/api/paypal/orders/${encodeURIComponent(orderId)}/capture`,
      { method: "POST" },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseMessage(response));
        return response.json() as Promise<{ comicId?: string }>;
      })
      .then((data) => {
        setComicId(data.comicId ?? "");
        setState("success");
      })
      .catch((reason: Error) => {
        setMessage(reason.message);
        setState("error");
      });
  }, [getToken, isLoaded, isSignedIn, orderId]);

  if (!orderId) {
    return (
      <div className="reader-message checkout-status">
        <TriangleAlert aria-hidden="true" />
        <h1>Checkout link is incomplete</h1>
        <p>Return to the catalogue and start the PayPal checkout again.</p>
        <Button asChild>
          <Link href="/catalogue">Back to catalogue</Link>
        </Button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="reader-message checkout-status">
        <Loader2 className="animate-spin" aria-hidden="true" />
        <h1>Confirming your PayPal payment</h1>
        <p>Keep this page open while Dzonyx verifies the order.</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="reader-message checkout-status">
        <TriangleAlert aria-hidden="true" />
        <h1>Sign in to finish checkout</h1>
        <p>Use the same Dzonyx account that started this purchase.</p>
        <Button asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (state === "processing" || state === "waiting") {
    return (
      <div className="reader-message checkout-status">
        <Loader2 className="animate-spin" aria-hidden="true" />
        <h1>Confirming your PayPal payment</h1>
        <p>Keep this page open while Dzonyx verifies the order.</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="reader-message checkout-status">
        <TriangleAlert aria-hidden="true" />
        <h1>Payment could not be confirmed</h1>
        <p>{message || "Try again from the catalogue."}</p>
        <Button asChild variant="outline">
          <Link href="/catalogue">Back to catalogue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="reader-message checkout-status success">
      <CheckCircle2 aria-hidden="true" />
      <h1>Issue added to your library</h1>
      <p>Your PayPal payment was verified successfully.</p>
      <div className="checkout-success-actions">
        {comicId ? (
          <Button asChild>
            <Link href={`/read/${comicId}`}>Read the issue</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/library">Open library</Link>
        </Button>
      </div>
    </div>
  );
}
