import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { parseArgs, getMonth, defaultCardsHtml } from "./cli.mjs";

function usageAndExit() {
  console.error(
    "Usage:\n  node scripts/cards2png.mjs <cards.html> [outDir]\n  node scripts/cards2png.mjs --month YYYY-MM\n\nExample:\n  node scripts/cards2png.mjs cards/devsecnews-2026-01-node-java/cards.html\n  node scripts/cards2png.mjs --month 2026-01"
  );
  process.exit(2);
}

const { flags, positionals } = parseArgs(process.argv.slice(2));
if (flags.help) usageAndExit();

const month = getMonth(flags);
const inputHtml = flags.input ?? positionals[0] ?? defaultCardsHtml(month);
if (!inputHtml) usageAndExit();
if (!fs.existsSync(inputHtml)) {
  console.error(`Input file not found: ${inputHtml}`);
  process.exit(1);
}

const outDir = flags.outDir ?? positionals[1] ?? path.dirname(inputHtml);
fs.mkdirSync(outDir, { recursive: true });

let chromium;
try {
  // Lazy import so the repo can be used without installing Playwright.
  ({ chromium } = await import("playwright"));
} catch (e) {
  console.error(
    "Playwright is not installed.\n\nInstall:\n  npm i -D playwright\n\nThen run:\n  node scripts/cards2png.mjs " +
      inputHtml
  );
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1120, height: 1400 },
  deviceScaleFactor: 2,
});

// Force export mode so layout stays fixed at 1080x1350 for consistent PNG.
const url = pathToFileURL(path.resolve(inputHtml)).toString() + "?export=1";
await page.goto(url, { waitUntil: "load" });

// Ensure fonts/layout settle.
await page.waitForTimeout(250);

const cards = await page.$$(".card");
if (!cards.length) {
  console.error("No .card elements found. Did you generate cards HTML?");
  await browser.close();
  process.exit(1);
}

for (let i = 0; i < cards.length; i++) {
  const n = String(i + 1).padStart(2, "0");
  const out = path.join(outDir, `card-${n}.png`);
  await cards[i].screenshot({ path: out });
  console.log("wrote:", out);
}

await browser.close();
