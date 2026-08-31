import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  PanelsTopLeft,
  Sparkles,
} from "lucide-react";
import { CatalogueGrid } from "@/components/catalogue-grid";
import { Button } from "@/components/ui/button";
import { studioNotes } from "@/lib/studio-notes";

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

      <section className="news-band">
        <div className="shell">
          <div className="section-heading news-heading">
            <div>
              <span className="section-number">02</span>
              <p className="eyebrow plain">Studio Notes</p>
              <h2>FROM INSIDE THE UNIVERSE</h2>
            </div>
            <Link className="text-link" href="/news">
              Read all updates <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className="news-grid">
            {studioNotes.map((note) => (
              <article className="news-card" key={note.id}>
                <div className="news-card-meta">
                  <span>{note.label}</span>
                  <b>{note.number}</b>
                </div>
                <h3>{note.title}</h3>
                <p>{note.summary}</p>
                <Link href={`/news#${note.id}`}>
                  Open note <ArrowUpRight aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pass-band">
        <div className="shell pass-grid">
          <div className="pass-orbit" aria-hidden="true">
            <span>D</span>
          </div>
          <div>
            <p className="eyebrow plain">Monthly membership</p>
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
            <p>Monthly price</p>
            <strong>€2</strong>
            <span>or $2.50 / month</span>
            <Button asChild className="w-full">
              <Link href="/pass">Choose your plan</Link>
            </Button>
            <small>EUR and USD plans available through PayPal.</small>
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
