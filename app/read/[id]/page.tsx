import { ComicReader } from "@/components/comic-reader";

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main id="main-content" className="reader-page">
      <ComicReader issueId={id} />
    </main>
  );
}
