import { authErrorResponse, requireIdentity } from "@/server/auth";
import {
  canReadComic,
  listAllComics,
  listPublishedComics,
} from "@/server/comics";
import { storageUnavailable } from "@/server/storage";
import type { ComicRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const identity = await requireIdentity(request);
    const candidates: ComicRecord[] = identity.isAdmin
      ? await listAllComics()
      : await listPublishedComics();
    const access = await Promise.all(
      candidates.map(async (comic) => ({
        comic,
        canRead: await canReadComic(identity, comic),
      })),
    );
    return Response.json({
      comics: access.filter((item) => item.canRead).map((item) => item.comic),
    });
  } catch (error) {
    if (storageUnavailable(error)) {
      return Response.json(
        { error: "Your library has not been connected yet." },
        { status: 503 },
      );
    }
    return authErrorResponse(error);
  }
}
