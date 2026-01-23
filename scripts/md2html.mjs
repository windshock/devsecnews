import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import hljs from "highlight.js";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { parseArgs, getMonth, defaultInput } from "./cli.mjs";

function usageAndExit() {
  console.error(
    "Usage:\n  node scripts/md2html.mjs <input.md> [output.html]\n  node scripts/md2html.mjs --month YYYY-MM\n\nExamples:\n  node scripts/md2html.mjs devsecnews-2026-01-node-java.md\n  node scripts/md2html.mjs in.md out.html\n  node scripts/md2html.mjs --month 2026-01"
  );
  process.exit(2);
}

const { flags, positionals } = parseArgs(process.argv.slice(2));
if (flags.help) usageAndExit();

const month = getMonth(flags);
const input = flags.input ?? positionals[0] ?? defaultInput(month);
const output =
  flags.output ??
  positionals[1] ??
  path.basename(input, path.extname(input)) + ".html";

if (!input.endsWith(".md")) usageAndExit();
if (!fs.existsSync(input)) {
  console.error(`Input file not found: ${input}`);
  process.exit(1);
}

const md = fs.readFileSync(input, "utf8");

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
  })
);
const slugCounts = new Map();
function slugify(raw) {
  const base = String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const key = base || "section";
  const count = slugCounts.get(key) || 0;
  slugCounts.set(key, count + 1);
  return count ? `${key}-${count}` : key;
}
const renderer = new marked.Renderer();
renderer.heading = (text, level, raw) => {
  const id = slugify(raw);
  return `<h${level} id="${id}">${text}</h${level}>`;
};
marked.setOptions({ gfm: true, breaks: false, mangle: false, headerIds: true, renderer });

const parts = splitByHeadings(md);
const htmlPrelude = marked.parse(parts.prelude);
const htmlNode = parts.node ? marked.parse(parts.node) : "";
const htmlJava = parts.java ? marked.parse(parts.java) : "";
const htmlRest = marked.parse(parts.rest);

const githubMarkdownCss = readOptionalTextFile(
  path.join("node_modules", "github-markdown-css", "github-markdown.css")
);
// GitHub-style code theme (light). This stays readable in most wiki/Teams embeds.
const hljsCssLight = readOptionalTextFile(
  path.join("node_modules", "highlight.js", "styles", "github.css")
);
const hljsCssDark = readOptionalTextFile(
  path.join("node_modules", "highlight.js", "styles", "github-dark.css")
);

const css = `
  @keyframes slideUpFade {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .report-wrap {
    animation: slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  :root {
    --bg-body: #0a0f17;
    --text-body: #e6edf3;
    --text-muted: #9aa4b2;
    --bg-topbar: rgba(10,15,23,0.92);
    --border-color: rgba(95,125,155,0.35);
    --bg-code: #0f172a;
    --code-border: rgba(148,163,184,0.25);
    --btn-hover: rgba(148,163,184,0.14);
    --btn-active: rgba(148,163,184,0.22);
    --highlight-bg: rgba(34,211,238,0.14);
    --highlight-text: #22d3ee;
    --accent-pink: #f472b6;
    --accent-green: #22c55e;
    --panel-bg: rgba(15,23,42,0.78);
    --panel-border: rgba(148,163,184,0.25);
    --surface: rgba(2,6,23,0.6);
    --surface-strong: rgba(2,6,23,0.85);
    color-scheme: light dark;
  }

  @media (prefers-color-scheme: light) {
    :root {
      --bg-body: #f7f5ef;
      --text-body: #0f172a;
      --text-muted: #475569;
      --bg-topbar: rgba(247,245,239,0.9);
      --border-color: rgba(148,163,184,0.45);
      --bg-code: #f1f5f9;
      --code-border: rgba(15,23,42,0.12);
      --btn-hover: rgba(15,23,42,0.06);
      --btn-active: rgba(15,23,42,0.12);
      --highlight-bg: rgba(14,165,233,0.12);
      --highlight-text: #0ea5e9;
      --accent-pink: #db2777;
      --accent-green: #16a34a;
      --panel-border: rgba(15,23,42,0.12);
      --surface: rgba(255,255,255,0.8);
      --surface-strong: rgba(255,255,255,0.95);
    }
    body {
      background:
        radial-gradient(1000px 600px at 8% -10%, rgba(14,165,233,0.16), transparent 60%),
        radial-gradient(900px 600px at 92% -5%, rgba(219,39,119,0.12), transparent 55%),
        radial-gradient(600px 600px at 50% 120%, rgba(34,197,94,0.10), transparent 60%),
        var(--bg-body);
    }
    }
    body::before { opacity: 0.06; }
    .markdown-body {
      background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
      box-shadow: 0 12px 26px rgba(15,23,42,0.12);
      border: 1px solid rgba(15,23,42,0.12);
      border-top: 0;
      border-radius: 0 0 20px 20px;
    }
    .hero {
      background: rgba(255,255,255,0.9);
      border: 1px solid rgba(14,165,233,0.2);
      border-bottom: 0;
      border-radius: 20px 20px 0 0;
    }
    .nav-pill {
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(15,23,42,0.12);
    }
    .nav-btn {
      color: #0f172a;
      border: 1px solid rgba(14,165,233,0.25);
      background: rgba(255,255,255,0.95);
      height: 30px;
    }
    .nav-center { color: #0ea5e9; }
    .ansi-line { color: #0ea5e9; text-shadow: none; }
  }

  body {
    margin: 0;
    background:
      radial-gradient(1200px 600px at 8% -10%, rgba(34,211,238,0.18), transparent 60%),
      radial-gradient(900px 500px at 92% -5%, rgba(244,114,182,0.12), transparent 55%),
      radial-gradient(600px 600px at 50% 120%, rgba(34,197,94,0.08), transparent 60%),
      var(--bg-body);
    color: var(--text-body);
    font-family: "IBM Plex Sans", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif;
    line-height: 1.6;
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
        rgba(255,255,255,0.04),
        rgba(255,255,255,0.04) 1px,
        transparent 1px,
        transparent 3px
      );
    opacity: 0.12;
    mix-blend-mode: soft-light;
  }
  main { max-width: 1080px; margin: 0 auto; padding: 72px 16px 60px; position: relative; }
  .hero {
    margin: 0;
    padding: 8px 14px;
    border-radius: 20px 20px 0 0;
    border: 1px solid rgba(34,211,238,0.25);
    border-bottom: 0;
    background: rgba(2,6,23,0.85);
    box-shadow: 0 10px 24px rgba(0,0,0,0.3);
  }
  .ansi-line {
    font-family: "JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    color: #7dd3fc;
    text-shadow: 0 0 10px rgba(34,211,238,0.35);
    white-space: nowrap;
    overflow: hidden;
    line-height: 1;
  }
  .markdown-body {
    box-sizing: border-box;
    min-width: 200px;
    color: #0b1220;
    background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
    border: 1px solid rgba(15,23,42,0.12);
    border-top: 0;
    border-radius: 0 0 20px 20px;
    padding: 18px;
    box-shadow: 0 18px 40px rgba(2,6,23,0.18);
  }
  .markdown-body a { color: #0ea5e9; }
  .markdown-body code, .markdown-body pre code { color: #0b1220; }
  .markdown-body h1, .markdown-body h2, .markdown-body h3 {
    font-family: "IBM Plex Sans", "Pretendard", "Noto Sans KR", system-ui, sans-serif;
    letter-spacing: -0.01em;
  }
  .markdown-body table { display: table; width: 100%; border-collapse: collapse; }
  .markdown-body th, .markdown-body td {
    border: 1px solid var(--border-color);
    padding: 8px 10px;
  }
  .markdown-body th {
    background: rgba(248,250,252,0.95);
    color: #0b1220;
  }
  .markdown-body td {
    background: rgba(248,250,252,0.9);
    color: #0b1220;
  }
  .markdown-body blockquote {
    border-left: 3px solid #94a3b8;
    background: rgba(248,250,252,0.9);
    padding: 10px 12px;
    border-radius: 10px;
    color: #0b1220;
  }
  
  /* Code blocks */
  .markdown-body pre {
    padding: 12px;
    border-radius: 10px;
    overflow: auto;
    background: var(--bg-code);
    border: 1px solid var(--code-border);
    box-shadow: inset 0 0 0 1px rgba(34,211,238,0.06);
  }
  /* Code blocks: bad vs good contrast (driven by JS classes on .codeblock) */
  .codeblock.bad pre {
    background: rgba(207,34,46,0.06);
    border-color: rgba(207,34,46,0.20);
  }
  .codeblock.good pre {
    background: rgba(26,127,55,0.06);
    border-color: rgba(26,127,55,0.20);
  }
  .markdown-body code, .markdown-body pre code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.92em;
    background: transparent;
  }
  a { word-break: break-all; color: var(--highlight-text); }
  .topbar {
    position: fixed;
    top: 14px;
    left: 14px;
    right: 14px;
    z-index: 30;
    background: transparent;
  }
  .ansi-topbar {
    font-family: "JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    color: #7dd3fc;
    letter-spacing: 0.4px;
  }
  .topbar-inner {
    max-width: 1080px;
    margin: 0 auto;
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
  }
  .nav-pill {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    background: rgba(10,15,23,0.92);
    border: 1px solid rgba(148,163,184,0.25);
    border-radius: 999px;
    padding: 8px 10px;
    backdrop-filter: blur(10px);
  }
  .nav-btn {
    appearance: none;
    border: 1px solid rgba(34,211,238,0.3);
    background: rgba(2,6,23,0.7);
    color: #e2e8f0;
    border-radius: 999px;
    padding: 0 12px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    height: 30px;
    line-height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
  }
  .hint {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .tocPanel {
    position: fixed;
    right: 16px;
    top: 64px;
    z-index: 30;
    width: 260px;
    max-height: calc(100vh - 96px);
    overflow: auto;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: var(--surface);
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    padding: 10px 12px;
    display: none;
  }
  body[data-toc="open"] .tocPanel { display: block; }
  .tocPanel h4 {
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--text-muted);
  }
  .tocPanel a {
    display: block;
    color: var(--text-body);
    text-decoration: none;
    font-size: 13px;
    padding: 4px 2px;
  }
  .tocPanel a:hover { color: var(--highlight-text); }
  .tocPanel .toc-l2 { padding-left: 8px; }
  .tocPanel .toc-l3 { padding-left: 16px; }
  /* Code copy button */
  .codeblock {
    position: relative;
    margin-bottom: 16px;
  }
  .copyBtn {
    position: absolute;
    top: 8px;
    right: 8px;
    appearance: none;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--surface);
    opacity: 0.8;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    color: var(--text-body);
  }
  .copyBtn:active { transform: translateY(1px); }
  .copyBtn[aria-disabled="true"] {
    opacity: 0.6;
    cursor: not-allowed;
  }
  @media (hover: hover) {
    .codeblock .copyBtn { opacity: 0; transition: opacity 0.2s; }
    .codeblock:hover .copyBtn { opacity: 1; }
  }
  /* Jump affordance */
  .jumpHint {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 6px;
    padding: 4px 8px;
    background: rgba(34,211,238,0.12);
    border-radius: 6px;
    display: inline-block;
  }
  .view-summary { display: none; }
  .view-node { display: none; }
  .view-java { display: none; }
  .view-rest { display: none; }

  /* Responsive (mobile-first adjustments) */
  @media (max-width: 720px) {
    main { padding: 16px 16px 96px; }
    .topbar {
      position: fixed;
      bottom: 10px;
      left: 10px;
      right: 10px;
      top: auto;
      background: transparent;
      z-index: 30;
    }
    .topbar-inner { flex-wrap: wrap; }
    .markdown-body { font-size: 16px; line-height: 1.6; }
    .markdown-body h1 { font-size: 1.6em; }
    
    .tocPanel {
      right: 10px;
      left: 10px;
      width: auto;
      top: 80px;
      max-height: 55vh;
    }
    
    
    /* Tables: horizontal scroll */
    .markdown-body table { display: block; width: 100%; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; }
    .copyBtn { top: 6px; right: 6px; opacity: 1; padding: 6px 10px; }
  }

  body[data-view="all"] .view-summary { display: block; }
  body[data-view="all"] .view-node { display: block; }
  body[data-view="all"] .view-java { display: block; }
  body[data-view="all"] .view-rest { display: block; }

  body[data-view="summary"] .view-summary { display: block; }
  body[data-view="node"] .view-node { display: block; }
  body[data-view="java"] .view-java { display: block; }
  ${githubMarkdownCss}
  ${hljsCssLight}
  @media (prefers-color-scheme: dark) {
    ${hljsCssDark}
  }
  @media (prefers-color-scheme: dark) {
    /* Force readable text inside light report panel on dark theme */
    .markdown-body,
    .markdown-body p,
    .markdown-body li,
    .markdown-body td,
    .markdown-body th {
      color: #0b1220;
    }
    .markdown-body code,
    .markdown-body pre code {
      color: #0b1220;
    }
    .markdown-body a { color: #0ea5e9; }
  }
`;

const title = path.basename(input);

const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>${css}</style>
  </head>
  <body data-view="all">
    <div class="topbar ansi-topbar">
      <div class="topbar-inner" aria-label="상단 내비게이션">
        <div class="nav-pill nav-left">
          <button type="button" class="nav-btn" id="view-toggle" aria-label="보기 모드">보기: 전체</button>
        </div>
        <div class="nav-pill nav-right">
          <button type="button" class="nav-btn" id="tts-toggle" aria-label="읽기">읽기</button>
          <button type="button" class="nav-btn" id="toc-toggle" aria-label="목차">목차</button>
        </div>
      </div>
    </div>
    <div class="tocPanel" id="toc-panel" aria-label="목차">
      <h4>목차</h4>
      <div id="toc-list"></div>
    </div>
    <main>
      <div class="hero ansi-bar">
        <div class="ansi-line">┌─ DEVSECNEWS ─ REPORT ───────────────────────────────────────┐</div>
      </div>
        <article class="markdown-body">
<section class="view-summary" data-view-section="summary">
${htmlPrelude}
</section>
<section class="view-node" data-view-section="node">
${htmlNode}
</section>
<section class="view-java" data-view-section="java">
${htmlJava}
</section>
<section class="view-rest" data-view-section="rest">
${htmlRest}
</section>
      </article>
      </div>
    </main>
    <script>
      (function () {
        const KEY = "devsecnews:view";
        const viewToggle = document.getElementById("view-toggle");
        const tocToggle = document.getElementById("toc-toggle");
        const tocPanel = document.getElementById("toc-panel");
        const tocList = document.getElementById("toc-list");

        function setView(v, persist) {
          if (!["summary","all","node","java"].includes(v)) v = "all";
          document.body.dataset.view = v;
          if (viewToggle) viewToggle.textContent = "보기: " + (v === "all" ? "전체" : v === "summary" ? "요약" : v === "node" ? "Node.js" : "Java");
          if (persist) {
            try { localStorage.setItem(KEY, v); } catch {}
          }
          // Keep URL navigable/bookmarkable without reloading.
          try { history.replaceState(null, "", v === "all" ? "#all" : ("#" + v)); } catch {}
          // If speaking, restart to read the newly visible section only.
          if (speaking) startTts();
          buildToc();
        }

        function getSectionsForView(view) {
          if (view === "summary") return [document.querySelector(".view-summary")];
          if (view === "node") return [document.querySelector(".view-node")];
          if (view === "java") return [document.querySelector(".view-java")];
          return [
            document.querySelector(".view-summary"),
            document.querySelector(".view-node"),
            document.querySelector(".view-java"),
            document.querySelector(".view-rest"),
          ];
        }

        function buildToc() {
          if (!tocList) return;
          const view = document.body.dataset.view || "all";
          const sections = getSectionsForView(view);
          const items = [];
          for (const s of sections) {
            if (!s) continue;
            const heads = Array.from(s.querySelectorAll("h1,h2,h3"));
            for (const h of heads) {
              const text = (h.innerText || h.textContent || "").trim();
              if (!text) continue;
              if (!h.id) continue;
              items.push({ level: h.tagName.toLowerCase(), text, id: h.id });
            }
          }
          tocList.innerHTML = "";
          if (!items.length) {
            const empty = document.createElement("div");
            empty.style.fontSize = "13px";
            empty.style.color = "var(--text-muted)";
            empty.textContent = "표시할 목차가 없습니다.";
            tocList.appendChild(empty);
            return;
          }
          for (const it of items) {
            const a = document.createElement("a");
            a.href = "#" + it.id;
            a.textContent = it.text;
            a.className = it.level === "h2" ? "toc-l2" : (it.level === "h3" ? "toc-l3" : "");
            a.addEventListener("click", () => {
              document.body.dataset.toc = "";
            });
            tocList.appendChild(a);
          }
        }

        if (tocToggle && tocPanel) {
          tocToggle.addEventListener("click", () => {
            const open = document.body.dataset.toc === "open";
            document.body.dataset.toc = open ? "" : "open";
          });
        }

        // Code block: add copy buttons
        (function initCopyButtons() {
          const blocks = Array.from(document.querySelectorAll("pre"));
          for (const pre of blocks) {
            const code = pre.querySelector("code");
            if (!code) continue;
            // Wrap to position button
            if (!pre.parentElement || pre.parentElement.classList.contains("codeblock")) continue;
            const wrap = document.createElement("div");
            wrap.className = "codeblock";
            pre.parentElement.insertBefore(wrap, pre);
            wrap.appendChild(pre);

            // Tag codeblock based on preceding label text (Korean)
            // Typical Markdown structure is: <p>안 좋은 예:</p><pre>...</pre>
            // or: <p>안전한 대안:</p><pre>...</pre>
            const prev = wrap.previousElementSibling;
            const prevText = (prev && (prev.innerText || prev.textContent) ? (prev.innerText || prev.textContent) : "").trim();
            if (prevText.startsWith("안 좋은 예")) wrap.classList.add("bad");
            if (prevText.startsWith("안전한 대안")) wrap.classList.add("good");

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "copyBtn";
            btn.textContent = "복사";
            btn.setAttribute("aria-label", "코드 복사");
            wrap.appendChild(btn);

            btn.addEventListener("click", async () => {
              const text = (code.innerText || code.textContent || "").trimEnd();
              if (!text) return;
              try {
                await navigator.clipboard.writeText(text);
                const old = btn.textContent;
                btn.textContent = "복사됨";
                setTimeout(() => (btn.textContent = old), 900);
              } catch {
                // Fallback
                try {
                  const ta = document.createElement("textarea");
                  ta.value = text;
                  ta.style.position = "fixed";
                  ta.style.left = "-9999px";
                  document.body.appendChild(ta);
                  ta.focus();
                  ta.select();
                  document.execCommand("copy");
                  document.body.removeChild(ta);
                  const old = btn.textContent;
                  btn.textContent = "복사됨";
                  setTimeout(() => (btn.textContent = old), 900);
                } catch {
                  btn.setAttribute("aria-disabled", "true");
                }
              }
            });
          }
        })();

        // Checklist → details jump (by Source URL)
        (function initChecklistJump() {
          const summary = document.querySelector(".view-summary");
          if (!summary) return;

          // Find the checklist section by heading text.
          const h = Array.from(summary.querySelectorAll("h1,h2,h3")).find((x) =>
            (x.innerText || "").includes("(5) 이번 달 개발자 체크리스트")
          );
          if (!h) return;

          const ol = h.nextElementSibling && h.nextElementSibling.tagName === "OL"
            ? h.nextElementSibling
            : summary.querySelector("ol");
          if (!ol) return;

          // Add a tiny hint once.
          if (!summary.querySelector(".jumpHint")) {
            const hint = document.createElement("div");
            hint.className = "jumpHint";
            hint.textContent = "체크리스트 항목을 클릭하면 본문으로 이동합니다.";
            ol.parentElement.insertBefore(hint, ol.nextSibling);
          }

          const items = Array.from(ol.querySelectorAll("li"));
          for (const li of items) {
            li.style.cursor = "pointer";
            li.addEventListener("click", () => {
              // Use the first external source URL inside the checklist item.
              const a = li.querySelector('a[href^="http"]');
              if (!a) return;
              const href = a.getAttribute("href");
              if (!href) return;

              // Show full doc so target is visible, then scroll.
              setView("all", true);

              // Find same href elsewhere (skip the one inside the checklist item).
              const links = Array.from(document.querySelectorAll('a[href="' + href.replace(/"/g, '\\"') + '"]'));
              let target = null;
              for (const l of links) {
                if (li.contains(l)) continue;
                target = l;
                break;
              }
              if (!target) return;

              // Scroll to nearest heading for context.
              const heading = target.closest("section")?.querySelector("h1,h2,h3") || target.closest("h1,h2,h3");
              (heading || target).scrollIntoView({ behavior: "smooth", block: "start" });
            });
          }
        })();

        // TTS (Web Speech API)
        const synth = window.speechSynthesis;
        const ttsBtn = document.getElementById("tts-toggle");
        const rateSel = null;
        const voiceSel = null;
        const skipUrlsChk = null;
        const skipRefsChk = null;
        let queue = [];
        let speaking = false;
        let ttsState = "idle"; // idle | playing | paused

        function getActiveView() {
          return document.body.dataset.view || "all";
        }

        function extractReadableLines(root, opts) {
          const lines = [];
          if (!root) return lines;

          const stopAtRefs = !!opts.stopAtRefs;
          const skipUrls = !!opts.skipUrls;
          const nodes = root.querySelectorAll("h1,h2,h3,p,li");
          for (const el of nodes) {
            // Skip code and tables.
            if (el.closest("pre, code, table")) continue;
            let t = (el.innerText || "").trim();
            if (!t) continue;
            if (stopAtRefs && /참고자료/.test(t)) break;

            // Remove trailing [Source] ... from a line (keeps the readable sentence).
            const srcIdx = t.lastIndexOf(" [Source] ");
            if (srcIdx !== -1) t = t.slice(0, srcIdx).trim();

            // Drop standalone source lines or URL-only lines.
            // NOTE: This script is embedded into an HTML template string, so avoid regex literals
            // containing backslash escapes unless they are double-escaped.
            if (t.startsWith("[Source]")) continue;
            if ((t.startsWith("http://") || t.startsWith("https://")) && !t.includes(" ")) continue;

            // If URL skipping is enabled, strip URL-like tokens embedded in text.
            if (skipUrls) {
              const normalized = t.replaceAll("\\n", " ").replaceAll("\\t", " ");
              const parts = normalized.split(" ");
              const out = [];
              for (const raw of parts) {
                const tok = raw.trim();
                if (!tok) continue;
                if (tok.startsWith("http://") || tok.startsWith("https://")) continue;
                out.push(tok);
              }
              t = out.join(" ").trim();
            }

            // Minor cleanup for TTS: remove inline code backticks.
            // NOTE: This JS snippet lives inside an HTML template string in this script,
            // so we must not embed a raw backtick character here.
            const BT = String.fromCharCode(96);
            t = t.split(BT).join("").trim();

            if (!t) continue;
            lines.push(t);
          }
          return lines;
        }

        function buildTextForCurrentView() {
          const view = getActiveView();
          const sections = getSectionsForView(view);
          const stopAtRefs = !!(skipRefsChk && skipRefsChk.checked);
          const skipUrls = !!(skipUrlsChk && skipUrlsChk.checked);
          const lines = [];
          for (const s of sections) {
            lines.push(...extractReadableLines(s, { stopAtRefs, skipUrls }));
          }
          return lines.join("\\n");
        }

        function chunkText(text) {
          const cleaned = text
            .replace(/\\s+\\n/g, "\\n")
            .replace(/\\n{3,}/g, "\\n\\n")
            .trim();
          if (!cleaned) return [];

          // Prefer Intl.Segmenter sentence splitting (more natural for Korean).
          let sentences = [];
          try {
            if (typeof Intl !== "undefined" && Intl.Segmenter) {
              const seg = new Intl.Segmenter("ko", { granularity: "sentence" });
              sentences = Array.from(seg.segment(cleaned))
                .map((x) => String(x.segment || "").trim())
                .filter(Boolean);
            }
          } catch {}

          // Fallback: split by paragraphs and punctuation.
          if (!sentences.length) {
            const paras = cleaned.split(/\\n\\n+/);
            for (const p of paras) {
              const sents = p
                .split(/(?<=[\\.!?])\\s+|\\n+/)
                .map((s) => s.trim())
                .filter(Boolean);
              sentences.push(...sents);
            }
          }

          // Merge sentences into small utterances (shorter sounds more natural and avoids long-utterance bugs).
          const chunks = [];
          let buf = "";
          for (const s of sentences) {
            const next = (buf ? buf + " " : "") + s;
            if (next.length > 180 && buf) {
              chunks.push(buf);
              buf = s;
            } else {
              buf = next;
            }
          }
          if (buf) chunks.push(buf);
          return chunks;
        }

        function populateVoices() {
          if (!voiceSel) return;
          const voices = synth.getVoices ? synth.getVoices() : [];
          // Clear, keep auto.
          const keep0 = voiceSel.options[0];
          voiceSel.innerHTML = "";
          voiceSel.appendChild(keep0);

          // Prefer Korean first.
          const ko = voices.filter(v => (v.lang || "").toLowerCase().startsWith("ko"));
          const rest = voices.filter(v => !(v.lang || "").toLowerCase().startsWith("ko"));
          const ordered = [...ko, ...rest];
          for (const v of ordered) {
            const opt = document.createElement("option");
            opt.value = v.name;
            opt.textContent = v.name + " (" + v.lang + ")";
            voiceSel.appendChild(opt);
          }
        }

        function pickVoice() {
          const voices = synth.getVoices ? synth.getVoices() : [];
          if (!voices.length) return null;
          
          const ua = (navigator.userAgent || "").toLowerCase();
          const isSafari = ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium");

          // Prefer Yuna (name match) on all browsers if available.
          const yuna = voices.find(v => String(v.name || "").toLowerCase().includes("yuna"));
          if (yuna) return yuna;

          // Safari: prefer system default Korean voice if available.
          if (isSafari) {
            const koVoices = voices.filter(v => (v.lang || "").toLowerCase().startsWith("ko"));
            const defKo = koVoices.find(v => v.default);
            return defKo || koVoices[0] || voices[0] || null;
          }

          // Fallback: any Korean voice, then first available.
          const ko = voices.find(v => (v.lang || "").toLowerCase().startsWith("ko"));
          return ko || voices[0] || null;
        }

        function setButtonsState() {
          if (!ttsBtn) return;
          ttsBtn.textContent = ttsState === "playing" ? "일시정지" : "읽기";
        }

        function stopTts() {
          try { synth.cancel(); } catch {}
          queue = [];
          speaking = false;
          ttsState = "idle";
          setButtonsState();
        }

        function speakNext() {
          if (!queue.length) {
            speaking = false;
            ttsState = "idle";
            setButtonsState();
            return;
          }
          const text = queue.shift();
          const u = new SpeechSynthesisUtterance(text);
          const v = pickVoice();
          if (v) u.voice = v;
          u.lang = (v && v.lang) ? v.lang : "ko-KR";
          u.rate = rateSel ? Number(rateSel.value || "1") : 1;
          u.pitch = 1;
          u.volume = 1;
          u.onend = () => speakNext();
          u.onerror = () => speakNext();
          speaking = true;
          ttsState = "playing";
          setButtonsState();
          synth.speak(u);
        }

        function startTts() {
          // Resume if paused
          if (ttsState === "paused") {
            synth.resume();
            speaking = true;
            ttsState = "playing";
            setButtonsState();
            return;
          }
          stopTts();
          const text = buildTextForCurrentView();
          queue = chunkText(text);
          if (!queue.length) {
            ttsState = "idle";
            setButtonsState();
            return;
          }
          // Some browsers need a micro-delay after cancel() before speak().
          setTimeout(() => speakNext(), 60);
        }

        if (synth && ttsBtn) {
          populateVoices();
          if (typeof speechSynthesis !== "undefined" && speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => populateVoices();
          }
          ttsBtn.addEventListener("click", () => {
            if (ttsState === "playing") {
              try { synth.pause(); } catch {}
              ttsState = "paused";
              setButtonsState();
              return;
            }
            if (ttsState === "paused") {
              try { synth.resume(); } catch {}
              ttsState = "playing";
              setButtonsState();
              return;
            }
            startTts();
          });
        } else {
          // No TTS support: hide controls
          if (ttsBtn) ttsBtn.style.display = "none";
        }

        // setView is defined above to allow reuse by other UI features.

        if (viewToggle) {
          const order = ["all","summary","node","java"];
          viewToggle.addEventListener("click", () => {
            const cur = document.body.dataset.view || "all";
            const idx = order.indexOf(cur);
            const next = order[(idx + 1) % order.length];
            setView(next, true);
          });
        }

        const hash = (location.hash || "").replace("#", "");
        if (["summary","all","node","java"].includes(hash)) {
          setView(hash, false);
          return;
        }
        try {
          const saved = localStorage.getItem(KEY);
          if (saved) setView(saved, false);
        } catch {}
        buildToc();
      })();
    </script>
  </body>
</html>
`;

fs.mkdirSync(path.dirname(output) === "." ? "." : path.dirname(output), {
  recursive: true,
});
fs.writeFileSync(output, html, "utf8");
console.log(`wrote: ${output}`);

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function readOptionalTextFile(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function listCardPngs(dir) {
  try {
    if (!fs.existsSync(dir)) return [];
    const names = fs.readdirSync(dir, { withFileTypes: true });
    return names
      .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".png"))
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b, "en"));
  } catch {
    return [];
  }
}

function splitByHeadings(md) {
  // Goal: keep Summary/Checklist/Rules visible, and toggle Node/Java blocks.
  // We split using the repo's fixed headings.
  const idxNode = md.indexOf("# (2) Node.js");
  const idxJava = md.indexOf("# (3) Java");
  const idxAfterJava = idxJava !== -1 ? md.length : md.length;

  if (idxNode === -1 || idxJava === -1 || idxJava < idxNode) {
    return { prelude: md, node: "", java: "", rest: "" };
  }

  const prelude = md.slice(0, idxNode);

  // Node: from Node heading up to Java heading
  const node = md.slice(idxNode, idxJava);

  // Java: from Java heading up to end
  // We keep everything after Java as "rest" only if you want common sections always visible.
  // Current doc has common sections after Java, so we keep them as rest to always show them.
  const idxCommon = md.indexOf("# (4) 공통 트렌드/권장사항");
  const idxRefs6 = md.indexOf("# (6) 참고자료");
  const idxRefs7 = md.indexOf("# (7) 참고자료");
  const idxRefs = idxRefs6 !== -1 ? idxRefs6 : idxRefs7;

  if (idxCommon !== -1 && idxCommon > idxJava) {
    const java = md.slice(idxJava, idxCommon);
    const rest = md.slice(idxCommon);
    return { prelude, node, java, rest };
  }

  // Fallback: keep references always visible if present.
  if (idxRefs !== -1 && idxRefs > idxJava) {
    const java = md.slice(idxJava, idxRefs);
    const rest = md.slice(idxRefs);
    return { prelude, node, java, rest };
  }

  return { prelude, node, java: md.slice(idxJava, idxAfterJava), rest: "" };
}
