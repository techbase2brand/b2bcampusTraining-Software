// The visual design system: tokens, liquid-metal border, glass, ambient background, motion budget and
// reduced-motion support. Source-level checks (the look itself needs a browser).

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const read = (f) => readFileSync(path.join(SRC, f), "utf8");
const css = read("app/globals.css");
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));
const components = walk(path.join(SRC, "components")).filter((f) => f.endsWith(".js"));

test("design tokens are centralised", () => {
  for (const token of ["--glass-bg", "--glass-border", "--cyan-glow", "--metal-silver", "--metal-cyan", "--metal-violet", "--metal-gold", "--animation-fast", "--animation-normal", "--liquid-speed", "--liquid-stops"]) {
    assert.ok(css.includes(`${token}:`), token);
  }
});

test("liquid border: registered angle, masked conic ring, one shared keyframe, 4-8s, presets", () => {
  assert.match(css, /@property --liquid-angle \{[^}]*syntax: "<angle>"[^}]*inherits: false/);
  assert.match(css, /conic-gradient\(\s*from var\(--liquid-angle\)/);
  assert.match(css, /mask-composite: exclude/);
  assert.match(css, /-webkit-mask-composite: xor/);
  assert.match(css, /@keyframes liquid-spin \{\s*to \{ --liquid-angle: 360deg; \}/);
  assert.match(css, /animation: liquid-spin var\(--liquid-speed\) steps\(120\) infinite/);
  const speed = Number(css.match(/--liquid-speed: (\d+)s/)[1]);
  assert.ok(speed >= 4 && speed <= 8, `speed ${speed}s should be 4 to 8`);
  assert.equal((css.match(/@keyframes liquid-spin/g) ?? []).length, 1, "one shared animation");
  for (const colour of ["216 228 255", "57 223 255", "111 124 255", "201 108 255", "246 201 107"]) assert.ok(css.includes(colour), colour);
  for (const cls of [".liquid-border-subtle", ".liquid-border-strong", ".liquid-border--still", ".liquid-border--active", ".liquid-on-focus", ".liquid-on-hover", ".liquid-delay-0", ".liquid-delay-3"]) assert.ok(css.includes(cls), cls);
  assert.match(css, /box-shadow: 0 0 12px rgb\(57 223 255/, "soft outer glow on ::after");
  assert.match(css, /pointer-events: none/);
  assert.match(css, /border-radius: inherit/);
  assert.match(css, /html\[data-liquid-test\]/, "a test mode that exaggerates the movement");
  assert.match(css, /\.glass-strong[\s\S]*backdrop-filter: var\(--glass-blur\)/);
});

test("regression: the angle is never baked into a custom property (that froze every ring at 0deg)", () => {
  const root = css.slice(css.indexOf(":root {", css.indexOf("LIQUID METAL BORDER")), css.indexOf("@property --liquid-angle"));
  assert.ok(!root.includes("var(--liquid-angle)"), "--liquid-* custom properties on :root must not reference --liquid-angle");
  assert.equal((css.match(/conic-gradient\(from var\(--liquid-angle\), var\(--liquid-stops\)\)/g) ?? []).length, 2, "ring+glow (one shared rule) and fields each apply their own angle");
});

test("the system sits in @layer components so Tailwind position utilities still win", () => {
  const layer = css.slice(css.indexOf("@layer components {"));
  assert.match(layer, /:where\(\s*\.liquid-border,/);
  assert.match(layer, /position: relative;\s*isolation: isolate/);
});

test("it applies to cards, panels, dialogs, tabs, fields and selected table rows", () => {
  for (const sel of [".panel", ".glass-strong", ".btn-liquid", '[role="dialog"]', '[role="tablist"]', '[aria-current="page"]', '[class~="app-border"]', '[class*="rounded-2xl"]']) assert.ok(css.includes(sel), sel);
  assert.match(css, /textarea,\s*select\s*\):not\(\.bg-transparent, \.border-0/, "form fields use the border-box gradient");
  assert.match(css, /tr\[aria-selected="true"\] > td/, "only the selected row of a table");
  const layerCss = css.slice(css.indexOf("@layer components {"), css.indexOf("Form fields"));
  assert.ok(!/(^|\s)(td|tr)\s*[,{]|\[class\*="rounded-md"\]/.test(layerCss), "no ring on every cell / row / chip");
});

test("reduced motion keeps the static metallic border; mobile only drops the extra glow", () => {
  const block = css.slice(css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(block, /animation-name: none/);
  assert.ok(!/display: none/.test(block) && !/border: none|--liquid-ring: none/.test(block), "the border itself is never removed");
  const universal = css.slice(css.indexOf("animation-duration: 0.01ms !important"));
  for (const sel of [".game-backdrop::before", ".game-backdrop::after", ".status-pulse", ".route-sheen::after", ".neural-line"]) assert.ok(universal.includes(sel), sel);
  const mobile = css.slice(css.indexOf("@media (max-width: 640px)"), css.indexOf("@media (prefers-reduced-motion", css.indexOf("@media (max-width: 640px)")));
  assert.match(mobile, /\.game-backdrop::after \{ display: none/);
  assert.ok(!/liquid-border::before[^}]*animation: none/.test(mobile), "the ring keeps moving on phones");
});

test("ambient background is layered and pointer-safe", () => {
  assert.match(css, /\.game-backdrop::before[\s\S]*pointer-events: none[\s\S]*animation: aurora/);
  assert.match(css, /\.game-backdrop::after[\s\S]*pointer-events: none[\s\S]*animation: drift/);
  assert.match(css, /\.game-backdrop \{\s*position: relative;\s*isolation: isolate/);
  assert.match(css, /@keyframes aurora \{[\s\S]*?translate3d/);
});

test("primary buttons are strong liquid, ghost buttons subtle; chrome and popups carry the ring", () => {
  const btn = read("components/game/GameButton.js");
  assert.match(btn, /primary: "btn-liquid"/);
  assert.match(btn, /"liquid-border liquid-border-strong"/);
  assert.match(btn, /"liquid-border liquid-border-subtle"/);
  assert.match(read("components/game/GameSidebar.js"), /liquid-border liquid-on-hover/);
  assert.match(read("components/game/StatBadge.js"), /liquid-border liquid-border-subtle/);
  assert.match(read("components/game/ProfileMenu.js"), /glass-strong liquid-border liquid-border-strong/);
  assert.match(read("components/game/GameModal.js"), /glass-strong liquid-border liquid-border-strong/);
  assert.match(read("components/dispatcher/DispatcherLayout.js"), /liquid-border liquid-border-subtle m-3/);
});

test("the ring never sits on a scrolling element (it would scroll away)", () => {
  for (const f of components) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/className="([^"]*liquid-border[^"]*)"/g)) {
      assert.ok(!/overflow-(y-|x-)?auto/.test(m[1]), `${path.basename(f)}: ${m[1]}`);
    }
  }
});

test("motion primitives exist and are wired to the right surfaces", () => {
  for (const cls of [".page-in", ".modal-in", ".drawer-in", ".backdrop-in", ".msg-in", ".bubble-me", ".bubble-them", ".check-pop", ".success-sweep", ".star-in", ".status-pulse", ".route-sheen", ".glow-card"]) assert.ok(css.includes(cls), cls);
  assert.match(css, /\[role="tab"\]\[aria-selected="true"\]/, "one tab style for every tab control");
  assert.match(css, /input:focus-visible[\s\S]*outline: none[\s\S]*box-shadow/, "visible, accessible focus edge");
  assert.match(read("components/game/GameModal.js"), /modal-in glass-strong liquid-border/);
  assert.match(read("components/game/GameDrawer.js"), /drawer-in glass-strong/);
  assert.match(read("components/dispatcher/DispatcherLayout.js"), /page-in/);
  for (const f of ["components/brokers/BrokerChat.js", "components/dispatch/DriverCommsPanel.js", "components/tracking/TrackingComms.js"]) {
    const src = read(f);
    assert.match(src, /msg-in flex/, f);
    assert.match(src, /bubble-me/, f);
    assert.match(src, /liquid-on-focus/, f);
  }
  const journey = read("components/tracking/JourneyCard.js");
  assert.match(journey, /m\.clock\?\.moving \? "route-sheen"/, "the route glows only while the truck really moves");
  assert.match(journey, /status-pulse/);
  assert.match(read("components/training/PhaseComplete.js"), /star-in/);
});

test("loading visual is used only for the real redirect state", () => {
  const users = components.filter((f) => /NeuralLoader/.test(readFileSync(f, "utf8"))).map((f) => path.basename(f)).sort();
  assert.deepEqual(users, ["LegacyRouteRedirect.js", "NeuralLoader.js"]);
  assert.ok(!/setTimeout/.test(read("components/game/NeuralLoader.js")), "no fake delay");
});

test("one global border system: tokens in :root, app-border classes, no per-component widths or colours", () => {
  for (const token of ["--app-border-width", "--app-border-opacity", "--app-border-glow", "--app-border-color", "--app-border-color-subtle", "--app-border-color-active", "--app-border-color-success", "--app-border-color-warning", "--app-border-color-error"]) {
    assert.ok(css.includes(`${token}:`), token);
  }
  for (const cls of [".app-border", ".app-border-subtle", ".app-border-active", ".app-border-success", ".app-border-warning", ".app-border-error", ".app-border-liquid"]) assert.ok(css.includes(cls), cls);
  assert.match(css, /border-width: var\(--app-border-width\)/);
  // every ring and glow derives from the same tokens, so one edit rescales them all
  assert.match(css, /--liquid-width: calc\(var\(--app-border-width\) \* 2\)/);
  assert.match(css, /--liquid-glow: var\(--app-border-glow\)/);
  assert.ok(!/--liquid-width: \d/.test(css), "no literal ring width");
  assert.ok(!/border: 1(\.5)?px solid (?!transparent)/.test(css.slice(css.indexOf("DESIGN SYSTEM"))), "no hardcoded border widths in the design system");
  // components: plain borders use app-border; only dividers, dashed placeholders and special widths keep Tailwind
  for (const f of components) {
    const lines = readFileSync(f, "utf8").split("\n");
    lines.forEach((line, n) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line) || !/rounded-|\bbg-|\bpx-|\bp-\d/.test(line)) return;
      const where = `${path.basename(f)}:${n + 1}`;
      assert.ok(!/(?<![\w:\-/[])border(?![\w\-/\]])/.test(line), `${where} has a bare "border" class`);
      const fullColour = /(?<![\w:\-/[])border-(line|cyan|gold|success|danger)(\/\d+)?(?![\w\-/\]])/.test(line);
      const divider = /(?<![\w:])border-(b|t|l|r|x|y)(?![\w])/.test(line);
      assert.ok(!fullColour || divider, `${where} has a full-border colour class`);
    });
  }
});
