import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, PanelsTopLeft, Sparkles } from "lucide-react";
import { CatalogueGrid } from "@/components/catalogue-grid";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero">
        <Image
          src="/hero-dzonyx.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-image"
        />
        <div className="hero-veil" />
        <div className="shell hero-content">
          <div className="eyebrow">
            <span />
            Independent digital comics
          </div>
          <h1>
            NEW WORLDS.
            <br />
            <em>ONE PANEL</em>
            <br />
            AT A TIME.
          </h1>
          <p>
            Enter the home of original Dzonyx stories. Build your collection
            and read every issue in a focused online reader.
          </p>
          <div className="hero-actions">
            <Button asChild size="lg">
              <Link href="/catalogue">
                Explore the catalogue <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pass">Discover Universe Pass</Link>
            </Button>
          </div>
        </div>
        <div className="hero-index" aria-hidden="true">
          DZ / 001
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div>
            <span className="section-number">01</span>
            <p className="eyebrow plain">New releases</p>
            <h2>FRESH FROM THE DRAWING BOARD</h2>
          </div>
          <Link className="text-link" href="/catalogue">
            View complete catalogue <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <CatalogueGrid limit={3} />
      </section>

      <section className="pass-band">
        <div className="shell pass-grid">
          <div className="pass-orbit" aria-hidden="true">
            <span>D</span>
          </div>
          <div>
            <p className="eyebrow plain">Membership preview</p>
            <h2>THE DZONYX UNIVERSE PASS</h2>
            <p className="pass-copy">
              One monthly membership for every issue marked as included. Your
              library stays in one place, ready whenever you are.
            </p>
            <ul className="feature-list">
              <li>
                <BookOpen aria-hidden="true" />
                Read included issues online
              </li>
              <li>
                <PanelsTopLeft aria-hidden="true" />
                Collections organised in reading order
              </li>
              <li>
                <Sparkles aria-hidden="true" />
                New releases added by the creator
              </li>
            </ul>
          </div>
          <div className="pass-price-card">
            <p>Planned launch price</p>
            <strong>€2</strong>
            <span>or $2.50 / month</span>
            <Button disabled className="w-full">
              Payments opening later
            </Button>
            <small>No card details are collected yet.</small>
          </div>
        </div>
      </section>

      <section className="manifesto">
        <div className="shell manifesto-grid">
          <p className="manifesto-label">WHY DZONYX</p>
          <blockquote>
            “A home for original stories with the energy of the comics we
            love—built as its own universe.”
          </blockquote>
          <p>
            Dzonyx begins with a writer, a blank page and a clear promise:
            every published issue shown here will be real. The catalogue opens
            when the first comic is ready.
          </p>
        </div>
      </section>
    </main>
  );
}
