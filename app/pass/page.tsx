import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { PassDetails } from "@/components/pass-details";

export const metadata: Metadata = {
  title: "Universe Pass",
  description: "Preview the planned Dzonyx Universe Pass membership.",
};

export default function PassPage() {
  return (
    <main id="main-content">
      <section className="page-hero pass-page-hero">
        <div className="shell pass-hero-grid">
          <div>
            <p className="eyebrow plain">Membership preview</p>
            <h1>UNLOCK THE UNIVERSE</h1>
            <p>
              A planned monthly reading pass for included Dzonyx stories,
              organised in one library and built for every screen.
            </p>
            <span className="preview-status">Preview — subscriptions are not live</span>
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
