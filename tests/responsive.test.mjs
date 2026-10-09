// Desktop / laptop responsive system: tokens, breakpoint bands, shared primitives wired to them.
// (Overflow at each viewport size is checked in a real browser; these guard the source of truth.)

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const read = (f) => readFileSync(path.join(SRC, f), "utf8");
const css = read("app/globals.css");
const section = css.slice(css.indexOf("RESPONSIVE SYSTEM"));
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));
const files = walk(path.join(SRC, "components")).concat(walk(path.join(SRC, "app")).filter((f) => f.endsWith(".js"))).filter((f) => f.endsWith(".js"));

test("global responsive tokens exist", () => {
  for (const t of ["--app-sidebar-width", "--app-header-height", "--app-page-padding", "--app-section-gap", "--app-card-padding", "--app-control-height", "--app-radius", "--app-icon-size", "--app-font-xs", "--app-font-sm", "--app-font-base", "--app-font-lg", "--app-heading-size", "--app-drawer-width", "--app-modal-width"]) {
    assert.ok(section.includes(`${t}:`), t);
  }
});

test("five width bands scale the root font and shrink the tokens as the screen gets smaller", () => {
  const bands = [...section.matchAll(/@media \(max-width: (\d+)px\) \{\s*:root \{[^}]*?font-size: ([\d.]+)px/g)].map((m) => [Number(m[1]), Number(m[2])]);
  assert.deepEqual(bands.map((b) => b[0]), [1799, 1535, 1365, 1199]);
  const sizes = bands.map((b) => b[1]);
  assert.deepEqual([...sizes].sort((a, b) => b - a), sizes, "smaller screens never get a larger root size");
  assert.match(section, /:root \{\s*font-size: 16px;/);
  const sidebar = [...section.matchAll(/--app-sidebar-width: (\d+)px/g)].map((m) => Number(m[1]));
  assert.ok(sidebar[0] >= 220 && sidebar.at(-1) >= 150 && sidebar.at(-1) <= 170, `sidebar ${sidebar}`);
  assert.deepEqual([...sidebar].sort((a, b) => b - a), sidebar);
  assert.match(section, /max-height: 800px/, "short screens get a tighter root");
});

test("small text has a readable floor", () => {
  assert.match(section, /--text-xs: max\(11px, 0\.75rem\)/);
  assert.match(section, /--text-sm: max\(12px, 0\.875rem\)/);
  for (const f of files) {
    if (f.endsWith("ControlCenterPreview.js")) continue; // decorative onboarding mock-up
    assert.ok(!/text-\[(\d|10)px\]/.test(readFileSync(f, "utf8")), `${path.basename(f)} has text under 11px`);
  }
});

test("shell primitives read the tokens instead of fixed widths", () => {
  for (const f of ["components/dispatcher/DispatcherLayout.js", "components/dispatcher/DispatcherApp.js", "components/home/LevelMap.js"]) {
    const src = read(f);
    assert.match(src, /app-sidebar/, f);
    assert.ok(!/\bw-(56|60)\b/.test(src.replace(/h-full w-\[min/g, "")), `${f} no fixed sidebar width`);
  }
  assert.match(read("components/game/GameTopBar.js"), /app-header/);
  assert.match(read("components/dispatcher/DispatcherLayout.js"), /game-grid min-w-0 flex-1 app-page/);
  assert.match(read("components/game/GameDrawer.js"), /var\(--app-drawer-width\)/);
  assert.match(read("components/game/GameModal.js"), /var\(--app-modal-width\)/);
  assert.match(read("components/game/GameModal.js"), /max-h-\[92dvh\]/);
});

test("workspace pages use dynamic viewport height and stack secondary panels on laptops", () => {
  for (const f of ["components/brokers/BrokersPage.js", "components/dispatch/DispatchPage.js"]) {
    const src = read(f);
    assert.ok(!/100vh/.test(src), `${f} must not use 100vh`);
    assert.match(src, /100dvh/);
    assert.match(src, /lg:max-\[1359px\]:grid-cols-\[/, "two columns on laptops");
    assert.match(src, /min-\[1360px\]:max-\[1699px\]:grid-cols-\[/, "three columns from 1360");
  }
  assert.match(read("components/analysis/LoadAnalysisPage.js"), /lg:max-\[1439px\]:grid-cols-/);
  assert.match(read("components/loadboard/LoadResultsTable.js"), /max-h-\[min\(34rem,58dvh\)\]/);
  assert.match(read("components/tracking/TrackingComms.js"), /h-\[clamp\(20rem,52dvh,28rem\)\]/);
});

test("card grids follow the available width, not fixed column counts", () => {
  for (const f of ["components/dispatcher/TruckList.js", "components/dispatcher/DriverList.js"]) {
    assert.match(read(f), /grid-cols-\[repeat\(auto-fill,minmax\(min\(100%,16\.5rem\),1fr\)\)\]/, f);
  }
});

test("the liquid border survives the compact bands (lighter glow and glass, never removed)", () => {
  const compact = section.slice(section.indexOf("@media (max-width: 1365px)"), section.indexOf("@media (max-width: 1199px)"));
  assert.match(compact, /--app-border-glow: 0\.1/);
  assert.match(compact, /backdrop-filter: blur\(8px\)/);
  assert.ok(!/liquid-border[^}]*animation: none/.test(section), "no band turns the animation off");
});
