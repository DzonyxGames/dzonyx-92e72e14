import { getDatabase } from "@/db";
import { authErrorResponse, requireAdmin } from "@/server/auth";
import { getBucket, storageUnavailable } from "@/server/storage";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: Context) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const asset = await getDatabase()
      .prepare(
        "SELECT id, comic_id, object_key, kind FROM assets WHERE id = ? LIMIT 1",
      )
      .bind(id)
      .first<{
        id: string;
        comic_id: string;
        object_key: string;
        kind: "cover" | "page";
      }>();
    if (!asset || asset.kind !== "page") {
      return Response.json({ error: "Page not found." }, { status: 404 });
    }
    await getDatabase()
      .prepare("DELETE FROM assets WHERE id = ? AND kind = 'page'")
      .bind(id)
      .run();
    const remaining = await getDatabase()
      .prepare(
        "SELECT id, position FROM assets " +
          "WHERE comic_id = ? AND kind = 'page' ORDER BY position ASC",
      )
      .bind(asset.comic_id)
      .all<{ id: string; position: number }>();
    const reorders = remaining.results
      .map((page, index) => ({ ...page, nextPosition: index + 1 }))
      .filter((page) => page.position !== page.nextPosition)
      .map((page) =>
        getDatabase()
          .prepare("UPDATE assets SET position = ? WHERE id = ?")
          .bind(page.nextPosition, page.id),
      );
    if (reorders.length) await getDatabase().batch(reorders);
    try {
      await getBucket().delete(asset.object_key);
    } catch {}
    await getDatabase()
      .prepare("UPDATE comics SET updated_at = ? WHERE id = ?")
      .bind(Date.now(), asset.comic_id)
      .run();
    return Response.json({ ok: true });
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
