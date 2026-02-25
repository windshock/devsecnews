import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";
import hljs from "highlight.js";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { parseArgs, getMonth, defaultInput, defaultHtml, DIST_DIR } from "./cli.mjs";

function usageAndExit() {
  console.error(
    "Usage:\n  node scripts/md2html.mjs <input.md> [output.html]\n  node scripts/md2html.mjs --month YYYY-MM [--rewrite-report --report-attempts 3]\n\nExamples:\n  node scripts/md2html.mjs content/devsecnews-2026-01-node-java.md\n  node scripts/md2html.mjs in.md dist/out.html\n  node scripts/md2html.mjs --month 2026-01\n  node scripts/md2html.mjs --month 2026-01 --rewrite-report --report-attempts 3"
  );
  process.exit(2);
}

const { flags, positionals } = parseArgs(process.argv.slice(2));
if (flags.help) usageAndExit();

const month = getMonth(flags);
const input = flags.input ?? positionals[0] ?? defaultInput(month);
const inferredBase = path.basename(input, path.extname(input));
const defaultOut =
  input === defaultInput(month)
    ? defaultHtml(month)
    : path.join(DIST_DIR, `${inferredBase}.html`);
const output = flags.output ?? positionals[1] ?? defaultOut;

if (!input.endsWith(".md")) usageAndExit();
if (!fs.existsSync(input)) {
  console.error(`Input file not found: ${input}`);
  process.exit(1);
}

let md = fs.readFileSync(input, "utf8");
if (flags["rewrite-report"]) {
  const attempts = Math.max(1, Number(flags["report-attempts"] || 3) || 3);
  const rewritten = rewriteReportWithCodex(md, {
    attempts,
    model: typeof flags["report-model"] === "string" ? flags["report-model"] : "",
    guidelinePath:
      typeof flags["report-guideline"] === "string"
        ? flags["report-guideline"]
        : path.join("prompts", "devsecnews-report-copy-editor-skill.md"),
    tempDir: path.join(path.dirname(output), `.report-rewrite-${inferredBase}-tmp`),
    keepTmp: Boolean(flags["report-debug"]),
  });
  if (rewritten) {
    md = rewritten;
    console.log(`report rewrite: applied (${attempts} attempts)`);
  } else {
    console.warn("report rewrite: skipped (fallback to original report)");
  }
}

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

const css = fs.readFileSync(path.join("templates", "report.css"), "utf8");
const githubMarkdownCss = fs.readFileSync(path.join("node_modules", "github-markdown-css", "github-markdown.css"), "utf8");
const hljsCssLight = fs.readFileSync(path.join("node_modules", "highlight.js", "styles", "github.css"), "utf8");
const hljsCssDark = fs.readFileSync(path.join("node_modules", "highlight.js", "styles", "github-dark.css"), "utf8");

// Combine CSS
const combinedCss = `
${githubMarkdownCss}
/* Highlight.js Light */
@media (prefers-color-scheme: light) {
  ${hljsCssLight}
}
/* Highlight.js Dark */
@media (prefers-color-scheme: dark) {
  ${hljsCssDark}
}
${css}
`;


const title = path.basename(input);

const cdn = `
<script src="https://cdn.tailwindcss.com?plugins=typography"></script>
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', 'system-ui', 'sans-serif'],
          mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        },
      }
    }
  }
</script>
<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
  }
  
  /* Smooth anchor scrolling */
  html { scroll-behavior: smooth; }
  
  .details-summary::-webkit-details-marker { display: none; }
</style>
`;

const html = `<!doctype html>
<html lang="ko" class="scroll-pt-24">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    ${cdn}
    <style>${combinedCss}</style>
  </head>
  <body class="bg-gray-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200 antialiased" data-view="all">
    
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      
      <!-- Header -->
      <header class="sticky top-4 z-50 mt-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div class="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase mb-0.5">DevSecNews Report</div>
          <h1 class="text-lg font-bold text-slate-900 dark:text-white leading-tight" id="hero-title">${escapeHtml(title)}</h1>
        </div>
        
        <div class="flex items-center gap-2">
           <button type="button" id="view-toggle" class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">보기: 전체</button>
           <button type="button" id="toc-toggle" class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors lg:hidden">목차</button>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 mt-8 items-start">
        
        <!-- Sidebar TOC -->
        <aside id="toc-panel" class="hidden lg:block sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto w-full p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
          <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">목차</h4>
          <div id="toc-list" class="space-y-1"></div>
        </aside>

        <!-- Main Content -->
        <main class="article w-full min-w-0">
          <article class="prose prose-slate dark:prose-invert max-w-none 
            prose-headings:font-bold prose-headings:tracking-tight
            prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700
            prose-img:rounded-xl prose-img:shadow-lg
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic
          ">
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
        </main>

      </div>
    </div>
    <script>
      (function () {
        const KEY = "devsecnews:view";
        const viewToggle = document.getElementById("view-toggle");
        const tocToggle = document.getElementById("toc-toggle");
        const tocPanel = document.getElementById("toc-panel");
        const tocList = document.getElementById("toc-list");
        const heroTitle = document.getElementById("hero-title");

        function setView(v, persist) {
          if (!["summary","all","node","java"].includes(v)) v = "all";
          document.body.dataset.view = v;
          if (viewToggle) viewToggle.textContent = "보기: " + (v === "all" ? "전체" : v === "summary" ? "요약" : v === "node" ? "Node.js" : "Java");
          if (persist) {
            try { localStorage.setItem(KEY, v); } catch {}
          }
          // URL Update
          try { history.replaceState(null, "", v === "all" ? "#all" : ("#" + v)); } catch {}
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
            tocList.innerHTML = '<div class="text-xs text-slate-500">표시할 목차가 없습니다.</div>';
            return;
          }
          for (const it of items) {
            const a = document.createElement("a");
            a.href = "#" + it.id;
            a.textContent = it.text;
            a.className = "block text-sm py-1 border-l-2 border-transparent pl-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500 transition-all truncate";
            if (it.level === "h3") {
              a.classList.add("ml-3", "text-xs");
            }
            a.addEventListener("click", () => {
              if (window.innerWidth < 1024 && tocPanel) tocPanel.classList.add("hidden");
            });
            tocList.appendChild(a);
          }
        }

        if (tocToggle && tocPanel) {
          tocToggle.addEventListener("click", () => {
            tocPanel.classList.toggle("hidden");
            // Check if it has classes for mobile positioning
            if (!tocPanel.classList.contains("fixed")) {
                tocPanel.classList.add("fixed", "inset-x-4", "top-20", "z-40", "shadow-xl", "bg-white", "dark:bg-slate-900");
                tocPanel.classList.remove("sticky");
            }
          });
        }

        function initHero() {
          // Remove first H1 from content if it matches title
          const firstH1 = document.querySelector(".article h1");
          if (firstH1 && heroTitle && firstH1.textContent.trim() === heroTitle.textContent.trim()) {
            firstH1.remove();
          }
        }

        function formatSourceLinks() {
          const anchors = Array.from(document.querySelectorAll('.article a[href^="http"]'));
          for (const a of anchors) {
             // Basic naive source mapping
             if (a.textContent.trim() === a.href) {
                try {
                    a.textContent = new URL(a.href).hostname.replace(/^www\./, "");
                } catch {}
             }
          }
        }

        function buildSummaryGrid() {
          const summary = document.querySelector(".view-summary");
          if (!summary) return;
          const heading = Array.from(summary.querySelectorAll("h1,h2,h3")).find((x) =>
            (x.textContent || "").includes("(1) Summary")
          );
          if (!heading) return;
          const list = heading.nextElementSibling && heading.nextElementSibling.tagName === "UL"
            ? heading.nextElementSibling
            : null;
          if (!list) return;
          const nodeHeading = document.querySelector(".view-node h1, .view-node h2, .view-node h3");
          const javaHeading = document.querySelector(".view-java h1, .view-java h2, .view-java h3");
          function resolveTargetIdBySourceHref(href, excludeEl) {
            const links = Array.from(document.querySelectorAll('a[href="' + href.replace(/"/g, '\\"') + '"]'));
            for (const l of links) {
              if (excludeEl && excludeEl.contains(l)) continue;
              const heading =
                l.closest("section")?.querySelector("h1,h2,h3") ||
                l.closest("h1,h2,h3");
              if (heading && heading.id) return heading.id;
            }
            return null;
          }
          const items = Array.from(list.querySelectorAll("li"));
          const grid = document.createElement("div");
          grid.className = "summary-grid";
          for (const li of items) {
            const clone = li.cloneNode(true);
            const link = clone.querySelector('a[href^="http"]');
            clone.querySelectorAll("a").forEach((a) => a.remove());
            let text = (clone.textContent || "").replace("[Source]", "").trim();
            if (!text) continue;
            const item = document.createElement("div");
            item.className = "summary-item";
            const h5 = document.createElement("h5");
            h5.textContent = "요약";
            const p = document.createElement("p");
            p.textContent = text;
            item.appendChild(h5);
            item.appendChild(p);
            if (link && link.getAttribute("href")) {
              const a = document.createElement("a");
              a.href = link.getAttribute("href");
              a.target = "_blank";
              a.rel = "noopener";
              a.textContent = "Source · " + new URL(a.href).hostname.replace(/^www\./, "");
              item.appendChild(a);
            }
            const jump = document.createElement("a");
            let target = null;
            if (/node\.?js/i.test(text) && nodeHeading && nodeHeading.id) target = nodeHeading.id;
            if (/java/i.test(text) && javaHeading && javaHeading.id) target = javaHeading.id;
            if (!target && link && link.getAttribute("href")) {
              target = resolveTargetIdBySourceHref(link.getAttribute("href"), li);
            }
            if (target) {
              jump.href = "#" + target;
              jump.textContent = "자세히";
              item.appendChild(jump);
            }
            grid.appendChild(item);
          }
          list.classList.add("summary-list");
          list.hidden = true;
          list.setAttribute("aria-hidden", "true");
          // Remove the list entirely in JS-enabled mode to prevent duplicate rendering.
          list.remove();
          heading.insertAdjacentElement("afterend", grid);
        }

        function buildCallouts() {
          const headings = Array.from(document.querySelectorAll(".markdown-body h2, .markdown-body h3"));
          for (const h of headings) {
            const text = (h.textContent || "").trim();
            if (!/영향 여부 자가진단/.test(text)) continue;
            const parent = h.parentNode;
            if (!parent) continue;
            const callout = document.createElement("div");
            callout.className = "callout";
            const title = document.createElement("div");
            title.className = "callout-title";
            title.textContent = "✅ 빠른 확인";
            callout.appendChild(title);
            parent.insertBefore(callout, h);
            callout.appendChild(h);
            let cur = callout.nextElementSibling;
            while (cur && !/^H[1-3]$/.test(cur.tagName)) {
              const next = cur.nextElementSibling;
              callout.appendChild(cur);
              cur = next;
            }
          }
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
          ol.classList.add("checklist");

          // Add a tiny hint once.
          if (!summary.querySelector(".jumpHint")) {
            const hint = document.createElement("div");
            hint.className = "jumpHint";
            hint.textContent = "체크리스트 항목을 클릭하면 본문으로 이동합니다.";
            ol.parentElement.insertBefore(hint, ol.nextSibling);
          }

          const items = Array.from(ol.querySelectorAll("li"));
          for (const li of items) {
            const link = li.querySelector('a[href^="http"]');
            if (!link) continue;
            const href = link.getAttribute("href");
            if (!href) continue;
            const links = Array.from(document.querySelectorAll('a[href="' + href.replace(/"/g, '\\"') + '"]'));
            let target = null;
            for (const l of links) {
              if (li.contains(l)) continue;
              target = l;
              break;
            }
            if (!target) continue;
            const heading = target.closest("section")?.querySelector("h1,h2,h3") || target.closest("h1,h2,h3");
            if (!heading || !heading.id) continue;
            const clone = li.cloneNode(true);
            clone.querySelectorAll("a").forEach((a) => a.remove());
            let text = (clone.textContent || "").replace("[Source]", "").trim();
            if (!text) continue;
            li.innerHTML = "";
            const jump = document.createElement("a");
            jump.href = "#" + heading.id;
            jump.className = "jump-link";
            jump.textContent = text;
            jump.addEventListener("click", (e) => {
              if (typeof setView === "function") {
                e.preventDefault();
                setView("all", true);
                setTimeout(() => {
                  const target = document.getElementById(heading.id);
                  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 80);
              }
            });
            li.appendChild(jump);
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
        document.body.classList.add("js");
        initHero();
        buildSummaryGrid();
        buildCallouts();
        formatSourceLinks();
        if (window.innerWidth <= 720) document.body.dataset.toc = "closed";
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
if (flags["rewrite-report"]) {
  console.log("report rewrite: enabled");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function rewriteReportWithCodex(originalMd, { attempts, model, guidelinePath, tempDir, keepTmp }) {
  const codexBin = findExecutable("codex");
  if (!codexBin) {
    console.warn("report rewrite: codex CLI not found");
    return null;
  }
  if (!fs.existsSync(guidelinePath)) {
    console.warn(`report rewrite: guideline not found (${guidelinePath})`);
    return null;
  }

  fs.mkdirSync(tempDir, { recursive: true });
  const guideline = fs.readFileSync(guidelinePath, "utf8");
  const maskedCards = maskSegments(
    originalMd,
    /<!--CARD[\s\S]*?-->/g,
    "__CARD_BLOCK_"
  );
  const maskedCodes = maskSegments(
    maskedCards.text,
    /```[\s\S]*?```/g,
    "__CODE_BLOCK_"
  );
  const rewriteInput = maskedCodes.text;
  const restoreTokens = [...maskedCards.tokens, ...maskedCodes.tokens];
  try {
    const candidates = [];
    for (let i = 0; i < attempts; i += 1) {
      const attemptNo = i + 1;
      const prompt = buildReportPrompt({
        guideline,
        md: rewriteInput,
        mode: "draft",
        attemptNo,
      });
      const out = runCodexText({
        codexBin,
        prompt,
        tempDir,
        runTag: `attempt-${attemptNo}`,
        model,
      });
      if (!out) continue;
      const normalized = restoreMaskedSegments(
        normalizeMarkdownOutput(out),
        restoreTokens
      );
      if (!normalized) continue;
      if (!isReportRewriteValid(originalMd, normalized)) continue;
      candidates.push({ score: scoreReportCopy(normalized), md: normalized });
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0].md;

    const refinePrompt = buildReportPrompt({
      guideline,
      md: maskWithTokens(best, restoreTokens),
      mode: "refine",
      attemptNo: 0,
    });
    const refinedRaw = runCodexText({
      codexBin,
      prompt: refinePrompt,
      tempDir,
      runTag: "refine",
      model,
    });
    const refined = refinedRaw
      ? restoreMaskedSegments(normalizeMarkdownOutput(refinedRaw), restoreTokens)
      : "";
    if (refined && isReportRewriteValid(originalMd, refined)) return refined;
    return best;
  } finally {
    if (!keepTmp) fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function buildReportPrompt({ guideline, md, mode, attemptNo }) {
  const modeText =
    mode === "refine"
      ? "리라이트 전용 패스다. 사실/숫자/코드/URL/헤딩/HTML주석(CARD 메타)은 절대 변경하지 말고 자연스러운 한국어 문장으로만 다듬어라."
      : `초안+리라이트 2패스를 내부에서 수행하라. 현재 시도 번호는 ${attemptNo}다.`;
  return `${guideline}

너는 리포트 카피 에디터다.
${modeText}

강제 규칙:
- 출력은 "리라이트된 Markdown 본문만" 반환한다.
- 코드블록(\`\`\`) 내부는 한 글자도 바꾸지 않는다.
- URL 문자열은 원문과 완전히 동일하게 유지한다.
- 헤딩 줄(#...)은 원문과 완전히 동일하게 유지한다.
- <!--CARD ... --> 주석 블록은 원문 그대로 유지한다.
- 불필요한 설명문/코드블록/메타 코멘트 출력 금지.

원문 Markdown:
${md}
`;
}

function runCodexText({ codexBin, prompt, tempDir, runTag, model }) {
  const promptFile = path.join(tempDir, `${runTag}.prompt.txt`);
  const outputFile = path.join(tempDir, `${runTag}.out.txt`);
  fs.writeFileSync(promptFile, prompt, "utf8");
  const modelFlag = model ? ` --model ${shellQuote(model)}` : "";
  const cmd = `${shellQuote(codexBin)} exec --skip-git-repo-check --sandbox workspace-write${modelFlag} --output-last-message ${shellQuote(outputFile)} - < ${shellQuote(promptFile)}`;
  try {
    execSync(cmd, { stdio: "pipe", timeout: 600000 });
  } catch (e) {
    console.warn(`report rewrite: codex exec failed (${runTag}): ${e.message}`);
    return "";
  }
  if (!fs.existsSync(outputFile)) return "";
  return fs.readFileSync(outputFile, "utf8");
}

function normalizeMarkdownOutput(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const fenced = raw.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : raw).trim();
  return body ? `${body}\n` : "";
}

function isReportRewriteValid(originalMd, rewrittenMd) {
  const originalHeadings = extractLines(originalMd, /^#{1,6}\s.*$/gm);
  const rewrittenHeadings = extractLines(rewrittenMd, /^#{1,6}\s.*$/gm);
  if (JSON.stringify(originalHeadings) !== JSON.stringify(rewrittenHeadings)) return false;

  const originalUrls = extractUrls(originalMd);
  const rewrittenUrls = extractUrls(rewrittenMd);
  if (JSON.stringify(originalUrls) !== JSON.stringify(rewrittenUrls)) return false;

  const originalCodes = extractCodeBlocks(originalMd);
  const rewrittenCodes = extractCodeBlocks(rewrittenMd);
  if (JSON.stringify(originalCodes) !== JSON.stringify(rewrittenCodes)) return false;

  const originalCards = extractCardMetaBlocks(originalMd);
  const rewrittenCards = extractCardMetaBlocks(rewrittenMd);
  if (JSON.stringify(originalCards) !== JSON.stringify(rewrittenCards)) return false;

  return true;
}

function extractLines(text, regex) {
  return (String(text || "").match(regex) || []).map((x) => x.trim());
}

function extractUrls(text) {
  return (String(text || "").match(/https?:\/\/[^\s<>"')\]]+/g) || []).map((x) => x.trim());
}

function extractCodeBlocks(text) {
  return (String(text || "").match(/```[\s\S]*?```/g) || []).map((x) => x.trim());
}

function extractCardMetaBlocks(text) {
  return (String(text || "").match(/<!--CARD[\s\S]*?-->/g) || []).map((x) => x.trim());
}

function scoreReportCopy(mdText) {
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
  let score = 100;
  for (const word of banned) {
    const hits = String(mdText).split(word).length - 1;
    if (hits > 0) score -= hits * 5;
  }
  const lines = String(mdText).split(/\r?\n/);
  let repeat = 0;
  let prev = "";
  let streak = 1;
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("```") || t.startsWith("[Source]")) continue;
    const end = t.match(/(?:요|다)\.?$/)?.[0] || "";
    if (!end) continue;
    if (end === prev) {
      streak += 1;
      if (streak >= 3) repeat += 1;
    } else {
      prev = end;
      streak = 1;
    }
  }
  score -= repeat * 3;
  return score;
}

function maskSegments(text, regex, prefix) {
  const tokens = [];
  const masked = String(text || "").replace(regex, (m) => {
    const token = `${prefix}${tokens.length}__`;
    tokens.push({ token, value: m });
    return token;
  });
  return { text: masked, tokens };
}

function restoreMaskedSegments(text, tokens) {
  let out = String(text || "");
  for (const t of tokens) {
    out = out.split(t.token).join(t.value);
  }
  return out;
}

function maskWithTokens(text, tokens) {
  let out = String(text || "");
  for (const t of tokens) {
    out = out.split(t.value).join(t.token);
  }
  return out;
}

function findExecutable(bin) {
  try {
    return execSync(`command -v ${shellQuote(bin)}`, { stdio: "pipe" })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
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
