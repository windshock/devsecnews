# DevSecNews 2026-03 수정 계획서

> 작성일: 2026-03-27  
> 대상: content/\*, prompts/\*, scripts/md2html.mjs, scripts/split-md.mjs  
> 범위: 구조 오류 / 한국어 표현 / HTML·스크립트 영향도 / 콘텐츠 검증

---

## 목차

1. [구조 수정 (content/)](#1-구조-수정)
2. [한국어 표현 수정](#2-한국어-표현-수정)
3. [HTML / 스크립트 영향도](#3-html--스크립트-영향도)
4. [콘텐츠 추가·제거 검토](#4-콘텐츠-추가제거-검토)
5. [프롬프트 보강 (prompts/)](#5-프롬프트-보강)
6. [실행 순서](#6-실행-순서)
7. [수정 제외 범위](#7-수정-제외-범위)

---

## 1. 구조 수정

### 1-A. 분리 파일 헤더 오류

**파일**: `devsecnews-2026-03-node.md`, `devsecnews-2026-03-java.md`  
**근인**: `split-md.mjs`가 헤더를 재작성하지 않고 원본 그대로 복사

```
node.md 1행
  Before: # DevSecNews 2026-03 — Node.js/Java 보안 요약(개발자용)
  After:  # DevSecNews 2026-03 — Node.js 보안 요약(개발자용)

java.md 1행
  Before: # DevSecNews 2026-03 — Node.js/Java 보안 요약(개발자용)
  After:  # DevSecNews 2026-03 — Java 보안 요약(개발자용)
```

**영구 수정 위치**: `split-md.mjs`에서 출력 헤더를 플랫폼별로 rewrite하는 로직 추가 (§3-A 참고)

---

### 1-B. 분리 파일 Summary·체크리스트에 상대 플랫폼 항목 혼재

**파일**: `devsecnews-2026-03-node.md`, `devsecnews-2026-03-java.md`  
**근인**: `split-md.mjs`의 `header` 슬라이스가 `# (2) Node.js` 이전 전체를 그대로 복사

#### node.md에서 제거할 항목

- Summary TOP 5: Java 전용 Spring(#1), Netty/ZooKeeper(#3)
- 체크리스트 6~10번 (mvn 명령, spring-security-web, actuator, netty, zookeeper)
- `<!--CARD-->`: `"domain":"java"` (summary-1), `"domain":"common"` (summary-3)

#### java.md에서 제거할 항목

- Summary TOP 5: Node 전용 node-forge(#2), Handlebars(#4), Picomatch(#5)
- 체크리스트 1~5번 (npm ls, handlebars, node-forge 2건, picomatch)
- `<!--CARD-->`: `"domain":"node"` (summary-2, summary-4, summary-5)

> 장기 해결: `split-md.mjs`에서 CARD `domain` 필드 기반 필터링 로직 추가 (§3-A 참고)

---

### 1-C. 분리 파일 섹션 번호 불연속

**파일**: `devsecnews-2026-03-node.md`, `devsecnews-2026-03-java.md`  
**현상**: split 후 섹션이 (1)→(2 또는 3)→(5)→(7)로 건너뜀

```
node.md 재번호
  (1) Summary             → (1) Summary
  (2) Node.js             → (2) Node.js
  (5) 체크리스트          → (3) 이번 달 개발자 체크리스트
  (7) 참고자료            → (4) 참고자료

java.md 재번호
  (1) Summary             → (1) Summary
  (3) Java                → (2) Java
  (5) 체크리스트          → (3) 이번 달 개발자 체크리스트
  (7) 참고자료            → (4) 참고자료
```

> `node-java.md` 원본 번호 체계는 `security-researcher-skill.md §3` 규칙 준수이므로 유지.

**HTML 영향 주의**: 1-C 번호 재정렬 시 `splitByHeadings()`의 하드코딩 탐색이 깨짐 → §3-F 참고. 1-C는 단기 필수 수정이 아님. 1-A·1-B 먼저 처리 후 판단.

---

### 1-D. java.md에 섹션 (4) 공통 트렌드 누락

**파일**: `devsecnews-2026-03-java.md`  
**근인**: `split-md.mjs`에서 `javaSection`이 `idxJava ~ idxCommon` 범위만 포함

**수정**: java.md에 (4) 공통 트렌드·권장사항과 "한 문장 결론" 추가.  
`split-md.mjs` 장기 수정 전까지는 `node-java.md`의 (4) 섹션을 java.md에 수동 삽입.

---

## 2. 한국어 표현 수정

### 2-A. `~해야 합니다` 과밀 → 어미 다양화

**위치**: 전 파일 체크리스트·항목별 설명·바로 할 일·취약 패턴 전체  
**규칙**: 3문장 연속 동일 어미 금지, `~해야 합니다` 비율 50% 이하

| 기존 | 대체 후보 |
|------|-----------|
| `~를 확인해야 합니다` | `~를 먼저 확인합니다` / `~를 확인하세요` |
| `~를 업데이트해야 합니다` | `~로 업데이트합니다` / `~로 올리세요` |
| `~를 추가해야 합니다` | `~를 추가합니다` / `~를 넣으세요` |
| `~를 제거해야 합니다` | `~를 제거합니다` / `~를 걷어냅니다` |
| `~을 막아야 합니다` | `~을 차단합니다` / `~을 막습니다` |

---

### 2-B. "흔들렸습니다" → 보안 맥락 표현으로

```
Before: Spring 관리 경로와 보안 헤더가 동시에 흔들렸습니다.
After:  Spring 관리 경로와 보안 헤더에서 취약점이 동시에 터졌습니다.

Before: Netty와 ZooKeeper는 네트워크 해석 차이가 문제였습니다.
After:  Netty와 ZooKeeper는 네트워크 해석 차이에서 취약점이 나왔습니다.
```

---

### 2-C. "~로 읽어야 합니다 / ~로 받아들여야 합니다" → 직접 단언

```
Before: 이번 달 뉴스는 "암묵적 해석을 줄이고 명시적 검증을 늘려라"로 읽어야 합니다.
After:  이번 달 핵심: 암묵적 해석을 줄이고 명시적 검증을 기본값으로 올립니다.

Before: 이번 달 Node 이슈는 편의 기능을 보안 경계로 쓰지 않아야 한다는 경고로 읽어야 합니다.
After:  이번 달 Node 이슈는 하나로 읽힙니다. 편의 기능을 보안 경계로 쓰면 반드시 우회됩니다.

Before: 이번 달 Java 이슈는 운영 편의용 우회 경로를 신뢰 경계에서 걷어내야 한다는 신호로 받아들여야 합니다.
After:  이번 달 Java 이슈의 공통점: 운영 편의로 만든 우회 경로가 그대로 신뢰 경계가 됩니다.
```

---

### 2-D. "안 좋은 예" → "취약한 예"  ⚠️ HTML 스크립트 수정 선행 필요 (§3-B)

**위치**: 취약 개발 패턴 Top 5 코드 예시 헤딩 전체  
**주의**: `md2html.mjs`의 `initCopyButtons()` 수정(§3-B)과 반드시 함께 처리.

```
Before: 안 좋은 예:
After:  취약한 예:
```

---

### 2-E. CVE 표 "확인 불가" → "보고 없음"

**위치**: Node.js, Java CVE 표의 "악용 여부(in-the-wild)" 열 전체

```
Before: 확인 불가
After:  보고 없음
```

---

### 2-F. Summary TOP 5 각 항목 압축

**문제**: "무슨 일 / 왜 중요 / 지금 할 일" 3파트로 항목당 4~5줄  
**수정**: "지금 할 일" 제거, 2~3줄 이내 압축 (체크리스트(5)에서 다룸)

```
Before:
1. **Spring 관리 경로와 보안 헤더가 동시에 흔들렸습니다.**
   무슨 일이 있었나: ...  왜 중요한가: ...  지금 할 일: ...

After:
1. **Spring 관리 경로·보안 헤더 취약점(CVE-2026-22731/22732/22733)**
   Actuator 경로와 애플리케이션 경로 충돌로 인증 우회, 보안 헤더 미기록 이슈가 터졌습니다.
   관리 경로와 애플리케이션 경로가 겹치면 인증 우회와 브라우저 방어 누락이 동시에 생깁니다.
```

---

### 2-G. 취약 패턴 "공격자는 ~" 첫 문장 다양화

**규칙**: 5개 중 최대 2개만 "공격자는 ~" 허용, 나머지는 결과·원인 중심으로

| 기존 | 대체 예시 |
|------|-----------|
| 공격자는 X를 이용합니다. | 이 패턴에서 3월에 실제 취약점이 나왔습니다. |
| 공격자는 X를 노립니다. | X와 Y가 섞이는 순간 Z가 됩니다. |

---

## 3. HTML / 스크립트 영향도

### 3-A. split-md.mjs 수정 필요 (1-A·1-B·1-C·1-D 영구 해결)

| 기능 | 우선순위 | 설명 |
|------|----------|------|
| 헤더 재작성 | 높음 | 출력 파일 1행 `Node.js/Java` → `Node.js` 또는 `Java` |
| Summary 항목 필터 | 높음 | CARD `domain` 필드로 Summary 불릿·CARD 블록 플랫폼 필터링 |
| 체크리스트 필터 | 중간 | Java 전용 mvn 항목은 node.md에서 제거, npm 항목은 java.md에서 제거 |
| 섹션 번호 재작성 | 낮음 | (5)→(3), (7)→(4) 출력 시 재라벨링 |
| 공통 트렌드 포함 | 낮음 | javaDoc에 (4) 공통 트렌드 섹션 포함 |

> **단기 대안**: split 재실행 후 node.md·java.md를 1-A~1-D 기준으로 수동 보정.

---

### 3-B. md2html.mjs — 코드블록 레이블 감지 ⚠️ BREAKING

**위치**: `initCopyButtons()` 함수

```js
// 현재
if (prevText.startsWith("안 좋은 예")) wrap.classList.add("bad");

// 수정 (2-D와 함께 처리)
if (/^(안 좋은 예|취약한 예)/.test(prevText)) wrap.classList.add("bad");
```

2-D에서 "안 좋은 예" → "취약한 예"로 변경 시 `.bad` CSS 클래스가 미적용됨.  
**MD 변경 전에 반드시 이 수정을 먼저 배포**하거나 동시에 처리.

---

### 3-C. md2html.mjs — 브라우저 탭 타이틀 및 H1 중복

**현재**: `title = path.basename(input)` → 파일명이 헤더 hero-title로 표시  
**문제**: 본문 첫 H1은 `initHero()`에서 제거되지 않아 타이틀이 헤더 + 본문 두 곳에 나타남

**수정 (권장)**:
```js
// 1) MD 첫 H1을 title로 사용
const h1Match = md.match(/^# (.+)$/m);
const title = h1Match ? h1Match[1] : path.basename(input);

// 2) initHero()를 첫 H1 무조건 제거로 변경
function initHero() {
  const firstH1 = document.querySelector(".article h1");
  if (firstH1) firstH1.remove();
}
```

---

### 3-D. md2html.mjs — 분리 파일 뷰 토글 오작동

**현상**: node.html에서 "Java" 뷰 선택 시 콘텐츠가 비어 화면 공백  
**수정**:
```js
const order = ["all","summary","node","java"].filter(v => {
  if (v === "node") return Boolean(document.querySelector(".view-node")?.children.length);
  if (v === "java") return Boolean(document.querySelector(".view-java")?.children.length);
  return true;
});
```

---

### 3-E. md2html.mjs — Source 링크 컨텍스트 손실

**현재**: `formatSourceLinks()`가 모든 GitHub 링크를 `github.com`으로 단축 → 여러 링크 구분 불가  
**수정**:
```js
const url = new URL(a.href);
const parts = url.pathname.split("/").filter(Boolean).slice(0, 2);
a.textContent = url.hostname.replace(/^www\./, "") + (parts.length ? "/" + parts.join("/") : "");
// 결과: github.com/netty/netty, spring.io/security
```

---

### 3-F. splitByHeadings() — 분리 파일 번호 재정렬 시 파싱 깨짐

**현재 코드**:
```js
const idxNode = md.indexOf("# (2) Node.js");
const idxJava = md.indexOf("# (3) Java");
const idxCommon = md.indexOf("# (4) 공통 트렌드/권장사항");
```

1-C에서 분리 파일의 `# (3) Java` → `# (2) Java`로 바꾸면 `splitByHeadings()`가 Java 섹션을 못 찾음.

**단기 대안**: 1-C(섹션 번호 재정렬)는 이번 싸이클에서 skip. 1-A·1-B만 수정.  
**장기 수정**: `splitByHeadings()`를 키워드 기반으로 변경:
```js
const idxJava = md.search(/^# \(\d+\) Java$/m);
```

---

### 3-G. HTML 메타 태그 부재 (낮은 우선순위)

**수정 방법** (md2html.mjs HTML 템플릿에 추가):
```html
<meta name="description" content="${escapeHtml(subtitle)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(subtitle)}" />
```

---

### 3-H. docs/ 배포 현황

현재 `docs/`에는 2026-01, 2026-02만 배포됨. 2026-03은 미배포.  
수정 완료 후:
```bash
npm run build:cards -- --month 2026-03
npm run deploy -- --month 2026-03
```

---

## 4. 콘텐츠 추가·제거 검토

### 4-A. 2월 중복 확인

2월 커버 항목: Swiper, OpenClaw, Tomcat, Avro  
3월 항목과 패키지·CVE 번호 중복 없음 → **재검토 불필요**

---

### 4-B. 3월 CVE 항목별 포함 적절성

| CVE | 패키지 | 공지일 | 판정 |
|-----|--------|--------|------|
| CVE-2026-22732 | spring-security-web | 2026-03-19 | ✅ |
| CVE-2026-22731 | spring-boot-starter-actuator | 2026-03-19 | ✅ |
| CVE-2026-22733 | spring-boot-starter-actuator | 2026-03-19 | ✅ |
| CVE-2026-33870 | netty-codec-http | 2026-03-26 | ✅ |
| CVE-2026-24281 | zookeeper | 2026-03-07 | ✅ |
| CVE-2026-33916 | handlebars | 2026-03-26 | ✅ |
| CVE-2026-33896/94/95 | node-forge | 2026-03-26 | ✅ (3건 묶음) |
| CVE-2026-33672 | picomatch | 2026-03-25 | ✅ |

전체 8 CVE · 6 패키지. Node 3패키지 / Java 3패키지. 균형 양호.

---

### 4-C. 누락 가능 항목 (다음 업데이트 시 확인 권장)

- **jackson-databind**: 자주 포함되는 Java 패키지. 3월 advisory 확인 필요.
- **express / fastify**: Node.js 웹 프레임워크 3월 이슈 확인.
- **json5 / ajv**: schema 관련 3월 이슈 확인.
- **io.grpc**: gRPC Java 3월 공지 확인.

---

### 4-D. 제거 검토

현재 포함 항목 중 제거 대상 없음.  
단, Netty/ZooKeeper(Summary #3)의 CARD `domain:"common"` → `"domain":"java"` 변경 검토.  
Netty는 Java 생태계이고 ZooKeeper도 Java 런타임 환경이 주. `domain:"common"`은 과분.

---

## 5. 프롬프트 보강

### 5-A. security-researcher-skill.md — 어미 다양화 규칙 추가 (§6에 추가)

```markdown
### 6.2) 어미 다양화(하드)
- 같은 어미를 3문장 연속 쓰지 않는다.
- 체크리스트 전체에서 ~해야 합니다 비율은 50% 이하.
- 나머지는 ~합니다 / ~하세요 / ~를 추가합니다 / ~를 넣습니다로 분산한다.
```

---

### 5-B. security-researcher-skill.md — Summary TOP 5 길이 상한 추가 (§7.1에 추가)

```markdown
### 7.1.2) Summary TOP 5 항목 길이 상한
- 각 항목: 이슈 요약 + 영향 2문장 이내.
- "지금 할 일" 파트는 Summary에 넣지 않는다. 체크리스트(5)에서 다룬다.
- 항목당 최대 3줄 초과 금지.
```

---

### 5-C. report-copy-editor-skill.md — 금지어·패턴 보강

```markdown
## 추가 금지어/금지 패턴
- "안 좋은 예" → "취약한 예"로 통일
- "확인 불가" → "보고 없음"으로 통일 (CVE 표 악용 여부 칸)
- "~로 읽어야 합니다" / "~로 받아들여야 합니다" → 직접 단언으로
- "흔들렸습니다" (보안 이슈 서술) → "취약점이 터졌습니다" / "이슈가 나왔습니다"

## 어미 다양화 규칙
- 동일 어미 3문장 연속 금지. (card-copy-editor와 동일 기준)
```

---

## 6. 실행 순서

```
Step 1  md2html.mjs 수정 (3-B BREAKING, 3-C·3-D·3-E)
        └─ "취약한 예" 레이블 수정(3-B)은 Step 2 전에 반드시 완료.

Step 2  node-java.md 한국어 표현 수정 (2-A ~ 2-G)
        └─ 원본이므로 먼저 정리.

Step 3  프롬프트 수정 (5-A·5-B·5-C)

Step 4  split-md.mjs 재실행 → node.md, java.md 재생성
        └─ 장기 수정(3-A) 준비 됐으면 함께 적용.
           아니면 재생성 후 1-A·1-B·1-D 수동 보정.
           1-C(번호 재정렬)는 3-F 확인 후 판단.

Step 5  npm run verify -- --month 2026-03

Step 6  npm run build:cards -- --month 2026-03

Step 7  분리 파일 HTML 확인 (node.html·java.html 뷰 토글·섹션 파싱, 3-D·3-F)

Step 8  npm run deploy -- --month 2026-03
```

---

## 7. 수정 제외 범위

- 코드블록 내부 (모든 파일)
- `<!--CARD ... -->` JSON 내 기술 정보 (URL, 버전, CVE)
- CVE 번호, 버전 번호, 패키지명, URL 문자열
- `ARCHITECTURE.md`, `AGENTS.md`, `README.md`
- `verify.mjs`, `deploy.mjs`, `gen-site.mjs`, `cards2png.mjs`
