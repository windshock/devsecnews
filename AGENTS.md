# AGENTS

이 파일은 자동화/AI 도구가 이 프로젝트를 빠르게 이해하도록 돕는 요약입니다.

## 목적
- DevSecNews 월간 리포트를 Markdown에서 HTML/카드뉴스로 변환합니다.
- GitHub Pages 배포는 `docs/` 폴더에 산출물을 복사하는 방식입니다.
- `# (0) Editor's Pick` 섹션을 최상단에 둘 수 있으며, `editorial/{YYYY-MM}/`을 참조합니다.

## 핵심 입력/출력
- 입력: `content/devsecnews-YYYY-MM-node-java.md`
- 출력:
  - 리포트 HTML: `dist/devsecnews-YYYY-MM-node-java.html`
  - 분리 리포트: `dist/devsecnews-YYYY-MM-node.html`, `dist/devsecnews-YYYY-MM-java.html`
  - 카드 HTML: `cards/devsecnews-YYYY-MM-node-java/cards.html` (PNG 생성은 비활성화됨)
  - 배포: `docs/`

## 월호 선택 규칙
- 기본 월호: `2026-01`
- 변경 방법: `DEVSECNEWS_MONTH=YYYY-MM` 또는 `--month YYYY-MM`

## 주요 커맨드
- `npm run build:html` (리포트 HTML)
- `npm run build:cards` (카드 HTML + 리포트 HTML)
- `npm run build:html:all` (분리 리포트까지 모두 생성)
- `npm run verify` (URL/참고자료 일치 검사)
- `npm run deploy` (docs/ 배포 + latest/index 갱신)

**⚠️ 필수 플래그**: 빌드/배포 시 항상 `--no-rewrite-copy --no-rewrite-report` 사용.
AI rewrite 옵션을 켜면 5~10분 타임아웃 발생. 예시:
```bash
npm run build:cards -- --month 2026-03 --no-rewrite-copy --no-rewrite-report
npm run deploy -- --month 2026-03 --no-rewrite-copy --no-rewrite-report
```

## 월간 제작 워크플로우(중요)
1) 월호 설정: `DEVSECNEWS_MONTH=YYYY-MM`
2) 조사/작성: `prompts/devsecnews-security-researcher-skill.md`로 `content/devsecnews-YYYY-MM-node-java.md` 생성/증분 업데이트
3) 검증: `npm run verify -- --month YYYY-MM`
4) 빌드: `npm run build:cards -- --month YYYY-MM --no-rewrite-copy --no-rewrite-report`
5) 배포: `npm run deploy -- --month YYYY-MM --no-rewrite-copy --no-rewrite-report`

## 스크립트 요약
| 스크립트 | 역할 | 비고 |
|----------|------|------|
| `scripts/md2html.mjs` | MD → 리포트 HTML | |
| `scripts/md2cards.mjs` | MD → 카드 HTML (KO↔EN 토글 지원) | 핵심 렌더러 |
| `scripts/cards2png.mjs` | 카드 HTML → PNG | **비활성화됨** (`build-cards.mjs`에서 주석 처리) |
| `scripts/build-cards.mjs` | verify → md2cards → md2html 오케스트레이터 | |
| `scripts/split-md.mjs` | 통합 MD → Node/Java 분리 | |
| `scripts/verify.mjs` | URL/참고자료 검증 | |
| `scripts/deploy.mjs` | docs/ 복사 + index/latest 갱신 | |
| `scripts/gen-site.mjs` | docs/index.html + docs/latest.html 생성 | |

## 문서 규칙(요약)
- URL은 Markdown 링크로 감싸지 않고 **"문자열 그대로"** 표기합니다 (`[text](url)` ✗ → `url` ✓).
- 본문 URL과 참고자료 URL이 항상 **1:1로 일치**해야 합니다 (`verify.mjs`가 검사).
- 카드뉴스용 메타는 HTML 주석 `<!--CARD {JSON} -->` 형태로 유지합니다.

---

## CARD JSON 구조 (md2cards.mjs)

### ⚠️ 데이터 흐름 — 새 필드 추가 시 반드시 3곳 수정
```
MD의 <!--CARD {JSON} -->
  ↓ (1) parseCardMetaBlocks()  — JSON에서 필드 추출
  ↓ (2) metaCards loop          — cards[] 배열에 복사
  ↓ (3) buildCardsHtml()        — HTML로 렌더링
```
**한 곳이라도 빠지면 데이터가 전달되지 않습니다.**
실제로 `ctaLinks` 필드가 (1)에서만 누락되어 CTA 카드에 옛날 하드코딩 링크가 나온 적 있음.

### 카드 종류(kind)와 렌더링
| kind | 렌더링 방식 | 사용 필드 |
|------|-------------|-----------|
| `editorial` | SUMMARY / RISK / IMPACT 3단 박스 | bodyMd, whyMd, impactMd |
| `checklist` | 번호 박스 리스트 (`parseNumbered`) | bodyMd ("1. text" 형식) |
| `insight` | PATTERN / ROOT CAUSE / PRINCIPLE 3단 박스 (cyan) | bodyMd, whyMd, impactMd |
| `cta` | 설명 + 클릭 버튼 링크 | bodyMd, **ctaLinks[]** |
| `summary` | editorial과 동일 | bodyMd, whyMd, impactMd |

### 도메인 → 테마
| domain | 색상 | 뱃지 |
|--------|------|------|
| `node` | green | Node.js |
| `java` | orange | Java |
| `editorial` | violet | Editor's Pick |
| `insight` | cyan | Lessons Learned |
| `common` | slate | 기본 |

### 이중 언어 (KO↔EN 토글)
- CARD JSON에 `title_en`, `bodyMd_en`, `whyMd_en`, `impactMd_en`, `actionMd_en`, `ctaLinks_en` 필드 추가
- 렌더러가 `data-lang="ko"` / `data-lang="en"` 요소를 이중 생성, JS 토글로 전환
- `_en` 필드가 없으면 해당 카드는 한국어만 표시
- 헤더 우측 🇰🇷/🇺🇸 버튼으로 전환

### 카드 콘텐츠 제약
- bodyMd **약 300자 초과 시 오버플로우** 가능
- **코드블록은 카드에서 렌더링 안 됨** — 텍스트로 요약할 것
- checklist는 **5항목 이내, 항목당 30자 이내** 권장
- 자동 CTA 카드 생성은 **주석 처리됨** — MD에 `tools-1` CTA CARD를 직접 작성할 것

## OG 미리보기 (LinkedIn/Twitter)
- `media/YYYY-MM/cover.webp`를 og:image로 사용
- `md2cards.mjs`의 `buildCardsHtml()`에서 baseName으로 경로 자동 생성
- 배포 시 `docs/media/YYYY-MM/cover.webp`에도 복사 필요
- LinkedIn 캐시 갱신: https://www.linkedin.com/post-inspector/ 에서 URL 입력

## 미디어 파일
- `media/YYYY-MM/cover.png` — 원본 커버 이미지
- `media/YYYY-MM/cover.webp` — OG용 압축 이미지 (PNG 대비 ~94% 감소)
- `media/YYYY-MM/cover.mp4` — 커버 동영상 (LinkedIn 직접 업로드용)
- `media/devsecnews_YYYY_MM_cards_linkedin.gif` — LinkedIn 공유용 GIF

---

## 알려진 함정 (Known Pitfalls)

### 빌드/배포
1. **AI rewrite 타임아웃**: `--no-rewrite-copy --no-rewrite-report` 없으면 빌드 5~10분, 타임아웃 빈번. **항상 붙일 것.**
2. **PNG 비활성화됨**: `build-cards.mjs`에서 `cards2png.mjs` 호출이 주석 처리됨. Playwright가 필요한 PNG 생성을 하려면 주석 해제.
3. **git add 범위 주의**: `git add cards/ docs/`가 audio/wav/npy 등 불필요 파일까지 포함할 수 있음. 대상 파일을 명시적으로 지정하거나 `.gitignore` 확인.

### CARD JSON
4. **필드 전달 누락 (가장 흔한 버그)**: CARD JSON에 새 필드 추가 시 `parseCardMetaBlocks()` → `metaCards loop` → `buildCardsHtml()` **세 곳 모두** 수정. 한 곳만 고치면 데이터가 전달 안 됨.
5. **자동 CTA 카드 중복**: `md2cards.mjs`의 자동 CTA 생성이 주석 처리됨. MD에 CTA CARD가 이미 있는데 자동 생성을 켜면 중복 발생.
6. **카드 콘텐츠 오버플로우**: bodyMd 300자+ 또는 코드블록 → 카드 하단 잘림. 텍스트 요약으로 대체.
7. **checklist 항목 수**: 5개 초과 또는 항목이 길면 하단 잘림. 항목당 30자 이내 권장.

### 콘텐츠
8. **URL 컨벤션**: 본문에서 Markdown 링크 `[text](url)` 사용 금지. bare URL만 사용. CARD JSON 내부는 예외.
9. **참고자료 섹션 번호**: `verify.mjs`는 `(5)`, `(6)`, `(7)` 중 하나의 참고자료 헤더를 인식. 다른 번호면 검증 실패.
10. **CARD 블록 내 URL**: verify 검사 대상이 아님. CARD JSON에는 Markdown 링크 사용 가능.

### 카드 디자인 시행착오 기록
11. **도메인 태그 선택**: 범용 교훈(lessons learned)에 `common` 태그 → 독자에게 뜬금없음. `node`/`java` 태그 → 범용이니 틀림. **`insight` 신규 도메인 생성이 정답.**
12. **참조 링크 적절성**: KISA/M-safer 같은 정부 서비스 링크보다 **실제 보도 기사**(BJC저널, 일요시사 등)가 맥락에 더 적합.
13. **한국어 문장 품질**: AI가 작성한 한국어는 주어-서술어 불일치, 조어, 단조로운 표현이 반복됨. 35개 문장을 고쳐도 부족해서 결국 사람이 다시 썼음. **AI 한국어 초고는 반드시 사람이 검토할 것.**
