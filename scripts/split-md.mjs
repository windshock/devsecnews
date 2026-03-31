import fs from "node:fs";
import path from "node:path";
import { parseArgs, getMonth, defaultInput, defaultSplitMd, CONTENT_DIR } from "./cli.mjs";

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
fs.mkdirSync(CONTENT_DIR, { recursive: true });

// Keyword-based heading search for resilience against section number changes.
const idxNode = md.search(/^# \(\d+\) Node\.js/m);
const idxJava = md.search(/^# \(\d+\) Java/m);
const idxCommon = md.search(/^# \(\d+\) 공통 트렌드/m);
const idxRefs = md.search(/^# \(\d+\) 참고자료/m);

if (idxNode === -1 || idxJava === -1 || idxRefs === -1) {
  console.error(
    "Expected headings not found: # (N) Node.js, # (N) Java, # (N) 참고자료"
  );
  process.exit(1);
}

const header = md.slice(0, idxNode);
const nodeSection = md.slice(idxNode, idxJava);
const javaSection = idxCommon !== -1
  ? md.slice(idxJava, idxCommon)
  : md.slice(idxJava, idxRefs);
const commonSection = idxCommon !== -1
  ? md.slice(idxCommon, idxRefs)
  : "";

// Filter header (Summary/Checklist/CARD blocks) by platform domain.
function filterHeaderByDomain(rawHeader, keepDomain) {
  const lines = rawHeader.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Filter CARD blocks by domain field
    if (line.trim().startsWith("<!--CARD")) {
      const cardLines = [line];
      let j = i + 1;
      while (j < lines.length && !lines[j].includes("-->")) {
        cardLines.push(lines[j]);
        j++;
      }
      if (j < lines.length) cardLines.push(lines[j]);
      const cardBlock = cardLines.join("\n");
      const domainMatch = cardBlock.match(/"domain"\s*:\s*"([^"]+)"/);
      const domain = domainMatch ? domainMatch[1] : "common";
      if (domain === keepDomain || domain === "common") {
        out.push(...cardLines);
      }
      i = j + 1;
      continue;
    }
    out.push(line);
    i++;
  }
  return out.join("\n");
}

// Filter numbered list items in Summary TOP 5 and Checklist by platform context.
function filterListItems(text, keepDomain) {
  const nodeKeywords = /\b(npm|node-forge|handlebars|picomatch)\b/i;
  const javaKeywords = /\b(mvn|spring-security-web|spring-boot-starter-actuator|netty-codec-http|zookeeper|spring)\b/i;

  const lines = text.split("\n");
  const out = [];
  let inSummaryOrChecklist = false;
  let skipUntilNextNumbered = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Summary or Checklist sections
    if (/^#.*Summary|^#.*핵심 뉴스|^#.*체크리스트|^##.*바로 할 일/.test(line)) {
      inSummaryOrChecklist = true;
      skipUntilNextNumbered = false;
      out.push(line);
      continue;
    }
    if (/^#\s/.test(line) && !line.includes("Summary") && !line.includes("체크리스트")) {
      inSummaryOrChecklist = false;
      skipUntilNextNumbered = false;
    }

    if (inSummaryOrChecklist) {
      const isNumbered = /^\d+\.\s/.test(line.trim());
      if (isNumbered) {
        const isNode = nodeKeywords.test(line);
        const isJava = javaKeywords.test(line);
        if (keepDomain === "node" && isJava && !isNode) {
          skipUntilNextNumbered = true;
          continue;
        }
        if (keepDomain === "java" && isNode && !isJava) {
          skipUntilNextNumbered = true;
          continue;
        }
        skipUntilNextNumbered = false;
      } else if (skipUntilNextNumbered) {
        // Skip continuation lines (e.g. [Source] lines after a filtered item)
        if (line.trim() === "" || /^\[Source\]/.test(line.trim())) continue;
        skipUntilNextNumbered = false;
      }
    }

    out.push(line);
  }
  return out.join("\n");
}

// Rewrite platform-specific header (title line)
function rewriteHeader(text, platform) {
  const label = platform === "node" ? "Node.js" : "Java";
  return text.replace(
    /^(# DevSecNews \d{4}-\d{2} —) .+$/m,
    `$1 ${label} 보안 요약(개발자용)`
  );
}

// Renumber sections sequentially: (1), (2), (3), ...
function renumberSections(text) {
  let counter = 0;
  return text.replace(/^# \((\d+)\)/gm, () => {
    counter++;
    return `# (${counter})`;
  });
}

// Build split documents
function buildSplitDoc(platform) {
  let filteredHeader = filterHeaderByDomain(header, platform);
  filteredHeader = filterListItems(filteredHeader, platform);
  filteredHeader = rewriteHeader(filteredHeader, platform);

  const platformSection = platform === "node" ? nodeSection : javaSection;
  let doc = filteredHeader + platformSection;

  // Include common trends section for both platforms
  if (commonSection) {
    doc += commonSection;
  }

  return doc;
}

const nodeDoc = buildSplitDoc("node");
const javaDoc = buildSplitDoc("java");

const nodeOut = defaultSplitMd(month, "node");
const javaOut = defaultSplitMd(month, "java");
writeWithRefs(nodeOut, nodeDoc);
writeWithRefs(javaOut, javaDoc);

console.log(`wrote: ${nodeOut}`);
console.log(`wrote: ${javaOut}`);

function writeWithRefs(outFile, contentWithoutRefs) {
  const urls = extractUrls(contentWithoutRefs);
  const refs = formatRefs(urls);

  let out = stripExistingRefs(contentWithoutRefs).trimEnd() + "\n\n" + refs + "\n";
  out = renumberSections(out);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, out, "utf8");
}

function stripExistingRefs(s) {
  const idx = s.search(/^# \(\d+\) 참고자료/m);
  if (idx === -1) return s;
  return s.slice(0, idx);
}

function extractUrls(s) {
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
