import "server-only";
import { env } from "cloudflare:workers";

const fallbackAdminUserId = "user_3IZ2fvVwU8371tG7dIwUAzcAn0T";
const fallbackIssuer = "https://thorough-insect-5780.clerk.accounts.dev";

function readString(name: string) {
  const value = (env as unknown as Record<string, unknown>)[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getServerConfig() {
  const issuer = readString("CLERK_ISSUER") ?? fallbackIssuer;
  return {
    adminUserId: readString("DZONYX_ADMIN_USER_ID") ?? fallbackAdminUserId,
    clerkIssuer: issuer.replace(/\/+$/, ""),
    allowedOrigins: (readString("DZONYX_ALLOWED_ORIGINS") ?? "")
      .split(",")
      .map((value) => value.trim().replace(/\/+$/, ""))
      .filter(Boolean),
  };
}
