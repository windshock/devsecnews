# DevSecNews 2026-04 — Node.js/Java 보안 요약 (개발자용)

## 이달의 한 줄 메시지

**4월 핵심어: automated trust path(자동화된 신뢰 경로) · build-log evidence(빌드 로그 증거) · shadow dev-environment(그림자 개발 환경) · ATO supply chain(계정 탈취 공급망)**

4월호의 핵심은 자동화된 신뢰 경로입니다. Axios 공급망 공격은 `npm install` 한 번으로 빌드 환경이 감염될 수 있음을 보여줬고, MCP 기반 AI 개발 환경은 설정 파일과 터널링 도구가 곧 실행 경로가 될 수 있음을 드러냈습니다. ATO 공급망 분석은 계정 탈취가 로그인 이벤트 하나로 끝나지 않고, 포인트·기프티콘·가상자산을 거쳐 다음 공격의 운영비로 환류되는 구조를 보여줍니다.

**한 줄 결론: 자동화된 신뢰를 통제하세요 — 빌드도, 설정도, 계정 흐름도.**

---

# (0) Editor's Note

4월호의 핵심은 자동화된 신뢰 경로입니다. Axios 공급망 공격은 `npm install` 한 번으로 빌드 환경이 감염될 수 있음을 보여줬고, PoisonChain은 lockfile보다 빌드 로그와 실행 시간대가 더 중요한 증거가 될 수 있음을 강조합니다. MCP 기반 AI 개발 환경은 설정 파일과 터널링 도구가 곧 실행 경로가 될 수 있음을 드러냈고, mcpguard는 이 경로를 사전에 검증해야 한다는 문제의식에서 출발합니다. ATO 공급망 분석은 계정 탈취가 로그인 이벤트 하나로 끝나지 않고, 포인트·기프티콘·가상자산을 거쳐 다음 공격의 운영비로 환류되는 구조를 보여줍니다. 이번 달에는 취약점 이름보다 `무엇이 자동 실행되고, 누가 그 경로를 검증하는가`를 먼저 확인해야 합니다.

---

# (1) Summary

- Axios npm 공급망 공격은 `axios@1.14.1`, `axios@0.30.4`, `plain-crypto-js@4.2.1` 악성 버전과 `postinstall` RAT 실행으로 이어졌습니다. lockfile만 보지 말고 공격 노출 시간대의 Jenkins/GitHub Actions 빌드 로그를 확인해야 합니다. [Source] https://github.com/windshock/PoisonChain/blob/main/public/docs/axios-npm-supply-chain-attack-report.md (2026-04-01)
- PoisonChain은 npm 공급망 사고에서 repo sweep, semver risk, build-log inspection, maintainer/team attribution, team dashboard를 한 번에 묶는 대응 파이프라인입니다. 보안팀은 Axios 사고 대응을 빌드 로그 기반 blast-radius 분석으로 전환해야 합니다. [Source] https://github.com/windshock/PoisonChain (2026-04)
- MCP 기반 AI 개발 환경은 JSON 설정, AI IDE, 터널링 도구, 외부 콘텐츠가 내부 명령 실행 경로로 연결될 수 있습니다. AI 개발환경 설정 파일을 코드와 같은 수준으로 검토해야 합니다. [Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/ai-mcp-security-roadmap-notes.md (2026-04)
- 과기정통부 긴급 보안점검 요청과 정보통신망법 개정 흐름은 AI/MCP 공급망 리스크를 개발팀 내부 문제가 아니라 전사 통제와 보고 리스크로 끌어올립니다. 외부 노출 차단, MFA, 행위 중심 모니터링을 4월 점검 항목에 포함해야 합니다. [Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/ai-mcp-security-roadmap-notes.md (2026-04)
- ATO 공급망은 유출 계정, 포인트·기프티콘 탈취, 현금화, 가상자산 전환, 다음 공격 인프라 재투자로 이어지는 순환 구조입니다. 로그인 이벤트만 보지 말고 자산 전환과 운영 인프라 흐름을 함께 추적해야 합니다. [Source] https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/ (2026-04-07)
- PointPivot은 국내 기프티콘·포인트 서비스를 노리는 사기 조직의 IP, 텔레그램, 사이트를 추적하는 OSINT 데이터베이스입니다. ATO 대응에는 글로벌 평판 목록뿐 아니라 국내형 캠페인 피벗 데이터를 함께 써야 합니다. [Source] https://github.com/windshock/pointpivot (2026-04)
- Java/Spring/JVM 4월 공식 보안 항목은 추가 조사가 필요합니다. 공식 공지일이 2026-04-01~2026-04-30인 항목만 포함하도록 deep research brief를 기준으로 보강해야 합니다. [Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/deep-research-brief.md (2026-04)

---

# (5) 이번 달 개발자 체크리스트

1. `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`에서 `axios@1.14.1`, `axios@0.30.4`, `plain-crypto-js@4.2.1` 흔적을 먼저 확인하세요. [Source] https://github.com/windshock/PoisonChain/blob/main/public/docs/axios-npm-supply-chain-attack-report.md (2026-04-01)
2. 공격 노출 시간대에 `npm install`이 실행된 Jenkins/GitHub Actions 빌드를 확인하고, 해당 빌드 환경의 npm/GitHub/AWS/SSH 자격증명을 회전하세요. [Source] https://github.com/windshock/PoisonChain/blob/main/public/docs/axios-npm-supply-chain-attack-report.md (2026-04-01)
3. lockfile 결과만으로 감염 여부를 종결하지 말고, PoisonChain 방식처럼 build log와 실제 실행 명령을 증거로 남기세요. [Source] https://github.com/windshock/PoisonChain (2026-04)
4. AI IDE, MCP server, local tool bridge, tunnel 설정 파일을 inventory로 만들고 누가 승인했는지 기록하세요. [Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/ai-mcp-security-roadmap-notes.md (2026-04)
5. MCP 설정 JSON에서 외부 URL, shell command, file write, browser automation, tunnel open 동작을 별도 위험 항목으로 분류하세요. [Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/ai-mcp-security-roadmap-notes.md (2026-04)
6. mcpguard가 준비되면 MCP 설정과 실행 경로를 사전 검증하는 CI gate로 연결하세요. [Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/README.md (2026-04)
7. 로그인 방어는 CAPTCHA 성공/실패만 보지 말고, 포인트·기프티콘 전환, 상품권 사용, 기기 변경, 전화번호 변경, 텔레그램 유도 흔적을 함께 보세요. [Source] https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/ (2026-04-07)
8. PointPivot의 IOC와 국내 게시판 스팸 피벗 데이터를 차단 정책과 조사 큐에 반영하세요. [Source] https://github.com/windshock/pointpivot (2026-04)
9. 4월 Java/Spring/JVM 항목은 공식 공지일 기준으로만 추가하고, 단순 DoS-only 항목은 제외하세요. [Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/deep-research-brief.md (2026-04)
10. 최종 배포 전 `npm run verify -- --month 2026-04`와 `npm run deploy -- --month 2026-04`를 실행하세요. [Source] https://github.com/windshock/devsecnews/blob/main/README.md (2026-04)

---

# (2) Node.js

## (2.1) CVE/이슈 표

| 항목 | 영향 | 개발자 조치 | Source |
|---|---|---|---|
| Axios npm 공급망 공격 (`axios@1.14.1`, `axios@0.30.4`, `plain-crypto-js@4.2.1`) | `postinstall` 훅으로 OS별 RAT이 실행되고, npm/GitHub/AWS/SSH 등 개발환경 자격증명이 노출될 수 있음 | lockfile, node_modules, 빌드 로그, 공격 시간대 실행 명령을 함께 확인하고 자격증명을 회전 | https://github.com/windshock/PoisonChain/blob/main/public/docs/axios-npm-supply-chain-attack-report.md |
| PoisonChain 대응 파이프라인 | lockfile만으로 실제 감염 여부를 판단하기 어려운 공급망 사고에서 repo/team/build 단위 영향 범위 산정 필요 | PoisonChain 방식으로 semver risk, build log, maintainer/team attribution을 한 번에 수집 | https://github.com/windshock/PoisonChain |
| 추가 Node.js/npm 4월 항목 | 4월 공식 공지/어드바이저리 기반 보강 필요 | `sources/2026-04/deep-research-brief.md` 기준으로 후보를 조사하고 포함 여부를 판단 | https://github.com/windshock/devsecnews/blob/main/sources/2026-04/deep-research-brief.md |

## (2.2) 항목별 설명

### Axios npm 공급망 공격: lockfile보다 실행 증거가 중요합니다

공격자는 `axios@1.14.1`, `axios@0.30.4` 악성 버전에 `plain-crypto-js@4.2.1`을 위장 의존성으로 넣고, `postinstall` 훅에서 OS별 RAT을 내려받아 실행했습니다. `setup.js`가 자체 삭제되고 `package.json`이 clean stub으로 교체되기 때문에, 사후 파일시스템 조사나 `npm ls` 결과만으로는 실제 실행 여부를 판단하기 어렵습니다. 공격 시간대에 `npm install`이 실행된 빌드와 개발 환경을 우선 격리하고 자격증명을 회전해야 합니다.

[Source] https://github.com/windshock/PoisonChain/blob/main/public/docs/axios-npm-supply-chain-attack-report.md (2026-04-01)

### PoisonChain: 공급망 사고 대응을 팀 단위 실행 계획으로 바꿉니다

PoisonChain은 npm 공급망 사고에서 repo sweep, semver risk, build-log inspection, maintainer/team attribution, team dashboard를 하나의 파이프라인으로 묶습니다. 이 접근은 “어떤 lockfile에 악성 버전이 보이는가”보다 “공격 시간대에 어떤 빌드가 실제로 무엇을 실행했는가”를 먼저 확인합니다. 보안팀은 공급망 사고 조사에서 빌드 로그를 1차 증거로 보존해야 합니다.

[Source] https://github.com/windshock/PoisonChain (2026-04)

## (2.3) 이번 달 취약 개발 패턴 Top 5

### 1) `postinstall` 실행을 정상 빌드 동작으로 가정

`npm install`은 패키지를 가져오는 명령이 아니라 임의 스크립트 실행 경로가 될 수 있습니다. `postinstall`이 실행되는 빌드는 네트워크 접근, 파일 쓰기, 환경변수 접근을 동시에 허용할 수 있으므로 공급망 공격에서 가장 먼저 확인해야 합니다. CI에서는 `npm ci --ignore-scripts` 적용 가능성을 검토하고, 예외가 필요한 패키지는 allowlist로 관리하세요.

```bash
npm ci --ignore-scripts
npm rebuild <allowed-package>
```

[Source] https://github.com/windshock/PoisonChain/blob/main/public/docs/axios-npm-supply-chain-attack-report.md (2026-04-01)

### 2) lockfile만 보고 감염 여부를 종결

lockfile은 의존성 의도를 보여주지만, 공격 시간대에 실제 어떤 명령이 실행됐는지는 보여주지 않습니다. 특히 악성 패키지가 설치 후 흔적을 지우면 소스 트리만으로는 실행 여부가 불명확해집니다. Jenkins/GitHub Actions 로그에서 공격 시간대의 `npm install`, `npm ci`, cache restore, Docker build 명령을 함께 확인하세요.

```bash
rg "npm install|npm ci|docker build|axios|plain-crypto-js" jenkins-logs/
```

[Source] https://github.com/windshock/PoisonChain (2026-04)

### 3) semver range가 악성 버전을 끌어올 수 있는지 확인하지 않음

`^1.14.0` 같은 범위 지정은 악성 버전이 registry에 올라온 순간 자동으로 위험해질 수 있습니다. lockfile에 현재 악성 버전이 없어도, 공격 시간대에 lockfile 없이 `npm install`이 실행됐다면 실제 설치 버전은 달라질 수 있습니다. semver range와 빌드 시점 registry 상태를 함께 기록하세요.

```bash
node -e "const semver=require('semver'); console.log(semver.satisfies('1.14.1','^1.14.0'))"
```

[Source] https://github.com/windshock/PoisonChain (2026-04)

### 4) 개발자 로컬 환경과 CI 환경의 자격증명 노출 범위를 분리하지 않음

macOS, Linux, Windows에서 RAT이 접근할 수 있는 자격증명 범위는 실행 환경에 따라 달라집니다. 개발자 로컬에서 직접 실행된 경우 SSH 키, npm token, cloud credential, `.env`가 함께 노출될 수 있고, CI에서는 repository secret과 cloud deployment token이 노출될 수 있습니다. 실행 환경별로 자격증명 회전 범위를 분리해 처리하세요.

[Source] https://github.com/windshock/PoisonChain/blob/main/public/docs/axios-npm-supply-chain-attack-report.md (2026-04-01)

### 5) 공급망 사고 대응을 repo 단위에서 멈춤

공급망 사고는 repo 이름보다 팀, 빌드 시스템, 배포 권한, 담당자 상태가 중요합니다. PoisonChain은 maintainer/team attribution과 team dashboard를 생성해 대응 책임을 팀 단위로 나눕니다. 사고 대응 보고서는 repo 목록이 아니라 팀별 조치 목록으로 정리하세요.

[Source] https://github.com/windshock/PoisonChain (2026-04)

## (2.4) 운영 참고

추가 Node.js/npm 4월 공식 항목은 `sources/2026-04/deep-research-brief.md`에 따라 보강합니다. 공식 공지일이 2026-04-01~2026-04-30인 항목만 추가하세요.

[Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/deep-research-brief.md (2026-04)

---

# (3) Java

## (3.1) CVE/이슈 표

| 항목 | 영향 | 개발자 조치 | Source |
|---|---|---|---|
| Java/Spring/JVM 4월 공식 보안 항목 1 | 추가 조사 필요 | 공식 공지일 기준으로 2026-04 항목만 포함 | https://github.com/windshock/devsecnews/blob/main/sources/2026-04/deep-research-brief.md |
| Java/Spring/JVM 4월 공식 보안 항목 2 | 추가 조사 필요 | 단순 DoS-only 항목은 제외하고 코드/빌드/런타임 설정 조치가 필요한 항목을 우선 | https://github.com/windshock/devsecnews/blob/main/sources/2026-04/deep-research-brief.md |

## (3.2) 항목별 설명

### Java 항목은 Deep Research 보강 후 확정합니다

현재 확보된 4월호 재료는 Axios/npm 공급망, MCP/AI 개발환경, ATO 공급망에 집중되어 있습니다. DevSecNews repo 프롬프트 기준으로는 Java 2개 이상이 필요하므로 Spring, Apache Java 프로젝트, Maven/GHSA, Oracle/OpenJDK CPU 공지 중 2026년 4월 공식 공지 항목을 추가로 조사해야 합니다. 후보 항목은 `sources/2026-04/deep-research-brief.md` 형식으로 먼저 정리하세요.

[Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/deep-research-brief.md (2026-04)

## (3.3) 이번 달 취약 개발 패턴 Top 5

### 1) AI/MCP 설정을 애플리케이션 설정과 분리하지 않음

Java 백엔드가 직접 MCP를 쓰지 않더라도 개발자가 사용하는 AI IDE, local tool bridge, tunnel 설정은 빌드·배포 환경에 영향을 줄 수 있습니다. 개발 환경의 MCP 설정과 터널링 도구를 보안 예외가 아니라 관리 대상 설정으로 등록하세요.

[Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/ai-mcp-security-roadmap-notes.md (2026-04)

### 2) Java/Spring 보안 항목을 운영 패치로만 분류

Spring이나 JVM 보안 이슈는 단순 운영 패치처럼 보여도 코드, 설정, 필터 체인, actuator exposure, serialization boundary를 바꿔야 하는 경우가 있습니다. 4월 Java 후보를 조사할 때 개발자가 바꿔야 할 설정과 테스트를 먼저 분리하세요.

[Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/deep-research-brief.md (2026-04)

### 3) 계정 탈취를 로그인 컨트롤러 문제로만 봄

ATO는 로그인 API 하나의 문제가 아니라 포인트 전환, 기프티콘 사용, 상품권 구매, 전화번호 변경, 기기 변경, 이상 거래 탐지와 연결됩니다. Java 백엔드에서는 로그인 성공 이후의 stored-value 전환 경로를 별도 위험 흐름으로 로깅하세요.

[Source] https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/ (2026-04-07)

### 4) 보안 이벤트와 비즈니스 이벤트를 분리 저장

계정 탈취 공급망은 로그인 이벤트와 포인트 사용 이벤트를 함께 봐야 보입니다. 인증 로그, 포인트 사용 로그, 상품권 전환 로그, 기기 변경 로그를 같은 사용자·세션·IP·디바이스 기준으로 연결하세요.

[Source] https://github.com/windshock/pointpivot (2026-04)

### 5) 정부 점검 항목을 문서 대응으로만 처리

과기정통부 긴급 보안점검 요청과 정보통신망법 개정 흐름은 문서 제출이 아니라 외부 노출, MFA, 모니터링, 사고 신고 체계의 운영 상태를 요구합니다. Java 서비스별 관리자 경로, 외부 노출 엔드포인트, 인증 우회 가능 경로를 4월 점검표에 넣으세요.

[Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/ai-mcp-security-roadmap-notes.md (2026-04)

## (3.4) 운영 참고

Java/Spring/JVM 공식 보안 항목은 아직 확정 전입니다. Deep Research 결과가 도착하면 이 섹션을 실제 CVE/어드바이저리 기반으로 교체해야 합니다.

[Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/deep-research-brief.md (2026-04)

---

# (4) 공통 트렌드/권장사항

## 4.1 자동화된 신뢰 경로를 inventory로 관리하세요

4월호의 세 축은 모두 자동화된 신뢰 경로입니다. Axios 사고에서는 `npm install`과 `postinstall`이, MCP 리스크에서는 JSON 설정과 AI tool execution이, ATO 공급망에서는 로그인 이후 stored-value 전환과 가상자산 환류가 자동화된 실행 경로로 작동합니다. 서비스별로 자동 실행되는 빌드·설정·계정 흐름을 inventory로 만들고 승인자를 기록하세요.

[Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/README.md (2026-04)

## 4.2 빌드 로그는 공급망 사고의 1차 증거입니다

사후 소스 트리와 lockfile은 중요한 단서지만 실제 실행 여부를 증명하지 못할 수 있습니다. PoisonChain이 강조하듯 공급망 사고에서는 빌드 로그, 실행 명령, 실행 시간대, 빌드 노드의 자격증명 범위를 함께 봐야 합니다. Jenkins/GitHub Actions 로그 보존 기간과 검색 가능성을 보안 운영 요구사항에 넣으세요.

[Source] https://github.com/windshock/PoisonChain (2026-04)

## 4.3 AI/MCP 설정은 코드 리뷰 대상입니다

MCP 기반 AI 개발 환경에서는 설정 파일이 외부 콘텐츠, local tool, shell command, tunnel, file write 권한을 연결할 수 있습니다. 이 구조에서는 모델 응답의 품질보다 실행 경로의 승인 여부가 더 중요합니다. MCP 설정 JSON을 코드 리뷰와 CI 검증 대상에 포함하세요.

[Source] https://github.com/windshock/devsecnews/blob/main/sources/2026-04/ai-mcp-security-roadmap-notes.md (2026-04)

## 4.4 ATO는 계정이 아니라 수익화 흐름으로 추적하세요

계정 탈취는 로그인 성공으로 끝나지 않습니다. 유출 계정이 포인트, 기프티콘, 상품권, 가상자산 환류를 거쳐 다시 공격 인프라로 돌아오면 단일 사고가 아니라 반복 가능한 공급망이 됩니다. ATO 탐지에는 로그인 방어와 함께 stored-value 전환, 텔레그램 유도, 국내 게시판 스팸, 프록시/VPS 흔적을 함께 넣으세요.

[Source] https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/ (2026-04-07)

---

# (6) 참고자료

- https://github.com/windshock/PoisonChain/blob/main/public/docs/axios-npm-supply-chain-attack-report.md
- https://github.com/windshock/PoisonChain
- https://github.com/windshock/devsecnews/blob/main/sources/2026-04/README.md
- https://github.com/windshock/devsecnews/blob/main/sources/2026-04/ai-mcp-security-roadmap-notes.md
- https://github.com/windshock/devsecnews/blob/main/sources/2026-04/deep-research-brief.md
- https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/
- https://github.com/windshock/pointpivot
