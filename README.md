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


## GitHub Pages 배포 (./docs)

이 프로젝트는 GitHub Pages를 `docs/` 폴더 기반으로 배포합니다.
생성된 산출물을 `docs/` 폴더로 복사하여 배포합니다.

배포 스크립트 실행:

```bash
npm run deploy
```

이 명령어는 다음을 수행합니다:
1. `npm run build:cards` 및 `npm run build:html` 실행
2. 루트의 `devsecnews-*.html`과 `cards/` 폴더 내용을 `docs/`로 복사
