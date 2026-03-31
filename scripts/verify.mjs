import fs from "node:fs";
import process from "node:process";
import { parseArgs, getMonth, defaultInput } from "./cli.mjs";

function usageAndExit() {
  console.error(
    "Usage:\n  node scripts/verify.mjs <input.md>\n  node scripts/verify.mjs --month YYYY-MM\n  node scripts/verify.mjs --month YYYY-MM --strict"
  );
  process.exit(2);
}

const { flags, positionals } = parseArgs(process.argv.slice(2));
if (flags.help) usageAndExit();
const strict = Boolean(flags.strict);

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

const bodyForLinkCheck = body.replace(/<!--CARD[\s\S]*?-->/g, "");
const markdownLinkMatches = [...bodyForLinkCheck.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];
const disallowedMarkdownLinks = markdownLinkMatches.filter(
  (m) => !(m[2] || "").trim().startsWith("#")
);
const malformedUrls = [...bodyUrls, ...refUrls].filter((u) =>
  /["'`}\]]$/.test(u)
);

if (disallowedMarkdownLinks.length) {
  console.error(
    "본문에 허용되지 않는 Markdown 링크가 발견되었습니다. 내부 앵커 링크(#...)만 허용됩니다."
  );
  for (const hit of disallowedMarkdownLinks.slice(0, 5)) {
    console.error(`  - ${hit[0]}`);
  }
  if (disallowedMarkdownLinks.length > 5) {
    console.error(`  ... and ${disallowedMarkdownLinks.length - 5} more`);
  }
  process.exit(1);
}

if (strict && malformedUrls.length) {
  console.error("끝 문자가 비정상인 URL이 발견되었습니다:");
  for (const u of malformedUrls) console.error(`  - ${u}`);
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

if (strict) {
  const targets = [...new Set([...bodyUrls, ...refUrls])];
  const dead = await findDeadLinks(targets);
  if (dead.length) {
    console.error("접속 실패(>=400) URL이 발견되었습니다:");
    for (const d of dead) console.error(`  - [${d.status}] ${d.url}`);
    process.exit(1);
  }
}

console.log("OK: URL 목록이 본문과 참고자료에 일치합니다.");
if (strict) console.log("OK: URL 실접속 검증도 통과했습니다.");

function indexOfRefs(s) {
  const candidates = [
    s.indexOf("# (5) 참고자료"),
    s.indexOf("# (6) 참고자료"),
    s.indexOf("# (7) 참고자료"),
  ].filter((i) => i !== -1);
  return candidates.length ? Math.min(...candidates) : -1;
}

function extractUrls(s) {
  // Stop before JSON quotes, template/backticks, escaped newlines, and closing brackets.
  const re = /https?:\/\/[^\s)"'`\\\]}]+/g;
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

async function findDeadLinks(urls) {
  const out = [];
  for (const url of urls) {
    try {
      // HEAD를 우선 시도하고, 차단되는 경우 GET으로 재시도합니다.
      let res = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (res.status === 405 || res.status === 403) {
        res = await fetch(url, { method: "GET", redirect: "follow" });
      }
      if (res.status >= 400) out.push({ url, status: res.status });
    } catch {
      out.push({ url, status: "ERR" });
    }
  }
  return out;
}
