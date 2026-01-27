import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";
import { parseArgs, getMonth, defaultBaseName, defaultHtml } from "./cli.mjs";

function usageAndExit() {
  console.error("Usage:\n  node scripts/deploy.mjs --month YYYY-MM");
  process.exit(2);
}

const { flags } = parseArgs(process.argv.slice(2));
if (flags.help) usageAndExit();

const month = getMonth(flags);
const baseName = defaultBaseName(month);

run(`node scripts/build-cards.mjs --month ${month}`);

const docsDir = path.join("docs");
const cardsSrc = path.join("cards", baseName);
const cardsDest = path.join(docsDir, "cards", baseName);
const htmlSrc = defaultHtml(month);
const htmlDest = path.join(docsDir, `${baseName}.html`);

if (!fs.existsSync(htmlSrc)) {
  console.error(`Missing HTML output: ${htmlSrc}`);
  process.exit(1);
}
if (!fs.existsSync(cardsSrc)) {
  console.error(`Missing cards output dir: ${cardsSrc}`);
  process.exit(1);
}

fs.mkdirSync(path.join(docsDir, "cards"), { recursive: true });
fs.copyFileSync(htmlSrc, htmlDest);
copyDir(cardsSrc, cardsDest);

console.log(`copied: ${htmlSrc} -> ${htmlDest}`);
console.log(`copied: ${cardsSrc} -> ${cardsDest}`);

run(`node scripts/gen-site.mjs --month ${month}`);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    const from = path.join(src, e.name);
    const to = path.join(dest, e.name);
    if (e.isDirectory()) {
      copyDir(from, to);
    } else if (e.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}
