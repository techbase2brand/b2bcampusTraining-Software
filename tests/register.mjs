// Lets `node --test` import the app's pure logic (src/lib, src/data) without a bundler:
// resolves the "@/" alias, extensionless imports, and treats src/*.js as ES modules.
import { register } from "node:module";
register("./loader.mjs", import.meta.url);
