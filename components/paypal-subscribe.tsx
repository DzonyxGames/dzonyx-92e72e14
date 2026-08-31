"use client";

import Link from "next/link";
import { useAuth } from "@clerk/react";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { authenticatedFetch, responseMessage } from "@/lib/auth-fetch";
import { formatMoney } from "@/lib/types";

type Currency = "EUR" | "USD";
type SubscriptionConfig = {
  clientId: string;
  environment: "sandbox" | "live";
  planIdEur: string;
  planIdUsd: string;
  userId: string;
  webhookReady: boolean;
};
type PayPalActions = {
  subscription: {
    create(input: {
      plan_id: string;
      custom_id: string;
      application_context: {
        brand_name: string;
        shipping_preference: "NO_SHIPPING";
        user_action: "SUBSCRIBE_NOW";
      };
    }): Promise<string>;
  };
};
type PayPalNamespace = {
  Buttons(options: {
    style: {
      color: "gold";
      label: "subscribe";
      layout: "vertical";
      shape: "rect";
    };
    createSubscription(data: unknown, actions: PayPalActions): Promise<string>;
    onApprove(data: { subscriptionID?: string }): Promise<void>;
    onCancel(): void;
    onError(error: unknown): void;
  }): {
    isEligible(): boolean;
    render(container: HTMLElement): Promise<void>;
  };
};

declare global {
  interface Window {
    [key: string]: PayPalNamespace | unknown;
  }
}

export function PayPalSubscribe({
  priceEurCents,
  priceUsdCents,
  subscriptionsEnabled,
}: {
  priceEurCents: number;
  priceUsdCents: number;
  subscriptionsEnabled: boolean;
}) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [config, setConfig] = useState<SubscriptionConfig | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [complete, setComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !subscriptionsEnabled) return;
    let active = true;
    authenticatedFetch(getToken, "/api/paypal/subscriptions/config")
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseMessage(response));
        return response.json() as Promise<SubscriptionConfig>;
      })
      .then((value) => {
        if (active) setConfig(value);
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message);
      });
    return () => {
      active = false;
    };
  }, [getToken, isLoaded, isSignedIn, subscriptionsEnabled]);

  const checkout = useMemo(() => {
    if (!config) return null;
    return {
      namespace: `paypalDzonyx${currency}`,
      planId: currency === "EUR" ? config.planIdEur : config.planIdUsd,
    };
  }, [config, currency]);

  useEffect(() => {
    if (!checkout || !config || !containerRef.current || complete) return;
    let active = true;
    const container = containerRef.current;
    container.replaceChildren();
    setError("");

    const renderButtons = async () => {
      if (!active) return;
      const paypal = window[checkout.namespace] as PayPalNamespace | undefined;
      if (!paypal?.Buttons) throw new Error("PayPal checkout did not load.");
      const buttons = paypal.Buttons({
        style: {
          color: "gold",
          label: "subscribe",
          layout: "vertical",
          shape: "rect",
        },
        createSubscription: (_data, actions) =>
          actions.subscription.create({
            plan_id: checkout.planId,
            custom_id: config.userId,
            application_context: {
              brand_name: "Dzonyx",
              shipping_preference: "NO_SHIPPING",
              user_action: "SUBSCRIBE_NOW",
            },
          }),
        onApprove: async (data) => {
          if (!data.subscriptionID) {
            setError("PayPal did not return a subscription ID.");
            return;
          }
          setNotice("Confirming your Universe Pass…");
          try {
            const response = await authenticatedFetch(
              getToken,
              "/api/paypal/subscriptions/confirm",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subscriptionId: data.subscriptionID,
                  planId: checkout.planId,
                }),
              },
            );
            if (!response.ok) throw new Error(await responseMessage(response));
            setComplete(true);
            setNotice("Universe Pass is active on this Dzonyx account.");
          } catch (reason) {
            setNotice("");
            setError(
              reason instanceof Error
                ? reason.message
                : "Subscription confirmation failed.",
            );
          }
        },
        onCancel: () => setNotice("Checkout was cancelled. Nothing was charged."),
        onError: () => setError("PayPal checkout could not be completed."),
      });
      if (!buttons.isEligible()) {
        throw new Error("PayPal is not available for this browser or account.");
      }
      await buttons.render(container);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-paypal-namespace="${checkout.namespace}"]`,
    );
    if (existing) {
      if ((window[checkout.namespace] as PayPalNamespace | undefined)?.Buttons) {
        void renderButtons().catch((reason: Error) => setError(reason.message));
      } else {
        existing.addEventListener("load", () => void renderButtons(), {
          once: true,
        });
      }
    } else {
      const script = document.createElement("script");
      script.src =
        "https://www.paypal.com/sdk/js?client-id=" +
        encodeURIComponent(config.clientId) +
        "&components=buttons&currency=" +
        currency +
        "&intent=subscription&vault=true";
      script.async = true;
      script.setAttribute("data-namespace", checkout.namespace);
      script.addEventListener("load", () => void renderButtons(), { once: true });
      script.addEventListener(
        "error",
        () => setError("PayPal checkout script could not be loaded."),
        { once: true },
      );
      document.head.appendChild(script);
    }
    return () => {
      active = false;
      container.replaceChildren();
    };
  }, [checkout, complete, config, currency, getToken]);

  if (!isLoaded) return <p className="checkout-notice">Loading account…</p>;
  if (!isSignedIn) {
    return (
      <div className="paypal-signin">
        <LockKeyhole aria-hidden="true" />
        <p>Sign in before starting a subscription.</p>
        <Button asChild><Link href="/sign-in">Sign in with email</Link></Button>
      </div>
    );
  }
  if (!subscriptionsEnabled) {
    return <p className="checkout-notice">PayPal subscriptions are not configured.</p>;
  }
  if (complete) {
    return (
      <div className="paypal-complete">
        <CheckCircle2 aria-hidden="true" />
        <strong>Universe Pass activated</strong>
        <p>{notice}</p>
        <Button asChild><Link href="/library">Open My Library</Link></Button>
      </div>
    );
  }

  return (
    <div className="paypal-checkout">
      {config?.environment === "sandbox" ? (
        <p className="sandbox-warning">Sandbox test mode — no real money will be charged.</p>
      ) : null}
      <div className="currency-choice" aria-label="Subscription currency">
        <button type="button" className={currency === "EUR" ? "active" : ""} onClick={() => setCurrency("EUR")}>
          {formatMoney(priceEurCents, "EUR")} EUR
        </button>
        <button type="button" className={currency === "USD" ? "active" : ""} onClick={() => setCurrency("USD")}>
          {formatMoney(priceUsdCents, "USD")} USD
        </button>
      </div>
      {!config && !error ? <p className="checkout-notice">Loading PayPal…</p> : null}
      {notice ? <p className="checkout-notice">{notice}</p> : null}
      {error ? <p className="checkout-error">{error}</p> : null}
      <div ref={containerRef} className="paypal-button-container" />
      {config && !config.webhookReady ? (
        <small className="webhook-warning">
          Checkout testing is ready. Automatic cancellation starts after the PayPal webhook is added.
        </small>
      ) : null}
    </div>
  );
}
