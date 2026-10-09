// Chat scrolling: only the message container scrolls; the page never jumps.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scrollToLatest } from "@/lib/chatScroll";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const read = (f) => readFileSync(path.join(SRC, f), "utf8");

test("scrollToLatest moves only the given container to its end", () => {
  const box = { scrollTop: 0, scrollHeight: 900 };
  scrollToLatest(box);
  assert.equal(box.scrollTop, 900);
  assert.doesNotThrow(() => scrollToLatest(null));
});

test("no chat uses scrollIntoView or window scrolling (they move the whole page)", () => {
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));
  for (const file of walk(path.join(SRC, "components")).filter((f) => f.endsWith(".js"))) {
    const text = readFileSync(file, "utf8");
    assert.ok(!/scrollIntoView|window\.scrollTo/.test(text), `${path.relative(SRC, file)} scrolls the page`);
  }
});

test("each chat scrolls its own message list and the composer stays outside it", () => {
  for (const f of ["components/brokers/BrokerChat.js", "components/dispatch/DriverCommsPanel.js", "components/tracking/TrackingComms.js"]) {
    const src = read(f);
    assert.match(src, /scrollToLatest\(logRef\.current\)/, f);
    assert.match(src, /ref=\{logRef\} role="log"/, f);
    assert.match(src, /min-h-0 flex-1[^"]*overflow-y-auto[^"]*"[^>]*ref=\{logRef\}|ref=\{logRef\}/, f);
  }
  const chat = read("components/brokers/BrokerChat.js");
  assert.match(chat, /onSubmit=\{submit\}/);
  assert.match(chat, /e\.preventDefault\(\)/, "submitting never navigates");
  assert.match(chat, /focus\(\{ preventScroll: true \}\)/, "focus returns to the box without scrolling the page");
  // the message list is the only flexible, scrolling part of the card
  assert.match(chat, /className="panel flex h-full flex-col overflow-hidden"/);
});
