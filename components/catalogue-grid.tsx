"use client";

import { LibraryBig } from "lucide-react";
import { useEffect, useState } from "react";
import { ComicCard } from "@/components/comic-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComicRecord } from "@/lib/types";

export function CatalogueGrid({ limit }: { limit?: number }) {
  const [comics, setComics] = useState<ComicRecord[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/catalog")
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalogue unavailable");
        return response.json() as Promise<{ comics: ComicRecord[] }>;
      })
      .then((data) => setComics(data.comics))
      .catch(() => {
        setFailed(true);
        setComics([]);
      });
  }, []);

  if (comics === null) {
    return (
      <div className="comic-grid" aria-label="Loading catalogue">
        {[0, 1, 2].map((item) => (
          <div className="comic-skeleton" key={item}>
            <Skeleton className="aspect-[2/3] w-full" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!comics.length) {
    return (
      <Empty className="catalogue-empty">
        <EmptyMedia variant="icon">
          <LibraryBig aria-hidden="true" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>
            {failed
              ? "Catalogue temporarily unavailable"
              : "The first issue is in the works"}
          </EmptyTitle>
          <EmptyDescription>
            {failed
              ? "Please try again in a moment."
              : "No pretend releases here. Published Dzonyx comics will appear in this catalogue."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="comic-grid">
      {comics.slice(0, limit).map((comic) => (
        <ComicCard key={comic.id} comic={comic} />
      ))}
    </div>
  );
}
