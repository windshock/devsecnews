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

## 월간 제작 워크플로우(조사 → MD → 빌드 → 배포)

이 프로젝트는 “프롬프트로 조사해 MD를 만들고, 스크립트로 산출물 생성” 흐름을 전제로 합니다.

1) 월호 선택

```bash
export DEVSECNEWS_MONTH=2025-12
```

2) 조사 + MD 작성(수동/AI 단계)
- 프롬프트: `prompts/devsecnews-security-researcher-skill.md`
- 카드 문구 리라이트(선택): `prompts/devsecnews-card-copy-editor-skill.md`
- 산출물: `devsecnews-YYYY-MM-node-java.md`
- 규칙 요약:
  - URL은 Markdown 링크로 감싸지 않고 “문자열 그대로” 씁니다.
  - 본문/표/참고자료의 URL 문자열은 완전히 동일해야 합니다.
  - 기존 월호 MD가 있으면 “증분 업데이트”만 허용합니다.

카드 문구를 자연스럽게 다듬고 싶다면, 카드 초안을 3회 생성한 뒤(`N=3`) 같은 프롬프트로 리라이트 패스를 한 번 더 실행해 최종 1개를 선택하세요.

3) 검증 + 빌드

```bash
npm run verify -- --month "$DEVSECNEWS_MONTH"
npm run build:cards -- --month "$DEVSECNEWS_MONTH"
```

4) 배포(GitHub Pages용 docs 갱신)

```bash
npm run deploy -- --month "$DEVSECNEWS_MONTH"
```

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

카드 문구 자동 리라이트(2패스 + 3회 시도 선택):

```bash
node scripts/md2cards.mjs --month "$DEVSECNEWS_MONTH" --rewrite-copy --copy-attempts 3
```

`npm run build:cards`는 기본으로 위 리라이트를 포함합니다. 리라이트를 끄려면:

```bash
node scripts/build-cards.mjs --month "$DEVSECNEWS_MONTH" --no-rewrite-copy
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
