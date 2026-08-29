import { getDatabase } from "@/db";
import { authErrorResponse, requireAdmin } from "@/server/auth";
import { getComicById } from "@/server/comics";
import { getBucket, safeId, storageUnavailable } from "@/server/storage";
import {
  comicImageFromRequest,
  validationResponse,
} from "@/server/validation";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const pages = await getDatabase()
      .prepare(
        "SELECT id, position FROM assets " +
          "WHERE comic_id = ? AND kind = 'page' ORDER BY position ASC",
      )
      .bind(id)
      .all<{ id: string; position: number }>();
    return Response.json({ pages: pages.results });
  } catch (error) {
    if (storageUnavailable(error)) {
      return Response.json(
        { error: "Page storage has not been connected yet." },
        { status: 503 },
      );
    }
    return authErrorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  let objectKey: string | null = null;
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const comic = await getComicById(id);
    if (!comic) {
      return Response.json({ error: "Comic not found." }, { status: 404 });
    }
    if (comic.pageCount >= 200) {
      return Response.json(
        { error: "A comic can contain up to 200 pages." },
        { status: 400 },
      );
    }
    let image;
    try {
      image = await comicImageFromRequest(request);
    } catch (error) {
      const response = validationResponse(error);
      if (response) return response;
      throw error;
    }
    const next = await getDatabase()
      .prepare(
        "SELECT COALESCE(MAX(position), 0) + 1 AS position " +
          "FROM assets WHERE comic_id = ? AND kind = 'page'",
      )
      .bind(id)
      .first<{ position: number }>();
    const position = Number(next?.position ?? 1);
    const assetId = safeId();
    objectKey = "comics/" + id + "/pages/" + assetId;
    await getBucket().put(objectKey, image.bytes, {
      httpMetadata: { contentType: image.contentType },
    });
    const database = getDatabase();
    await database.batch([
      database
        .prepare(
          "INSERT INTO assets " +
            "(id, comic_id, kind, object_key, content_type, byte_size, position, created_at) " +
            "VALUES (?, ?, 'page', ?, ?, ?, ?, ?)",
        )
        .bind(
          assetId,
          id,
          objectKey,
          image.contentType,
          image.bytes.byteLength,
          position,
          Date.now(),
        ),
      database
        .prepare("UPDATE comics SET updated_at = ? WHERE id = ?")
        .bind(Date.now(), id),
    ]);
    objectKey = null;
    return Response.json({ assetId, position });
  } catch (error) {
    if (objectKey) {
      try {
        await getBucket().delete(objectKey);
      } catch {}
    }
    if (storageUnavailable(error)) {
      return Response.json(
        { error: "File storage has not been connected yet." },
        { status: 503 },
      );
    }
    return authErrorResponse(error);
  }
}
