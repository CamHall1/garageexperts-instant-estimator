import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderAllEmails } from "../emails/src/templates";

const distDir = path.resolve(__dirname, "../emails/dist");
mkdirSync(distDir, { recursive: true });

for (const { filename, html } of renderAllEmails()) {
  writeFileSync(path.join(distDir, filename), html, "utf8");
  console.log(`Wrote emails/dist/${filename}`);
}
