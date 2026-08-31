"use client";

import Link from "next/link";
import { useAuth } from "@clerk/react";
import { BookOpen, LibraryBig } from "lucide-react";
import { useEffect, useState } from "react";
import { ComicCard } from "@/components/comic-card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { authenticatedFetch, responseMessage } from "@/lib/auth-fetch";
import type { ComicRecord } from "@/lib/types";

export function LibraryView() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [comics, setComics] = useState<ComicRecord[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    authenticatedFetch(getToken, "/api/library")
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseMessage(response));
        return response.json() as Promise<{ comics: ComicRecord[] }>;
      })
      .then((data) => setComics(data.comics))
      .catch((reason: Error) => {
        setError(reason.message);
        setComics([]);
      });
  }, [getToken, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return <Skeleton className="h-72 w-full" />;
  }

  if (!isSignedIn) {
    return (
      <div className="library-signin">
        <div>
          <BookOpen className="mx-auto mb-5 size-10 text-orange-500" />
          <h2>Sign in to open your library</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            We will email you a one-time code. No password is needed.
          </p>
          <Button asChild>
            <Link href="/sign-in">Sign in with email</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (comics === null) {
    return <Skeleton className="h-72 w-full" />;
  }

  if (!comics.length) {
    return (
      <Empty className="catalogue-empty">
        <EmptyMedia variant="icon">
          <LibraryBig aria-hidden="true" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{error || "Your library is ready for its first issue"}</EmptyTitle>
          <EmptyDescription>
            {error
              ? "Try again after storage is connected."
              : "Free issues and future purchases will appear here."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="comic-grid">
      {comics.map((comic) => (
        <ComicCard key={comic.id} comic={comic} hasAccess />
      ))}
    </div>
  );
}
