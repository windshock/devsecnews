# devsecnews

DevSecNews 월간 요약(Markdown)과 HTML 뷰어/카드뉴스 산출물을 생성하는 작은 Node.js 프로젝트입니다.

## 한 장 요약

- 입력 파일: `devsecnews-YYYY-MM-node-java.md` (월호별 1개)
- 산출물: 리포트 HTML / 카드 HTML / 카드 PNG
- 배포: `docs/` 폴더로 복사 (GitHub Pages)
- 월호 변경: `DEVSECNEWS_MONTH=2026-01` 또는 `--month 2026-01`

## 빠른 시작

```bash
npm ci
npm run build:html
```

생성 파일:
- `devsecnews-YYYY-MM-node-java.html`
- `devsecnews-YYYY-MM-node.html`
- `devsecnews-YYYY-MM-java.html`

## 월호 설정(필수)

기본값은 `2026-01`입니다. 다른 월호로 작업하려면 아래 중 하나를 사용합니다.

- 환경변수: `DEVSECNEWS_MONTH=2026-02`
- CLI 옵션: `--month 2026-02`

예시:

```bash
DEVSECNEWS_MONTH=2026-02 npm run build:html
npm run build:cards:html -- --month 2026-02
```

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

한 번에 실행:

```bash
npm run build:cards
```

메인 HTML(`devsecnews-YYYY-MM-node-java.html`)은 `cards/devsecnews-YYYY-MM-node-java/` 아래 PNG가 있으면 상단에 카드 덱(좌우 넘김)으로 표시합니다.

## 분리 리포트 생성

```bash
npm run build:html:all
```

Node/Java 분리 리포트까지 한 번에 생성합니다.

## 유효성 검사

```bash
npm run verify
```

본문 URL과 참고자료 URL이 정확히 일치하는지 검사합니다.

## GitHub Pages 배포 (./docs)

이 프로젝트는 GitHub Pages를 `docs/` 폴더 기반으로 배포합니다.
생성된 산출물을 `docs/` 폴더로 복사하여 배포합니다.

배포 스크립트 실행:

```bash
npm run deploy
```

이 명령어는 다음을 수행합니다:
1. `npm run build:cards` 실행
2. 루트의 `devsecnews-*.html`과 `cards/` 폴더 내용을 `docs/`로 복사
3. `docs/index.html`과 `docs/latest.html`을 최신 월호로 갱신
