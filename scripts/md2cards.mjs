import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { parseArgs, getMonth, defaultInput } from "./cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function usageAndExit() {
  console.error(
    "Usage:\n  node scripts/md2cards.mjs <input.md> [outDir]\n  node scripts/md2cards.mjs --month YYYY-MM [--rewrite-copy --copy-attempts 3]\n\nExamples:\n  node scripts/md2cards.mjs devsecnews-2026-01-node-java.md\n  node scripts/md2cards.mjs in.md cards/out\n  node scripts/md2cards.mjs --month 2026-01\n  node scripts/md2cards.mjs --month 2026-01 --rewrite-copy --copy-attempts 3"
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
      ctaLinks: c.ctaLinks,
      title_en: c.title_en,
      bodyMd_en: c.bodyMd_en,
      whyMd_en: c.whyMd_en,
      impactMd_en: c.impactMd_en,
      actionMd_en: c.actionMd_en,
      ctaLinks_en: c.ctaLinks_en,
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

// CTA card disabled — tools-1 card in MD serves as the final action card.
// cards.push({ kind: "cta", ... });

if (flags["rewrite-copy"]) {
  const attempts = Math.max(1, Number(flags["copy-attempts"] || 3) || 3);
  const rewritten = rewriteCardsWithCodex(cards, {
    attempts,
    model: typeof flags["copy-model"] === "string" ? flags["copy-model"] : "",
    guidelinePath:
      typeof flags["copy-guideline"] === "string"
        ? flags["copy-guideline"]
        : path.join("prompts", "devsecnews-card-copy-editor-skill.md"),
    keepTmp: Boolean(flags["copy-debug"]),
  });
  if (rewritten && rewritten.length === cards.length) {
    cards.splice(0, cards.length, ...rewritten);
    console.log(`copy rewrite: applied (${attempts} attempts)`);
  } else {
    console.warn("copy rewrite: skipped (fallback to original copy)");
  }
}

const html = buildCardsHtml({
  title: titleLine,
  cards,
  reportHref: `../../${baseName}.html`,
  baseName,
});

const outFile = path.join(outDir, "cards.html");
fs.writeFileSync(outFile, html, "utf8");

/* ── Tailwind CLI: generate minimal CSS and inline it ── */
const projectRoot = path.resolve(__dirname, "..");
const twConfig = path.join(projectRoot, "tailwind.cards.config.cjs");
const twInput = path.join(__dirname, "cards-input.css");
const twOutput = path.join(outDir, ".tw.css");

try {
  execSync(
    `npx tailwindcss -c ${twConfig} -i ${twInput} --content ${outFile} -o ${twOutput} --minify`,
    { cwd: projectRoot, stdio: "pipe" }
  );
  const twCss = fs.readFileSync(twOutput, "utf8");
  let final = fs.readFileSync(outFile, "utf8");
  final = final.replace("<!-- __TAILWIND_CSS__ -->", `<style>${twCss}</style>`);
  fs.writeFileSync(outFile, final, "utf8");
  fs.unlinkSync(twOutput); // clean up temp file
} catch (e) {
  console.warn("⚠ Tailwind CLI failed, falling back to CDN:", e.message);
  let final = fs.readFileSync(outFile, "utf8");
  final = final.replace(
    "<!-- __TAILWIND_CSS__ -->",
    '<script src="https://cdn.tailwindcss.com"></script>'
  );
  fs.writeFileSync(outFile, final, "utf8");
}

console.log(`wrote: ${outFile}`);
console.log(`cards: ${cards.length}`);
if (flags["rewrite-copy"]) {
  console.log("copy rewrite: enabled");
}

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
    const ctaLinks = Array.isArray(obj.ctaLinks) ? obj.ctaLinks : undefined;
    // English translation fields
    const title_en = String(obj.title_en || "").trim();
    const bodyMd_en = String(obj.bodyMd_en || "").trim();
    const whyMd_en = String(obj.whyMd_en || "").trim();
    const impactMd_en = String(obj.impactMd_en || "").trim();
    const actionMd_en = String(obj.actionMd_en || "").trim();
    const ctaLinks_en = Array.isArray(obj.ctaLinks_en) ? obj.ctaLinks_en : undefined;
    out.push({ id, kind, header, title, bodyMd, whyMd, impactMd, actionMd, source, domain, ctaLinks,
      title_en, bodyMd_en, whyMd_en, impactMd_en, actionMd_en, ctaLinks_en });
  }
  return out;
}

function buildCardsHtml({ title, cards, reportHref, baseName }) {
  const siteBase = "https://windshock.github.io/devsecnews";
  const ogImage = `${siteBase}/media/${baseName.replace(/^devsecnews-/, '').replace(/-node-java$/, '')}/cover.webp`;
  const ogUrl = `${siteBase}/cards/${baseName}/cards.html`;
  const ogDesc = cards.slice(0, 3).map(c => c.title).join(" · ");
  const cdn = `
  <!-- __TAILWIND_CSS__ -->
  <style>
    :root {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
    }
    
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
        height: 56svh !important;
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
    /* Lock body scroll — use svh so it fits within Safari bars */
    body.locked { overflow: hidden !important; height: 100svh !important; height: 100dvh !important; }
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
      } else if (domainInfo.domain === "insight") {
        themeClass = "from-slate-900 to-cyan-950 border-cyan-900/50";
        badgeClass = "bg-cyan-900/30 text-cyan-400 border-cyan-700/50";
        accentClass = "text-cyan-400";
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

      // Build content HTML for a given language variant
      function buildContentHtml(bodyMd, whyMd, impactMd, actionMd, ctaLinksArr) {
        const bodyHtml = parseCardMd(bodyMd);
        const whyHtml = parseCardMd(whyMd);
        const impactHtml = parseCardMd(impactMd);
        const actionHtml = actionMd ? parseCardMd(actionMd) : "";
        let contentHtml = "";
        if (c.kind === "checklist") {
          const items = parseNumbered(bodyMd || "");
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
          const links = ctaLinksArr || c.ctaLinks || FINAL_CARD_CTA_LINKS;
          const ctaButtons = links.map((link, idx) => {
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
        } else if (c.kind === "insight") {
          contentHtml = `
            <div class="space-y-3 text-[13px]">
              ${bodyHtml ? `<div class="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20"><div class="text-xs font-bold text-cyan-400 mb-1">PATTERN</div><div class="text-slate-200 leading-relaxed">${bodyHtml}</div></div>` : ""}
              ${whyHtml ? `<div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"><div class="text-xs font-bold text-amber-400 mb-1">ROOT CAUSE</div><div class="text-slate-200 leading-relaxed">${whyHtml}</div></div>` : ""}
              ${impactHtml ? `<div class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"><div class="text-xs font-bold text-emerald-400 mb-1">PRINCIPLE</div><div class="text-slate-200 leading-relaxed">${impactHtml}</div></div>` : ""}
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
        return { contentHtml, actionBlock };
      }

      // Korean (default)
      const ko = buildContentHtml(c.bodyMd, c.whyMd, c.impactMd, c.actionMd, c.ctaLinks);
      // English (if available)
      const hasEn = !!(c.title_en || c.bodyMd_en);
      const en = hasEn
        ? buildContentHtml(c.bodyMd_en || c.bodyMd, c.whyMd_en || c.whyMd, c.impactMd_en || c.impactMd, c.actionMd_en || c.actionMd, c.ctaLinks_en || c.ctaLinks)
        : null;
      const titleEn = c.title_en || titleText;

      return `
        <!-- Card -->
        <article class="card w-[85vw] max-w-sm h-[78vh] max-h-[560px] flex flex-col relative bg-gradient-to-br ${themeClass} border rounded-3xl shadow-2xl overflow-hidden">
          <div class="flex-1 min-h-0 flex flex-col p-6 z-10">
            ${metaHtml}
            <h2 class="text-2xl font-bold text-white leading-tight mb-4 tracking-tight" data-lang="ko">${escapeHtml(titleText)}</h2>${hasEn ? `
            <h2 class="text-2xl font-bold text-white leading-tight mb-4 tracking-tight" data-lang="en" style="display:none">${escapeHtml(titleEn)}</h2>` : ""}
            <div class="card-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar mask-fade-bottom">
              <div data-lang="ko">${ko.contentHtml}</div>${hasEn ? `
              <div data-lang="en" style="display:none">${en.contentHtml}</div>` : ""}
            </div>
            <div data-lang="ko">${ko.actionBlock}</div>${hasEn && en.actionBlock ? `
            <div data-lang="en" style="display:none">${en.actionBlock}</div>` : ""}
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
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(ogDesc)}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${ogUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(ogDesc)}" />
    <meta name="twitter:image" content="${ogImage}" />
    ${cdn}
  </head>
  <body class="bg-slate-950 text-slate-200 w-screen flex flex-col select-none" style="height:100svh;height:100dvh;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)">
    
    <!-- Top Bar -->
    <header class="page-header fixed top-0 w-full z-50 flex items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <a href="${escapeHtml(reportHref || "../../devsecnews-2026-01-node-java.html")}" class="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Report
      </a>
      <div class="flex items-center gap-3">
        <div class="text-xs font-mono text-slate-600">
          <span class="hidden sm:inline">← DRAG or SCROLL →</span>
          <span class="sm:hidden">← SWIPE →</span>
        </div>
        <button id="lang-toggle" class="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-slate-300" title="Toggle language">
          <span data-lang-label="ko">🇰🇷 KO</span>
          <span data-lang-label="en" style="display:none">🇺🇸 EN</span>
        </button>
      </div>
    </header>

    <script>
      // Language toggle (ko ↔ en)
      (function() {
        let currentLang = 'ko';
        document.addEventListener('DOMContentLoaded', () => {
          const btn = document.getElementById('lang-toggle');
          if (!btn) return;
          btn.addEventListener('click', () => {
            const next = currentLang === 'ko' ? 'en' : 'ko';
            document.querySelectorAll('[data-lang]').forEach(el => {
              el.style.display = el.getAttribute('data-lang') === next ? '' : 'none';
            });
            document.querySelectorAll('[data-lang-label]').forEach(el => {
              el.style.display = el.getAttribute('data-lang-label') === next ? '' : 'none';
            });
            currentLang = next;
          });
        });
      })();
    </script>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('locked');
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
        let autoRotate = false;
        let lastTs = 0;
        let spacing = 220;
        const autoSpeed = 0.18; // cards / sec

        const isMobile = () => window.innerWidth <= 640;
        /* visualViewport gives the real visible area (accounts for Safari bars) */
        const vh = () => (window.visualViewport ? window.visualViewport.height : window.innerHeight);
        const layout = () => {
          const baseW = Math.max(240, Math.round(cards[0].getBoundingClientRect().width || 360));
          spacing = Math.round(baseW * (isMobile() ? 0.44 : 0.62));
          const h = vh();
          const ringH = isMobile()
            ? Math.max(320, Math.round(h * 0.65))
            : Math.max(500, Math.round(h * 0.78));
          ring.style.height = ringH + "px";
        };

        const render = () => {
          for (let i = 0; i < n; i += 1) {
            const card = cards[i];
            const d = wrapDelta(i, position);
            const ad = Math.abs(d);
            const x = Math.round(d * spacing);
            const z = Math.round(320 - ad * 130);
            const rotateY = clamp(d * -42, -62, 62);
            const scale = 1 - Math.min(0.26, ad * 0.11);
            const opacity = Math.max(0.25, 1 - Math.min(0.75, ad * 0.25));
            card.style.cssText = "position:absolute;left:50%;top:50%;"
              + "transform:translate3d(calc(-50% + " + x + "px),-50%," + z + "px) rotateY(" + rotateY + "deg) scale(" + scale + ");"
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
          autoResumeTimer = setTimeout(() => { startLoop(); }, 4000);
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
        if (window.visualViewport) {
          window.visualViewport.addEventListener("resize", () => { layout(); render(); });
        }

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

function rewriteCardsWithCodex(cards, { attempts, model, guidelinePath, keepTmp }) {
  const codexBin = findExecutable("codex");
  if (!codexBin) {
    console.warn("copy rewrite: codex CLI not found");
    return null;
  }
  if (!fs.existsSync(guidelinePath)) {
    console.warn(`copy rewrite: guideline not found (${guidelinePath})`);
    return null;
  }
  const guideline = fs.readFileSync(guidelinePath, "utf8");
  const basePayload = cards.map((c, idx) => ({
    idx,
    kind: c.kind,
    header: c.header || "",
    title: c.title || "",
    bodyMd: c.bodyMd || "",
    whyMd: c.whyMd || "",
    impactMd: c.impactMd || "",
    actionMd: c.actionMd || "",
    source: c.source || "",
  }));

  const tmpDir = path.join(outDir, ".copy-rewrite-tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    const candidates = [];
    for (let i = 0; i < attempts; i += 1) {
      const attemptNo = i + 1;
      const prompt = buildCopyPrompt({
        guideline,
        payload: basePayload,
        mode: "draft",
        attemptNo,
      });
      const parsed = runCodexForCopy({
        codexBin,
        prompt,
        tmpDir,
        runTag: `attempt-${attemptNo}`,
        model,
      });
      if (!parsed) continue;
      const normalized = normalizeRewrittenCards(parsed, cards.length);
      if (!normalized) continue;
      const score = scoreCopyCards(normalized);
      candidates.push({ score, cards: applyRewrites(cards, normalized) });
    }

    if (!candidates.length) return null;
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0].cards;

    const refinePrompt = buildCopyPrompt({
      guideline,
      payload: best.map((c, idx) => ({
        idx,
        kind: c.kind,
        header: c.header || "",
        title: c.title || "",
        bodyMd: c.bodyMd || "",
        whyMd: c.whyMd || "",
        impactMd: c.impactMd || "",
        actionMd: c.actionMd || "",
        source: c.source || "",
      })),
      mode: "refine",
      attemptNo: 0,
    });
    const refined = runCodexForCopy({
      codexBin,
      prompt: refinePrompt,
      tmpDir,
      runTag: "refine",
      model,
    });
    const normalizedRefined = refined
      ? normalizeRewrittenCards(refined, cards.length)
      : null;
    return normalizedRefined ? applyRewrites(cards, normalizedRefined) : best;
  } finally {
    if (!keepTmp) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}

function buildCopyPrompt({ guideline, payload, mode, attemptNo }) {
  const modeInstruction =
    mode === "refine"
      ? "리라이트 전용 패스다. 정보(사실/숫자/고유명사/링크)를 절대 바꾸지 말고 문장만 자연스럽게 다듬어라."
      : `초안+리라이트 2패스를 내부에서 수행하고 최종 결과만 출력해라. 현재 시도 번호는 ${attemptNo}다.`;
  return `${guideline}

${modeInstruction}
출력은 JSON 객체 하나만 허용한다. 코드블록/설명문을 절대 추가하지 말고 아래 스키마를 정확히 지켜라.
{
  "cards": [
    {
      "idx": 0,
      "title": "...",
      "bodyMd": "...",
      "whyMd": "...",
      "impactMd": "...",
      "actionMd": "..."
    }
  ]
}

입력 카드(JSON):
${JSON.stringify(payload, null, 2)}
`;
}

function runCodexForCopy({ codexBin, prompt, tmpDir, runTag, model }) {
  const promptFile = path.join(tmpDir, `${runTag}.prompt.txt`);
  const outputFile = path.join(tmpDir, `${runTag}.out.txt`);
  fs.writeFileSync(promptFile, prompt, "utf8");
  const modelFlag = model ? ` --model ${shellQuote(model)}` : "";
  const cmd = `${shellQuote(codexBin)} exec --skip-git-repo-check --sandbox workspace-write${modelFlag} --output-last-message ${shellQuote(outputFile)} - < ${shellQuote(promptFile)}`;
  try {
    execSync(cmd, { stdio: "pipe", timeout: 180000 });
  } catch (e) {
    console.warn(`copy rewrite: codex exec failed (${runTag}): ${e.message}`);
    return null;
  }
  if (!fs.existsSync(outputFile)) return null;
  const raw = fs.readFileSync(outputFile, "utf8");
  return parseJsonObject(raw);
}

function parseJsonObject(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fence ? fence[1] : raw).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first === -1 || last === -1 || last <= first) return null;
    try {
      return JSON.parse(candidate.slice(first, last + 1));
    } catch {
      return null;
    }
  }
}

function normalizeRewrittenCards(obj, expectedLen) {
  if (!obj || typeof obj !== "object") return null;
  if (!Array.isArray(obj.cards) || obj.cards.length !== expectedLen) return null;
  const out = [];
  for (const item of obj.cards) {
    const idx = Number(item?.idx);
    if (!Number.isInteger(idx) || idx < 0 || idx >= expectedLen) return null;
    out.push({
      idx,
      title: String(item?.title ?? "").trim(),
      bodyMd: String(item?.bodyMd ?? "").trim(),
      whyMd: String(item?.whyMd ?? "").trim(),
      impactMd: String(item?.impactMd ?? "").trim(),
      actionMd: String(item?.actionMd ?? "").trim(),
    });
  }
  out.sort((a, b) => a.idx - b.idx);
  return out;
}

function applyRewrites(cards, rewritten) {
  return cards.map((c, idx) => {
    const r = rewritten[idx];
    if (!r) return c;
    return {
      ...c,
      title: r.title || c.title,
      bodyMd: r.bodyMd || c.bodyMd,
      whyMd: r.whyMd || c.whyMd,
      impactMd: r.impactMd || c.impactMd,
      actionMd: r.actionMd || c.actionMd,
    };
  });
}

function scoreCopyCards(cards) {
  const banned = [
    "다음과 같습니다",
    "기반으로",
    "최적",
    "솔루션",
    "효율",
    "또한",
    "따라서",
    "전반적으로",
  ];
  const endingBag = [];
  let penalty = 0;
  for (const c of cards) {
    const text = [c.title, c.bodyMd, c.whyMd, c.impactMd, c.actionMd]
      .map((v) => String(v || ""))
      .join(" ");
    for (const word of banned) {
      if (text.includes(word)) penalty += 8;
    }
    const endings = text.match(/[가-힣]+\s*(?:요|다)\./g) || [];
    for (const e of endings) endingBag.push(e.trim());
    if (text.length > 220) penalty += 2;
  }
  let repeatPenalty = 0;
  for (let i = 2; i < endingBag.length; i += 1) {
    if (endingBag[i] === endingBag[i - 1] && endingBag[i - 1] === endingBag[i - 2]) {
      repeatPenalty += 6;
    }
  }
  return 100 - penalty - repeatPenalty;
}

function findExecutable(bin) {
  try {
    const out = execSync(`command -v ${shellQuote(bin)}`, { stdio: "pipe" })
      .toString()
      .trim();
    return out || "";
  } catch {
    return "";
  }
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
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
  if (v === "insight") return "insight";
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
  if (domain === "insight") return "Lessons Learned";
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
