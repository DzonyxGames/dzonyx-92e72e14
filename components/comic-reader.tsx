"use client";

import Link from "next/link";
import { useAuth } from "@clerk/react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  GalleryHorizontal,
  LockKeyhole,
  Maximize2,
  Minimize2,
  ScanLine,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authenticatedFetch, responseMessage } from "@/lib/auth-fetch";
import type { ComicRecord } from "@/lib/types";

type ReaderPage = { id: string; position: number };
type FitMode = "page" | "width";

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

export function ComicReader({ issueId }: { issueId: string }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [comic, setComic] = useState<ComicRecord | null>(null);
  const [pages, setPages] = useState<ReaderPage[]>([]);
  const [index, setIndex] = useState(0);
  const [pageUrl, setPageUrl] = useState("");
  const [error, setError] = useState("");
  const [loadedPageId, setLoadedPageId] = useState("");
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<FitMode>("page");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const readerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const previousPage = useCallback(() => {
    setIndex((value) => Math.max(value - 1, 0));
  }, []);

  const nextPage = useCallback(() => {
    setIndex((value) => Math.min(value + 1, pages.length - 1));
  }, [pages.length]);

  const zoomOut = useCallback(() => {
    setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP));
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP));
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await readerRef.current?.requestFullscreen();
      return;
    }
    await document.exitFullscreen();
  }, []);

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
        setIndex(0);
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
        nextPage();
      }
      if (event.key === "ArrowLeft") {
        previousPage();
      }
      if (event.key === "+" || event.key === "=") {
        zoomIn();
      }
      if (event.key === "-") {
        zoomOut();
      }
      if (event.key.toLowerCase() === "f") {
        void toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextPage, previousPage, toggleFullscreen, zoomIn, zoomOut]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === readerRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

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
    <div className="reader-shell" ref={readerRef}>
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
        className={`reader-stage reader-fit-${fitMode}`}
        onContextMenu={(event) => event.preventDefault()}
        onTouchStart={(event) => {
          touchStartX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStartX.current;
          const end = event.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (start === null || end === undefined) return;
          const distance = end - start;
          if (distance < -55) nextPage();
          if (distance > 55) previousPage();
        }}
      >
        {!pages.length ? (
          <div className="reader-message compact">
            <p>No pages have been uploaded to this issue yet.</p>
          </div>
        ) : loadedPageId !== pages[index]?.id || !pageUrl ? (
          <Skeleton className="h-[72vh] w-full max-w-3xl" />
        ) : (
          <div className="reader-canvas">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pageUrl}
              alt={"Page " + (index + 1) + " of " + comic.title}
              draggable={false}
              className="reader-page-image"
              style={
                fitMode === "width"
                  ? ({ width: `${zoom * 100}%` } as CSSProperties)
                  : ({
                      height: `${Math.round(78 * zoom)}vh`,
                      maxWidth: `${zoom * 100}%`,
                    } as CSSProperties)
              }
            />
          </div>
        )}
      </div>
      <div className="reader-progress" aria-hidden="true">
        <span
          style={{
            width: pages.length ? `${((index + 1) / pages.length) * 100}%` : "0%",
          }}
        />
      </div>
      <div className="reader-toolbar" aria-label="Comic reader controls">
        <Button
          variant="outline"
          size="sm"
          onClick={previousPage}
          disabled={index <= 0}
          aria-label="Previous page"
          title="Previous page (Left arrow)"
        >
          <ChevronLeft aria-hidden="true" />
          <span className="reader-control-label">Previous</span>
        </Button>
        <div className="reader-tool-group">
          <Button variant="ghost" size="sm" onClick={zoomOut} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out" title="Zoom out (-)"><ZoomOut aria-hidden="true" /></Button>
          <span className="reader-zoom-value">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={zoomIn} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in" title="Zoom in (+)"><ZoomIn aria-hidden="true" /></Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFitMode((value) => (value === "page" ? "width" : "page"));
              setZoom(1);
            }}
            aria-label={fitMode === "page" ? "Fit page" : "Fit width"}
            title={fitMode === "page" ? "Fit page" : "Fit width"}
          >
            {fitMode === "page" ? <ScanLine aria-hidden="true" /> : <GalleryHorizontal aria-hidden="true" />}
            <span className="reader-control-label">{fitMode === "page" ? "Fit page" : "Fit width"}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} title={`${isFullscreen ? "Exit" : "Enter"} fullscreen (F)`}>
            {isFullscreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          </Button>
        </div>
        <Button
          size="sm"
          onClick={nextPage}
          disabled={!pages.length || index >= pages.length - 1}
          aria-label="Next page"
          title="Next page (Right arrow)"
        >
          <span className="reader-control-label">Next</span>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      <p className="reader-help">Swipe on mobile · Arrow keys turn pages · + / − zoom · F fullscreen</p>
    </div>
  );
}
