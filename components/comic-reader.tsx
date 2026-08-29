"use client";

import Link from "next/link";
import { useAuth } from "@clerk/react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authenticatedFetch, responseMessage } from "@/lib/auth-fetch";
import type { ComicRecord } from "@/lib/types";

type ReaderPage = { id: string; position: number };

export function ComicReader({ issueId }: { issueId: string }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [comic, setComic] = useState<ComicRecord | null>(null);
  const [pages, setPages] = useState<ReaderPage[]>([]);
  const [index, setIndex] = useState(0);
  const [pageUrl, setPageUrl] = useState("");
  const [error, setError] = useState("");
  const [loadedPageId, setLoadedPageId] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    authenticatedFetch(getToken, "/api/comics/" + issueId + "/reader")
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseMessage(response));
        return response.json() as Promise<{
          comic: ComicRecord;
          pages: ReaderPage[];
        }>;
      })
      .then((data) => {
        setComic(data.comic);
        setPages(data.pages);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [getToken, isLoaded, isSignedIn, issueId]);

  useEffect(() => {
    const page = pages[index];
    if (!page) return;
    let objectUrl = "";
    let active = true;
    authenticatedFetch(getToken, "/api/assets/" + page.id)
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseMessage(response));
        return response.blob();
      })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPageUrl(objectUrl);
        setLoadedPageId(page.id);
      })
      .catch((reason: Error) => setError(reason.message));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [getToken, index, pages]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setIndex((value) => Math.min(value + 1, pages.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((value) => Math.max(value - 1, 0));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pages.length]);

  if (!isLoaded) {
    return <Skeleton className="mx-auto h-[70vh] w-full max-w-3xl" />;
  }

  if (!isSignedIn) {
    return (
      <div className="reader-message">
        <LockKeyhole aria-hidden="true" />
        <h1>Sign in to open the reader</h1>
        <p>Use the email code sent by Clerk. No password is required.</p>
        <Button asChild>
          <Link href="/sign-in">Sign in with email</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reader-message">
        <LockKeyhole aria-hidden="true" />
        <h1>Reader unavailable</h1>
        <p>{error}</p>
        <Button asChild variant="outline">
          <Link href="/catalogue">Back to catalogue</Link>
        </Button>
      </div>
    );
  }

  if (!comic) {
    return <Skeleton className="mx-auto h-[70vh] w-full max-w-3xl" />;
  }

  return (
    <div className="reader-shell">
      <div className="reader-topbar">
        <Button asChild variant="ghost" size="sm">
          <Link href="/library">
            <ArrowLeft aria-hidden="true" />
            Library
          </Link>
        </Button>
        <div>
          <span>{comic.collectionName}</span>
          <h1>{comic.title}</h1>
        </div>
        <span className="reader-counter">
          {pages.length ? index + 1 : 0} / {pages.length}
        </span>
      </div>
      <div
        className="reader-stage"
        onContextMenu={(event) => event.preventDefault()}
      >
        {!pages.length ? (
          <div className="reader-message compact">
            <p>No pages have been uploaded to this issue yet.</p>
          </div>
        ) : loadedPageId !== pages[index]?.id || !pageUrl ? (
          <Skeleton className="h-[72vh] w-full max-w-3xl" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pageUrl}
            alt={"Page " + (index + 1) + " of " + comic.title}
            draggable={false}
          />
        )}
      </div>
      <div className="reader-controls">
        <Button
          variant="outline"
          onClick={() => setIndex((value) => Math.max(value - 1, 0))}
          disabled={index <= 0}
        >
          <ChevronLeft aria-hidden="true" />
          Previous
        </Button>
        <span>Use arrow keys to turn pages</span>
        <Button
          onClick={() =>
            setIndex((value) => Math.min(value + 1, pages.length - 1))
          }
          disabled={!pages.length || index >= pages.length - 1}
        >
          Next
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
