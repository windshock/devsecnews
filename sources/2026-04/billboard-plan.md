# DevSecNews 2026-04 Billboard Plan

이 문서는 2026년 4월호 전광판/포스터 시안을 위한 기획안이다.  
목적은 이미지 자체보다 **4월호 메시지가 3월호와 어떻게 달라지는지**를 고정하고, 이후 다른 LLM/편집자가 `content/devsecnews-2026-04-node-java.md`, 카드뉴스, 배너 HTML/GIF에 같은 메시지를 반영할 수 있게 하는 것이다.

## 반드시 다른 문서에 반영할 것

> 아래 핵심 메시지와 차별화 프레임은 전광판용 문구에만 머물면 안 된다.  
> 다른 LLM/편집자는 이 내용을 다음 파일과 산출물에 반영해야 한다.

반영 대상:

```text
content/devsecnews-2026-04-node-java.md
cards/devsecnews-2026-04-node-java/cards.html
cards/devsecnews-2026-04-node-java/*.png
docs/devsecnews-2026-04-node-java.html
docs/cards/devsecnews-2026-04-node-java/cards.html
4월호 Confluence 전광판/포스터/GIF/HTML
```

반영해야 할 핵심 변화:

```text
기존 초안 문구:
자동화된 신뢰를 통제하세요 — 빌드도, 설정도, 계정 흐름도.

권장 최종 문구:
자동 실행 경로를 통제하세요 — 빌드도, 설정도, 계정 흐름도.
```

이유:

- 3월호는 “신뢰 경계 붕괴”가 핵심이었다.
- 4월호는 “자동 실행 경로 통제”가 핵심이다.
- 4월호에서 `신뢰`라는 단어를 계속 전면에 두면 3월호와 메시지가 겹친다.
- 4월호는 `postinstall`, `MCP tool execution`, `ATO monetization flow`처럼 실제로 자동 실행되는 경로를 다룬다.

## 3월호와의 차별점

| 구분 | 3월호 | 4월호 |
|---|---|---|
| 핵심 프레임 | 신뢰 경계 붕괴 | 자동 실행 경로 통제 |
| 대표 질문 | 무엇을 믿었는가? | 무엇이 자동으로 실행되는가? |
| 대표 사례 | Trivy, WAF, CAPTCHA | Axios, MCP, ATO |
| 메시지 | 신뢰하지 말고 검증하세요 | 자동 실행 경로를 통제하세요 |
| 행동 | 도구·파서·사용자 구분을 검증 | 빌드·설정·계정 흐름을 기록/통제 |

3월호 문구:

```text
신뢰하지 말고 검증하세요 — 도구도, 파서도, 사용자 구분도.
```

4월호 권장 문구:

```text
자동 실행 경로를 통제하세요 — 빌드도, 설정도, 계정 흐름도.
```

## 전광판 전체 컨셉

전광판은 4월호를 “취약점 이름 목록”으로 소개하지 않는다.  
대신 세 가지 자동 실행 경로를 보여준다.

```text
Build Path   — Axios / npm install / postinstall / build log
Config Path  — MCP / AI IDE / JSON config / local tools
Account Path — ATO / stored-value / crypto reinvestment
```

## 추천 전광판 제목

1순위:

```text
자동 실행 경로를 통제하세요
빌드도, 설정도, 계정 흐름도.
```

대안:

```text
자동화는 편의가 아니라 실행 권한입니다
```

```text
무엇이 자동으로 실행되고 있습니까?
```

Confluence Page Header / 포스터에는 1순위를 사용한다.

## 슬라이드/포스터 시나리오

### Slide 1 — Core Frame

제목:

```text
자동 실행 경로를 통제하세요
```

부제:

```text
빌드도, 설정도, 계정 흐름도.
```

보조 설명:

```text
4월호는 취약점 이름보다 무엇이 자동으로 실행되는지를 봅니다.
```

키워드:

```text
Build Path · Config Path · Account Path
```

CTA:

```text
4월호 실행 경로 점검하기 →
```

### Slide 2 — Build Path / Axios

제목:

```text
npm install은 설치가 아니라 실행입니다
```

보조 설명:

```text
Axios 공급망 공격은 postinstall 하나로 빌드 환경의 자격증명을 노렸습니다.
```

흐름:

```text
npm install → postinstall → RAT → CI/CD secrets
```

조치:

```text
빌드 로그로 감염 범위를 확인하세요.
```

### Slide 3 — Config Path / MCP

제목:

```text
설정 파일도 실행 경로입니다
```

보조 설명:

```text
MCP와 AI IDE는 JSON 설정을 통해 로컬 도구와 명령 실행을 연결합니다.
```

흐름:

```text
mcp.json → tool permission → local command → external bridge
```

조치:

```text
MCP 설정을 코드처럼 리뷰하세요.
```

### Slide 4 — Account Path / ATO

제목:

```text
계정 탈취는 로그인에서 끝나지 않습니다
```

보조 설명:

```text
포인트, 기프티콘, 가상자산으로 이어지면 계정은 공격 운영비가 됩니다.
```

흐름:

```text
leaked account → points/gifticons → cash-out/crypto → next attack
```

조치:

```text
로그인 이후의 자산 흐름을 보세요.
```

### Slide 5 — Action

제목:

```text
자동 실행되는 것은 반드시 기록되어야 합니다
```

보조 설명:

```text
빌드 로그, MCP 설정, 계정 전환 흐름을 이번 달 점검표에 넣으세요.
```

체크 항목:

```text
Build Log
MCP Config
ATO Flow
```

CTA:

```text
4월호 실행 경로 점검하기 →
```

## 정적 포스터 버전

Confluence Page Header에서 한 장짜리 정적 포스터로 쓸 경우 다음 구조를 사용한다.

```text
자동 실행 경로를 통제하세요
빌드도, 설정도, 계정 흐름도.

npm install은 빌드 권한을,
MCP 설정은 로컬 실행 권한을,
탈취 계정은 공격 운영비를 만듭니다.

[4월호 실행 경로 점검하기 →]
```

오른쪽 카드 3개:

```text
Build Path
Axios · postinstall · build log

Config Path
MCP · AI IDE · local tools

Account Path
ATO · stored-value · crypto
```

## 디자인 방향

3월호가 “신뢰 경계 / 탐지 대시보드” 느낌이었다면, 4월호는 “실행 경로 / 파이프라인 / 추적 로그” 느낌으로 구분한다.

디자인 키워드:

```text
Pipeline
Execution Path
Trace Log
Automation Flow
Control Point
```

배경 로그 예시:

```text
[build] npm install
[hook] postinstall executed
[mcp] tool permission requested
[auth] points converted
[alert] execution path untracked
```

## 이미지 시안

초기 정적 포스터 시안은 아래 로컬 산출물로 생성했다.

```text
/mnt/data/devsecnews_2026_04_billboard_poster.png
/mnt/data/devsecnews_2026_04_billboard_poster.svg
```

GitHub에는 텍스트 기반 SVG를 별도 반영할 수 있다. PNG는 바이너리이므로 필요 시 별도 업로드 절차를 사용한다.

## 다른 LLM에게 남기는 작업 지시

다음 LLM/편집자는 이 문서를 기준으로 아래 작업을 진행한다.

1. `content/devsecnews-2026-04-node-java.md`의 핵심 문구를 “자동 실행 경로” 프레임으로 바꾼다.
2. `자동화된 신뢰`라는 표현은 Editor's Note에서 보조 개념으로만 사용하고, 제목/전광판/카드뉴스 헤드라인에는 `자동 실행 경로`를 사용한다.
3. Java/Spring 보강 결과는 `sources/2026-04/deep-research-result.md`에서 가져와 본문에 반영한다.
4. 카드뉴스와 전광판은 같은 3축 구조를 사용한다: `Build Path`, `Config Path`, `Account Path`.
5. 최종 산출 전 `npm run verify -- --month 2026-04`, `npm run build:cards -- --month 2026-04`, `npm run deploy -- --month 2026-04`를 실행한다.
