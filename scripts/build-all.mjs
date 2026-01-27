import { execSync } from "node:child_process";
import process from "node:process";
import { parseArgs, getMonth, defaultSplitMd } from "./cli.mjs";

function usageAndExit() {
  console.error("Usage:\n  node scripts/build-all.mjs --month YYYY-MM");
  process.exit(2);
}

const { flags } = parseArgs(process.argv.slice(2));
if (flags.help) usageAndExit();

const month = getMonth(flags);
const nodeMd = defaultSplitMd(month, "node");
const javaMd = defaultSplitMd(month, "java");

run(`node scripts/split-md.mjs --month ${month}`);
run(`node scripts/md2html.mjs --month ${month}`);
run(`node scripts/md2html.mjs ${nodeMd}`);
run(`node scripts/md2html.mjs ${javaMd}`);

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}
