import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const globalsPath = path.join(projectRoot, "app", "globals.css");
const googleFontsImport = /^@import url\(['"]https:\/\/fonts\.googleapis\.com\/css2\?[^\n]+\);\r?\n?/m;

const source = await readFile(globalsPath, "utf8");
const optimized = source.replace(googleFontsImport, "");

if (optimized !== source) {
  await writeFile(globalsPath, optimized, "utf8");
  console.log("[fonts] Google Fonts externo removido; next/font será utilizado.");
} else {
  console.log("[fonts] globals.css já está preparado para next/font.");
}
