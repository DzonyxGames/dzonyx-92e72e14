import { getDatabase } from "@/db";
import { authErrorResponse, requireIdentity } from "@/server/auth";
import { canReadComic, getComicById } from "@/server/comics";
import { storageUnavailable } from "@/server/storage";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const identity = await requireIdentity(request);
    const { id } = await context.params;
    const comic = await getComicById(id);
    if (!comic) {
      return Response.json({ error: "Comic not found." }, { status: 404 });
    }
    if (!(await canReadComic(identity, comic))) {
      return Response.json(
        {
          error:
            "This issue is locked. Purchases and subscriptions are not open yet.",
        },
        { status: 403 },
      );
    }
    const pages = await getDatabase()
      .prepare(
        "SELECT id, position FROM assets " +
          "WHERE comic_id = ? AND kind = 'page' ORDER BY position ASC",
      )
      .bind(id)
      .all<{ id: string; position: number }>();
    return Response.json({ comic, pages: pages.results });
  } catch (error) {
    if (storageUnavailable(error)) {
      return Response.json(
        { error: "The reader storage has not been connected yet." },
        { status: 503 },
      );
    }
    return authErrorResponse(error);
  }
}
