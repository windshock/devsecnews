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
const FINAL_CARD_CTA_LINKS = [
  {
    label: "보안진단 플레이북(SKILLS)",
    href: "http://code.skplanet.com/projects/VULCHK/repos/audit_result/browse?at=refs%2Fheads%2Fmain",
  },
  {
    label: "보안진단 신청 페이지",
    href: "https://wiki.skplanet.com/x/XjzEIw",
  },
  {
    label: "시큐어 코딩 가이드",
    href: "https://wiki.skplanet.com/pages/viewpage.action?pageId=237006490",
  },
];

if (metaCards.length) {
  for (const c of metaCards) {
    cards.push({
      kind: c.kind,
      domain: c.domain,
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
    const isFirst = i === 0;
    cards.push({
      kind: isFirst ? "editorial" : "summary",
      header: isFirst ? "Editor's Note" : "요약",
      title: isFirst ? "Editor's Note" : `Summary ${i + 1}/${summaryItems.length}`,
      bodyMd: summary,
      actionMd: action,
      source,
      domain: isFirst ? "editorial" : undefined,
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

// Always append a dedicated final CTA card for internal self-check resources.
cards.push({
  kind: "cta",
  domain: "common",
  header: "가이드",
  title: "개발자 셀프 체크 가이드 및 툴",
  bodyMd:
    "월간 점검을 마친 뒤 아래 링크로 바로 실행/신청/가이드 확인까지 이어가세요.",
  source: "",
});

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
    const domain = String(obj.domain || "").trim();
    if (!id || !kind || !header || !title) continue;
    out.push({ id, kind, header, title, bodyMd, whyMd, impactMd, actionMd, source, domain });
  }
  return out;
}

function buildCardsHtml({ title, cards, reportHref }) {
  const cdn = `
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Pretendard', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          colors: {
            node: '#4ade80',
            java: '#fb923c',
            edit: '#a78bfa',
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap');
    
    /* Hide scrollbar for clean UI */
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .card-scroll {
      -webkit-overflow-scrolling: touch;
    }
    .deck {
      perspective: 1400px;
      transform-style: preserve-3d;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @media (max-width: 640px) {
      .deck { perspective: 900px; }
    }
    .coverflow {
      position: relative;
      transform-style: preserve-3d;
      width: 100%;
      height: min(82vh, 620px);
    }
    .card {
      transform-origin: center center;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      contain: layout style paint;
    }
    /* Mobile portrait: tall & narrow cards — phone-shaped cover flow */
    @media (max-width: 640px) {
      .card {
        width: 60vw !important;
        max-width: 270px !important;
        height: 56vh !important;
        max-height: 415px !important;
        border-radius: 1.25rem !important;
      }
      .card > div:first-child { padding: 0.875rem !important; }
      .card h2 { font-size: 0.875rem !important; line-height: 1.3 !important; margin-bottom: 0.5rem !important; }
      .card .text-xs { font-size: 0.55rem !important; }
      .card .text-sm { font-size: 0.65rem !important; }
      .card .text-2xl { font-size: 0.875rem !important; }
      .card .text-\[10px\] { font-size: 8px !important; }
      .card .p-3 { padding: 0.5rem !important; }
      .card .space-y-4 > * + * { margin-top: 0.5rem !important; }
      .card .mb-4 { margin-bottom: 0.375rem !important; }
      /* Kill expensive effects on mobile */
      .card .blur-3xl { display: none !important; }
      .page-header { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; background: rgb(2 6 23 / 0.95) !important; }
    }

    body.export .deck {
      display: block;
      padding: 0;
      height: auto;
      overflow: visible;
    }
    body.export .coverflow {
      display: block;
      width: auto;
      height: auto !important;
      position: static;
    }
    body.export .card {
      width: 1080px;
      height: 1350px;
      margin-bottom: 20px;
      border-radius: 0;
      position: relative !important;
      left: auto !important;
      top: auto !important;
      transform: none !important;
      opacity: 1 !important;
      filter: none !important;
      pointer-events: auto !important;
    }
    body.export .page-header { display: none; }
    /* After Safari bar collapses, lock body scroll */
    body.locked { overflow: hidden !important; height: 100dvh !important; }
  </style>
  `;

  const cardsHtml = cards
    .map((c, i) => {
      // Custom Renderer for Cards to shorten links
      const cardRenderer = new marked.Renderer();
      cardRenderer.link = (href, title, text) => {
        let display = text;
        if (text.startsWith("http") && text.length > 20) {
          display = "Link ↗";
        }
        return `<a href="${href}" target="_blank" class="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 underline-offset-2 break-all">${display}</a>`;
      };

      const parseCardMd = (md) => marked.parse(md || "", { renderer: cardRenderer });

      const bodyHtml = parseCardMd(c.bodyMd);
      const whyHtml = parseCardMd(c.whyMd);
      const impactHtml = parseCardMd(c.impactMd);
      const actionHtml = c.actionMd ? parseCardMd(c.actionMd) : "";
      const titleText = deriveCardTitle(c, i, cards.length);
      const domainInfo = getDomainMeta(c);

      // Determine theme colors based on domain
      let themeClass = "from-slate-800 to-slate-900 border-slate-700";
      let badgeClass = "bg-slate-800 text-slate-300 border-slate-600";
      let accentClass = "text-slate-400";

      if (domainInfo.domain === "node") {
        themeClass = "from-slate-900 to-green-950 border-green-900/50";
        badgeClass = "bg-green-900/30 text-green-400 border-green-700/50";
        accentClass = "text-green-500";
      } else if (domainInfo.domain === "java") {
        themeClass = "from-slate-900 to-orange-950 border-orange-900/50";
        badgeClass = "bg-orange-900/30 text-orange-400 border-orange-700/50";
        accentClass = "text-orange-500";
      } else if (domainInfo.domain === "editorial") {
        themeClass = "from-slate-900 to-violet-950 border-violet-900/50";
        badgeClass = "bg-violet-900/30 text-violet-400 border-violet-700/50";
        accentClass = "text-violet-400";
      }

      const badgesHtml = domainInfo.badges
        .map((b) => `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeClass}">${badgeLabel(b)}</span>`)
        .join("");

      const metaHtml = `
        <div class="flex items-center gap-2 mb-4">
          <span class="text-xs font-mono uppercase tracking-widest text-slate-500">DEVSECNEWS</span>
          <div class="flex gap-1 ml-auto">${badgesHtml}</div>
        </div>
      `;

      const sourceHtml = c.source
        ? `<a href="${escapeHtml(c.source)}" target="_blank" class="text-xs font-mono text-slate-500 hover:text-white transition-colors ml-auto">Source ↗</a>`
        : "";

      // Internal Content Logic
      let contentHtml = "";
      if (c.kind === "checklist") {
        const items = parseNumbered(c.bodyMd || "");
        const listItems = items
          .map((item, idx) => `
            <li class="flex gap-3 items-start p-3 bg-white/5 rounded-lg border border-white/5">
              <span class="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold font-mono text-slate-300">${idx + 1}</span>
              <span class="text-sm text-slate-200 leading-snug pt-0.5">${escapeHtml(item)}</span>
            </li>`)
          .join("");
        contentHtml = `<ul class="space-y-2 mt-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">${listItems}</ul>`;
      } else if (c.kind === "cta") {
        const ctaDesc = bodyHtml
          ? `<div class="p-3 rounded-lg bg-white/5 border border-white/5 text-slate-200 leading-relaxed">${bodyHtml}</div>`
          : "";
        const ctaButtons = FINAL_CARD_CTA_LINKS.map((link, idx) => {
          const colorClass =
            idx === 0
              ? "bg-sky-600/90 hover:bg-sky-500 border-sky-400/40"
              : idx === 1
                ? "bg-emerald-600/90 hover:bg-emerald-500 border-emerald-400/40"
                : "bg-amber-600/90 hover:bg-amber-500 border-amber-400/40";
          return `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold text-white transition-colors text-center ${colorClass}">${escapeHtml(link.label)} ↗</a>`;
        }).join("");
        contentHtml = `
          <div class="space-y-3 mt-2">
            ${ctaDesc}
            <div class="grid gap-2">${ctaButtons}</div>
          </div>
        `;
      } else if (c.kind === "summary" || c.kind === "editorial") {
        contentHtml = `
          <div class="space-y-4 text-sm">
            ${bodyHtml ? `<div class="p-3 rounded-lg bg-white/5 border border-white/5"><div class="text-xs font-bold text-slate-400 mb-1">SUMMARY</div><div class="text-slate-200 leading-relaxed">${bodyHtml}</div></div>` : ""}
            ${whyHtml ? `<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20"><div class="text-xs font-bold text-red-400 mb-1">RISK</div><div class="text-slate-200 leading-relaxed">${whyHtml}</div></div>` : ""}
            ${impactHtml ? `<div class="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"><div class="text-xs font-bold text-orange-400 mb-1">IMPACT</div><div class="text-slate-200 leading-relaxed">${impactHtml}</div></div>` : ""}
          </div>
        `;
      } else {
        contentHtml = `<div class="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed">${bodyHtml}</div>`;
      }

      const actionBlock = actionHtml
        ? `<div class="mt-auto pt-4 border-t border-white/10">
             <div class="text-[10px] font-bold uppercase tracking-widest ${accentClass} mb-1">Action</div>
             <div class="text-sm text-white font-medium">${actionHtml}</div>
           </div>`
        : "";
      return `
        <!-- Card -->
        <article class="card w-[85vw] max-w-sm h-[78vh] max-h-[560px] flex flex-col relative bg-gradient-to-br ${themeClass} border rounded-3xl shadow-2xl overflow-hidden">
          <div class="flex-1 min-h-0 flex flex-col p-6 z-10">
            ${metaHtml}
            <h2 class="text-2xl font-bold text-white leading-tight mb-4 tracking-tight">${escapeHtml(titleText)}</h2>
            <div class="card-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar mask-fade-bottom">
              ${contentHtml}
            </div>
            ${actionBlock}
            <div class="mt-4 flex justify-between items-center pt-2 border-t border-white/5">
              <span class="text-xs text-slate-600 font-mono">${i + 1} / ${cards.length}</span>
              ${sourceHtml}
            </div>
          </div>
          
          <!-- Background Decoration -->
          <div class="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-20 -left-20 w-64 h-64 bg-black/20 rounded-full blur-3xl pointer-events-none"></div>
        </article>
      `;
    })
    .join("\n");

  return `<!doctype html>
<html lang="ko" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
    <title>${escapeHtml(title)} cards</title>
    ${cdn}
  </head>
  <body class="bg-slate-950 text-slate-200 min-h-[100dvh] w-screen flex flex-col select-none" style="padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)">
    
    <!-- Top Bar -->
    <header class="page-header fixed top-0 w-full z-50 flex items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <a href="${escapeHtml(reportHref || "../../devsecnews-2026-01-node-java.html")}" class="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Report
      </a>
      <div class="text-xs font-mono text-slate-600">
        <span class="hidden sm:inline">← DRAG or SCROLL →</span>
        <span class="sm:hidden">← SWIPE →</span>
      </div>
    </header>

    <script>
      /* ── iOS Safari: collapse address/tab bar on load ── */
      (function safariBarCollapse() {
        var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        if (!isIOS) { document.body.classList.add('locked'); return; }
        if (navigator.standalone) { document.body.classList.add('locked'); return; }
        var b = document.body;
        /* briefly allow scroll so 1px scroll triggers bar collapse */
        b.style.height = 'calc(100dvh + 2px)';
        b.style.overflow = 'auto';
        setTimeout(function() {
          window.scrollTo({ top: 1, behavior: 'instant' });
          setTimeout(function() {
            b.style.height = '';
            b.style.overflow = '';
            b.classList.add('locked');
            /* fire resize so layout() picks up new innerHeight */
            window.dispatchEvent(new Event('resize'));
          }, 350);
        }, 80);
      })();

      document.addEventListener('DOMContentLoaded', () => {
        const deck = document.querySelector('.deck');
        const ring = document.getElementById('coverflow');
        if (!deck || !ring) return;
        const isExport = document.body.classList.contains('export') || new URLSearchParams(location.search).get('export') === '1';
        if (isExport) return;

        const cards = Array.from(ring.querySelectorAll('.card'));
        const n = cards.length;
        if (!n) return;

        const mod = (v, m) => ((v % m) + m) % m;
        const wrapDelta = (index, pos) => mod(index - pos + n / 2, n) - n / 2;
        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

        let position = 0;
        let target = 0;
        let autoRotate = true;
        let lastTs = 0;
        let spacing = 220;
        const autoSpeed = 0.18; // cards / sec

        const isMobile = () => window.innerWidth <= 640;
        const layout = () => {
          const baseW = Math.max(240, Math.round(cards[0].getBoundingClientRect().width || 360));
          halfW = Math.round(baseW / 2);
          spacing = Math.round(baseW * (isMobile() ? 0.44 : 0.62));
          const ringH = isMobile()
            ? Math.max(360, Math.round(window.innerHeight * 0.65))
            : Math.max(500, Math.round(window.innerHeight * 0.78));
          ring.style.height = ringH + "px";
        };

        /* Half card width, cached on layout */
        let halfW = 180;

        const render = () => {
          for (let i = 0; i < n; i += 1) {
            const card = cards[i];
            const d = wrapDelta(i, position);
            const ad = Math.abs(d);
            /* Only GPU-friendly properties: transform + opacity */
            const x = Math.round(d * spacing - halfW);
            const z = Math.round(320 - ad * 130);
            const rotateY = clamp(d * -42, -62, 62);
            const scale = 1 - Math.min(0.26, ad * 0.11);
            const opacity = Math.max(0.25, 1 - Math.min(0.75, ad * 0.25));
            card.style.cssText = "position:absolute;left:50%;top:50%;"
              + "transform:translate3d(" + x + "px,-50%," + z + "px) rotateY(" + rotateY + "deg) scale(" + scale + ");"
              + "opacity:" + opacity + ";"
              + "z-index:" + Math.round(1000 - ad * 120) + ";"
              + "pointer-events:" + (ad < 0.75 ? "auto" : "none") + ";";
          }
        };

        let rafId = 0;
        let running = false;
        const tick = (ts) => {
          if (!lastTs) lastTs = ts;
          const dt = (ts - lastTs) / 1000;
          lastTs = ts;
          if (autoRotate) target += autoSpeed * dt;
          const diff = target - position;
          position += diff * Math.min(1, dt * 7.5);
          render();
          /* Stop loop when idle (position ≈ target and no auto-rotate) */
          if (!autoRotate && Math.abs(diff) < 0.001) {
            position = target;
            render();
            running = false;
            return;
          }
          rafId = window.requestAnimationFrame(tick);
        };
        const startLoop = () => {
          if (running) return;
          running = true;
          lastTs = 0;
          rafId = window.requestAnimationFrame(tick);
        };

        let dragging = false;
        let dragStartX = 0;
        let dragStartTarget = 0;
        let autoResumeTimer = null;
        deck.style.cursor = "grab";

        const snapToNearest = () => {
          target = Math.round(target);
        };
        const pauseAutoRotate = () => {
          autoRotate = false;
          if (autoResumeTimer) clearTimeout(autoResumeTimer);
        };
        const scheduleAutoResume = () => {
          if (autoResumeTimer) clearTimeout(autoResumeTimer);
          autoResumeTimer = setTimeout(() => { autoRotate = true; startLoop(); }, 4000);
        };

        /* ── Mouse ── */
        deck.addEventListener("mouseenter", () => { pauseAutoRotate(); });
        deck.addEventListener("mouseleave", () => {
          if (!dragging) { snapToNearest(); startLoop(); scheduleAutoResume(); }
        });
        deck.addEventListener("mousedown", (e) => {
          dragging = true;
          pauseAutoRotate();
          dragStartX = e.clientX;
          dragStartTarget = target;
          deck.style.cursor = "grabbing";
          startLoop();
        });
        window.addEventListener("mouseup", () => {
          if (!dragging) return;
          dragging = false;
          snapToNearest();
          startLoop();
          scheduleAutoResume();
          deck.style.cursor = "grab";
        });
        window.addEventListener("mousemove", (e) => {
          if (!dragging) return;
          const dx = e.clientX - dragStartX;
          target = dragStartTarget - dx / spacing;
          startLoop();
        });

        /* ── Touch (direction-locked) ── */
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTarget = 0;
        let touchAxis = ""; /* "" = undecided, "h" = horizontal, "v" = vertical */
        const LOCK_THRESHOLD = 8; /* px to decide direction */
        deck.addEventListener("touchstart", (e) => {
          pauseAutoRotate();
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          touchStartTarget = target;
          touchAxis = "";
          dragging = false; /* wait until direction is decided */
        }, { passive: true });
        deck.addEventListener("touchmove", (e) => {
          const dx = e.touches[0].clientX - touchStartX;
          const dy = e.touches[0].clientY - touchStartY;
          if (!touchAxis) {
            if (Math.abs(dx) > LOCK_THRESHOLD || Math.abs(dy) > LOCK_THRESHOLD) {
              touchAxis = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
              if (touchAxis === "h") dragging = true;
            }
          }
          if (touchAxis === "h") {
            target = touchStartTarget - dx / spacing;
            startLoop();
            e.preventDefault();
          }
        }, { passive: false });
        deck.addEventListener("touchend", () => {
          if (dragging) {
            dragging = false;
            snapToNearest();
            startLoop();
          }
          scheduleAutoResume();
          touchAxis = "";
        });

        /* ── Wheel ── */
        deck.addEventListener("wheel", (e) => {
          target += e.deltaY * 0.0028;
          pauseAutoRotate();
          snapToNearest();
          startLoop();
          scheduleAutoResume();
          e.preventDefault();
        }, { passive: false });

        /* ── Keyboard ── */
        document.addEventListener("keydown", (e) => {
          if (e.key === "ArrowRight") { target += 1; pauseAutoRotate(); startLoop(); scheduleAutoResume(); }
          if (e.key === "ArrowLeft")  { target -= 1; pauseAutoRotate(); startLoop(); scheduleAutoResume(); }
        });

        /* ── Click to focus card ── */
        cards.forEach((card, idx) => {
          card.addEventListener("click", () => {
            target += wrapDelta(idx, target);
            pauseAutoRotate();
            startLoop();
            scheduleAutoResume();
          });
        });
        window.addEventListener("resize", () => { layout(); render(); });

        layout();
        render();
        startLoop();
      });
    </script>

    <!-- Deck (Scroll Snap Container) -->
    <main class="deck flex-1 w-full pt-14 pb-4 px-4">
      <div class="coverflow" id="coverflow">
        ${cardsHtml}
      </div>
    </main>

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
  if (card.kind === "editorial") {
    return { domain: "editorial", badges: ["editor's note"] };
  }
  if (card.kind === "checklist") {
    return { domain: "mixed", badges: ["node", "java"] };
  }
  if (card.kind === "cta") {
    return { domain: "common", badges: ["guide"] };
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
  if (domain === "guide") return "Guide";
  if (domain === "editor's note") return "Editor's Note";
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
