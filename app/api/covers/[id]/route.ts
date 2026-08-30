import { getDatabase } from "@/db";
import { getBucket, storageUnavailable } from "@/server/storage";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const asset = await getDatabase()
      .prepare(
        "SELECT a.object_key, a.content_type FROM assets a " +
          "INNER JOIN comics c ON c.id = a.comic_id " +
          "WHERE a.id = ? AND a.kind = 'cover' " +
          "AND c.status = 'published' AND c.cover_asset_id = a.id LIMIT 1",
      )
      .bind(id)
      .first<{ object_key: string; content_type: string }>();
    if (!asset) return new Response("Not found", { status: 404 });
    const object = await getBucket().get(asset.object_key);
    if (!object) return new Response("Not found", { status: 404 });
    return new Response(object.body, {
      headers: {
        "Content-Type": asset.content_type,
        "Cache-Control": "public, max-age=300",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (storageUnavailable(error)) {
      return new Response("Not found", { status: 404 });
    }
    return new Response("Image unavailable", { status: 500 });
  }
}
