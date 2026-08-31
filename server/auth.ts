import "server-only";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { getServerConfig } from "./config";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(issuer: string) {
  const current = jwksByIssuer.get(issuer);
  if (current) return current;
  const created = createRemoteJWKSet(
    new URL(issuer + "/.well-known/jwks.json"),
  );
  jwksByIssuer.set(issuer, created);
  return created;
}

function bearerToken(request: Request) {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) {
    throw new AuthError("Sign in is required.");
  }
  const token = value.slice(7).trim();
  if (!token) throw new AuthError("Sign in is required.");
  return token;
}

function assertRequestOrigin(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin.replace(/\/+$/, "") !== requestOrigin) {
    throw new AuthError("Request origin is not allowed.", 403);
  }
  return requestOrigin;
}

export type DzonyxIdentity = {
  userId: string;
  isAdmin: boolean;
  claims: JWTPayload;
};

export async function requireIdentity(request: Request): Promise<DzonyxIdentity> {
  const token = bearerToken(request);
  const requestOrigin = assertRequestOrigin(request);
  const config = getServerConfig();
  const permittedOrigins = new Set([requestOrigin, ...config.allowedOrigins]);
  try {
    const { payload, protectedHeader } = await jwtVerify(
      token,
      getJwks(config.clerkIssuer),
      {
        algorithms: ["RS256"],
        issuer: config.clerkIssuer,
        clockTolerance: 5,
        requiredClaims: ["sub", "exp", "iat", "nbf"],
      },
    );
    if (protectedHeader.alg !== "RS256" || !payload.sub) {
      throw new AuthError("Invalid session.");
    }
    if (
      typeof payload.azp === "string" &&
      !permittedOrigins.has(payload.azp.replace(/\/+$/, ""))
    ) {
      throw new AuthError("Session origin is not allowed.", 403);
    }
    return {
      userId: payload.sub,
      isAdmin: payload.sub === config.adminUserId,
      claims: payload,
    };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError("Your session is invalid or expired.");
  }
}

export async function requireAdmin(request: Request) {
  const identity = await requireIdentity(request);
  if (!identity.isAdmin) {
    throw new AuthError("Administrator access is required.", 403);
  }
  return identity;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
