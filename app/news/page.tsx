import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { studioNotes } from "@/lib/studio-notes";

export const metadata: Metadata = {
  title: "News & Studio Notes",
  description:
    "Dzonyx studio notes, reader updates and honest membership news.",
};

export default function NewsPage() {
  return (
    <main id="main-content">
      <section className="page-hero news-page-hero">
        <div className="shell news-hero-grid">
          <div>
            <p className="eyebrow plain">News &amp; Studio Notes</p>
            <h1>THE UNIVERSE IS TAKING SHAPE</h1>
            <p>
              Development notes, reader improvements and publishing updates
              from Dzonyx. No invented announcements—only what is real now and
              what is clearly marked as planned.
            </p>
          </div>
          <Newspaper aria-hidden="true" />
        </div>
      </section>

      <section className="page-body shell newsroom">
        {studioNotes.map((note) => (
          <article className="news-story" id={note.id} key={note.id}>
            <div className="news-story-number" aria-hidden="true">
              {note.number}
            </div>
            <div className="news-story-copy">
              <p className="eyebrow plain">{note.label}</p>
              <h2>{note.title}</h2>
              <p className="news-story-lead">{note.summary}</p>
              {note.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}

        <div className="newsroom-cta">
          <div>
            <p className="eyebrow plain">Enter the catalogue</p>
            <h2>THE NEXT STORY STARTS WITH ISSUE ONE</h2>
          </div>
          <Link className="text-link" href="/catalogue">
            Explore comics <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
