// md2magazine.mjs — render a DevSecNews monthly issue markdown into a
// distinctive "terminal-editorial" magazine HTML (dark, single red accent,
// serif Korean display + mono labels, ghost section numbers, Field Notes as
// severity-chipped cards, moving video cover).
//
// Usage: node scripts/md2magazine.mjs [content/devsecnews-YYYY-MM-node-java.md]
// Output: dist/<basename>.html  (self-contained except Google Fonts + assets/)

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import hljs from "highlight.js";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";

const input = process.argv[2] || "content/devsecnews-2026-05-node-java.md";
if (!fs.existsSync(input)) { console.error(`not found: ${input}`); process.exit(1); }
const base = path.basename(input, ".md");
const monthMatch = base.match(/(\d{4})-(\d{2})/);
const month = monthMatch ? `${monthMatch[1]}-${monthMatch[2]}` : "";
const output = path.join("dist", `${base}.html`);

marked.use(markedHighlight({
  langPrefix: "hljs language-",
  highlight(code, lang) {
    try { return lang && hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value; }
    catch { return code; }
  },
}));
marked.setOptions({ gfm: true, breaks: false });

const md = fs.readFileSync(input, "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stripEsc = (s) => String(s).replace(/\\([.\-—])/g, "$1").trim();
const mdInline = (s) => marked.parseInline(s.trim());
const mdBlock = (s) => marked.parse(stripHr(s).trim());
const stripHr = (s) => s.replace(/^\s*---\s*$/gm, "").trim();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Curated jargon → plain-Korean glossary. Defs must NOT contain another term word
// (the walker scans inserted markup too). Longer phrases first so they win.
const TERMS = [
  ["configuration escalation", "설정 파일이 그대로 실행 권한으로 승격되는 구조."],
  ["proof of presence", "배포 직전 실제 사람이 라이브 2FA 챌린지로 승인했다는 증거. 자동화 자격증명으로는 통과할 수 없다."],
  ["trusted publishing", "CI가 단기 신원으로 인증해 장기 토큰 없이 패키지를 게시하는 방식."],
  ["staged publishing", "패키지를 바로 공개하지 않고 검토·승인 단계를 거쳐 게시하는 npm 방식."],
  ["FIDO", "비밀번호 대신 보안키·생체 인증을 쓰는 표준. 피싱에 강하다."],
  ["dependency confusion", "내부 전용 패키지와 같은 이름을 공개 레지스트리에 올려, 빌드가 공개본을 당겨오게 만드는 공격."],
  ["tool poisoning", "MCP 도구 설명에 숨긴 악성 지시로 AI 에이전트를 조종하는 공격."],
  ["rug pull", "처음엔 정상이던 패키지·도구가 이후 버전에서 악성으로 바뀌는 공격."],
  ["provenance", "패키지가 어느 빌드·커밋에서 나왔는지 기록한 '출처 증명'. 안전 보장이 아니라 출처 기록이다."],
  ["attestation", "빌드 출처를 서명해 붙인 증명서."],
  ["SLSA", "공급망 무결성 등급 표준(Supply-chain Levels for Software Artifacts). 등급이 높을수록 빌드 출처가 더 검증된다."],
  ["Sigstore", "키를 따로 보관하지 않고 소프트웨어에 서명·검증하게 해주는 오픈소스 서명 인프라."],
  ["Fulcio", "신원을 받아 단기 서명 인증서를 발급하는 기관."],
  ["OIDC", "OpenID Connect. CI가 장기 토큰 대신 단기 신원 토큰으로 인증하는 방식."],
  ["sink", "외부 입력이 최종적으로 위험하게 쓰이는 지점(파일 쓰기·DB 쿼리·명령 실행 등)."],
  ["egress", "시스템에서 바깥으로 나가는 네트워크 트래픽."],
  ["SCA", "소프트웨어 구성 분석(Software Composition Analysis). 의존성의 알려진 취약점을 추적하는 도구 분류."],
];

// Wrap the FIRST body occurrence of each term in an <abbr> tooltip. Skips code,
// links, headings (tag-aware walk so markup never breaks). Records used terms.
function injectTooltips(html, terms, used) {
  const SKIP = /^(pre|code|a|abbr|h[1-6]|script|style)$/i;
  const parts = html.split(/(<[^>]+>)/);
  let skip = 0;
  for (let i = 0; i < parts.length; i++) {
    const t = parts[i];
    if (t.startsWith("<")) {
      const m = t.match(/^<\s*(\/?)\s*([a-zA-Z0-9]+)/);
      if (m && SKIP.test(m[2]) && !/\/>\s*$/.test(t)) {
        if (m[1] === "/") { if (skip > 0) skip--; } else skip++;
      }
      continue;
    }
    if (skip > 0 || !t) continue;
    let seg = t;
    for (const [term, def] of terms) {
      if (used.has(term)) continue;
      const re = new RegExp(`\\b${escapeRe(term)}\\b`, "i");
      if (re.test(seg)) {
        seg = seg.replace(re, (mm) => `<abbr class="term" tabindex="0" data-tip="${esc(def)}" title="${esc(def)}">${mm}</abbr>`);
        used.add(term);
      }
    }
    parts[i] = seg;
  }
  return parts.join("");
}

// --- parse -----------------------------------------------------------------
const issueId = (md.match(/^#\s+DevSecNews\s+(\S+)/m) || [, month])[1];
const taglineM = md.match(/^>\s*(Discovery is cheap[^\n]*)/m);
const tagline = taglineM ? taglineM[1].trim() : "";

// split into level-2 sections, in order
const rawSections = md.split(/\n(?=## )/).filter((s) => s.startsWith("## "));
const sections = rawSections.map((blk) => {
  const nl = blk.indexOf("\n");
  const heading = stripEsc(blk.slice(3, nl < 0 ? undefined : nl));
  const body = nl < 0 ? "" : blk.slice(nl + 1);
  return { heading, body };
});

// section[0] is the theme/cover headline
const themeFull = sections.length ? sections[0].heading : "취약점 인플레이션";
const [themeMain, ...themeRest] = themeFull.split(/\s*—\s*/);
const themeSub = themeRest.join(" — ");

function classify(heading) {
  if (/^\d+\.\d/.test(heading)) {                          // 4.1, 4.5 ...
    const m = heading.match(/^(\d+)\.(\d+)\s+(.+)/);
    return { kind: "fieldsub", main: +m[1], sub: +m[2], title: m[3] };
  }
  const m = heading.match(/^(\d+)\.\s*(.+)/);              // 1. Signal ...
  if (m) return { kind: "main", num: +m[1], title: m[2] };
  if (/참고자료/.test(heading)) return { kind: "refs" };
  return { kind: "other" };
}

// English kicker / Korean headline from a "Eng: 한글" or "Eng — 한글" title
function splitTitle(title) {
  let m = title.split(/\s*[:—]\s*/);
  if (m.length >= 2) return { kicker: m[0].trim(), head: m.slice(1).join(" — ").trim() };
  return { kicker: title.trim(), head: title.trim() };
}

const SEV = [
  { re: /\bcritical\b/i, label: "CRITICAL", cls: "sev--crit" },
  { re: /자기 복제|\bworm\b|웜/i, label: "WORM", cls: "sev--crit" },
  { re: /\bhigh\b/i, label: "HIGH", cls: "sev--high" },
  { re: /\bmedium\b/i, label: "MEDIUM", cls: "sev--med" },
];
function severityOf(text) {
  for (const s of SEV) if (s.re.test(text)) return s;
  return null;
}
function cveOf(text) {
  const m = text.match(/CVE-\d{4}-\d{4,7}/);
  return m ? m[0] : null;
}

// render a Field Notes sub-section body into cards
function renderCards(body) {
  const parts = stripHr(body).split(/\n(?=### )/);
  const cards = parts.filter((p) => p.startsWith("### "));
  return cards.map((c) => {
    const nl = c.indexOf("\n");
    const rawTitle = stripEsc(c.slice(4, nl < 0 ? undefined : nl));
    const cbody = nl < 0 ? "" : c.slice(nl + 1);
    // "도구 — ..." titles render as neutral tooling sidebars (no severity).
    const isTool = /^(도구|〔도구〕)\s*[—-]/.test(rawTitle) || /^tooling\b/i.test(rawTitle);
    const title = rawTitle.replace(/^(도구|〔도구〕|tooling)\s*[—-]\s*/i, "");
    const sev = isTool ? null : severityOf(title + " " + cbody);
    const cve = isTool ? null : cveOf(title + " " + cbody);
    let html = mdBlock(cbody);
    // promote the "기본 설계 전환:" paragraph to a styled action callout
    html = html.replace(/<p>(기본 설계 전환:)/g, '<p class="card__shift"><span class="card__shift-k">$1</span>');
    const chips = isTool
      ? `<span class="chip chip--tool">TOOLING</span>`
      : [
          cve ? `<span class="chip chip--cve">${esc(cve)}</span>` : "",
          sev ? `<span class="chip ${sev.cls}">${sev.label}</span>` : "",
        ].join("");
    return `<article class="card${isTool ? " card--tool" : ""}">
      <div class="card__head"><h4 class="card__title">${mdInline(title)}</h4>${chips ? `<div class="card__chips">${chips}</div>` : ""}</div>
      <div class="card__body">${html}</div>
    </article>`;
  }).join("\n");
}

// --- build body HTML --------------------------------------------------------
let main = "";
const toc = [];

for (let i = 1; i < sections.length; i++) {        // skip [0] theme
  const { heading, body } = sections[i];
  const c = classify(heading);

  if (c.kind === "main") {
    const { kicker, head } = splitTitle(c.title);
    const num = String(c.num).padStart(2, "0");
    toc.push({ num, kicker, head, id: `s${c.num}` });
    const intro = stripHr(body).trim();
    main += `<section class="chapter" id="s${c.num}">
      <div class="chapter__rule"></div>
      <div class="chapter__head">
        <span class="chapter__num" aria-hidden="true">${num}</span>
        <div>
          <div class="chapter__kicker">${esc(kicker)}</div>
          <h2 class="chapter__title">${mdInline(head)}</h2>
        </div>
      </div>
      ${intro ? `<div class="prose">${mdBlock(intro)}</div>` : ""}
    </section>`;
  } else if (c.kind === "fieldsub") {
    const { kicker, head } = splitTitle(c.title);
    const isCheck = /실행\s*체크/.test(c.title);
    main += `<section class="fieldgroup${isCheck ? " fieldgroup--check" : ""}">
      <div class="fieldgroup__head"><span class="fieldgroup__tag">${esc(kicker)}</span><h3 class="fieldgroup__title">${mdInline(head)}</h3></div>
      ${isCheck ? `<div class="prose checklist">${mdBlock(body)}</div>` : `<div class="cards">${renderCards(body)}</div>`}
    </section>`;
  } else if (c.kind === "refs") {
    toc.push({ num: "·", kicker: "REFERENCES", head: "참고자료", id: "refs" });
    main += `<section class="chapter refs" id="refs">
      <div class="chapter__rule"></div>
      <div class="chapter__head"><span class="chapter__num" aria-hidden="true">§</span><div><div class="chapter__kicker">REFERENCES</div><h2 class="chapter__title">참고자료</h2></div></div>
      <div class="prose refs__list">${mdBlock(body)}</div>
    </section>`;
  }
}

// inject jargon tooltips into the body, then build the "이번 호 용어" box
const usedTerms = new Set();
main = injectTooltips(main, TERMS, usedTerms);
const glossaryHtml = usedTerms.size
  ? `<section class="glossary">
      <div class="glossary__label">이번 호 용어 — 점선 용어는 본문에서 마우스를 올리면 뜻이 뜹니다</div>
      <dl class="glossary__grid">
        ${TERMS.filter(([t]) => usedTerms.has(t)).map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join("\n")}
      </dl>
    </section>`
  : "";

const tocHtml = toc.map((t) =>
  `<a class="toc__item" href="#${t.id}"><span class="toc__num">${t.num}</span><span class="toc__kicker">${esc(t.kicker)}</span><span class="toc__head">${esc(t.head)}</span></a>`
).join("");

const hasVideo = fs.existsSync(path.join("dist", "assets", `devsecnews-board-${month}.mp4`));
const videoRel = `assets/devsecnews-board-${month}.mp4`;
const posterRel = `assets/devsecnews-board-${month}.jpg`;
const issueDate = month ? `${month.slice(0,4)}년 ${String(+month.slice(5)).padStart(2,"0")}월호` : "";

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>DevSecNews ${esc(issueId)} | ${esc(themeMain)}</title>
<meta name="description" content="${esc(themeSub || themeMain)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;700;900&family=Noto+Sans+KR:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
<style>
:root{
  --ink:#0a0d12; --ink-2:#0f141b; --panel:#10161f; --line:rgba(180,196,214,.12);
  --paper:#e9e7e1; --muted:#9aa7b4; --dim:#5d6b78;
  --red:#ff4b5c; --amber:#f5a524;
  --serif:"Noto Serif KR",Georgia,serif;
  --sans:"Noto Sans KR",system-ui,sans-serif;
  --display:"Pretendard","Noto Sans KR",system-ui,sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
  --wrap:920px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--ink);color:var(--paper);font-family:var(--sans);
  font-size:17px;line-height:1.75;-webkit-font-smoothing:antialiased;
  background-image:radial-gradient(120% 80% at 50% -8%,rgba(255,75,92,.06),transparent 46%);
}
/* grain */
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.035;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");z-index:3;}
.wrap{max-width:var(--wrap);margin:0 auto;padding:0 24px;position:relative;z-index:2}

/* ---------- cover ---------- */
/* sticky scroll-over hero: cover pins full-screen, content slides up over it */
.cover{border-bottom:1px solid var(--line);background:linear-gradient(180deg,#05080d, var(--ink) 70%);
  position:sticky;top:0;z-index:0;min-height:100vh;display:flex;flex-direction:column;justify-content:center}
.scroller{position:relative;z-index:2;background:var(--ink)}
.cover__bar{display:flex;justify-content:space-between;align-items:center;
  font-family:var(--mono);font-size:12px;letter-spacing:.28em;text-transform:uppercase;
  color:var(--muted);padding:22px 0 18px}
.cover__bar .brand{color:var(--red);font-weight:600}
.cover__media{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#000;
  box-shadow:0 30px 80px -40px rgba(255,75,92,.4),0 10px 40px -20px rgba(0,0,0,.8)}
.cover__media video,.cover__media img{display:block;width:100%;height:auto}
.cover__theme{font-family:var(--display);font-weight:900;letter-spacing:-.02em;line-height:1.04;
  font-size:clamp(40px,8vw,84px);margin:34px 0 0}
.cover__sub{font-size:clamp(16px,2.4vw,21px);color:var(--muted);max-width:34em;margin:16px 0 0;line-height:1.6}
.cover__tag{font-family:var(--mono);color:var(--red);font-size:clamp(13px,1.7vw,16px);
  letter-spacing:.02em;margin:22px 0 0;padding-left:16px;border-left:3px solid var(--red)}
.cover__foot{display:flex;gap:22px;flex-wrap:wrap;font-family:var(--mono);font-size:12px;
  color:var(--dim);text-transform:uppercase;letter-spacing:.2em;padding:30px 0 40px}
.cover .wrap{will-change:transform,opacity,filter}
.cover__media{will-change:transform}
.cover__scroll{position:absolute;left:50%;bottom:22px;font-family:var(--mono);font-size:22px;
  color:var(--muted);z-index:1;pointer-events:none;animation:bob 1.6s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(9px)}}

/* ---------- contents ---------- */
.contents{padding:46px 0;border-bottom:1px solid var(--line)}
.contents__label{font-family:var(--mono);font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--dim);margin-bottom:20px}
.toc{display:grid;grid-template-columns:repeat(2,1fr);gap:2px 36px}
.toc__item{display:grid;grid-template-columns:34px auto;align-items:baseline;gap:0 14px;
  padding:13px 0;border-top:1px solid var(--line);text-decoration:none;color:var(--paper);transition:.15s}
.toc__item:hover{color:var(--red);transform:translateX(3px)}
.toc__num{font-family:var(--mono);color:var(--red);font-size:13px}
.toc__kicker{grid-column:2;font-family:var(--mono);font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--dim)}
.toc__head{grid-column:2;font-weight:700;font-size:15.5px;line-height:1.4}

/* ---------- chapters ---------- */
.chapter{padding:64px 0 8px;position:relative}
.chapter__rule{height:1px;background:linear-gradient(90deg,var(--red),transparent 60%);margin-bottom:30px}
.chapter__head{display:flex;align-items:flex-start;gap:22px;margin-bottom:26px}
.chapter__num{font-family:var(--serif);font-weight:900;font-size:clamp(56px,11vw,104px);line-height:.8;
  color:transparent;-webkit-text-stroke:1.5px rgba(255,75,92,.45);text-stroke:1.5px rgba(255,75,92,.45);
  letter-spacing:-.04em;flex:none;margin-top:-6px}
.chapter__kicker{font-family:var(--mono);font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:var(--red);margin-bottom:8px}
.chapter__title{font-family:var(--serif);font-weight:700;font-size:clamp(26px,4.4vw,40px);line-height:1.18;margin:0;letter-spacing:-.01em}

/* prose */
.prose{font-size:17px;color:#d7d9dd}
.prose p{margin:0 0 1.15em}
.prose a{color:var(--red);text-decoration:none;border-bottom:1px solid rgba(255,75,92,.35)}
.prose a:hover{border-bottom-color:var(--red)}
.prose strong{color:var(--paper);font-weight:700}
.prose code{font-family:var(--mono);font-size:.86em;background:var(--ink-2);border:1px solid var(--line);
  padding:.1em .4em;border-radius:5px;color:#ffd0d4}
.prose pre{background:#070a0e;border:1px solid var(--line);border-radius:10px;padding:18px;overflow:auto;font-family:var(--mono);font-size:14px}
.prose pre code{background:none;border:none;padding:0;color:#cdd6df}
/* pull quote (blockquote) */
.prose blockquote{margin:34px 0;padding:6px 0 6px 26px;border-left:3px solid var(--red);
  font-family:var(--serif);font-weight:500;font-size:clamp(20px,3vw,30px);line-height:1.4;color:var(--paper)}
.prose blockquote p{margin:0}
/* tables (Default Shift) */
.prose table{width:100%;border-collapse:collapse;margin:26px 0;font-size:14.5px}
.prose th{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;
  text-align:left;color:var(--red);border-bottom:1px solid var(--line);padding:12px 14px;vertical-align:top}
.prose td{border-bottom:1px solid var(--line);padding:13px 14px;vertical-align:top;color:#cfd4da}
.prose tr td:first-child{font-weight:700;color:var(--paper)}
/* lists */
.prose ul,.prose ol{margin:0 0 1.15em;padding-left:1.3em}
.prose li{margin:.4em 0}
.prose ul li::marker{color:var(--red)}
.prose ol li::marker{color:var(--red);font-family:var(--mono)}

/* checklist (4.5) */
.checklist strong{display:inline-block;font-family:var(--mono);font-size:11.5px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--red);margin:18px 0 4px}

/* ---------- field notes cards ---------- */
.fieldgroup{padding:30px 0 4px}
.fieldgroup__head{display:flex;align-items:baseline;gap:14px;margin:8px 0 22px;
  border-bottom:1px solid var(--line);padding-bottom:14px}
.fieldgroup__tag{font-family:var(--mono);font-size:11px;letter-spacing:.22em;text-transform:uppercase;
  color:var(--ink);background:var(--red);padding:4px 9px;border-radius:4px;font-weight:600;flex:none}
.fieldgroup__title{font-family:var(--serif);font-weight:700;font-size:clamp(19px,2.8vw,25px);margin:0;line-height:1.25}
.cards{display:grid;gap:18px}
.card{background:linear-gradient(180deg,var(--panel),var(--ink-2));border:1px solid var(--line);
  border-left:2px solid rgba(255,75,92,.5);border-radius:12px;padding:22px 24px;transition:.18s}
.card:hover{border-left-color:var(--red);box-shadow:0 16px 50px -34px rgba(255,75,92,.5)}
.card__head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:12px}
.card__title{font-family:var(--serif);font-weight:700;font-size:19px;line-height:1.3;margin:0;color:var(--paper)}
.card__title code{font-family:var(--mono);font-size:.8em;background:var(--ink);padding:.1em .35em;border-radius:4px;color:#ffd0d4}
.card__chips{display:flex;gap:6px;flex:none;flex-wrap:wrap;justify-content:flex-end}
.chip{font-family:var(--mono);font-size:10px;letter-spacing:.1em;font-weight:600;padding:4px 8px;border-radius:5px;white-space:nowrap}
.chip--cve{background:var(--ink);color:var(--muted);border:1px solid var(--line)}
.sev--crit{background:rgba(255,75,92,.16);color:var(--red);border:1px solid rgba(255,75,92,.4)}
.sev--high{background:rgba(245,165,36,.14);color:var(--amber);border:1px solid rgba(245,165,36,.4)}
.sev--med{background:rgba(154,167,180,.12);color:var(--muted);border:1px solid var(--line)}
.card__body{font-size:15.5px;color:#c4cad1;line-height:1.7}
.card__body p{margin:0 0 .9em}
.card__body a{color:var(--red);text-decoration:none;border-bottom:1px solid rgba(255,75,92,.3)}
.card__body code{font-family:var(--mono);font-size:.84em;background:var(--ink);border:1px solid var(--line);padding:.08em .35em;border-radius:4px;color:#ffd0d4}
.card__shift{margin-top:14px!important;padding:13px 16px;background:rgba(255,75,92,.07);
  border:1px solid rgba(255,75,92,.2);border-radius:8px;font-size:14.5px;color:#dfe3e8}
.card__shift-k{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--red);font-weight:600;display:block;margin-bottom:5px}

/* refs */
.refs__list ul{list-style:none;padding:0;columns:1}
.refs__list li{font-family:var(--mono);font-size:13px;border-bottom:1px solid var(--line);padding:10px 0;margin:0;word-break:break-all}
.refs__list a{border:none}

/* jargon tooltips */
.term{border-bottom:1px dotted var(--red);cursor:help;position:relative;color:inherit}
.term:hover::after,.term:focus::after{
  content:attr(data-tip);position:absolute;left:0;bottom:calc(100% + 9px);
  width:max-content;max-width:300px;white-space:normal;
  background:#05080d;border:1px solid var(--line);border-left:2px solid var(--red);
  color:var(--paper);font-family:var(--sans);font-size:13px;font-weight:400;line-height:1.55;letter-spacing:0;
  padding:10px 13px;border-radius:8px;box-shadow:0 14px 36px -12px rgba(0,0,0,.85);z-index:60;pointer-events:none}
.term:hover::before,.term:focus::before{
  content:"";position:absolute;left:10px;bottom:calc(100% + 3px);border:6px solid transparent;
  border-top-color:var(--line);z-index:61;pointer-events:none}

/* glossary box */
.glossary{border-top:1px solid var(--line);margin-top:64px;padding-top:40px}
.glossary__label{font-family:var(--mono);font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:var(--dim);margin-bottom:22px}
.glossary__grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px 40px;margin:0}
.glossary dt{font-family:var(--mono);font-size:13px;color:var(--red);font-weight:600;margin-top:14px}
.glossary dd{margin:3px 0 0;font-size:14px;color:#c4cad1;line-height:1.6}
@media(max-width:720px){.glossary__grid{grid-template-columns:1fr}}

/* footer */
.colophon{border-top:1px solid var(--line);margin-top:70px;padding:46px 0 70px;
  font-family:var(--mono);font-size:12.5px;color:var(--dim);letter-spacing:.04em}
.colophon b{color:var(--red);font-weight:600;letter-spacing:.18em;text-transform:uppercase}
.colophon .row{display:flex;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-top:10px}

@media(max-width:720px){ .toc{grid-template-columns:1fr} .chapter__head{gap:14px} body{font-size:16px} }

/* load reveal */
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.cover__theme,.cover__sub,.cover__tag{animation:rise .7s both}
.cover__sub{animation-delay:.08s}.cover__tag{animation-delay:.16s}
</style>
</head>
<body>
  <header class="cover">
    <div class="wrap">
      <div class="cover__bar"><span class="brand">● DevSecNews</span><span>Issue ${esc(issueId)}</span></div>
      <div class="cover__media">
        ${hasVideo
          ? `<video autoplay muted loop playsinline poster="${posterRel}"><source src="${videoRel}" type="video/mp4" /></video>`
          : `<img src="${posterRel}" alt="cover" />`}
      </div>
      <h1 class="cover__theme">${esc(themeMain)}</h1>
      ${themeSub ? `<p class="cover__sub">${esc(themeSub)}</p>` : ""}
      ${tagline ? `<p class="cover__tag">${esc(tagline)}</p>` : ""}
      <div class="cover__foot"><span>${esc(issueDate)}</span><span>Node.js · Java · AI/MCP</span><span>Developer Security</span></div>
    </div>
    <div class="cover__scroll" aria-hidden="true">↓</div>
  </header>

  <div class="scroller">
  <nav class="contents"><div class="wrap">
    <div class="contents__label">In this issue</div>
    <div class="toc">${tocHtml}</div>
  </div></nav>

  <main class="wrap">
    ${main}
    ${glossaryHtml}
  </main>

  <footer class="colophon"><div class="wrap">
    <b>DevSecNews</b>
    <div class="row"><span>Issue ${esc(issueId)} · ${esc(issueDate)}</span><span>윈드쇼크 · windshock.github.io</span></div>
    <div class="row"><span>발견은 흔해졌다 · 검증은 귀해졌다 · 신뢰가 전장이다</span></div>
  </div></footer>
  </div>
  <script>
  (function(){
    var cover=document.querySelector('.cover');
    if(!cover) return;
    var wrap=cover.querySelector('.wrap'),
        media=cover.querySelector('.cover__media'),
        arrow=cover.querySelector('.cover__scroll');
    function tick(){
      var p=Math.min(Math.max(window.scrollY/window.innerHeight,0),1);
      if(wrap){wrap.style.opacity=(1-p*0.9).toFixed(3);
        wrap.style.transform='scale('+(1-p*0.07).toFixed(3)+')';
        wrap.style.filter='blur('+(p*5).toFixed(1)+'px)';}
      if(media) media.style.transform='translateY('+(p*36).toFixed(1)+'px)';
      if(arrow) arrow.style.opacity=Math.max(0,1-p*4).toFixed(3);
    }
    addEventListener('scroll',function(){requestAnimationFrame(tick);},{passive:true});
    tick();
  })();
  </script>
</body>
</html>`;

fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync(output, html, "utf8");
console.log(`wrote: ${output}`);
