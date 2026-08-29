import type { Metadata } from "next";
import { PassDetails } from "@/components/pass-details";

export const metadata: Metadata = {
  title: "Universe Pass",
  description: "Preview the planned Dzonyx Universe Pass membership.",
};

export default function PassPage() {
  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow plain">Membership</p>
          <h1>UNLOCK THE UNIVERSE</h1>
          <p>
            A simple monthly option for readers who want every included Dzonyx
            comic together.
          </p>
        </div>
      </section>
      <section className="page-body shell">
        <PassDetails />
      </section>
    </main>
  );
}
