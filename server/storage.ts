import "server-only";
import { env } from "cloudflare:workers";

export function getBucket(): R2Bucket {
  const bucket = (env as unknown as { BUCKET?: R2Bucket }).BUCKET;
  if (!bucket) {
    throw new Error("Cloudflare R2 binding BUCKET is unavailable.");
  }
  return bucket;
}

export function storageUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return (
    (message.includes("binding") && message.includes("is unavailable")) ||
    message.includes("no such table")
  );
}

export function safeId() {
  return crypto.randomUUID();
}

export function slugify(input: string) {
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || "issue";
}

export function detectComicImage(bytes: Uint8Array): string | null {
  if (
    bytes.length > 11 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length > 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}
