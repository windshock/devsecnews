import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { marked } from "marked";
import { parseArgs, getMonth, defaultInput } from "./cli.mjs";

function usageAndExit() {
  console.error(
    "Usage:\n  node scripts/md2cards.mjs <input.md> [outDir]\n  node scripts/md2cards.mjs --month YYYY-MM\n\nExamples:\n  node scripts/md2cards.mjs devsecnews-2026-01-node-java.md\n  node scripts/md2cards.mjs in.md cards/out\n  node scripts/md2cards.mjs --month 2026-01"
  );
  process.exit(2);
}

const { flags, positionals } = parseArgs(process.argv.slice(2));
if (flags.help) usageAndExit();

const month = getMonth(flags);
const input = flags.input ?? positionals[0] ?? defaultInput(month);
if (!input.endsWith(".md")) usageAndExit();
if (!fs.existsSync(input)) {
  console.error(`Input file not found: ${input}`);
  process.exit(1);
}

const baseName = path.basename(input, path.extname(input));
const outDir =
  flags.outDir ?? positionals[1] ?? path.join("cards", baseName);
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
  reportHref: `../../${baseName}.html`,
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

function buildCardsHtml({ title, cards, reportHref }) {
  const css = `
  :root { color-scheme: dark; }
  body {
    margin: 0;
    background:
      radial-gradient(1000px 700px at 10% -10%, rgba(34,211,238,0.2), transparent 60%),
      radial-gradient(900px 600px at 90% -10%, rgba(244,114,182,0.16), transparent 55%),
      radial-gradient(700px 600px at 50% 120%, rgba(34,197,94,0.12), transparent 60%),
      #0a0f17;
    color: #e2e8f0;
    font-family: "IBM Plex Sans", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image:
      repeating-linear-gradient(
        to bottom,
        rgba(255,255,255,0.035),
        rgba(255,255,255,0.035) 1px,
        transparent 1px,
        transparent 3px
      );
    opacity: 0.12;
    mix-blend-mode: soft-light;
  }
  @media (prefers-color-scheme: light) {
    body {
      background:
        radial-gradient(900px 600px at 10% -10%, rgba(14,165,233,0.12), transparent 60%),
        radial-gradient(900px 600px at 90% -10%, rgba(219,39,119,0.10), transparent 55%),
        radial-gradient(700px 600px at 50% 120%, rgba(34,197,94,0.08), transparent 60%),
        #f8fafc;
      color: #0f172a;
    }
    body::before { opacity: 0.05; }
    .links, .nav {
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(15,23,42,0.12);
    }
    .links a, .nav button {
      color: #0f172a;
      border: 1px solid rgba(14,165,233,0.25);
      background: rgba(255,255,255,0.95);
    }
    .nav .count { color: rgba(15,23,42,0.7); }
  }
  @keyframes slideUpFade {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .links {
    position: fixed;
    top: 14px;
    left: 14px;
    z-index: 20;
    display: inline-flex;
    gap: 8px;
    align-items: center;
    background: rgba(10,15,23,0.92);
    border: 1px solid rgba(148,163,184,0.25);
    border-radius: 999px;
    padding: 8px 10px;
    backdrop-filter: blur(10px);
  }
  .links a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    color: #e2e8f0;
    border: 1px solid rgba(34,211,238,0.3);
    background: rgba(2,6,23,0.7);
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    line-height: 1;
  }
  .links a:hover { border-color: rgba(34,211,238,0.55); }
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
    background: rgba(10,15,23,0.92);
    border: 1px solid rgba(148,163,184,0.25);
    border-radius: 999px;
    padding: 8px 10px;
    backdrop-filter: blur(10px);
  }
  .nav button {
    appearance: none;
    border: 1px solid rgba(34,211,238,0.3);
    background: rgba(2,6,23,0.7);
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
    color: #e2e8f0;
  }
  .nav .count {
    font-size: 12px;
    color: rgba(226,232,240,0.7);
    min-width: 54px;
    text-align: center;
  }
  .ansi-top {
    font-family: "JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    color: #7dd3fc;
    background: rgba(2,6,23,0.85);
    border-bottom: 1px solid rgba(34,211,238,0.35);
    padding: 8px 16px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  .ansi-top span { color: rgba(244,114,182,0.9); }
  .card {
    width: min(1080px, calc(100vw - 32px));
    height: min(1350px, calc(100vh - 32px));
    aspect-ratio: 1080 / 1350;
    background:
      radial-gradient(circle at 12% 10%, rgba(34,211,238,0.08) 0%, transparent 45%),
      radial-gradient(circle at 88% 80%, rgba(244,114,182,0.06) 0%, transparent 45%),
      linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 28px;
    border: 1px solid rgba(34,211,238,0.25);
    /* Dynamic Theme Variables */
    --theme-color: #0ea5e9;
    --theme-bg: rgba(14,165,233,0.12);
    --theme-border: rgba(14,165,233,0.28);
    box-shadow: 0 18px 60px rgba(2,6,23,0.55);
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    display: none; /* single-card view */
  }
  .card.active {
    display: flex;
    animation: slideUpFade 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  
  /* Theme overrides by card kind */
  .card.checklist {
    --theme-color: #a855f7;
    --theme-bg: rgba(168,85,247,0.12);
    --theme-border: rgba(168,85,247,0.28);
  }
  .card.rules {
    --theme-color: #f59e0b;
    --theme-bg: rgba(245,158,11,0.14);
    --theme-border: rgba(245,158,11,0.32);
  }
  .card.warning {
    --theme-color: #f43f5e;
    --theme-bg: rgba(244,63,94,0.12);
    --theme-border: rgba(244,63,94,0.28);
  }

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
  body.export .links { display: none; }
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
    padding: 10px 14px;
    border-radius: 999px;
    background: var(--theme-bg);
    border: 1px solid var(--theme-border);
    color: var(--theme-color);
    font-weight: 700;
    font-size: 16px;
    font-family: "JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    text-shadow: 0 0 12px rgba(14,165,233,0.25);
  }
  .meta {
    text-align: right;
    color: rgba(15,23,42,0.65);
    font-size: 18px;
    line-height: 1.3;
  }
  .title {
    padding: 0 52px;
    font-size: 42px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #0b1220;
  }
  .headline {
    padding: 0 52px;
    font-size: 48px;
    font-weight: 900;
    letter-spacing: -0.03em;
    color: #0b1220;
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
    padding: 16px 18px 10px 32px;
    background: rgba(15,23,42,0.08);
    border: 1px solid rgba(14,165,233,0.18);
    border-radius: 16px;
    color: #0b1220;
  }
  .checkGrid li {
    break-inside: avoid;
    margin: 0 0 10px;
    font-size: 22px;
    line-height: 1.35;
    color: #0b1220;
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
    background: rgba(248,250,252,0.96);
  }
  .action {
    padding: 14px 14px;
    padding: 14px 14px;
    border-radius: 16px;
    border: 1px solid var(--theme-border);
    background: linear-gradient(120deg, var(--theme-bg), rgba(255,255,255,0.8));
    font-size: 24px;
    line-height: 1.45;
    color: rgba(15,23,42,0.92);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.6);
  }
  .action strong { color: var(--theme-color); }
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
    /* Mobile: use available screen height, unset fixed aspect ratio to avoid tiny cards */
    .card {
      width: calc(100vw - 24px);
      height: calc(100vh - 80px); /* Fill screen, leaving space for margins */
      aspect-ratio: auto;
      border-radius: 20px;
      /* Flexbox properties ready for when it becomes active */
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
      /* Ensure scrollbar is visible */
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.3) rgba(255,255,255,0.05);
    }
    body:not(.export) .card { padding-bottom: 56px; }
    .card.active {
      display: flex; /* Only show active card */
    }
    /* Allow inner content to expand so card can scroll it */
    .mid {
      overflow: visible;
      flex: 0 0 auto;
    }
    .card::-webkit-scrollbar {
      width: 6px;
    }
    .card::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.2); 
      border-radius: 4px;
    }
    .card::-webkit-scrollbar-track {
      background: transparent;
    }
    /* Flex children */
    .top, .title, .headline, .meta, .source { flex-shrink: 0; }
    .body, .checkGrid, .slots { flex-shrink: 0; } /* Let them scroll with the card */
    .foot { flex-shrink: 0; margin-top: auto; } /* Push to bottom if space permits */
    /* Increase top padding to avoid overlap with fixed buttons (Nav/Links) */
    .top { padding: 32px 20px 10px; }
    .title { padding: 0 20px; font-size: 24px; }
    .headline { padding: 0 20px; font-size: 26px; }
    .body { padding: 10px 20px 0; font-size: 17px; }
    
    .slots { padding: 10px 20px 0; gap: 8px; }
    .slot { border-radius: 12px; padding: 10px 12px; }
    .slot h4 { font-size: 12px; margin-bottom: 4px; }
    .slot .slotBody { font-size: 14px; line-height: 1.4; }
    
    .action { font-size: 13px; padding: 10px 12px; border-radius: 12px; margin-top: 4px; }
    .foot { padding: 10px 20px 16px; }
    
    .badge { font-size: 12px; padding: 6px 10px; }
    .meta { font-size: 12px; max-width: 60%; line-height: 1.2; }
    .source { font-size: 11px; word-break: break-all; margin-top: 10px; }
    
    .nav {
      top: auto;
      bottom: 10px;
      right: 10px;
      padding: 6px 10px;
    }
    .nav button { padding: 4px 8px; font-size: 12px; }
    .nav .count { min-width: 46px; }
    .links {
      top: auto;
      bottom: 10px;
      left: 10px;
      padding: 6px 10px;
    }
    .links a { padding: 4px 8px; font-size: 12px; }
    
    /* Checklist sizing */
    .checkGrid { padding: 10px 20px 0; }
    .checkGrid li { font-size: 15px; margin: 0 0 8px; line-height: 1.35; }
  }
  `;

  const cardsHtml = cards
    .map((c, i) => {
      const bodyHtml = marked.parse(c.bodyMd || "");
      const whyHtml = marked.parse(c.whyMd || "");
      const impactHtml = marked.parse(c.impactMd || "");
      const actionHtml = c.actionMd ? marked.parse(c.actionMd) : "";
      const srcHtml = c.source
        ? `<div class="hr"></div><div class="source">[Source] <a href="${escapeHtml(c.source)}" target="_blank" style="color: inherit;">${escapeHtml(
          c.source
        )}</a></div>`
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
<section class="card ${escapeHtml(c.kind)}" data-card-idx="${i + 1}">
  <div class="ansi-top">┌─ DEVSECNEWS ─ ${escapeHtml(c.kind)} ─┐</div>
  <div class="top">
    <div class="badge">${escapeHtml(c.header)}</div>
    <div class="meta">${escapeHtml(title)}<br/>${escapeHtml(c.title)}</div>
  </div>
  <div class="mid">
    ${isSummary
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
    <div class="links" aria-label="링크">
      <a href="${escapeHtml(reportHref || "../../devsecnews-2026-01-node-java.html")}" id="reportLink" aria-label="본문 리포트로 이동">본문 리포트</a>
    </div>
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

        // Swipe (Mobile Touch)
        let touchstartX = 0;
        let touchstartY = 0;
        const main = document.getElementById("stage");
        if (main) {
          main.addEventListener("touchstart", (e) => {
            touchstartX = e.changedTouches[0].screenX;
            touchstartY = e.changedTouches[0].screenY;
          }, { passive: true });
          main.addEventListener("touchend", (e) => {
            const touchendX = e.changedTouches[0].screenX;
            const touchendY = e.changedTouches[0].screenY;
            handleSwipe(touchstartX, touchstartY, touchendX, touchendY);
          }, { passive: true });
        }

        function handleSwipe(sx, sy, ex, ey) {
          const dx = ex - sx;
          const dy = ey - sy;
          // Ignore vertical scrolls (if dy > dx)
          if (Math.abs(dy) > Math.abs(dx)) return;
          // Min swipe distance
          if (Math.abs(dx) < 50) return;
          if (dx < 0) set(idx + 1, true); // Swipe Left -> Next
          if (dx > 0) set(idx - 1, true); // Swipe Right -> Prev
        }

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
