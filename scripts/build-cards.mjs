import { execSync } from "node:child_process";
import process from "node:process";
import { parseArgs, getMonth } from "./cli.mjs";

function usageAndExit() {
  console.error("Usage:\n  node scripts/build-cards.mjs --month YYYY-MM");
  process.exit(2);
}

const { flags } = parseArgs(process.argv.slice(2));
if (flags.help) usageAndExit();

const month = getMonth(flags);

run(`node scripts/md2cards.mjs --month ${month}`);
run(`node scripts/cards2png.mjs --month ${month}`);
run(`node scripts/md2html.mjs --month ${month}`);

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}
