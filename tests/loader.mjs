import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");

function withExtension(file) {
  for (const candidate of [file, `${file}.js`, path.join(file, "index.js")]) {
    if (existsSync(candidate) && !candidate.endsWith(path.sep)) {
      try {
        readFileSync(candidate);
        return candidate;
      } catch {
        // a directory: try the next candidate
      }
    }
  }
  return null;
}

export async function resolve(specifier, context, next) {
  let file = null;
  if (specifier.startsWith("@/")) file = withExtension(path.join(SRC, specifier.slice(2)));
  else if (specifier.startsWith(".") && context.parentURL?.startsWith(pathToFileURL(SRC).href)) file = withExtension(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier));
  if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.startsWith(pathToFileURL(SRC).href) && url.endsWith(".js")) {
    return { format: "module", source: readFileSync(fileURLToPath(url), "utf8"), shortCircuit: true };
  }
  return next(url, context);
}
