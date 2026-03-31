import { execSync } from "node:child_process";
import process from "node:process";
import { parseArgs, getMonth } from "./cli.mjs";

function usageAndExit() {
  console.error(
    "Usage:\n  node scripts/build-cards.mjs --month YYYY-MM [--strict] [--no-rewrite-copy] [--no-rewrite-report]"
  );
  process.exit(2);
}

const { flags } = parseArgs(process.argv.slice(2));
if (flags.help) usageAndExit();

const month = getMonth(flags);

const strictFlag = flags.strict ? " --strict" : "";
const rewriteCopyEnabled = !flags["no-rewrite-copy"];
const rewriteCopyArgs = rewriteCopyEnabled
  ? " --rewrite-copy --copy-attempts 3"
  : "";
const rewriteReportEnabled = !flags["no-rewrite-report"];
const rewriteReportArgs = rewriteReportEnabled
  ? " --rewrite-report --report-attempts 1"
  : "";
run(`node scripts/verify.mjs --month ${month}${strictFlag}`);
run(`node scripts/md2cards.mjs --month ${month}${rewriteCopyArgs}`);
// PNG generation disabled — card HTML is the primary deliverable.
// run(`node scripts/cards2png.mjs --month ${month}`);
run(`node scripts/md2html.mjs --month ${month}${rewriteReportArgs}`);

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}
