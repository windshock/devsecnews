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

// Prefer explicit CARD meta blocks if present (stable, card-news friendly).
const metaCards = parseCardMetaBlocks(md);

const summaryMd = extractTopSection(md, "# (1) Summary");
const checklistMd = extractTopSection(md, "# (5) 이번 달 개발자 체크리스트");
const rulesMd = extractTopSection(md, "# (6) 패턴→팀 규칙(5)");

const summaryItems = parseBullets(summaryMd);
const checklistItems = parseNumbered(checklistMd);
const rulesItems = parseNumbered(rulesMd);

const cards = [];

if (metaCards.length) {
  for (const c of metaCards) {
    cards.push({
      kind: c.kind,
      header: c.header,
      title: c.title,
      bodyMd: c.bodyMd,
      whyMd: c.whyMd,
      impactMd: c.impactMd,
      actionMd: c.actionMd,
      source: c.source,
    });
  }
} else {
// Summary: 1 bullet per card.
for (let i = 0; i < summaryItems.length; i++) {
  const { body, source } = splitSource(summaryItems[i]);
  const { summary, action } = splitActionSentence(body);
  cards.push({
    kind: "summary",
    header: "요약",
    title: `Summary ${i + 1}/${summaryItems.length}`,
    bodyMd: summary,
    actionMd: action,
    source,
  });
}

// Checklist: group 4 per card (10 items -> 3 cards).
const perChecklistCard = 10;
for (let i = 0; i < checklistItems.length; i += perChecklistCard) {
  const chunk = checklistItems.slice(i, i + perChecklistCard);
  const bodies = chunk.map((t) => splitSource(t).body.trim());
  const sources = chunk.map((t) => splitSource(t).source).filter(Boolean);
  cards.push({
    kind: "checklist",
    header: "체크리스트",
    title: "이번 달 개발자 체크리스트(10)",
    bodyMd: bodies.map((b, j) => `${i + j + 1}. ${b}`).join("\n"),
    actionMd: "이번 카드의 항목을 완료 처리합니다.",
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
    actionMd: "팀 규칙을 PR 템플릿과 린트 규칙에 반영합니다.",
    source: "",
  });
}
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

function parseCardMetaBlocks(fullMd) {
  const out = [];
  const re = /<!--CARD\s*([\s\S]*?)-->/g;
  let m;
  while ((m = re.exec(fullMd)) !== null) {
    const raw = String(m[1] ?? "").trim();
    if (!raw) continue;
    // Support either pure JSON, or JSON wrapped with newlines/spaces.
    let obj;
    try {
      obj = JSON.parse(raw);
    } catch {
      continue;
    }
    if (!obj || typeof obj !== "object") continue;
    const kind = String(obj.kind || "").trim();
    const header = String(obj.header || "").trim();
    const title = String(obj.title || "").trim();
    const bodyMd = String(obj.bodyMd || "").trim();
    const whyMd = String(obj.whyMd || "").trim();
    const impactMd = String(obj.impactMd || "").trim();
    const actionMd = String(obj.actionMd || "").trim();
    const source = String(obj.source || "").trim();
    const id = String(obj.id || "").trim();
    if (!id || !kind || !header || !title) continue;
    out.push({ id, kind, header, title, bodyMd, whyMd, impactMd, actionMd, source });
  }
  return out;
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
  .stage {
    height: 100vh;
    display: grid;
    place-items: center;
    padding: 16px;
    box-sizing: border-box;
  }
  .nav {
    position: fixed;
    top: 14px;
    right: 14px;
    z-index: 20;
    display: inline-flex;
    gap: 8px;
    align-items: center;
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(31,35,40,0.14);
    border-radius: 999px;
    padding: 8px 10px;
    backdrop-filter: blur(10px);
  }
  .nav button {
    appearance: none;
    border: 1px solid rgba(31,35,40,0.18);
    background: #fff;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
  }
  .nav .count {
    font-size: 12px;
    color: rgba(31,35,40,0.7);
    min-width: 54px;
    text-align: center;
  }
  .card {
    width: min(1080px, calc(100vw - 32px));
    height: min(1350px, calc(100vh - 32px));
    aspect-ratio: 1080 / 1350;
    background: radial-gradient(1000px 800px at 10% 10%, rgba(9,105,218,0.14), transparent 60%),
                radial-gradient(900px 700px at 90% 20%, rgba(34,197,94,0.10), transparent 55%),
                #ffffff;
    border-radius: 28px;
    border: 1px solid rgba(31,35,40,0.12);
    box-shadow: 0 18px 60px rgba(0,0,0,0.35);
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    display: none; /* single-card view */
  }
  .card.active { display: block; }

  /* Desktop reading: use a shorter, wide card (16:9) in landscape */
  @media (min-width: 900px) and (orientation: landscape) {
    body:not(.export) .card {
      width: min(1200px, calc(100vw - 32px));
      height: min(820px, calc(100vh - 32px));
      aspect-ratio: 4 / 3;
      border-radius: 22px;
    }
    body:not(.export) .top { padding: 22px 28px 10px; }
    body:not(.export) .title { padding: 0 28px; font-size: 30px; }
    body:not(.export) .headline { padding: 0 28px; font-size: 36px; }
    body:not(.export) .slots { padding: 12px 28px 0; }
    body:not(.export) .body { padding: 12px 28px 0; font-size: 20px; }
    body:not(.export) .action { font-size: 14px; padding: 10px 12px; border-radius: 12px; }
    body:not(.export) .foot { padding: 14px 28px 18px; }
    body:not(.export) .source { font-size: 12px; }
    body:not(.export) .badge { font-size: 13px; padding: 8px 10px; }
    body:not(.export) .meta { font-size: 12px; }
  }
  /* Export mode for PNG: fixed canvas */
  body.export .stage { height: auto; display: block; padding: 24px; }
  body.export .card {
    display: block;
    width: 1080px;
    height: 1350px;
    aspect-ratio: auto;
    margin: 0 auto 18px;
  }
  .mid {
    flex: 1;
    overflow: hidden;
  }
  .top {
    padding: 40px 52px 14px;
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
    padding: 0 52px;
    font-size: 42px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #0f172a;
  }
  .headline {
    padding: 0 52px;
    font-size: 48px;
    font-weight: 900;
    letter-spacing: -0.03em;
    color: #0f172a;
    line-height: 1.12;
  }
  .slots {
    padding: 18px 52px 0;
    display: grid;
    gap: 12px;
  }
  .slot {
    border: 1px solid rgba(31,35,40,0.10);
    background: rgba(246,248,250,0.7);
    border-radius: 16px;
    padding: 12px 14px;
  }
  .slot h4 {
    margin: 0 0 8px;
    font-size: 14px;
    letter-spacing: -0.01em;
    color: rgba(31,35,40,0.78);
  }
  .slot .slotBody {
    font-size: 22px;
    line-height: 1.45;
    color: rgba(15,23,42,0.92);
  }
  .clamp3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .clamp2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .body {
    padding: 22px 52px 0;
    font-size: 32px;
    line-height: 1.48;
    color: #111827;
  }
  /* Checklist: fit 10 items in one card (two columns) */
  .checkGrid {
    padding: 16px 52px 0;
  }
  .checkGrid ol {
    margin: 0;
    padding-left: 1.2em;
  }
  .checkGrid li {
    break-inside: avoid;
    margin: 0 0 10px;
    font-size: 22px;
    line-height: 1.35;
  }
  @media (min-width: 900px) and (orientation: landscape) {
    body:not(.export) .checkGrid { padding: 12px 28px 0; }
    /* Match team-rules list size in desktop reading mode */
    body:not(.export) .checkGrid li { font-size: 20px; margin: 0 0 10px; line-height: 1.35; }
  }
  @media (max-width: 720px) {
    .checkGrid { padding: 12px 18px 0; }
    .checkGrid li { font-size: 18px; margin: 0 0 10px; line-height: 1.4; }
  }
  .body p { margin: 0 0 14px; }
  .body li { margin: 0 0 10px; }
  .body ul, .body ol { margin: 10px 0 0 1.2em; }
  .body code { background: rgba(31,35,40,0.06); padding: 2px 6px; border-radius: 8px; }
  .foot {
    margin-top: auto;
    padding: 22px 52px 28px;
    border-top: 1px solid rgba(31,35,40,0.10);
    background: rgba(255,255,255,0.92);
  }
  .action {
    padding: 14px 14px;
    border-radius: 16px;
    border: 1px solid rgba(9,105,218,0.16);
    background: rgba(9,105,218,0.07);
    font-size: 24px;
    line-height: 1.45;
    color: rgba(15,23,42,0.92);
  }
  .action strong { color: #0b3d91; }
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
  @media (max-width: 720px) {
    .stage { padding: 10px; }
    .card { border-radius: 18px; }
    .top { padding: 18px 18px 10px; }
    .title { padding: 0 18px; font-size: 26px; }
    .headline { padding: 0 18px; font-size: 28px; }
    .body { padding: 14px 18px 0; font-size: 18px; }
    .slots { padding: 12px 18px 0; gap: 10px; }
    .slot { border-radius: 14px; padding: 10px 10px; }
    .slot h4 { font-size: 12px; }
    .slot .slotBody { font-size: 14px; }
    .action { font-size: 14px; padding: 10px 10px; border-radius: 12px; }
    .foot { padding: 14px 18px 18px; }
    .badge { font-size: 13px; padding: 8px 10px; }
    .meta { font-size: 12px; }
    .source { font-size: 12px; }
    .nav { top: 10px; right: 10px; padding: 6px 8px; }
    .nav button { padding: 6px 8px; }
  }
  `;

  const cardsHtml = cards
    .map((c, i) => {
      const bodyHtml = marked.parse(c.bodyMd || "");
      const whyHtml = marked.parse(c.whyMd || "");
      const impactHtml = marked.parse(c.impactMd || "");
      const actionHtml = c.actionMd ? marked.parse(c.actionMd) : "";
      const srcHtml = c.source
        ? `<div class="hr"></div><div class="source">[Source] ${escapeHtml(
            c.source
          )}</div>`
        : "";

      const isSummary = c.kind === "summary";
      const summaryBody = bodyHtml ? `<div class="slotBody clamp2">${bodyHtml}</div>` : "";
      const whyBody = whyHtml ? `<div class="slotBody clamp3">${whyHtml}</div>` : "";
      const impactBody = impactHtml ? `<div class="slotBody clamp3">${impactHtml}</div>` : "";
      const slotsHtml = `
        <div class="slots">
          <div class="slot"><h4>한 줄 요약</h4>${summaryBody}</div>
          <div class="slot"><h4>왜 위험</h4>${whyBody}</div>
          <div class="slot"><h4>영향</h4>${impactBody}</div>
        </div>
      `;

      return `
<section class="card" data-card-idx="${i + 1}">
  <div class="top">
    <div class="badge">${escapeHtml(c.header)}</div>
    <div class="meta">${escapeHtml(title)}<br/>${escapeHtml(c.title)}</div>
  </div>
  <div class="mid">
    ${
      isSummary
        ? `<div class="headline">${escapeHtml(c.title)}</div>${slotsHtml}`
        : c.kind === "checklist"
          ? `<div class="title">${escapeHtml(c.title)}</div><div class="checkGrid">${bodyHtml}</div>`
        : `<div class="title">${escapeHtml(c.header)}</div><div class="body">${bodyHtml}</div>`
    }
  </div>
  <div class="foot">
    ${c.actionMd ? `<div class="action"><strong>오늘 조치</strong><br/>${actionHtml}</div>` : ""}
    ${srcHtml}
  </div>
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
    <div class="nav" aria-label="카드 내비게이션">
      <button type="button" id="prev" aria-label="이전">이전</button>
      <div class="count" id="count">1/${cards.length}</div>
      <button type="button" id="next" aria-label="다음">다음</button>
    </div>
    <main class="stage" id="stage">
${cardsHtml}
    </main>
    <script>
      (function () {
        const params = new URLSearchParams(location.search);
        if (params.get("export") === "1") document.body.classList.add("export");
        const cards = Array.from(document.querySelectorAll(".card"));
        const prev = document.getElementById("prev");
        const next = document.getElementById("next");
        const count = document.getElementById("count");
        if (cards.length === 0) return;

        let idx = 0;
        function set(i, focus) {
          idx = Math.max(0, Math.min(cards.length - 1, i));
          for (let j = 0; j < cards.length; j++) {
            cards[j].classList.toggle("active", j === idx || document.body.classList.contains("export"));
          }
          if (count) count.textContent = String(idx + 1) + "/" + String(cards.length);
          if (focus && !document.body.classList.contains("export")) {
            try { cards[idx].focus?.(); } catch {}
          }
        }
        prev && prev.addEventListener("click", () => set(idx - 1, true));
        next && next.addEventListener("click", () => set(idx + 1, true));

        // Keyboard
        window.addEventListener("keydown", (e) => {
          if (e.key === "ArrowLeft") set(idx - 1, true);
          if (e.key === "ArrowRight") set(idx + 1, true);
          if (e.key === "ArrowUp") set(idx - 1, true);
          if (e.key === "ArrowDown") set(idx + 1, true);
        });

        // Init
        set(0, false);
      })();
    </script>
  </body>
</html>`;
}

function splitActionSentence(body) {
  const s = String(body || "").trim();
  if (!s) return { summary: "", action: "" };
  // Heuristic: if there are 2+ sentences, treat the last sentence as the action.
  // We split by the last ". " (dot+space) before the final sentence.
  const lastDot = s.lastIndexOf(". ");
  // If there's no dot-space, it's likely a single sentence → no action box.
  if (lastDot === -1) return { summary: s, action: "" };
  const summary = s.slice(0, lastDot + 1).trim();
  const action = s.slice(lastDot + 2).trim();
  // If the "action" is suspiciously short or there's effectively only one sentence, skip.
  if (!action || summary.length < 8) return { summary: s, action: "" };
  return { summary, action };
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

