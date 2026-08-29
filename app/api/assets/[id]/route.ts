import { getDatabase } from "@/db";
import { authErrorResponse, requireIdentity } from "@/server/auth";
import { canReadComic, getComicById } from "@/server/comics";
import { getBucket, storageUnavailable } from "@/server/storage";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const identity = await requireIdentity(request);
    const { id } = await context.params;
    const asset = await getDatabase()
      .prepare(
        "SELECT id, comic_id, object_key, content_type, kind " +
          "FROM assets WHERE id = ? LIMIT 1",
      )
      .bind(id)
      .first<{
        id: string;
        comic_id: string;
        object_key: string;
        content_type: string;
        kind: "cover" | "page";
      }>();
    if (!asset) {
      return Response.json({ error: "Image not found." }, { status: 404 });
    }
    const comic = await getComicById(asset.comic_id);
    if (!comic || !(await canReadComic(identity, comic))) {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }
    const object = await getBucket().get(asset.object_key);
    if (!object) {
      return Response.json({ error: "Image not found." }, { status: 404 });
    }
    return new Response(object.body, {
      headers: {
        "Content-Type": asset.content_type,
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (storageUnavailable(error)) {
      return Response.json(
        { error: "File storage has not been connected yet." },
        { status: 503 },
      );
    }
    return authErrorResponse(error);
  }
}
