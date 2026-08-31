import "server-only";
import { env } from "cloudflare:workers";

export type PayPalCurrency = "EUR" | "USD";
export type PayPalEnvironment = "sandbox" | "live";

type PayPalConfig = {
  clientId: string;
  clientSecret: string;
  environment: PayPalEnvironment;
  apiBase: string;
  planIdEur: string | null;
  planIdUsd: string | null;
  webhookId: string | null;
};

type PayPalLink = {
  href?: string;
  rel?: string;
};

export type PayPalOrder = {
  id?: string;
  status?: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    invoice_id?: string;
    amount?: {
      currency_code?: string;
      value?: string;
    };
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: {
          currency_code?: string;
          value?: string;
        };
      }>;
    };
  }>;
};

export type PayPalSubscription = {
  id: string;
  plan_id: string;
  status: string;
  custom_id?: string;
};

type AccessTokenResponse = {
  access_token?: string;
  expires_in?: number;
};

let cachedToken:
  | {
      cacheKey: string;
      value: string;
      expiresAt: number;
    }
  | undefined;

function readString(name: string) {
  const value = (env as unknown as Record<string, unknown>)[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readConfig(): PayPalConfig | null {
  const clientId = readString("PAYPAL_CLIENT_ID");
  const clientSecret = readString("PAYPAL_CLIENT_SECRET");
  const requestedEnvironment = (
    readString("PAYPAL_ENVIRONMENT") ?? readString("PAYPAL_ENV")
  )?.toLowerCase();
  const environment: PayPalEnvironment | null =
    requestedEnvironment === "sandbox" || requestedEnvironment === "live"
      ? requestedEnvironment
      : null;

  if (!clientId || !clientSecret || !environment) return null;

  // Live checkout stays deliberately locked until the merchant explicitly
  // opts in after completing production verification and webhook setup.
  if (environment === "live" && readString("PAYPAL_LIVE_ENABLED") !== "true") {
    return null;
  }

  return {
    clientId,
    clientSecret,
    environment,
    planIdEur: readString("PAYPAL_PLAN_ID_EUR"),
    planIdUsd: readString("PAYPAL_PLAN_ID_USD"),
    webhookId: readString("PAYPAL_WEBHOOK_ID"),
    apiBase:
      environment === "sandbox"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com",
  };
}

function configOrThrow() {
  const config = readConfig();
  if (!config) {
    throw new Error("PayPal checkout is not configured.");
  }
  return config;
}

export function payPalCheckoutState() {
  const config = readConfig();
  return {
    enabled: Boolean(config),
    environment: config?.environment ?? null,
  };
}

export function payPalSubscriptionState() {
  const config = readConfig();
  const enabled = Boolean(config?.planIdEur && config.planIdUsd);
  return {
    enabled,
    environment: config?.environment ?? null,
    webhookReady: Boolean(config?.webhookId),
  };
}

export function payPalSubscriptionPublicConfig() {
  const config = configOrThrow();
  if (!config.planIdEur || !config.planIdUsd) {
    throw new Error("PayPal subscription plans are not configured.");
  }
  return {
    clientId: config.clientId,
    environment: config.environment,
    planIdEur: config.planIdEur,
    planIdUsd: config.planIdUsd,
    webhookReady: Boolean(config.webhookId),
  };
}

export function isConfiguredSubscriptionPlan(planId: string) {
  const config = configOrThrow();
  return planId === config.planIdEur || planId === config.planIdUsd;
}

function amountValue(cents: number) {
  if (!Number.isInteger(cents) || cents <= 0) {
    throw new Error("A positive checkout amount is required.");
  }
  return (cents / 100).toFixed(2);
}

async function accessToken(config: PayPalConfig) {
  const cacheKey = `${config.environment}:${config.clientId}`;
  if (
    cachedToken &&
    cachedToken.cacheKey === cacheKey &&
    cachedToken.expiresAt > Date.now() + 30_000
  ) {
    return cachedToken.value;
  }

  const response = await fetch(config.apiBase + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    throw new Error("PayPal authentication failed.");
  }
  const payload = (await response.json()) as AccessTokenResponse;
  if (!payload.access_token) {
    throw new Error("PayPal did not return an access token.");
  }
  cachedToken = {
    cacheKey,
    value: payload.access_token,
    expiresAt: Date.now() + Math.max(60, payload.expires_in ?? 300) * 1000,
  };
  return payload.access_token;
}

async function payPalRequest<T>(
  path: string,
  init: RequestInit,
  requestId?: string,
) {
  const config = configOrThrow();
  const token = await accessToken(config);
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  if (requestId) headers.set("PayPal-Request-Id", requestId);

  const response = await fetch(config.apiBase + path, {
    ...init,
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`PayPal request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

function approvalUrl(order: PayPalOrder) {
  const candidate = order.links?.find(
    (link) => link.rel === "payer-action" || link.rel === "approve",
  )?.href;
  if (!candidate) throw new Error("PayPal did not return an approval link.");
  const url = new URL(candidate);
  if (
    url.protocol !== "https:" ||
    !(url.hostname === "paypal.com" || url.hostname.endsWith(".paypal.com"))
  ) {
    throw new Error("PayPal returned an invalid approval link.");
  }
  return url.toString();
}

export async function createPayPalOrder(input: {
  amountCents: number;
  cancelUrl: string;
  comicId: string;
  currency: PayPalCurrency;
  merchantReference: string;
  returnUrl: string;
  title: string;
}) {
  const value = amountValue(input.amountCents);
  const order = await payPalRequest<PayPalOrder>(
    "/v2/checkout/orders",
    {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: input.comicId,
            custom_id: input.merchantReference,
            invoice_id: input.merchantReference,
            description: input.title.slice(0, 127),
            amount: {
              currency_code: input.currency,
              value,
              breakdown: {
                item_total: {
                  currency_code: input.currency,
                  value,
                },
              },
            },
            items: [
              {
                name: input.title.slice(0, 127),
                sku: input.comicId,
                category: "DIGITAL_GOODS",
                quantity: "1",
                unit_amount: {
                  currency_code: input.currency,
                  value,
                },
              },
            ],
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "Dzonyx",
              landing_page: "LOGIN",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              return_url: input.returnUrl,
              cancel_url: input.cancelUrl,
            },
          },
        },
      }),
    },
    input.merchantReference,
  );
  if (!order.id) throw new Error("PayPal did not return an order ID.");
  return {
    id: order.id,
    approvalUrl: approvalUrl(order),
  };
}

export async function capturePayPalOrder(orderId: string) {
  return payPalRequest<PayPalOrder>(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      body: "{}",
    },
    `capture-${orderId}`,
  );
}

export async function getPayPalSubscription(subscriptionId: string) {
  if (!/^[A-Za-z0-9-]{8,128}$/.test(subscriptionId)) {
    throw new Error("Invalid PayPal subscription ID.");
  }
  return payPalRequest<PayPalSubscription>(
    `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: "GET" },
  );
}

export async function verifyPayPalWebhook(
  request: Request,
  webhookEvent: Record<string, unknown>,
) {
  const config = configOrThrow();
  if (!config.webhookId) {
    throw new Error("PAYPAL_WEBHOOK_ID is not configured.");
  }
  const requiredHeader = (name: string) => {
    const value = request.headers.get(name);
    if (!value) throw new Error("Missing PayPal webhook signature.");
    return value;
  };
  const result = await payPalRequest<{ verification_status?: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: requiredHeader("paypal-auth-algo"),
        cert_url: requiredHeader("paypal-cert-url"),
        transmission_id: requiredHeader("paypal-transmission-id"),
        transmission_sig: requiredHeader("paypal-transmission-sig"),
        transmission_time: requiredHeader("paypal-transmission-time"),
        webhook_id: config.webhookId,
        webhook_event: webhookEvent,
      }),
    },
  );
  return result.verification_status === "SUCCESS";
}
