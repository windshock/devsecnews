import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { marked } from "marked";

function usageAndExit() {
  console.error(
    "Usage:\n  node scripts/md2cards.mjs <input.md> [outDir]\n\nExamples:\n  node scripts/md2cards.mjs devsecnews-2026-01-node-java.md\n  node scripts/md2cards.mjs in.md cards/out"
  );
  process.exit(2);
}

const input = process.argv[2] ?? "devsecnews-2026-01-node-java.md";
if (!input.endsWith(".md")) usageAndExit();
if (!fs.existsSync(input)) {
  console.error(`Input file not found: ${input}`);
  process.exit(1);
}

const baseName = path.basename(input, path.extname(input));
const outDir = process.argv[3] ?? path.join("cards", baseName);
fs.mkdirSync(outDir, { recursive: true });

const md = fs.readFileSync(input, "utf8");
const titleLine = (md.match(/^#\s.+/m)?.[0] ?? "# DevSecNews").replace(/^#\s*/, "");

const summaryMd = extractTopSection(md, "# (1) Summary");
const checklistMd = extractTopSection(md, "# (5) 이번 달 개발자 체크리스트");
const rulesMd = extractTopSection(md, "# (6) 패턴→팀 규칙(5)");

const summaryItems = parseBullets(summaryMd);
const checklistItems = parseNumbered(checklistMd);
const rulesItems = parseNumbered(rulesMd);

const cards = [];

// Summary: 1 bullet per card.
for (let i = 0; i < summaryItems.length; i++) {
  const { body, source } = splitSource(summaryItems[i]);
  cards.push({
    kind: "summary",
    header: "요약",
    title: `Summary ${i + 1}/${summaryItems.length}`,
    bodyMd: body,
    source,
  });
}

// Checklist: group 4 per card (10 items -> 3 cards).
const perChecklistCard = 4;
for (let i = 0; i < checklistItems.length; i += perChecklistCard) {
  const chunk = checklistItems.slice(i, i + perChecklistCard);
  const bodies = chunk.map((t) => splitSource(t).body.trim());
  const sources = chunk.map((t) => splitSource(t).source).filter(Boolean);
  cards.push({
    kind: "checklist",
    header: "체크리스트",
    title: `Checklist ${Math.floor(i / perChecklistCard) + 1}/${Math.ceil(
      checklistItems.length / perChecklistCard
    )}`,
    bodyMd: bodies.map((b, j) => `${i + j + 1}. ${b}`).join("\n"),
    source: sources.length ? sources[0] : "",
  });
}

// Team rules: all on one card (keep short).
if (rulesItems.length) {
  cards.push({
    kind: "rules",
    header: "팀 규칙",
    title: "패턴→팀 규칙(5)",
    bodyMd: rulesItems.map((t, i) => `${i + 1}. ${t.trim()}`).join("\n"),
    source: "",
  });
}

const html = buildCardsHtml({
  title: titleLine,
  cards,
});

const outFile = path.join(outDir, "cards.html");
fs.writeFileSync(outFile, html, "utf8");
console.log(`wrote: ${outFile}`);
console.log(`cards: ${cards.length}`);

function extractTopSection(fullMd, headingLine) {
  const start = indexOfLine(fullMd, headingLine);
  if (start === -1) return "";
  const afterStart = fullMd.slice(start);
  const m = afterStart.match(/^#\s\(\d+\)\s.+/gm);
  if (!m || m.length <= 1) return afterStart;
  // first match is the section heading itself; take until next top-level heading
  const second = m[1];
  const end = start + afterStart.indexOf(second);
  return fullMd.slice(start, end);
}

function indexOfLine(s, line) {
  // Exact heading line match.
  const re = new RegExp("^" + escapeRegExp(line) + "\\s*$", "m");
  const m = s.match(re);
  return m ? m.index : -1;
}

function parseBullets(sectionMd) {
  const lines = sectionMd.split(/\r?\n/);
  const out = [];
  for (const ln of lines) {
    if (ln.startsWith("- ")) out.push(ln.slice(2).trim());
  }
  return out;
}

function parseNumbered(sectionMd) {
  const lines = sectionMd.split(/\r?\n/);
  const out = [];
  for (const ln of lines) {
    const m = ln.match(/^\s*\d+\.\s+(.*)\s*$/);
    if (m) out.push(m[1].trim());
  }
  return out;
}

function splitSource(text) {
  const idx = text.lastIndexOf(" [Source] ");
  if (idx === -1) return { body: text.trim(), source: "" };
  return {
    body: text.slice(0, idx).trim(),
    source: text.slice(idx + " [Source] ".length).trim(),
  };
}

function buildCardsHtml({ title, cards }) {
  const css = `
  :root { color-scheme: light; }
  body {
    margin: 0;
    background: #0b1220;
    color: #111827;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  }
  .wrap {
    padding: 24px;
    display: grid;
    gap: 18px;
    justify-content: center;
  }
  .card {
    width: 1080px;
    height: 1350px;
    background: radial-gradient(1000px 800px at 10% 10%, rgba(9,105,218,0.14), transparent 60%),
                radial-gradient(900px 700px at 90% 20%, rgba(34,197,94,0.10), transparent 55%),
                #ffffff;
    border-radius: 28px;
    border: 1px solid rgba(31,35,40,0.12);
    box-shadow: 0 18px 60px rgba(0,0,0,0.35);
    overflow: hidden;
    position: relative;
  }
  .top {
    padding: 48px 56px 18px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 18px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 999px;
    background: rgba(9,105,218,0.10);
    border: 1px solid rgba(9,105,218,0.22);
    color: #0b3d91;
    font-weight: 700;
    font-size: 18px;
  }
  .meta {
    text-align: right;
    color: rgba(31,35,40,0.72);
    font-size: 18px;
    line-height: 1.3;
  }
  .title {
    padding: 0 56px;
    font-size: 40px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #0f172a;
  }
  .body {
    padding: 26px 56px 0;
    font-size: 30px;
    line-height: 1.48;
    color: #111827;
  }
  .body p { margin: 0 0 14px; }
  .body li { margin: 0 0 10px; }
  .body ul, .body ol { margin: 10px 0 0 1.2em; }
  .body code { background: rgba(31,35,40,0.06); padding: 2px 6px; border-radius: 8px; }
  .foot {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 22px 56px 28px;
    background: linear-gradient(to top, rgba(255,255,255,0.98), rgba(255,255,255,0.75), transparent);
  }
  .source {
    font-size: 18px;
    color: rgba(31,35,40,0.75);
    margin-top: 14px;
    word-break: break-all;
  }
  .hr {
    height: 1px;
    background: rgba(31,35,40,0.10);
    margin: 10px 0 12px;
  }
  `;

  const cardsHtml = cards
    .map((c, i) => {
      const bodyHtml = marked.parse(c.bodyMd || "");
      const srcHtml = c.source
        ? `<div class="hr"></div><div class="source">[Source] ${escapeHtml(
            c.source
          )}</div>`
        : "";
      return `
<section class="card" data-card-idx="${i + 1}">
  <div class="top">
    <div class="badge">${escapeHtml(c.header)}</div>
    <div class="meta">${escapeHtml(title)}<br/>${escapeHtml(c.title)}</div>
  </div>
  <div class="title">${escapeHtml(c.kind === "summary" ? "이번 달 핵심" : c.header)}</div>
  <div class="body">${bodyHtml}</div>
  <div class="foot">${srcHtml}</div>
</section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} cards</title>
    <style>${css}</style>
  </head>
  <body>
    <main class="wrap">
${cardsHtml}
    </main>
  </body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

