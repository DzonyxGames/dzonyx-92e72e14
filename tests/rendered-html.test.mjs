import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("packages Dzonyx metadata and honest launch copy", async () => {
  const [layout, home, worker, manifest] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../dist/server/index.js", import.meta.url), "utf8"),
    readFile(
      new URL("../dist/.openai/hosting.json", import.meta.url),
      "utf8",
    ),
  ]);
  const hosting = JSON.parse(manifest);

  assert.match(layout, /Dzonyx — Original digital comics/);
  assert.match(home, /every published issue shown here will be real/i);
  assert.match(home, /Payments opening later/i);
  assert.match(worker, /Original digital comics/i);
  assert.equal(hosting.d1, "DB");
  assert.equal(hosting.r2, "BUCKET");
  assert.doesNotMatch(layout + home, /codex-preview/i);
  assert.doesNotMatch(layout + home, /Starter Project/i);
});
