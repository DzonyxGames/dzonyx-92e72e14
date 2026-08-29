import { listPublishedComics } from "@/server/comics";
import { storageUnavailable } from "@/server/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({
      comics: await listPublishedComics(),
      storageReady: true,
    });
  } catch (error) {
    if (storageUnavailable(error)) {
      return Response.json({ comics: [], storageReady: false });
    }
    return Response.json(
      { comics: [], error: "The catalogue could not be loaded." },
      { status: 500 },
    );
  }
}
