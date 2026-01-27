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
  reportHref: `../../dist/${baseName}.html`,
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
    const domain = String(obj.domain || "").trim();
    if (!id || !kind || !header || !title) continue;
    out.push({ id, kind, header, title, bodyMd, whyMd, impactMd, actionMd, source, domain });
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
    .page-header {
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(15,23,42,0.12);
    }
    .report-link, .pager-btn {
      color: #0f172a;
      border: 1px solid rgba(14,165,233,0.25);
      background: rgba(255,255,255,0.95);
    }
    .pager-indicator { color: rgba(15,23,42,0.7); }
  }
  @keyframes slideUpFade {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .page-header {
    position: fixed;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    width: min(920px, calc(100% - 32px));
    align-items: center;
    background: rgba(10,15,23,0.92);
    border: 1px solid rgba(148,163,184,0.25);
    border-radius: 999px;
    padding: 8px 10px;
    backdrop-filter: blur(10px);
  }
  .report-link {
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
  .report-link:hover { border-color: rgba(34,211,238,0.55); }
  .pager {
    display: inline-flex;
    gap: 8px;
    align-items: center;
  }
  .pager-btn {
    appearance: none;
    border: 1px solid rgba(34,211,238,0.3);
    background: rgba(2,6,23,0.7);
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
    color: #e2e8f0;
  }
  .pager-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .pager-indicator {
    font-size: 12px;
    color: rgba(226,232,240,0.7);
    min-width: 56px;
    text-align: center;
  }
  .deck {
    max-width: 920px;
    margin: 0 auto;
    padding: 92px 16px 28px;
    display: grid;
    gap: 16px;
  }
  .card {
    border: 1px solid rgba(148,163,184,0.3);
    border-radius: 20px;
    padding: 16px;
    background:
      radial-gradient(circle at 10% 0%, rgba(34,211,238,0.08) 0%, transparent 45%),
      radial-gradient(circle at 90% 100%, rgba(244,114,182,0.06) 0%, transparent 45%),
      linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(241,245,249,0.98) 100%);
    box-shadow: 0 18px 60px rgba(2,6,23,0.4);
    color: #0b1220;
  }
  .card[hidden] { display: none; }
  .card.is-active { animation: slideUpFade 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
  .card-head { margin-bottom: 12px; }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-bottom: 6px;
  }
  .kicker {
    margin: 0;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(15,23,42,0.6);
    font-family: "JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    border: 1px solid rgba(14,165,233,0.35);
    background: rgba(14,165,233,0.12);
    color: #0b1220;
  }
  .badge--node {
    border-color: rgba(14,165,233,0.45);
    background: rgba(14,165,233,0.14);
  }
  .badge--java {
    border-color: rgba(234,88,12,0.45);
    background: rgba(234,88,12,0.16);
  }
  .badge--common {
    border-color: rgba(148,163,184,0.45);
    background: rgba(148,163,184,0.16);
  }
  .card-title {
    margin: 0;
    font-size: 22px;
    line-height: 1.25;
    font-weight: 800;
  }
  .card-body .row {
    display: grid;
    grid-template-columns: 112px 1fr;
    gap: 10px;
    padding: 10px 0;
    border-top: 1px solid rgba(148,163,184,0.25);
    align-items: start;
  }
  .card-body dt { font-weight: 700; color: rgba(15,23,42,0.75); }
  .card-body dd { margin: 0; color: rgba(15,23,42,0.9); }
  .card-body p { margin: 0 0 8px; }
  .card-body ul, .card-body ol { margin: 6px 0 0 1.1em; }
  .card-body code { background: rgba(15,23,42,0.06); padding: 2px 6px; border-radius: 8px; }
  .actions { margin: 0; padding-left: 1.1em; }
  .card-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(148,163,184,0.25);
    font-size: 12px;
    color: rgba(15,23,42,0.7);
  }
  .card-foot a { color: inherit; text-decoration: none; }
  .card-foot a:hover { text-decoration: underline; }
  .checklist {
    margin: 0;
    padding-left: 0;
    display: grid;
    gap: 8px;
    list-style: none;
    counter-reset: checklist;
  }
  .checklist li {
    line-height: 1.35;
    counter-increment: checklist;
    display: grid;
    grid-template-columns: 24px 20px 1fr;
    gap: 8px;
    align-items: start;
  }
  .checklist li::before {
    content: counter(checklist) ".";
    font-weight: 600;
    color: rgba(15,23,42,0.7);
    text-align: right;
    padding-top: 2px;
  }
  .checklist label { display: contents; }
  .checklist input { grid-column: 2; margin-top: 2px; accent-color: #0ea5e9; }
  .check-text { grid-column: 3; }
  .card--checklist .card-title { margin-bottom: 6px; }
  body.export .page-header { display: none; }
  body.export .deck { padding-top: 24px; }
  body.export .card {
    width: 1080px;
    height: 1350px;
    margin: 0 auto 18px;
  }
  body.export .card-body .row { grid-template-columns: 140px 1fr; }
  @media (max-width: 720px) {
    .page-header {
      top: auto;
      bottom: 12px;
      border-radius: 999px;
      padding: 6px 8px;
      width: calc(100% - 24px);
    }
    .deck { padding: 16px 12px 84px; }
    .card { border-radius: 16px; padding: 14px; }
    .card-title { font-size: 18px; }
    .card-body .row { grid-template-columns: 88px 1fr; }
    .pager-btn, .report-link { padding: 4px 8px; font-size: 12px; }
    .pager-indicator { min-width: 52px; }
  }
  `;

  const cardsHtml = cards
    .map((c, i) => {
      const bodyHtml = marked.parse(c.bodyMd || "");
      const whyHtml = marked.parse(c.whyMd || "");
      const impactHtml = marked.parse(c.impactMd || "");
      const actionHtml = c.actionMd ? marked.parse(c.actionMd) : "";
      const titleText = deriveCardTitle(c, i, cards.length);
      const cardId = `card-${i + 1}`;
      const domainInfo = getDomainMeta(c);
      const badgesHtml = domainInfo.badges
        .map((b) => `<span class="badge badge--${escapeHtml(b)}" data-domain="${escapeHtml(b)}">${badgeLabel(b)}</span>`)
        .join("");
      const metaHtml = `
        <div class="meta">
          <span class="kicker">DEVSECNEWS · ${escapeHtml(c.header)}</span>
          ${badgesHtml}
        </div>
      `;
      const sourceHtml = c.source
        ? `<a class="source" href="${escapeHtml(c.source)}" target="_blank" rel="noopener">Source</a>`
        : "";
      const actionBlock = actionHtml
        ? `<div class="row"><dt>오늘 조치</dt><dd>${actionHtml}</dd></div>`
        : "";

      if (c.kind === "checklist") {
        const items = parseNumbered(c.bodyMd || "");
        const listItems = items
          .map((item) => `<li><label><input type="checkbox" /><span class="check-text">${escapeHtml(item)}</span></label></li>`)
          .join("");
        return `
<section class="card card--checklist" data-card="${escapeHtml(c.kind)}" data-index="${i + 1}" data-domain="${escapeHtml(domainInfo.domain)}" aria-labelledby="${cardId}-title">
  <header class="card-head">
    ${metaHtml}
    <h2 id="${cardId}-title" class="card-title">${escapeHtml(titleText)}</h2>
  </header>
  <ol class="checklist">${listItems}</ol>
  <footer class="card-foot">
    <span>${c.actionMd ? escapeHtml(stripMarkdown(c.actionMd)) : ""}</span>
  </footer>
</section>`;
      }

      if (c.kind === "summary") {
        const summaryHtml = bodyHtml ? `<div class="row"><dt>한 줄 요약</dt><dd>${bodyHtml}</dd></div>` : "";
        const whyBlock = whyHtml ? `<div class="row"><dt>왜 위험</dt><dd>${whyHtml}</dd></div>` : "";
        const impactBlock = impactHtml ? `<div class="row"><dt>영향</dt><dd>${impactHtml}</dd></div>` : "";
        return `
<section class="card card--summary" data-card="${escapeHtml(c.kind)}" data-index="${i + 1}" data-domain="${escapeHtml(domainInfo.domain)}" aria-labelledby="${cardId}-title">
  <header class="card-head">
    ${metaHtml}
    <h2 id="${cardId}-title" class="card-title">${escapeHtml(titleText)}</h2>
  </header>
  <dl class="card-body">
    ${summaryHtml}
    ${whyBlock}
    ${impactBlock}
    ${actionBlock}
  </dl>
  <footer class="card-foot">
    ${sourceHtml}
  </footer>
</section>`;
      }

      return `
<section class="card" data-card="${escapeHtml(c.kind)}" data-index="${i + 1}" data-domain="${escapeHtml(domainInfo.domain)}" aria-labelledby="${cardId}-title">
  <header class="card-head">
    ${metaHtml}
    <h2 id="${cardId}-title" class="card-title">${escapeHtml(titleText)}</h2>
  </header>
  <div class="card-body">
    ${bodyHtml}
  </div>
  <footer class="card-foot">
    <span>${c.actionMd ? escapeHtml(stripMarkdown(c.actionMd)) : ""}</span>
    ${sourceHtml}
  </footer>
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
    <header class="page-header">
      <a class="report-link" href="${escapeHtml(reportHref || "../../devsecnews-2026-01-node-java.html")}" id="reportLink" aria-label="본문 리포트로 이동">본문 리포트</a>
      <nav class="pager" aria-label="카드 이동">
        <button class="pager-btn" type="button" id="prev" aria-label="이전">이전</button>
        <span class="pager-indicator" aria-live="polite"><span id="count">1</span>/<span id="total">${cards.length}</span></span>
        <button class="pager-btn" type="button" id="next" aria-label="다음">다음</button>
      </nav>
    </header>
    <main class="deck" id="stage">
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
        const total = document.getElementById("total");
        if (cards.length === 0) return;

        let idx = 0;
        if (total) total.textContent = String(cards.length);
        function set(i, focus) {
          idx = Math.max(0, Math.min(cards.length - 1, i));
          for (let j = 0; j < cards.length; j++) {
            const isExport = document.body.classList.contains("export");
            const isActive = j === idx || isExport;
            if (!isExport) {
              cards[j].hidden = !isActive;
              cards[j].setAttribute("aria-hidden", isActive ? "false" : "true");
            } else {
              cards[j].hidden = false;
              cards[j].removeAttribute("aria-hidden");
            }
            cards[j].classList.toggle("is-active", isActive && !isExport);
          }
          if (count) count.textContent = String(idx + 1);
          if (prev) prev.disabled = cards.length <= 1;
          if (next) next.disabled = cards.length <= 1;
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

        // Init (JS-enabled: single-card mode)
        if (!document.body.classList.contains("export")) {
          document.body.classList.add("js");
          set(0, false);
        }
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

function deriveCardTitle(card, index, total) {
  const raw = String(card.title || "").trim();
  if (raw && !raw.startsWith("Summary ")) return raw;
  if (card.kind === "summary") {
    const plain = stripMarkdown(card.bodyMd || "");
    const trimmed = truncateText(plain, 48);
    if (trimmed) return trimmed;
    return `요약 ${index + 1}/${total}`;
  }
  if (card.kind === "checklist") return "이번 달 개발자 체크리스트(10)";
  if (card.kind === "rules") return "패턴→팀 규칙(5)";
  return raw || `${card.header || "카드"} ${index + 1}/${total}`;
}

function getDomainMeta(card) {
  if (card.kind === "checklist") {
    return { domain: "mixed", badges: ["node", "java"] };
  }
  const preferred = normalizeDomain(card.domain);
  const inferred = preferred || inferDomain(card);
  const domain = inferred || "common";
  return { domain, badges: [domain] };
}

function normalizeDomain(raw) {
  const v = String(raw || "").trim().toLowerCase();
  if (v === "node" || v === "nodejs" || v === "node.js") return "node";
  if (v === "java") return "java";
  if (v === "common") return "common";
  return "";
}

function inferDomain(card) {
  const text = [
    card.title,
    card.bodyMd,
    card.whyMd,
    card.impactMd,
    card.actionMd,
    card.source,
  ]
    .map((x) => String(x || ""))
    .join(" ")
    .toLowerCase();

  if (
    text.includes("node.js") ||
    text.includes("nodejs") ||
    text.includes("nodejs.org") ||
    text.includes("cve-2025-5513") ||
    text.includes("cve-2026-21636")
  ) {
    return "node";
  }
  if (
    text.includes("struts") ||
    text.includes("spring") ||
    text.includes("jaspersoft") ||
    text.includes("jasperreports") ||
    text.includes("skyve") ||
    text.includes("apache.org/confluence/display/ww") ||
    text.includes("mail-archive.com/mod_mbox/struts") ||
    text.includes("cve-2025-68493") ||
    text.includes("cve-2025-10492") ||
    text.includes("cve-2026-22718") ||
    /\bjava\b/.test(text)
  ) {
    return "java";
  }
  return "";
}

function badgeLabel(domain) {
  if (domain === "node") return "Node.js";
  if (domain === "java") return "Java";
  if (domain === "common") return "Common";
  return domain.toUpperCase();
}

function stripMarkdown(text) {
  return String(text || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`{1,3}[^`]+`{1,3}/g, "")
    .replace(/[*_~>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(text, maxLen) {
  const s = String(text || "").trim();
  if (!s) return "";
  if (s.length <= maxLen) return s;
  return s.slice(0, Math.max(0, maxLen - 1)).trim() + "…";
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
