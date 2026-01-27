import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseArgs, getMonth, defaultBaseName } from "./cli.mjs";

function usageAndExit() {
  console.error(
    "Usage:\n  node scripts/gen-site.mjs --month YYYY-MM"
  );
  process.exit(2);
}

const { flags } = parseArgs(process.argv.slice(2));
if (flags.help) usageAndExit();

const month = getMonth(flags);
const baseName = defaultBaseName(month);
const docsDir = path.join("docs");
fs.mkdirSync(docsDir, { recursive: true });

const indexHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DevSecNews ${escapeHtml(month)} (Node.js/Java)</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; margin: 40px auto; max-width: 920px; padding: 0 16px; }
    h1 { font-size: 24px; margin: 0 0 12px; }
    p { margin: 0 0 16px; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 16px; }
    a.card { display: block; border: 1px solid rgba(127,127,127,.35); border-radius: 12px; padding: 14px 16px; text-decoration: none; color: inherit; }
    a.card:hover { border-color: rgba(127,127,127,.6); }
    .title { font-weight: 700; margin: 0 0 4px; }
    .desc { opacity: .8; margin: 0; }
    code { background: rgba(127,127,127,.15); padding: 1px 6px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>DevSecNews ${escapeHtml(month)} — Node.js/Java</h1>
  <p>GitHub Pages 배포용 랜딩입니다. 아래 링크로 이동합니다.</p>
  <p><strong>공유용 링크:</strong> <code>./devsecnews-YYYY-MM-node-java.html</code> 또는 <code>./latest.html</code>만 사용합니다. <code>dist/</code> 경로는 공개되지 않습니다.</p>
  <div class="grid">
    <a class="card" href="./${escapeHtml(baseName)}.html">
      <div class="title">본문 리포트(HTML)</div>
      <p class="desc">탭/복사 버튼/TTS 포함.</p>
    </a>
    <a class="card" href="./cards/${escapeHtml(baseName)}/cards.html">
      <div class="title">카드 뉴스(cards.html)</div>
      <p class="desc">←/→로 넘깁니다. PNG 내보내기는 <code>?export=1</code> 입니다.</p>
    </a>
    <a class="card" href="./latest.html">
      <div class="title">latest.html</div>
      <p class="desc">가장 최근 리포트로 이동하는 고정 링크.</p>
    </a>
  </div>
</body>
</html>`;

const latestHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DevSecNews Latest</title>
  <meta http-equiv="refresh" content="0; url=./${escapeHtml(baseName)}.html" />
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; margin: 40px auto; max-width: 920px; padding: 0 16px; }
    a { color: inherit; }
  </style>
</head>
<body>
  <p>자동 이동 중입니다. 이동이 되지 않으면 <a href="./${escapeHtml(baseName)}.html">여기</a>를 클릭합니다.</p>
</body>
</html>`;

fs.writeFileSync(path.join(docsDir, "index.html"), indexHtml, "utf8");
fs.writeFileSync(path.join(docsDir, "latest.html"), latestHtml, "utf8");
console.log(`wrote: ${path.join(docsDir, "index.html")}`);
console.log(`wrote: ${path.join(docsDir, "latest.html")}`);

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
