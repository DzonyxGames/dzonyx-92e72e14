import Link from "next/link";
import { BookOpen, LockKeyhole, Orbit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PurchaseComicButton } from "@/components/purchase-comic-button";
import type { ComicRecord } from "@/lib/types";
import { formatMoney } from "@/lib/types";

export function ComicCard({
  comic,
  hasAccess = false,
  paymentsEnabled = false,
  sandboxMode = false,
}: {
  comic: ComicRecord;
  hasAccess?: boolean;
  paymentsEnabled?: boolean;
  sandboxMode?: boolean;
}) {
  const isFree = comic.priceEurCents === 0 && comic.priceUsdCents === 0;
  const canOpen = isFree || hasAccess;
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
          {canOpen ? (
            <Button asChild variant="default">
              <Link href={"/read/" + comic.id}>
                <BookOpen aria-hidden="true" />
                Read now
              </Link>
            </Button>
          ) : paymentsEnabled ? (
            <PurchaseComicButton comic={comic} sandboxMode={sandboxMode} />
          ) : (
            <Button disabled variant="outline">
              <LockKeyhole aria-hidden="true" />
              Payments opening later
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
