import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { PassDetails } from "@/components/pass-details";

export const metadata: Metadata = {
  title: "Universe Pass",
  description: "Subscribe to the Dzonyx Universe Pass and read included comics.",
};

export default function PassPage() {
  return (
    <main id="main-content">
      <section className="page-hero pass-page-hero">
        <div className="shell pass-hero-grid">
          <div>
            <p className="eyebrow plain">Monthly membership</p>
            <h1>UNLOCK THE UNIVERSE</h1>
            <p>
              A monthly reading pass for included Dzonyx stories,
              organised in one library and built for every screen.
            </p>
            <span className="preview-status">Secure checkout powered by PayPal</span>
          </div>
          <div className="pass-hero-mark" aria-hidden="true">
            <BrandMark />
          </div>
        </div>
      </section>
      <section className="page-body shell">
        <PassDetails />
      </section>
    </main>
  );
}
