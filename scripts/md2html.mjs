import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import hljs from "highlight.js";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";

function usageAndExit() {
  console.error(
    "Usage:\n  node scripts/md2html.mjs <input.md> [output.html]\n\nExamples:\n  node scripts/md2html.mjs devsecnews-2026-01-node-java.md\n  node scripts/md2html.mjs in.md out.html"
  );
  process.exit(2);
}

const input = process.argv[2] ?? "devsecnews-2026-01-node-java.md";
const output =
  process.argv[3] ??
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
marked.setOptions({ gfm: true, breaks: false });

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
  :root {
    --bg-body: #ffffff;
    --text-body: #1f2328;
    --text-muted: #656d76;
    --bg-topbar: rgba(255,255,255,0.92);
    --border-color: #d0d7de;
    --bg-code: #f6f8fa;
    --code-border: rgba(31,35,40,0.12);
    --btn-hover: rgba(31,35,40,0.08); 
    --btn-active: rgba(31,35,40,0.12);
    --highlight-bg: rgba(9,105,218,0.12);
    --highlight-text: #0969da;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg-body: #0d1117;
      --text-body: #c9d1d9;
      --text-muted: #8b949e;
      --bg-topbar: rgba(13,17,23,0.92);
      --border-color: #30363d;
      --bg-code: #161b22;
      --code-border: #30363d;
      --btn-hover: rgba(177,186,196,0.12);
      --btn-active: rgba(177,186,196,0.2);
      --highlight-bg: rgba(56,139,253,0.15);
      --highlight-text: #4493f8;
      color-scheme: dark;
    }
  }

  body {
    margin: 0;
    background: var(--bg-body);
    color: var(--text-body);
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  main { max-width: 980px; margin: 0 auto; padding: 28px 18px; }
  .markdown-body { box-sizing: border-box; min-width: 200px; color: var(--text-body); }
  .markdown-body table { display: table; width: 100%; border-collapse: collapse; }
  
  /* Code blocks */
  .markdown-body pre {
    padding: 12px;
    border-radius: 10px;
    overflow: auto;
    background: var(--bg-code);
    border: 1px solid var(--code-border);
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
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--bg-topbar);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border-color);
  }
  .topbar-inner {
    max-width: 980px;
    margin: 0 auto;
    padding: 10px 18px;
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
  }
  .segmented {
    display: inline-flex;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    overflow: hidden;
    background: var(--bg-body);
  }
  .segmented button {
    appearance: none;
    border: 0;
    background: transparent;
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
    color: var(--text-body);
  }
  .segmented button[aria-pressed="true"] {
    background: var(--highlight-bg);
    color: var(--highlight-text);
    font-weight: 600;
  }
  .hint {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .topbar-right {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  .tts {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .tts button, .tts select, .tts label {
    font-size: 13px;
    color: var(--text-body);
  }
  .tts button {
    appearance: none;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-body);
    padding: 6px 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.2s;
  }
  .tts button:hover:not([disabled]) {
    background: var(--btn-hover);
  }
  .tts button:active:not([disabled]) {
    background: var(--btn-active);
  }
  .tts button[disabled] {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .tts select {
    appearance: none;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-body);
    padding: 6px 24px 6px 10px; /* space for arrow if custom */
    max-width: 220px;
  }
  .tts .chk {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-body);
    padding: 6px 10px;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
  }
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
    background: var(--bg-body);
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
    background: var(--btn-hover);
    border-radius: 6px;
    display: inline-block;
  }
  .view-summary { display: none; }
  .view-node { display: none; }
  .view-java { display: none; }
  .view-rest { display: none; }

  /* Responsive (mobile-first adjustments) */
  @media (max-width: 720px) {
    main { padding: 16px 16px; }
    .markdown-body { font-size: 16px; line-height: 1.6; }
    .markdown-body h1 { font-size: 1.6em; }
    
    /* Topbar: Stack vertically for better touch targets */
    .topbar-inner { 
      flex-direction: column; 
      align-items: stretch;
      gap: 12px; 
      padding: 12px 16px;
    }
    .segmented { display: flex; width: 100%; }
    .segmented button { flex: 1; text-align: center; padding: 10px 4px; font-size: 14px; }
    
    .topbar-right { justify-content: space-between; gap: 12px; width: 100%; }
    .hint { display: none; }
    .tts { width: 100%; justify-content: space-between; gap: 8px; }
    
    /* Play controls bigger */
    #tts-play, #tts-pause, #tts-stop {
      flex: 1; 
      text-align: center; 
      padding: 10px 8px;
      font-size: 14px;
    }
    /* Options row */
    .tts select, .tts .chk {
      font-size: 13px; 
      padding: 8px 6px;
      max-width: none;
      flex: 1;
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
    <div class="topbar">
      <div class="topbar-inner">
        <div class="segmented" role="group" aria-label="보기 선택">
          <button type="button" data-view-btn="summary" aria-pressed="false">요약</button>
          <button type="button" data-view-btn="node" aria-pressed="false">Node.js</button>
          <button type="button" data-view-btn="java" aria-pressed="false">Java</button>
          <button type="button" data-view-btn="all" aria-pressed="true">전체</button>
        </div>
        <div class="topbar-right">
          <div class="hint">상단 탭으로 필요한 부분만 봅니다.</div>
          <div class="tts" aria-label="읽어주기(TTS)">
            <button type="button" id="tts-play">읽기</button>
            <button type="button" id="tts-pause" disabled>일시정지</button>
            <button type="button" id="tts-stop" disabled>중지</button>
            <select id="tts-rate" aria-label="읽기 속도">
              <option value="0.9">0.9x</option>
              <option value="1" selected>1.0x</option>
              <option value="1.1">1.1x</option>
              <option value="1.2">1.2x</option>
            </select>
            <select id="tts-voice" aria-label="목소리 선택">
              <option value="">(목소리 자동)</option>
            </select>
            <label class="chk">
              <input type="checkbox" id="tts-skip-urls" checked />
              URL 제외
            </label>
            <label class="chk">
              <input type="checkbox" id="tts-skip-refs" checked />
              참고자료 제외
            </label>
          </div>
        </div>
      </div>
    </div>
    <main>
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
    </main>
    <script>
      (function () {
        const KEY = "devsecnews:view";
        const buttons = Array.from(document.querySelectorAll("[data-view-btn]"));

        function setView(v, persist) {
          if (!["summary","all","node","java"].includes(v)) v = "all";
          document.body.dataset.view = v;
          for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.viewBtn === v));
          if (persist) {
            try { localStorage.setItem(KEY, v); } catch {}
          }
          // Keep URL navigable/bookmarkable without reloading.
          try { history.replaceState(null, "", v === "all" ? "#all" : ("#" + v)); } catch {}
          // If speaking, restart to read the newly visible section only.
          if (speaking) startTts();
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
        const playBtn = document.getElementById("tts-play");
        const pauseBtn = document.getElementById("tts-pause");
        const stopBtn = document.getElementById("tts-stop");
        const rateSel = document.getElementById("tts-rate");
        const voiceSel = document.getElementById("tts-voice");
        const skipUrlsChk = document.getElementById("tts-skip-urls");
        const skipRefsChk = document.getElementById("tts-skip-refs");
        let queue = [];
        let speaking = false;

        function getActiveView() {
          return document.body.dataset.view || "all";
        }

        function getSectionsForView(view) {
          if (view === "summary") return [document.querySelector(".view-summary")];
          if (view === "node") return [document.querySelector(".view-node")];
          if (view === "java") return [document.querySelector(".view-java")];
          // all
          return [
            document.querySelector(".view-summary"),
            document.querySelector(".view-node"),
            document.querySelector(".view-java"),
            document.querySelector(".view-rest"),
          ];
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
          
          const selected = voiceSel && voiceSel.value ? voices.find(v => v.name === voiceSel.value) : null;
          if (selected) return selected;
          
          // Auto-select logic (Prioritize Korean High Quality)
          const ko = voices.filter(v => (v.lang || "").toLowerCase().startsWith("ko"));
          // Try to find "Google", "Siri", "Yuna", or "Premium" in name for better quality
          const best = ko.find(v => v.name.includes("Google")) || 
                       ko.find(v => v.name.includes("Yuna")) || 
                       ko.find(v => v.name.includes("Siri")) || 
                       ko.find(v => v.name.includes("Premium")) || 
                       ko[0];
          return best || voices[0] || null;
        }

        function setButtonsState() {
          if (!playBtn || !pauseBtn || !stopBtn) return;
          pauseBtn.disabled = !speaking || synth.paused;
          stopBtn.disabled = !speaking;
          playBtn.textContent = synth.speaking && synth.paused ? "재개" : "읽기";
        }

        function stopTts() {
          try { synth.cancel(); } catch {}
          queue = [];
          speaking = false;
          setButtonsState();
        }

        function speakNext() {
          if (!queue.length) {
            speaking = false;
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
          setButtonsState();
          synth.speak(u);
        }

        function startTts() {
          // Resume if paused
          if (synth.speaking && synth.paused) {
            synth.resume();
            speaking = true;
            setButtonsState();
            return;
          }
          stopTts();
          const text = buildTextForCurrentView();
          queue = chunkText(text);
          if (!queue.length) return;
          // Some browsers need a micro-delay after cancel() before speak().
          setTimeout(() => speakNext(), 60);
        }

        if (synth && playBtn) {
          populateVoices();
          if (typeof speechSynthesis !== "undefined" && speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => populateVoices();
          }
          playBtn.addEventListener("click", startTts);
          pauseBtn && pauseBtn.addEventListener("click", () => {
            try { synth.pause(); } catch {}
            setButtonsState();
          });
          stopBtn && stopBtn.addEventListener("click", stopTts);
          voiceSel && voiceSel.addEventListener("change", () => {
            // If currently speaking, restart with new voice.
            if (speaking) startTts();
          });
          rateSel && rateSel.addEventListener("change", () => {
            if (speaking) startTts();
          });
          skipUrlsChk && skipUrlsChk.addEventListener("change", () => {
            if (speaking) startTts();
          });
          skipRefsChk && skipRefsChk.addEventListener("change", () => {
            if (speaking) startTts();
          });
        } else {
          // No TTS support: hide controls
          const tts = document.querySelector(".tts");
          if (tts) tts.style.display = "none";
        }

        // setView is defined above to allow reuse by other UI features.

        for (const b of buttons) {
          b.addEventListener("click", () => setView(b.dataset.viewBtn, true));
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
