import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal & privacy",
};

export default function LegalPage() {
  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow plain">Dzonyx policies</p>
          <h1>LEGAL &amp; PRIVACY</h1>
          <p>Launch drafts for the Dzonyx digital-comic service.</p>
        </div>
      </section>
      <section className="page-body shell legal-copy">
        <p className="legal-note">
          These policies are drafts and must be reviewed by the adult who
          operates the store before real sales are enabled.
        </p>
        <h2>Copyright</h2>
        <p>
          © 2026 Dzonyx. All rights reserved. Dzonyx comic scripts, titles,
          characters, page layouts and published artwork may not be copied,
          redistributed, resold, uploaded or publicly shared without written
          permission from the rights holder. Buying access grants personal
          reading access only; it does not transfer copyright.
        </p>
        <h2>Reader access</h2>
        <p>
          Accounts are intended for the individual reader. Access to paid
          issues may be suspended after a refund, chargeback, account misuse or
          a breach of these terms. Technical protections cannot guarantee that
          screenshots or unauthorised copies are impossible.
        </p>
        <h2>Privacy</h2>
        <p>
          Clerk processes email addresses and sign-in codes for authentication.
          Dzonyx stores the account identifier needed to connect a reader with
          purchases or a subscription. Comic files are delivered through a
          protected reader. Dzonyx does not currently collect card details
          because payments are disabled.
        </p>
        <h2>Contact and operator</h2>
        <p>
          The adult store operator’s legal name, business contact email,
          address where required, refund rules and applicable consumer notices
          must be inserted before sales begin.
        </p>
      </section>
    </main>
  );
}
