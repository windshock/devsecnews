import fs from "node:fs";
import process from "node:process";
import { parseArgs, getMonth, defaultInput } from "./cli.mjs";

function usageAndExit() {
  console.error(
    "Usage:\n  node scripts/verify.mjs <input.md>\n  node scripts/verify.mjs --month YYYY-MM"
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
const refsIdx = indexOfRefs(md);
if (refsIdx === -1) {
  console.error("참고자료 섹션을 찾지 못했습니다. (# (6) 참고자료 또는 # (7) 참고자료)");
  process.exit(1);
}

const body = md.slice(0, refsIdx);
const refs = md.slice(refsIdx);

const bodyUrls = new Set(extractUrls(body));
const refUrls = new Set(extractUrlsFromRefs(refs));

const missingInRefs = [...bodyUrls].filter((u) => !refUrls.has(u));
const missingInBody = [...refUrls].filter((u) => !bodyUrls.has(u));

const markdownLinkHits = body.match(/\[[^\]]+\]\([^\)]+\)/g) ?? [];

if (markdownLinkHits.length) {
  console.error("본문에 Markdown 링크 형식이 발견되었습니다. URL은 문자열로만 넣어야 합니다.");
  for (const hit of markdownLinkHits.slice(0, 5)) {
    console.error(`  - ${hit}`);
  }
  if (markdownLinkHits.length > 5) {
    console.error(`  ... and ${markdownLinkHits.length - 5} more`);
  }
  process.exit(1);
}

if (missingInRefs.length || missingInBody.length) {
  if (missingInRefs.length) {
    console.error("참고자료에 없는 URL (본문에만 존재):");
    for (const u of missingInRefs) console.error(`  - ${u}`);
  }
  if (missingInBody.length) {
    console.error("본문에 없는 URL (참고자료에만 존재):");
    for (const u of missingInBody) console.error(`  - ${u}`);
  }
  process.exit(1);
}

console.log("OK: URL 목록이 본문과 참고자료에 일치합니다.");

function indexOfRefs(s) {
  const i6 = s.indexOf("# (6) 참고자료");
  const i7 = s.indexOf("# (7) 참고자료");
  if (i6 === -1) return i7;
  if (i7 === -1) return i6;
  return Math.min(i6, i7);
}

function extractUrls(s) {
  const re = /https?:\/\/[^\s)]+/g;
  return s.match(re) ?? [];
}

function extractUrlsFromRefs(s) {
  const lines = s.split(/\r?\n/);
  const out = [];
  for (const ln of lines) {
    const t = ln.trim();
    if (!t.startsWith("- ")) continue;
    const url = t.slice(2).trim();
    if (!url) continue;
    out.push(url);
  }
  return out;
}
