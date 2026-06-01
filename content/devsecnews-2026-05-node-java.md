# DevSecNews 2026-05

## 취약점 인플레이션 — 발견이 공짜가 되자 우리는 신뢰를 자동화했고, 5월에 그 신뢰가 위조됐다

## 1\. The Inflation — 발견이 공짜가 된 시대, 검증이 병목이다

올해 보안의 전제 하나가 바뀌었다. 취약점을 찾는 일이 더는 비싸지 않다. AI 스캐너는 코드를 훑어 취약점 후보를 쏟아내고, AI 에이전트는 취약 코드 도달부터 익스플로잇 사다리까지 단계별로 기어오른다. ExploitBench·ExploitGym 같은 벤치마크는 모델이 그 사다리를 어디까지 오르는지 측정하는데, 가리키는 방향은 한쪽이다. 발견과 악용 시도의 비용은 계속 떨어진다. ([ExploitBench](https://github.com/exploitbench/exploitbench), 2026-05 확인 / [ExploitGym, Berkeley RDI](https://rdi.berkeley.edu/blog/exploitgym/), 2026-05 확인)

문제는 발견이 아니라 그다음이다. 리포트는 쏟아지는데, 사람이 그 홍수를 다 검증하지 못한다. 중복인지, 진짜 악용 가능한지, 패치 증거가 있는지 가려내는 triage가 밀린다. 발견은 공짜가 됐지만 검증은 그대로 비싸다. 보안진단을 마지막 이벤트가 아니라 개발 공정 안의 반복 검증으로 끌고 들어와야 하는 이유가 여기 있다. ([windshock.github.io](https://windshock.github.io/ko/post/2026-05-01-security-assessment-as-development-process/), 2026-05-01)

검증이 발견 속도를 못 따라가면 사람은 검증을 **자동 신호**에 떠넘긴다. "서명됐으니 됐다", "provenance가 붙었으니 안전하다", "스캐너가 통과시켰으니 괜찮다." 발견의 인플레이션은 그래서 조용히 신뢰의 위기로 번진다. 일일이 못 보는 것을, 자동 배지가 대신 봐줬다고 믿기 시작하니까.

그리고 2026년 5월, 바로 그 배지가 위조됐다.

> Discovery is cheap. Verification is scarce. Trust is the battlefield.

## 2\. The Forged Badge — 검증 배지를 단 악성코드

2026년 5월 11일 저녁 6분 동안, npm에 패키지 84개가 올라왔다. `@tanstack/react-router`를 포함한 42개. 전부 유효한 SLSA Build Level 3 provenance attestation을 달고 있었다. "이 패키지는 진짜 TanStack의 CI 파이프라인이 빌드했다"는 암호학적 증명서다. 증명서는 진짜였다. 그런데 패키지는 전부 악성코드였다. ([StepSecurity](https://www.stepsecurity.io/blog/mini-shai-hulud-is-back-a-self-spreading-supply-chain-attack-hits-the-npm-ecosystem), 2026-05-11)

이게 5월의 진짜 사건이다. 취약점이 터진 게 아니라, **신뢰 그 자체가 위조됐다.**

배경을 봐야 무게가 보인다. 2025년 9월, 1세대 Shai-Hulud 웜이 npm을 휩쓴 뒤 업계의 진단은 분명했다. 문제는 훔칠 수 있는 사람의 비밀이다. 그래서 답도 분명했다. 사람을 빼자. GitHub와 npm은 로컬 publish에 FIDO 기반 2FA를 의무화하고, 토큰 수명을 7일로 깎고, 장기 토큰 대신 OIDC trusted publishing을 밀었다. CI가 OpenID Connect로 인증하면 npm이 자동으로 provenance를 발행한다. 베팅은 명확했다. 사람이 들고 다니는 비밀번호보다 기계의 신원과 암호학적 출처 증명이 안전하다. ([The Hacker News](https://thehackernews.com/2025/09/github-mandates-2fa-and-short-lived.html), 2025-09 / [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/), 2026-05 확인)

Mini Shai-Hulud는 이 방어를 깨지 않았다. **그 방어가 됐다.** 웜은 GitHub Actions runner에 떠 있는 OIDC 토큰(`ACTIONS_ID_TOKEN_REQUEST_TOKEN`)을 훔쳐 Fulcio에서 서명 인증서를 받고, Sigstore에 악성 산출물 서명을 정식으로 요청했다. 인증서를 위조한 게 아니다. 진짜 TanStack 파이프라인으로 인증한 채 서명을 받았다. 시크릿은 runner의 `/proc/{pid}/mem`을 직접 읽어 마스킹을 우회하고(마스킹은 로그 표시만 가린다), 자동화용 `bypass_2fa` 토큰을 찾아 같은 메인테이너의 패키지를 열거해 다시 publish했다. ([StepSecurity](https://www.stepsecurity.io/blog/mini-shai-hulud-is-back-a-self-spreading-supply-chain-attack-hits-the-npm-ecosystem), 2026-05-11)

핵심은 한 줄이다. **provenance는 "어느 파이프라인이 만들었나"를 증명하지, "그 파이프라인이 정상 동작했나"를 증명하지 않는다.** 우리는 *출처*를 *안전*이라고 팔았다. 서명 인증서를 손에 넣은 공격자에게 그 둘은 같은 것이 된다. ([CSA](https://labs.cloudsecurityalliance.org/research/csa-research-note-shai-hulud-ai-supply-chain-20260517-csa-st/), 2026-05-17)

## 3\. The Same Mistake, Four Times — 신호를 실행으로 올린 네 가지

신뢰 신호는 본래 사람을 빼기 위한 약속이다. "서명됐으니 믿어라", "로컬이니 안전하다", "스캔 통과했으니 됐다." 이 약속이 성립하려면 신호가 실행·배포로 *승격*되는 지점에 승인자가 있어야 한다. 5월의 사건들은 영역이 달라도 전부 그 승인자가 없는 자리에서 터졌다.

**npx — 내가 친 명령이 곧 설치 명령이 된다.** `npx build-tool`은 로컬에 `build-tool`이 없으면 같은 문자열을 패키지 이름으로 승격해 registry에서 받아 실행한다. scoped 패키지(`@company/internal-build-tool`)가 노출하는 binary 이름은 scope를 못 담으니, 공개되지 않은 명령 이름 하나가 실행 경계가 된다. 공격자가 알아야 할 건 내부 패키지명이 아니라 README·CI 로그에 적힌 명령 이름뿐이다. "내가 실행하려던 것"과 "실제로 받아 실행되는 것" 사이에 아무도 없다. ([Lupin & Holmes](https://www.landh.tech/blog/20260521-npx-used-confusion-and-its-super-effective/), 2026-05-21)

**MCP — 설정이 곧 실행이 된다.** `mcp.json`의 command·args는 겉보기엔 환경 구성이지만, AI 추천 → 승인 → 설정 → 도구 호출 → 로컬 실행으로 곧장 이어진다. 이건 새 문제가 아니라 XML-RPC부터 반복된 신뢰 경계 실패다. 설정을 "코드보다 덜 위험한 것"으로 다루는 순간 승인자가 사라진다. `0.0.0.0` 바인딩과 무인증 JSON-RPC는 "로컬이니 안전"이라는 마지막 가정마저 무너뜨린다. ([windshock.github.io](https://windshock.github.io/ko/post/2026-05-07-mcp-is-repeating-rpc-security-history/), 2026-05-07)

**Spring AI — 모델 출력이 곧 sink에 닿는다.** 5월 공개된 Spring AI 네 건은 전부 같은 모양이다. 대화 메모리(`CVE-2026-41712`·`41713`), vector store(`41705`), 모델이 만든 파일명(`41863`), AI 기능이 만지는 입력이 검증 없이 데이터·쿼리·파일에 도달한다. "우리 앱의 데이터"라는 이유로 모델 입출력을 신뢰 입력으로 다룬 결과다. ([spring.io](https://spring.io/security/cve-2026-41712/), 2026-05-08)

**진단 — "스캔했다"가 곧 "검증됐다"가 된다.** 한 인증 백엔드 진단은 모듈 스코프 기본값 탓에 메인 모듈만 보고, 옆 모듈의 엔드포인트가 응답에 AES key/iv를 그대로 실어 보내고 같은 모듈에 그 키가 하드코딩된 사실을 놓쳤다. 리포트는 깔끔하게 통과했다. 스캐너의 출력은 발견이지 판정이 아닌데, 스코프를 누가 정했는지 묻는 사람이 없었다. ([windshock.github.io](https://windshock.github.io/ko/post/2026-05-19-sec-audit-static-feedback-loop/), 2026-05-19)

네 사건의 공통점은 공격 기법이 아니다. 신호를 실행·배포·노출로 승격하는 지점에 사람이 없었다. 그리고 그 빈자리는 사고가 난 뒤에야 보인다.

## 4\. Put The Human Back — 스캐너가 아니라 승인자다

그럼 더 좋은 신호를 만들면 되지 않나. 5월은 그 길이 막혔다고 답한다. provenance는 위조됐고, MCP 스캐너는 한 랩 벤치마크에서 24개 기대 탐지 중 recall이 0~4%대였다. 승격 경계에서 "자동으로 더 잘 판정하는 신호"는 막다른 길이다. ([github.com/windshock/mcpscan](https://github.com/windshock/mcpscan), 2026-05 확인)

남는 답은 하나다. **되돌릴 수 없는 단계에 사람을 다시 넣는 것.** publish, 실행, 시크릿 접근 같은 비가역 지점에.

흥미로운 건 업계가 5월에 정확히 그렇게 움직였다는 점이다. npm은 staged publishing과 함께 "proof of presence"를 내놨다(npm CLI 11.15.0). 코드가 배포되기 전 *실제 사람이 검토·승인했다는 증거*를 요구하는데, 이 승인은 자동화 자격증명·OIDC 토큰·비대화형 경로로는 완료할 수 없고 오직 라이브 2FA 챌린지로만 충족된다. 10년간 신뢰를 자동화해 온 생태계가, 위조 불가능한 단 하나의 통제로 **사람을 도로 집어넣은** 것이다. ([The Hacker News](https://thehackernews.com/2026/05/npm-adds-2fa-gated-publishing-and.html), 2026-05 / [npm 공급망 보안 계획](https://github.com/orgs/community/discussions/174507), 2026-05 확인)

"사람은 확장이 안 된다"는 반론이 바로 따라온다. 맞다. 그래서 승인자를 *모든 곳*에 두자는 게 아니다. 파이프라인의 대부분은 자동으로 둔다. 사람은 **신호가 실행이나 배포로 승격되는 비가역 경계 한 곳**에만 선다. proof of presence가 publish 순간에만 사람을 요구하듯이. 비용은 그 한 번이고, 막는 건 위조된 신뢰 전체다.

그래서 5월의 처방은 제품별로 흩어지지 않는다. npm은 publish에 사람을, MCP는 실행에 allowlist 승인을, Spring AI는 모델 출력이 sink에 닿기 전 경계를, 진단은 스코프를 정하는 사람을 둔다. 전부 "자동 신호 ↑"가 아니라 **"승인 경계 ↓"**다.

---

## 5\. Patch & Defend — 이번 달 패치하고 막기

주장은 여기까지다. 아래는 이번 달 당장 손대야 할 것 — 버전, 침해지표, 도구.

## 5.1 npm 공급망 (Node.js)

### Mini Shai-Hulud 침해 범위와 대응

`@tanstack/*` 42개 + `@uipath` 80여 개 포함 130개 이상 패키지, 2026-05-11 게시. 노출 시간대(2026-05-11 전후)에 감염 스코프를 설치한 runner의 GitHub PAT·npm 토큰·OIDC·클라우드 키를 교체하고, `gh-token-monitor` LaunchAgent/systemd 유닛과 `.claude/settings.json`·`.vscode/tasks.json` persistence 흔적을 제거한다. 토큰 폐기를 감지하면 `rm -rf ~/`가 돌므로 **의심 머신을 먼저 격리한 뒤** 폐기한다. ([Unit42](https://unit42.paloaltonetworks.com/monitoring-npm-supply-chain-attacks/), 2026-05-21 갱신 / [Securonix](https://connect.securonix.com/threat-research-intelligence-62/mini-shai-hulud-the-self-replicating-npm-worm-that-turned-software-development-against-itself-307), 2026-05 확인)

기본 설계 전환: provenance가 붙었다고 통과시키지 않는다 — 출처 증명과 안전 검증을 분리한다.

### npx confusion · dependency confusion

`npx <name>`을 `npx --no-install <name>`로 바꿔 registry fallback을 막고, `package.json`의 `bin`으로 노출한 unscoped 명령 이름은 registry에 선점한다. Microsoft가 2026-05-29 보고한 33개 악성 패키지처럼 내부 이름을 가로채는 dependency confusion은 내부 scope를 `.npmrc`에서 사내 registry로 고정해 막는다. ([Aikido](https://www.aikido.dev/blog/npx-confusion-unclaimed-package-names), 2026-05 확인 / [Microsoft Security Blog](https://www.microsoft.com/en-us/security/blog/2026/05/29/33-malicious-npm-packages-abuse-dependency-confusion-profile-developer-environments/), 2026-05-29)

기본 설계 전환: 명령 이름·내부 패키지 이름을 "실행 경계"로 보고 미리 claim·고정한다.

### 도구 — 설치·CI 방어 (외부)

**Socket**은 게시 즉시 패키지 행위 변화(갑자기 `~/.aws/credentials`를 읽거나 네트워크를 여는)를 플래그한다. **Renovate/Dependabot**의 release-age 게이트(`minimumReleaseAge`)로 게시 7일 미만 버전 설치를 보류하면 웜의 초기 확산창을 닫는다. CI는 **StepSecurity Harden-Runner**로 egress를 allowlist하고, 빌드는 `npm ci --ignore-scripts` + lockfile 고정을 기본값으로 둔다. ([Socket](https://socket.dev/), 2026-05 확인 / [Renovate docs](https://docs.renovatebot.com/), 2026-05 확인 / [Harden-Runner](https://github.com/step-security/harden-runner), 2026-05 확인 / [npm 보안 베스트 프랙티스](https://github.com/lirantal/npm-security-best-practices), 2026-05 확인)

기본 설계 전환: release-age 게이트 + 설치 스크립트 차단 + egress allowlist를 팀 기본값으로 고정한다.

### 도구 — 사고 대응·탐지 (오픈소스)

**PoisonChain**은 저장소 전수 조사·semver 노출 분석·빌드 로그에서 `npm install` 침해와 `npm ci` 안전 경로 구분·팀 귀속을 한 파이프라인으로 묶는다. **shai-hulud-test**는 Colima의 Falco로 컨테이너 내부 `npm install`의 curl·임시파일 드롭·node→shell을 잡는 데모 랩이다. ([github.com/windshock/PoisonChain](https://github.com/windshock/PoisonChain), 2026-05 확인 / [github.com/windshock/shai-hulud-test](https://github.com/windshock/shai-hulud-test), 2026-05 확인)

기본 설계 전환: lockfile 진단과 설치 행위 탐지를 한 타임라인에 정렬한다.

### Node.js core 5월 상태

5월 신규 Node.js core 보안 릴리스는 확인되지 않는다(직전 2026-03-24). 런타임 CVE 대신 패키지 신뢰 경계에 집중한다. ([nodejs.org/en/blog/vulnerability](https://nodejs.org/en/blog/vulnerability), 2026-05-30 확인)

기본 설계 전환: "core CVE 없음"을 안전으로 읽지 않는다.

## 5.2 Java · Spring — 이번 달 반드시 패치

### Spring Cloud Config Server directory traversal (CVE-2026-40982)

조작된 URL로 디렉터리 탈출이 가능한 critical 이슈. 영향 `3.1.x`·`4.1.x`·`4.2.x`·`4.3.x`·`5.0.x`, 수정 `4.3.3`·`5.0.3`(OSS)·`3.1.14`/`4.1.10`/`4.2.7`(엔터프라이즈). 함께 공개된 `CVE-2026-40981`은 Google Secrets Manager 백엔드에서 다른 GCP 프로젝트 시크릿까지 노출될 수 있는 high. ([spring.io](https://spring.io/security/cve-2026-40982/), 2026-05-06 / [spring.io](https://spring.io/security/cve-2026-40981/), 2026-05-06)

기본 설계 전환: 설정 서버는 신뢰된 배포 채널이 아니라 입력 검증 대상이다 — 경로 정규화·allowlist + 시크릿 권한 최소화.

### Spring AI 4건 (CVE-2026-41712 / 41713 / 41705 / 41863)

전부 영향 `1.0.0–1.0.x`·`1.1.0–1.1.x`, 수정 `1.0.7`·`1.1.6` — **한 패치 묶음**. `41712`(high): `ChatMemory` `DEFAULT_CONVERSATION_ID` 기본값 탓 교차 사용자 누출(업그레이드 후 모든 `ChatClient`에 conversation ID 명시 필요). `41713`(high): `PromptChatMemoryAdvisor` 메모리 포이즌닝. `41705`(high): `MilvusVectorStore#doDelete` filter-expression 인젝션. `41863`(medium): Anthropic Skills 파일명 경로 탈출. ([spring.io](https://spring.io/security/cve-2026-41712/), 2026-05-08 / [spring.io](https://spring.io/security/cve-2026-41863/), 2026-05-23)

기본 설계 전환: 모델 입력·메모리·출력이 닿는 sink를 코드 리뷰 체크리스트에 넣고, AI 라이브러리도 일반 라이브러리와 같은 패치 주기로 관리한다.

### 도구 — Spring 의존성 추적 (외부)

**Dependabot/Renovate**로 `org.springframework.*` 업그레이드 PR을 자동 생성하고, **Snyk** 같은 SCA로 게시 직후 신규 CVE를 추적한다. JDK/JRE CPU(분기)와 Spring 의존성(상시)은 패치 티켓을 분리한다. ([Snyk](https://snyk.io/), 2026-05 확인 / [Renovate docs](https://docs.renovatebot.com/), 2026-05 확인)

기본 설계 전환: "라이브러리 한 줄 올리기"를 사람 기억이 아니라 자동 PR + SCA 알림으로 받는다.

## 5.3 AI · MCP

### 도구 — MCP 설정·트래픽 점검

**Invariant Labs MCP-Scan**은 `mcp.json` 도구 설명을 스캔해 tool poisoning·프롬프트 인젝션·rug pull을 잡고, `proxy` 모드로 런타임 MCP 트래픽을 감시한다. **Cisco mcp-scanner**·windshock **mcp-guard**도 함께 둘 수 있다. 단 스캐너 recall이 낮으므로(§4) **승인된 서버만 실행하는 allowlist를 1차 통제로** 두고 스캐너는 보조 신호로만 쓴다. ([Invariant MCP-Scan](https://github.com/invariantlabs-ai/mcp-scan), 2026-05 확인 / [github.com/windshock/mcpscan](https://github.com/windshock/mcpscan), 2026-05 확인)

기본 설계 전환: `mcp.json`의 command·args·바인딩 주소를 인벤토리로 만들고 `0.0.0.0`·무인증 엔드포인트를 금지 조건으로 둔다.

### 도구 — Windshock Lens: 추론을 로컬 경계 안에

반대 방향 설계. Windshock Lens(이전 ScamGuard AI, v0.2.0 개명 2026-05-28)는 Chrome 내장 Gemini Nano로 의심 페이지를 브라우저 안에서 분석하고, 분류 추론을 외부 API로 보내지 않는다. AI 기능의 신뢰 경계를 네트워크 밖이 아니라 로컬 안으로 좁힌 사례다. ([github.com/windshock/lens](https://github.com/windshock/lens), 2026-05 확인)

기본 설계 전환: AI 기능을 붙일 때 추론 데이터가 어느 경계를 넘는지 먼저 정한다.

---

## 참고자료

- https://www.stepsecurity.io/blog/mini-shai-hulud-is-back-a-self-spreading-supply-chain-attack-hits-the-npm-ecosystem
- https://unit42.paloaltonetworks.com/monitoring-npm-supply-chain-attacks/
- https://connect.securonix.com/threat-research-intelligence-62/mini-shai-hulud-the-self-replicating-npm-worm-that-turned-software-development-against-itself-307
- https://labs.cloudsecurityalliance.org/research/csa-research-note-shai-hulud-ai-supply-chain-20260517-csa-st/
- https://thehackernews.com/2025/09/github-mandates-2fa-and-short-lived.html
- https://docs.npmjs.com/trusted-publishers/
- https://thehackernews.com/2026/05/npm-adds-2fa-gated-publishing-and.html
- https://github.com/orgs/community/discussions/174507
- https://www.landh.tech/blog/20260521-npx-used-confusion-and-its-super-effective/
- https://www.aikido.dev/blog/npx-confusion-unclaimed-package-names
- https://www.microsoft.com/en-us/security/blog/2026/05/29/33-malicious-npm-packages-abuse-dependency-confusion-profile-developer-environments/
- https://socket.dev/
- https://docs.renovatebot.com/
- https://github.com/step-security/harden-runner
- https://github.com/lirantal/npm-security-best-practices
- https://snyk.io/
- https://nodejs.org/en/blog/vulnerability
- https://spring.io/security/cve-2026-40982/
- https://spring.io/security/cve-2026-40981/
- https://spring.io/security/cve-2026-41712/
- https://spring.io/security/cve-2026-41713/
- https://spring.io/security/cve-2026-41705/
- https://spring.io/security/cve-2026-41863/
- https://github.com/invariantlabs-ai/mcp-scan
- https://windshock.github.io/ko/post/2026-05-01-security-assessment-as-development-process/
- https://windshock.github.io/ko/post/2026-05-07-mcp-is-repeating-rpc-security-history/
- https://windshock.github.io/ko/post/2026-05-19-sec-audit-static-feedback-loop/
- https://github.com/exploitbench/exploitbench
- https://rdi.berkeley.edu/blog/exploitgym/
- https://github.com/windshock/PoisonChain
- https://github.com/windshock/shai-hulud-test
- https://github.com/windshock/mcpscan
- https://github.com/windshock/lens
