import fs from "node:fs";
import { parseArgs, getMonth, defaultInput } from "./cli.mjs";

function usageAndExit() {
  console.error(
    "Usage:\n  node scripts/split-md.mjs <input.md>\n  node scripts/split-md.mjs --month YYYY-MM"
  );
  process.exit(2);
}

const { flags, positionals } = parseArgs(process.argv.slice(2));
if (flags.help) usageAndExit();

const month = getMonth(flags);
const input = flags.input ?? positionals[0] ?? defaultInput(month);
if (!input) usageAndExit();
if (!fs.existsSync(input)) {
  console.error(`Input file not found: ${input}`);
  process.exit(1);
}

const md = fs.readFileSync(input, "utf8");

// We split by top-level numbered headings used in this repo.
const idxNode = md.indexOf("# (2) Node.js");
const idxJava = md.indexOf("# (3) Java");
const idxCommon = md.indexOf("# (4) 공통 트렌드/권장사항");
const idxRefs6 = md.indexOf("# (6) 참고자료");
const idxRefs7 = md.indexOf("# (7) 참고자료");
const idxRefs = idxRefs6 !== -1 ? idxRefs6 : idxRefs7;

if (idxNode === -1 || idxJava === -1 || idxRefs === -1) {
  console.error(
    "Expected headings not found: # (2) Node.js, # (3) Java, # (6) 참고자료 or # (7) 참고자료"
  );
  process.exit(1);
}

const header = md.slice(0, idxNode);
const nodeSection = md.slice(idxNode, idxJava);
const javaSection = idxCommon !== -1 ? md.slice(idxJava, idxCommon) : md.slice(idxJava, idxRefs);

// Create slim docs: Header + Summary/Checklist/Rules + one language section + References.
const nodeDoc = header + nodeSection;
const javaDoc = header + javaSection;

writeWithRefs(`devsecnews-${month}-node.md`, nodeDoc);
writeWithRefs(`devsecnews-${month}-java.md`, javaDoc);

console.log(`wrote: devsecnews-${month}-node.md`);
console.log(`wrote: devsecnews-${month}-java.md`);

function writeWithRefs(outFile, contentWithoutRefs) {
  const urls = extractUrls(contentWithoutRefs);
  const refs = formatRefs(urls);

  const out = stripExistingRefs(contentWithoutRefs).trimEnd() + "\n\n" + refs + "\n";
  fs.writeFileSync(outFile, out, "utf8");
}

function stripExistingRefs(s) {
  const i6 = s.indexOf("# (6) 참고자료");
  const i7 = s.indexOf("# (7) 참고자료");
  const i = i6 !== -1 ? i6 : i7;
  if (i === -1) return s;
  return s.slice(0, i);
}

function extractUrls(s) {
  // Keep URLs as-is; we only de-dupe exact strings.
  const re = /https?:\/\/[^\s)]+/g;
  const found = s.match(re) ?? [];
  const uniq = [];
  const seen = new Set();
  for (const u of found) {
    if (!seen.has(u)) {
      seen.add(u);
      uniq.push(u);
    }
  }
  return uniq;
}

function formatRefs(urls) {
  const lines = ["# (7) 참고자료", ""];
  for (const u of urls) lines.push(`- ${u}`);
  return lines.join("\n");
}
