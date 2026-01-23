# AGENTS

이 파일은 자동화/AI 도구가 이 프로젝트를 빠르게 이해하도록 돕는 요약입니다.

## 목적
- DevSecNews 월간 리포트를 Markdown에서 HTML/카드뉴스/PNG로 변환합니다.
- GitHub Pages 배포는 `docs/` 폴더에 산출물을 복사하는 방식입니다.

## 핵심 입력/출력
- 입력: `devsecnews-YYYY-MM-node-java.md`
- 출력:
  - 리포트 HTML: `devsecnews-YYYY-MM-node-java.html`
  - 분리 리포트: `devsecnews-YYYY-MM-node.html`, `devsecnews-YYYY-MM-java.html`
  - 카드 HTML/PNG: `cards/devsecnews-YYYY-MM-node-java/`
  - 배포: `docs/`

## 월호 선택 규칙
- 기본 월호: `2026-01`
- 변경 방법: `DEVSECNEWS_MONTH=YYYY-MM` 또는 `--month YYYY-MM`

## 주요 커맨드
- `npm run build:html` (리포트 HTML)
- `npm run build:cards` (카드 HTML+PNG+리포트 HTML)
- `npm run build:html:all` (분리 리포트까지 모두 생성)
- `npm run verify` (URL/참고자료 일치 검사)
- `npm run deploy` (docs/ 배포 + latest/index 갱신)

## 스크립트 요약
- `scripts/md2html.mjs`: MD → 리포트 HTML
- `scripts/md2cards.mjs`: MD → 카드 HTML
- `scripts/cards2png.mjs`: 카드 HTML → PNG (Playwright 필요)
- `scripts/split-md.mjs`: 통합 MD → Node/Java 분리
- `scripts/verify.mjs`: URL/참고자료 검증
- `scripts/deploy.mjs`: docs/ 복사
- `scripts/gen-site.mjs`: docs/index.html + docs/latest.html 생성

## 문서 규칙(요약)
- URL은 Markdown 링크로 감싸지 않고 “문자열 그대로” 표기합니다.
- 본문 URL과 참고자료 URL이 항상 1:1로 일치해야 합니다.
- 카드뉴스용 메타는 HTML 주석 `<!--CARD ... -->` 형태로 유지합니다.
