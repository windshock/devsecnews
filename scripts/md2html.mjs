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

const baseName = path.basename(input, path.extname(input));
const cardsDir = path.join("cards", baseName);
const cardPngs = listCardPngs(cardsDir).map((f) =>
  // Make it relative to the generated HTML in repo root.
  path.posix.join("cards", baseName, f)
);
const cardPngsJson = JSON.stringify(cardPngs);

const githubMarkdownCss = readOptionalTextFile(
  path.join("node_modules", "github-markdown-css", "github-markdown.css")
);
// GitHub-style code theme (light). This stays readable in most wiki/Teams embeds.
const hljsCss = readOptionalTextFile(
  path.join("node_modules", "highlight.js", "styles", "github.css")
);

const css = `
  :root { color-scheme: light; }
  body {
    margin: 0;
    background: #ffffff;
    color: #1f2328;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
    line-height: 1.6;
  }
  main { max-width: 980px; margin: 0 auto; padding: 28px 18px; }
  .markdown-body { box-sizing: border-box; min-width: 200px; }
  .markdown-body table { display: table; width: 100%; }
  .markdown-body pre { padding: 12px; border-radius: 8px; }
  a { word-break: break-all; }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(31,35,40,0.12);
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
    border: 1px solid rgba(31,35,40,0.18);
    border-radius: 999px;
    overflow: hidden;
    background: #fff;
  }
  .segmented button {
    appearance: none;
    border: 0;
    background: transparent;
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
    color: #1f2328;
  }
  .segmented button[aria-pressed="true"] {
    background: rgba(9,105,218,0.12);
    color: #0969da;
    font-weight: 600;
  }
  .hint {
    font-size: 12px;
    color: rgba(31,35,40,0.65);
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
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }
  .tts button, .tts select, .tts label {
    font-size: 12px;
  }
  .tts button {
    appearance: none;
    border: 1px solid rgba(31,35,40,0.18);
    border-radius: 8px;
    background: #fff;
    padding: 6px 10px;
    cursor: pointer;
    white-space: nowrap;
  }
  .tts button[disabled] {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .tts select {
    appearance: none;
    border: 1px solid rgba(31,35,40,0.18);
    border-radius: 8px;
    background: #fff;
    padding: 6px 8px;
    max-width: 220px;
  }
  .tts .chk {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    border: 1px solid rgba(31,35,40,0.18);
    border-radius: 8px;
    background: #fff;
    padding: 6px 8px;
    white-space: nowrap;
  }
  /* Card deck (PNG carousel) */
  .cardsDock {
    margin: 18px 0 22px;
  }
  .cardsFrame {
    border: 1px solid rgba(31,35,40,0.12);
    border-radius: 14px;
    background: #fff;
    overflow: hidden;
    box-shadow: 0 6px 24px rgba(31,35,40,0.08);
  }
  .cardsHeader {
    padding: 10px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-bottom: 1px solid rgba(31,35,40,0.08);
    background: rgba(246,248,250,0.8);
  }
  .cardsTitle {
    font-size: 13px;
    color: rgba(31,35,40,0.8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cardsCtrls {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }
  .cardsCtrls button {
    appearance: none;
    border: 1px solid rgba(31,35,40,0.18);
    border-radius: 10px;
    background: #fff;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
  }
  .cardsCtrls button[disabled] {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .cardsCount {
    font-size: 12px;
    color: rgba(31,35,40,0.65);
    min-width: 48px;
    text-align: right;
  }
  .cardsViewport {
    display: grid;
    place-items: center;
    padding: 12px;
    background: #ffffff;
  }
  .cardsViewport img {
    width: min(520px, 100%);
    height: auto;
    border-radius: 12px;
    border: 1px solid rgba(31,35,40,0.10);
    background: #fff;
  }
  .cardsDots {
    display: flex;
    gap: 6px;
    padding: 10px 12px 12px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    border-top: 1px solid rgba(31,35,40,0.08);
    background: rgba(246,248,250,0.6);
  }
  .cardsDots button {
    width: 10px;
    height: 10px;
    padding: 0;
    border-radius: 999px;
    border: 1px solid rgba(31,35,40,0.25);
    background: transparent;
    cursor: pointer;
  }
  .cardsDots button[aria-pressed="true"] {
    background: rgba(9,105,218,0.75);
    border-color: rgba(9,105,218,0.75);
  }
  .view-summary { display: none; }
  .view-node { display: none; }
  .view-java { display: none; }
  .view-rest { display: none; }

  body[data-view="all"] .view-summary { display: block; }
  body[data-view="all"] .view-node { display: block; }
  body[data-view="all"] .view-java { display: block; }
  body[data-view="all"] .view-rest { display: block; }

  body[data-view="summary"] .view-summary { display: block; }
  body[data-view="node"] .view-node { display: block; }
  body[data-view="java"] .view-java { display: block; }
  ${githubMarkdownCss}
  ${hljsCss}
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
              <input type="checkbox" id="tts-skip-refs" checked />
              참고자료 제외
            </label>
          </div>
        </div>
      </div>
    </div>
    <main>
      <section class="cardsDock" id="cardsDock" data-cards='${escapeHtmlAttr(
        cardPngsJson
      )}' style="${cardPngs.length ? "" : "display:none;"}">
        <div class="cardsFrame" aria-label="카드뉴스">
          <div class="cardsHeader">
            <div class="cardsTitle">카드뉴스(요약/체크리스트/팀 규칙)</div>
            <div class="cardsCtrls">
              <button type="button" id="cardsPrev" aria-label="이전 카드">◀</button>
              <button type="button" id="cardsNext" aria-label="다음 카드">▶</button>
              <div class="cardsCount" id="cardsCount">0/0</div>
            </div>
          </div>
          <div class="cardsViewport">
            <img id="cardsImg" alt="카드뉴스 이미지" />
          </div>
          <div class="cardsDots" id="cardsDots" aria-label="카드 선택"></div>
        </div>
      </section>
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

        // Card deck (PNG carousel)
        (function initCards() {
          const dock = document.getElementById("cardsDock");
          if (!dock) return;
          let cards = [];
          try {
            const raw = dock.getAttribute("data-cards") || "[]";
            cards = JSON.parse(raw);
          } catch {}
          if (!Array.isArray(cards) || cards.length === 0) {
            dock.style.display = "none";
            return;
          }

          const img = document.getElementById("cardsImg");
          const prev = document.getElementById("cardsPrev");
          const next = document.getElementById("cardsNext");
          const count = document.getElementById("cardsCount");
          const dots = document.getElementById("cardsDots");
          let idx = 0;

          function set(i) {
            idx = (i + cards.length) % cards.length;
            if (img) img.src = cards[idx];
            if (count) count.textContent = String(idx + 1) + "/" + String(cards.length);
            if (prev) prev.disabled = cards.length <= 1;
            if (next) next.disabled = cards.length <= 1;
            if (dots) {
              const btns = Array.from(dots.querySelectorAll("button[data-dot]"));
              for (const b of btns) b.setAttribute("aria-pressed", String(Number(b.dataset.dot) === idx));
            }
          }

          function buildDots() {
            if (!dots) return;
            dots.innerHTML = "";
            for (let i = 0; i < cards.length; i++) {
              const b = document.createElement("button");
              b.type = "button";
              b.dataset.dot = String(i);
              b.setAttribute("aria-label", "카드 " + String(i + 1));
              b.setAttribute("aria-pressed", "false");
              b.addEventListener("click", () => set(i));
              dots.appendChild(b);
            }
          }

          buildDots();
          set(0);

          prev && prev.addEventListener("click", () => set(idx - 1));
          next && next.addEventListener("click", () => set(idx + 1));

          // Keyboard arrows (avoid capturing when typing in inputs)
          window.addEventListener("keydown", (e) => {
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
            if (e.key === "ArrowLeft") set(idx - 1);
            if (e.key === "ArrowRight") set(idx + 1);
          });

          // Swipe (touch)
          let startX = 0;
          let startY = 0;
          let active = false;
          dock.addEventListener("touchstart", (e) => {
            if (!e.touches || e.touches.length !== 1) return;
            active = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
          }, { passive: true });
          dock.addEventListener("touchend", (e) => {
            if (!active) return;
            active = false;
            const touch = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
            if (!touch) return;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            // Prefer horizontal swipe; ignore mostly-vertical gestures to avoid scroll fights.
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
            if (dx < 0) set(idx + 1);
            else set(idx - 1);
          }, { passive: true });
        })();

        // TTS (Web Speech API)
        const synth = window.speechSynthesis;
        const playBtn = document.getElementById("tts-play");
        const pauseBtn = document.getElementById("tts-pause");
        const stopBtn = document.getElementById("tts-stop");
        const rateSel = document.getElementById("tts-rate");
        const voiceSel = document.getElementById("tts-voice");
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
          const nodes = root.querySelectorAll("h1,h2,h3,p,li");
          for (const el of nodes) {
            // Skip code and tables.
            if (el.closest("pre, code, table")) continue;
            const t = (el.innerText || "").trim();
            if (!t) continue;
            if (stopAtRefs && t.includes("(7) 참고자료")) break;
            lines.push(t);
          }
          return lines;
        }

        function buildTextForCurrentView() {
          const view = getActiveView();
          const sections = getSectionsForView(view);
          const stopAtRefs = !!(skipRefsChk && skipRefsChk.checked);
          const lines = [];
          for (const s of sections) {
            lines.push(...extractReadableLines(s, { stopAtRefs }));
          }
          return lines.join("\\n");
        }

        function chunkText(text) {
          const cleaned = text
            .replace(/\\s+\\n/g, "\\n")
            .replace(/\\n{3,}/g, "\\n\\n")
            .trim();
          if (!cleaned) return [];

          // Split by paragraphs then by sentence-ish punctuation to keep utterances short.
          const paras = cleaned.split(/\\n\\n+/);
          const chunks = [];
          for (const p of paras) {
            const sents = p.split(/(?<=[\\.\\!\\?]|다\\.|다\\?|다\\!)\\s+/);
            let buf = "";
            for (const s of sents) {
              const next = (buf ? buf + " " : "") + s.trim();
              if (next.length > 240 && buf) {
                chunks.push(buf);
                buf = s.trim();
              } else {
                buf = next;
              }
            }
            if (buf) chunks.push(buf);
          }
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
          const selected = voiceSel && voiceSel.value ? voices.find(v => v.name === voiceSel.value) : null;
          if (selected) return selected;
          // Auto: pick Korean if available.
          const ko = voices.find(v => (v.lang || "").toLowerCase().startsWith("ko"));
          return ko || voices[0] || null;
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
          speakNext();
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
          skipRefsChk && skipRefsChk.addEventListener("change", () => {
            if (speaking) startTts();
          });
        } else {
          // No TTS support: hide controls
          const tts = document.querySelector(".tts");
          if (tts) tts.style.display = "none";
        }

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
  const idxRefs = md.indexOf("# (7) 참고자료");

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

function escapeHtmlAttr(s) {
  // For embedding JSON strings inside an HTML attribute.
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("'", "&#39;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

