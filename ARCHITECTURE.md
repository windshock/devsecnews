# Architecture

## 개요
이 프로젝트는 월간 리포트 Markdown을 기준으로 리포트 HTML과 카드뉴스(HTML/PNG)를 생성하고, `docs/` 폴더로 배포합니다.

## 데이터 흐름

```
[devsecnews-YYYY-MM-node-java.md]
            |
            |  (md2html)
            v
[devsecnews-YYYY-MM-node-java.html]
            |
            |  (split-md)
            v
[devsecnews-YYYY-MM-node.md]   [devsecnews-YYYY-MM-java.md]
            |                               |
            | (md2html)                     | (md2html)
            v                               v
[devsecnews-YYYY-MM-node.html] [devsecnews-YYYY-MM-java.html]
            |
            |  (md2cards)
            v
[cards/devsecnews-YYYY-MM-node-java/cards.html]
            |
            |  (cards2png)
            v
[cards/devsecnews-YYYY-MM-node-java/card-XX.png]
            |
            |  (deploy)
            v
[docs/* + docs/latest.html + docs/index.html]
```

## 스크립트 I/O 요약

| 스크립트 | 입력 | 출력 | 비고 |
|---|---|---|---|
| `scripts/md2html.mjs` | `devsecnews-YYYY-MM-node-java.md` | `devsecnews-YYYY-MM-node-java.html` | 탭/복사/TTS 포함 |
| `scripts/split-md.mjs` | `devsecnews-YYYY-MM-node-java.md` | `devsecnews-YYYY-MM-node.md`, `devsecnews-YYYY-MM-java.md` | 참고자료 자동 재생성 |
| `scripts/md2cards.mjs` | `devsecnews-YYYY-MM-node-java.md` | `cards/.../cards.html` | CARD 메타 우선 사용 |
| `scripts/cards2png.mjs` | `cards/.../cards.html` | `cards/.../card-XX.png` | Playwright 필요 |
| `scripts/verify.mjs` | `devsecnews-YYYY-MM-node-java.md` | (검증 로그) | URL/참고자료 일치 검사 |
| `scripts/deploy.mjs` | 산출물 폴더 | `docs/` | 배포 복사 |
| `scripts/gen-site.mjs` | 월호 | `docs/index.html`, `docs/latest.html` | 랜딩/리다이렉트 |

## 월호 선택
- 기본 월호: `2026-01`
- 변경: `DEVSECNEWS_MONTH=YYYY-MM` 또는 `--month YYYY-MM`
