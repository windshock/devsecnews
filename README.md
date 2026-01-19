# devsecnews

DevSecNews 월간 요약(Markdown)과 HTML 뷰어/카드뉴스 산출물을 생성하는 작은 Node.js 프로젝트입니다.

## 빠른 시작

```bash
npm ci
npm run build:html
```

생성 파일:
- `devsecnews-2026-01-node-java.html`
- `devsecnews-2026-01-node.html`
- `devsecnews-2026-01-java.html`

## 카드뉴스(HTML → PNG)

카드 HTML 생성:

```bash
npm run build:cards:html
```

PNG 캡처(Playwright 필요):

```bash
npm i -D playwright
npx playwright install chromium
npm run build:cards:png
```

메인 HTML(`devsecnews-2026-01-node-java.html`)은 `cards/devsecnews-2026-01-node-java/` 아래 PNG가 있으면 상단에 카드 덱(좌우 넘김)으로 표시합니다.

