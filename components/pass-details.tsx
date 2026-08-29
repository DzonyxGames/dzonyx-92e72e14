"use client";

import { BookMarked, Check, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  defaultStoreSettings,
  formatMoney,
  type StoreSettings,
} from "@/lib/types";

export function PassDetails() {
  const [settings, setSettings] =
    useState<StoreSettings>(defaultStoreSettings);

  useEffect(() => {
    fetch("/api/store")
      .then((response) => response.json())
      .then((data: { settings?: StoreSettings }) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="pass-page-grid">
      <div className="pass-page-copy">
        <p className="eyebrow plain">One pass, one library</p>
        <h2>{settings.passName}</h2>
        <p>
          Read every published issue carrying the Universe Pass badge. Issues
          not marked as included can still be offered separately once payments
          are connected.
        </p>
        <div className="pass-benefits">
          <div>
            <BookMarked aria-hidden="true" />
            <strong>Included catalogue</strong>
            <span>Read marked issues in the online reader.</span>
          </div>
          <div>
            <Check aria-hidden="true" />
            <strong>New releases</strong>
            <span>New included comics appear in your library.</span>
          </div>
          <div>
            <ShieldCheck aria-hidden="true" />
            <strong>No pretend checkout</strong>
            <span>Payments stay off until the real provider is ready.</span>
          </div>
        </div>
      </div>
      <aside className="pass-purchase-card">
        <span>PLANNED MONTHLY PRICE</span>
        <strong>{formatMoney(settings.passEurCents, "EUR")}</strong>
        <p>{formatMoney(settings.passUsdCents, "USD")} for USD customers</p>
        <Button disabled size="lg">
          Subscriptions opening later
        </Button>
        <small>
          PayPal is not connected. Dzonyx does not currently collect payment
          details.
        </small>
      </aside>
    </div>
  );
}
