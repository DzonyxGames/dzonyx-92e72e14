import type { Metadata } from "next";
import { CatalogueGrid } from "@/components/catalogue-grid";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Browse every published Dzonyx digital comic and collection.",
};

export default function CataloguePage() {
  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow plain">Every published issue</p>
          <h1>THE CATALOGUE</h1>
          <p>
            Original collections appear here in reading order. Choose an issue,
            sign in with your email code and open the online reader.
          </p>
        </div>
      </section>
      <section className="page-body shell">
        <CatalogueGrid />
      </section>
    </main>
  );
}
