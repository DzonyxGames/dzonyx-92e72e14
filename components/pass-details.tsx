"use client";

import {
  BookMarked,
  Check,
  ListOrdered,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PayPalSubscribe } from "@/components/paypal-subscribe";
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
          not marked as included can still be bought separately.
        </p>
        <div className="pass-benefits">
          <div>
            <BookMarked aria-hidden="true" />
            <strong>Included catalogue</strong>
            <span>Read marked issues in the online reader.</span>
          </div>
          <div>
            <Sparkles aria-hidden="true" />
            <strong>New releases</strong>
            <span>New included comics appear in your library.</span>
          </div>
          <div>
            <ListOrdered aria-hidden="true" />
            <strong>Reading order</strong>
            <span>Follow every collection issue by issue.</span>
          </div>
          <div>
            <MonitorSmartphone aria-hidden="true" />
            <strong>Every screen</strong>
            <span>Read naturally on a phone, tablet or computer.</span>
          </div>
        </div>

        <section className="pass-explainer" aria-labelledby="pass-how-title">
          <p className="eyebrow plain">How it works</p>
          <h3 id="pass-how-title">FROM RELEASE TO READER</h3>
          <ol>
            <li><span>01</span><div><strong>Look for the Pass badge</strong><p>Every included issue will be clearly marked.</p></div></li>
            <li><span>02</span><div><strong>Open your library</strong><p>Included stories stay together in reading order.</p></div></li>
            <li><span>03</span><div><strong>Read your way</strong><p>Use page fit, width fit, zoom, fullscreen or mobile swipe.</p></div></li>
          </ol>
        </section>

        <div className="pass-trust-note">
          <ShieldCheck aria-hidden="true" />
          <div>
            <strong>Verified access</strong>
            <p>
              Dzonyx grants access only after PayPal confirms an active
              subscription. Cancellation removes Pass access automatically.
            </p>
          </div>
        </div>
      </div>
      <aside className="pass-purchase-card">
        <span className="pass-card-status">
          <Check aria-hidden="true" /> Monthly membership
        </span>
        <span>MONTHLY PRICE</span>
        <strong>{formatMoney(settings.passEurCents, "EUR")}</strong>
        <p>{formatMoney(settings.passUsdCents, "USD")} for USD customers</p>
        <PayPalSubscribe
          priceEurCents={settings.passEurCents}
          priceUsdCents={settings.passUsdCents}
          subscriptionsEnabled={settings.subscriptionsEnabled}
        />
        <small>Payments are handled securely by PayPal. Dzonyx never receives card details.</small>
      </aside>
    </div>
  );
}
