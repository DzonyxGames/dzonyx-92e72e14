import { authErrorResponse, requireIdentity } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const identity = await requireIdentity(request);
    return Response.json({ isAdmin: identity.isAdmin });
  } catch (error) {
    return authErrorResponse(error);
  }
}
