import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const agreementSource = readFileSync(new URL("../agreement/preview/page.tsx", import.meta.url), "utf8");

test("waits for the report before scrolling to the earlybird section", () => {
  assert.match(source, /window\.location\.hash === "#earlybird-section"[\s\S]*?\}, \[showReport\]\);/);
  assert.doesNotMatch(source, /setTimeout\([\s\S]*?earlybird-section[\s\S]*?, 300\)/);
});

test("keeps the active team when returning from the agreement preview", () => {
  assert.match(agreementSource, /\/gap-report\$\{teamId \? `\?teamId=\$\{teamId\}` : ""\}#earlybird-section/);
});
