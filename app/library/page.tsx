import type { Metadata } from "next";
import { LibraryView } from "@/components/library-view";

export const metadata: Metadata = {
  title: "My Library",
};

export default function LibraryPage() {
  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow plain">Your reading shelf</p>
          <h1>MY LIBRARY</h1>
          <p>Your accessible issues and Universe Pass releases live here.</p>
        </div>
      </section>
      <section className="page-body shell">
        <LibraryView />
      </section>
    </main>
  );
}
