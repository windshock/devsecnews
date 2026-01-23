# scripts

## 공통 옵션
- `--month YYYY-MM` 또는 환경변수 `DEVSECNEWS_MONTH`
- `--input <path>` (지원하는 스크립트만)
- `--outDir <path>` (지원하는 스크립트만)

## 스크립트 목록

### md2html.mjs
- 역할: 리포트 HTML 생성
- 입력: `devsecnews-YYYY-MM-node-java.md`
- 출력: `devsecnews-YYYY-MM-node-java.html`

```bash
node scripts/md2html.mjs --month 2026-01
node scripts/md2html.mjs devsecnews-2026-01-node-java.md out.html
```

### md2cards.mjs
- 역할: 카드뉴스 HTML 생성
- 출력: `cards/devsecnews-YYYY-MM-node-java/cards.html`

```bash
node scripts/md2cards.mjs --month 2026-01
node scripts/md2cards.mjs devsecnews-2026-01-node-java.md cards/out
```

### cards2png.mjs
- 역할: 카드 HTML → PNG
- 필요: Playwright

```bash
node scripts/cards2png.mjs --month 2026-01
node scripts/cards2png.mjs cards/devsecnews-2026-01-node-java/cards.html
```

### split-md.mjs
- 역할: 통합 MD → Node/Java 분리

```bash
node scripts/split-md.mjs --month 2026-01
```

### verify.mjs
- 역할: 본문 URL과 참고자료 URL 일치 검사

```bash
node scripts/verify.mjs --month 2026-01
```

### deploy.mjs
- 역할: 산출물을 `docs/`로 복사

```bash
node scripts/deploy.mjs --month 2026-01
```

### gen-site.mjs
- 역할: `docs/index.html` 및 `docs/latest.html` 생성

```bash
node scripts/gen-site.mjs --month 2026-01
```

### build-all.mjs
- 역할: 분리/리포트 HTML 전체 생성

```bash
node scripts/build-all.mjs --month 2026-01
```
