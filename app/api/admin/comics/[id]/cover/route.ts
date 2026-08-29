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

export async function POST(request: Request, context: Context) {
  let objectKey: string | null = null;
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const comic = await getComicById(id);
    if (!comic) {
      return Response.json({ error: "Comic not found." }, { status: 404 });
    }
    let image;
    try {
      image = await comicImageFromRequest(request);
    } catch (error) {
      const response = validationResponse(error);
      if (response) return response;
      throw error;
    }
    const assetId = safeId();
    objectKey = "comics/" + id + "/covers/" + assetId;
    const bucket = getBucket();
    await bucket.put(objectKey, image.bytes, {
      httpMetadata: { contentType: image.contentType },
    });
    const database = getDatabase();
    const oldCover = comic.coverAssetId
      ? await database
          .prepare("SELECT object_key FROM assets WHERE id = ?")
          .bind(comic.coverAssetId)
          .first<{ object_key: string }>()
      : null;
    const statements = [
      database
        .prepare(
          "INSERT INTO assets " +
            "(id, comic_id, kind, object_key, content_type, byte_size, position, created_at) " +
            "VALUES (?, ?, 'cover', ?, ?, ?, NULL, ?)",
        )
        .bind(
          assetId,
          id,
          objectKey,
          image.contentType,
          image.bytes.byteLength,
          Date.now(),
        ),
      database
        .prepare(
          "UPDATE comics SET cover_asset_id = ?, updated_at = ? WHERE id = ?",
        )
        .bind(assetId, Date.now(), id),
    ];
    if (comic.coverAssetId) {
      statements.push(
        database
          .prepare("DELETE FROM assets WHERE id = ? AND kind = 'cover'")
          .bind(comic.coverAssetId),
      );
    }
    await database.batch(statements);
    objectKey = null;
    if (oldCover) {
      try {
        await bucket.delete(oldCover.object_key);
      } catch {}
    }
    return Response.json({ assetId });
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
