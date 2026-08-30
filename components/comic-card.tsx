import Link from "next/link";
import { BookOpen, LockKeyhole, Orbit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ComicRecord } from "@/lib/types";
import { formatMoney } from "@/lib/types";

export function ComicCard({ comic }: { comic: ComicRecord }) {
  const isFree = comic.priceEurCents === 0 && comic.priceUsdCents === 0;
  return (
    <article className="comic-card">
      <div className="cover-frame">
        {comic.coverAssetId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={"/api/covers/" + comic.coverAssetId}
            alt={comic.title + " cover"}
            loading="lazy"
          />
        ) : (
          <div className="cover-placeholder">
            <span>{comic.collectionName}</span>
            <strong>#{comic.issueNumber}</strong>
          </div>
        )}
        <span className="issue-chip">ISSUE {comic.issueNumber}</span>
      </div>
      <div className="comic-card-body">
        <div className="comic-card-kicker">{comic.collectionName}</div>
        <h3>{comic.title}</h3>
        <p>{comic.description || "Story details are coming soon."}</p>
        <div className="comic-badges">
          {comic.includedInPass ? (
            <Badge variant="outline">
              <Orbit aria-hidden="true" />
              Universe Pass
            </Badge>
          ) : null}
          <Badge variant="outline">{comic.pageCount} pages</Badge>
        </div>
        <div className="comic-card-footer">
          <div className="price-stack">
            {isFree ? (
              <strong>Free</strong>
            ) : (
              <>
                <strong>{formatMoney(comic.priceEurCents, "EUR")}</strong>
                <span>{formatMoney(comic.priceUsdCents, "USD")}</span>
              </>
            )}
          </div>
          <Button asChild variant={isFree ? "default" : "outline"}>
            <Link href={"/read/" + comic.id}>
              {isFree ? (
                <BookOpen aria-hidden="true" />
              ) : (
                <LockKeyhole aria-hidden="true" />
              )}
              {isFree ? "Read now" : "Check access"}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
