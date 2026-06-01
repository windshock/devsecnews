# DevSecNews 2026-04

## 개발 패키지 설치 명령(npm install), AI 도구 설정, 로그인 성공 — 어디까지 보이고 있습니까?

## 1\. Signal: 설치·설정·로그인 뒤에서 권한이 움직이고 있었다

4월 핵심어: 실행 가시성 · 권한 경계 · 수익화 흐름

4월호의 신호는 설치, 설정, 계정 흐름 뒤에서 실제로 무엇이 실행되고 기록되는지가 충분히 보이지 않는다는 점을 설명합니다.

CI에서는 패키지를 설치했을 뿐인데 runner의 secret이 노출 후보가 됐습니다. AI IDE에서는 설정 JSON 한 줄이 로컬 shell과 파일 시스템에 닿는 실행 권한이 됐습니다. 계정 보안에서는 로그인 성공 이후 포인트와 기프티콘이 움직이며 피해가 완성됐습니다.

이 사건들은 "개발자가 몰랐다"는 말로 끝나지 않습니다. 더 정확한 질문은 이것입니다. 이 지식은 애초에 사람에게 전달할 대상이었습니까, 아니면 기본값과 인터페이스 안에 들어갔어야 합니까?

## 2\. Pattern: 정상 업무 흐름이 실행 권한과 수익화 권한으로 바뀌었다

4월의 사건들은 서로 다른 영역에서 나왔지만 같은 모양을 가졌습니다. 정상 업무 흐름이 실행 권한이나 수익화 권한을 얻었고, 그 권한은 사고가 난 뒤에야 보였습니다.

- Axios: 설치는 의존성 해석에서 멈추지 않았습니다. `axios@1.14.1`, `axios@0.30.4`는 `plain-crypto-js@4.2.1`을 끌어와 설치 시점에 RAT(Remote Access Trojan)을 내려받는 경로를 만들었습니다. ([Microsoft Security Blog](https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/), 2026-04-01)  
- MCP: 설정은 개인화에서 멈추지 않았습니다. MCP의 tools, resources, prompts는 AI 애플리케이션 초기화 과정에서 capability로 선언되고, 토큰 전달(token passthrough)과 혼동된 대리인(confused deputy) 같은 경계 문제가 공식 보안 문서에서 다뤄집니다. ([MCP Architecture](https://modelcontextprotocol.io/docs/learn/architecture), 2026-04 확인 / [MCP Security Best Practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices), 2026-04 확인)  
- ATO: 로그인은 인증에서 멈추지 않았습니다. 계정 탈취는 로그인 성공·실패가 아니라 포인트, 기프티콘, 현금화, 다음 공격 인프라로 이어지는 운영 흐름으로 추적해야 합니다. ([windshock.github.io](https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/), 2026-04-07)

공통점은 공격자가 낯선 화면을 만든 것이 아닙니다. 이미 신뢰받던 경로가 기록과 소유권 없이 실행 권한을 갖고 있었습니다.

## 3\. Design Failure: 가르칠 지식과 구조에 넣을 지식을 구분하지 못했다

이번 이슈의 핵심은 지식 전달 실패가 아니라 지식 배치 실패입니다. 반복 가능하고 기계적으로 판정할 수 있는 위험을 계속 사람의 주의와 기억에 맡겼고, 사람의 판단이 필요한 지점에는 충분한 증거와 책임 인터페이스가 없었습니다.

`postinstall`이 실행될 수 있다는 사실은 교육 자료 맨 끝에 둘 지식이 아닙니다. CI가 기본으로 기록하고 제한해야 할 지식입니다. Azure Pipelines 안내도 셀프 호스티드 에이전트(self-hosted agent), 커스텀 스크립트, 컨테이너화된 빌드에서 악성 Axios 버전이 설치됐다면 해당 job의 자격증명과 산출물을 노출 가능 상태로 보라고 설명합니다. ([Azure Pipelines DevBlog](https://devblogs.microsoft.com/devops/axios-npm-supply-chain-compromise-guidance-for-azure-pipelines-customers/), 2026-04-24)

MCP 설정은 개발자 취향의 문제가 아닙니다. 로컬 도구와 토큰 범위(token scope)를 연결하는 권한 인터페이스입니다. MCP 보안 문서는 토큰 전달을 금지하고 클라이언트별 동의(per-client consent), 대상 검증(audience validation), 감사 가능성을 요구합니다. 설정 파일을 개인 취향으로 두면 실행 권한의 승인자가 사라집니다. ([MCP Security Best Practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices), 2026-04 확인)

ATO 대응도 로그인 방어 교육으로 끝낼 수 없습니다. PointPivot과 ATO 분석은 계정 탈취가 국내형 포인트·기프티콘·텔레그램 유도·현금화 흐름으로 이어질 수 있음을 보여줍니다. 로그인 이후 저장 가치(stored-value) 이동을 보안 이벤트로 승격합니다. ([github.com/windshock/pointpivot](https://github.com/windshock/pointpivot), 2026-04 확인)

---

## 4\. Field Notes

## 4.1 Node.js / npm

### Axios npm 공급망 사고

Axios npm 사고는 4월 Node.js 영역의 핵심 항목입니다. Microsoft는 2026-03-31에 `axios@1.14.1`, `axios@0.30.4`가 악성 버전으로 게시됐고, `plain-crypto-js@4.2.1`이 post-install 단계에서 2단계 RAT을 내려받는 구조였다고 설명했습니다. GitHub Advisory도 `GHSA-fw8c-xr5c-95f9`로 해당 악성 패키지 이슈를 추적합니다. ([Microsoft Security Blog](https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/), 2026-04-01 / [GitHub Advisory](https://github.com/advisories/GHSA-fw8c-xr5c-95f9), 2026-03-31)

영향 판단은 lockfile만으로 끝내지 않습니다. Azure Pipelines 안내는 셀프 호스티드 에이전트, 커스텀 태스크, 서드파티 익스텐션, 컨테이너화된 빌드가 악성 버전을 설치했다면 캐시, 산출물, 노출된 자격증명을 다시 처리하라고 설명합니다. ([Azure Pipelines DevBlog](https://devblogs.microsoft.com/devops/axios-npm-supply-chain-compromise-guidance-for-azure-pipelines-customers/), 2026-04-24)

기본 설계 전환: `npm install`은 읽기 작업이 아니라 실행 권한이 있는 빌드 단계입니다. `npm ci --ignore-scripts` 적용 가능성, 예외 allowlist, 빌드 로그 검색, npm·GitHub·클라우드 자격증명 교체(credential rotation) 절차를 팀 기본값으로 둡니다.

### PoisonChain

PoisonChain은 Axios 같은 npm 공급망 사고에서 저장소 전수 조사, semver 노출 분석, 빌드 로그 검사, 패키지 관리자·팀 귀속, 팀 대시보드를 한 번에 묶는 대응 파이프라인입니다. "lockfile 증거에서 실행 증거로 이동해야 한다"는 운영 관점의 참고자료로 둡니다. ([github.com/windshock/PoisonChain](https://github.com/windshock/PoisonChain), 2026-04 확인)

기본 설계 전환: 공급망 사고 대응은 저장소 목록이 아니라 실행된 빌드와 담당 팀 목록으로 정리합니다.

### Node.js core 4월 상태

Node.js 공식 vulnerability 블로그 기준으로 2026-04-27 현재 4월 신규 Node.js core 보안 릴리스는 뚜렷하게 확인되지 않습니다. 4월 Node.js 섹션은 런타임 CVE를 의도적으로 비워두고 npm 공급망과 빌드 실행 증거에 초점을 둡니다. ([nodejs.org/en/blog/vulnerability](https://nodejs.org/en/blog/vulnerability), 2026-04-27 확인)

기본 설계 전환: "이번 달 core CVE가 없다"는 공백을 취약점 부재로 해석하지 말고, 빌드·패키지·배포 신뢰 경계로 점검 대상을 이동합니다.

## 4.2 Java / Spring / JVM

### Spring Security Authorization Server metadata validation flaw (CVE-2026-22752)

`CVE-2026-22752`는 Spring Security Authorization Server의 동적 클라이언트 등록(dynamic client registration) 엔드포인트가 특정 클라이언트 메타데이터를 충분히 검증하지 않는 문제입니다. 초기 액세스 토큰(Initial Access Token)을 가진 공격자가 조작된 메타데이터로 악성 클라이언트를 등록하면 저장형 XSS(Stored XSS), 권한 상승(Privilege Escalation), SSRF로 이어질 수 있습니다. 영향 버전은 Spring Security `7.0.0–7.0.4`, Spring Authorization Server `1.3.0–1.3.10`, `1.4.0–1.4.9`, `1.5.0–1.5.6`이며, 수정 버전은 `7.0.5`, `1.3.11`, `1.4.10`, `1.5.7`입니다. ([spring.io](https://spring.io/security/cve-2026-22752/), 2026-04-21)

기본 설계 전환: 동적 클라이언트 등록은 편의 기능이 아니라 클라이언트가 보안 경계 안으로 들어오는 승인 인터페이스입니다. redirect URI, logo URI, 메타데이터 필드 allowlist를 코드와 테스트로 고정합니다.

### Spring Security JdbcOneTimeTokenService race condition (CVE-2026-22751)

`CVE-2026-22751`은 `JdbcOneTimeTokenService`를 명시적으로 쓰는 일회용 토큰(One-Time Token) 로그인에서 TOCTOU(검사 시점과 사용 시점 간 경쟁 조건, Time-of-Check to Time-of-Use)로 단일 토큰이 복수 인증 세션에 쓰일 수 있는 문제입니다. 영향 버전은 Spring Security `6.4.0–6.4.15`, `6.5.0–6.5.9`, `7.0.0–7.0.4`이며, 수정 버전은 `6.4.16`, `6.5.10`, `7.0.5`입니다. ([spring.io](https://spring.io/security/cve-2026-22751/), 2026-04-21)

기본 설계 전환: "일회용"이라는 이름을 보안 속성으로 믿지 말고, consume 동작이 원자적으로 처리되는지 동시 요청 테스트를 추가합니다.

### Spring Boot default security filter chain flaw (CVE-2026-40976)

`CVE-2026-40976`은 특정 조건에서 Spring Boot 기본 웹 보안 필터 체인이 무력화되어 모든 엔드포인트에 비인가 접근이 가능해질 수 있는 critical 이슈입니다. 조건은 서블릿 웹 애플리케이션, 별도 Spring Security 구성 없음, `spring-boot-actuator-autoconfigure` 의존, `spring-boot-health` 미의존 조합이며, 영향 버전은 Spring Boot `4.0.0–4.0.5`, 수정 버전은 `4.0.6`입니다. ([spring.io](https://spring.io/security/cve-2026-40976/), 2026-04-23)

기본 설계 전환: 기본 보안 자동 설정은 "있을 것"으로 가정하지 말고, actuator 조합과 엔드포인트 인가(endpoint authorization)를 통합 테스트로 확인합니다.

### Spring Boot RabbitMQ TLS hostname verification flaw (CVE-2026-40971)

`CVE-2026-40971`은 Spring Boot RabbitMQ 자동 설정이 SSL bundle을 사용할 때 브로커 연결에서 호스트네임 검증(hostname verification)을 수행하지 않는 문제입니다. 영향 버전은 Spring Boot `4.0.0–4.0.5`, `3.5.0–3.5.13`이며, 수정 버전은 `4.0.6`, `3.5.14`입니다. ([spring.io](https://spring.io/security/cve-2026-40971/), 2026-04-23)

기본 설계 전환: TLS 사용 여부만 보안 조건으로 두지 말고, 호스트네임 검증 실패 테스트를 메시징 경로에 넣습니다.

### Oracle Java SE April 2026 Critical Patch Update

Oracle April 2026 CPU는 Java SE에 11개 신규 보안 패치와 추가 서드파티 패치를 포함하고, 그중 7개는 인증 없이 원격 악용이 가능하다고 설명합니다. Java Management 릴리스 노트는 `26.0.1`, `25.0.3`, `21.0.11`, `17.0.19`, `11.0.31`, `8u491` 라인을 April 2026 CPU 릴리스로 제시합니다. ([oracle.com](https://www.oracle.com/security-alerts/cpuapr2026.html), 2026-04-21 / [Oracle Java Management](https://docs.oracle.com/en-us/iaas/releasenotes/java-management/jdk-cpu-april-2026.htm), 2026-04-21)

기본 설계 전환: Spring 패치와 JDK/JRE CPU를 같은 패치 티켓에 묶지 않습니다. 런타임 이미지, CI 이미지, 컨테이너 베이스 이미지를 별도 인벤토리로 확인합니다.

## 4.3 AI / MCP / 개발 환경

MCP 위험은 단일 CVE보다 실행 구조에 가깝습니다. MCP 아키텍처 문서는 초기화 과정에서 클라이언트와 서버가 프로토콜 버전, 기능(capabilities), tools/resources 지원 여부를 교환한다고 설명합니다. 이 구조에서 로컬 MCP 서버와 도구 호출(tool invocation)은 개발자 로컬 권한, 파일 접근, 네트워크 접근을 직접 다룰 수 있습니다. ([MCP Architecture](https://modelcontextprotocol.io/docs/learn/architecture), 2026-04 확인)

MCP 보안 모범 사례는 혼동된 대리인 방지를 위해 클라이언트별 동의와 적절한 보안 통제가 필요하다고 설명하고, 토큰 전달을 금지된 안티 패턴으로 규정합니다. MCP 서버가 업스트림 토큰을 대상 검증 없이 다운스트림 API로 넘기면 감사와 통제 경계가 깨집니다. ([MCP Security Best Practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices), 2026-04 확인)

OX Security는 2026-04-15 MCP STDIO와 다운스트림 MCP 어댑터 구현에서 명령 주입(command injection)·원격 코드 실행(RCE) 계열 취약점을 다수 보고했습니다. 영향 수치와 생태계 전체 범위는 제3자 연구기관 발표 의존도가 높으므로 중간 신뢰도 참고자료로만 사용하고, 공식 MCP 보안 문서를 1차 설계 근거로 둡니다. ([OX Security](https://www.ox.security/blog/the-mother-of-all-ai-supply-chains-critical-systemic-vulnerability-at-the-core-of-the-mcp/), 2026-04-15)

기본 설계 전환: MCP 설정 JSON은 코드 리뷰 대상입니다. command, args, 파일 쓰기, 네트워크, 브라우저 자동화, 터널 개방 동작을 인벤토리에 넣고 승인된 MCP 서버만 실행합니다.

## 4.4 Account Security / ATO

ATO 공급망은 로그인 이벤트가 아니라 수익화 흐름입니다. 계정 탈취가 포인트·기프티콘·상품권·가상자산 전환으로 이어지면 공격자는 다음 자격증명 스터핑(credential stuffing)과 스팸 인프라 비용을 다시 확보합니다. ([windshock.github.io](https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/), 2026-04-07)

PointPivot은 국내 기프티콘·포인트 서비스를 노리는 사기 조직의 IP, 텔레그램, 사이트를 추적하는 OSINT 데이터베이스입니다. 법집행기관 확정 자료는 아니므로 중간 신뢰도로 두되, 국내형 침해지표(IOC)와 피벗 데이터를 조사 큐와 차단 정책의 보조 입력으로 씁니다. ([github.com/windshock/pointpivot](https://github.com/windshock/pointpivot), 2026-04 확인)

기본 설계 전환: CAPTCHA와 로그인 레이트 리밋(rate limit)만으로 ATO 대응을 닫지 않습니다. 포인트 전환, 기프티콘 발행, 연락처 변경, 결제수단 변경, 기기 변경에 단계적 인증(step-up auth)과 보안 로그 연결을 추가합니다.

## 4.5 실행 체크

**Build**

1. `axios@1.14.1`, `axios@0.30.4`, `plain-crypto-js@4.2.1` 흔적을 lockfile, package cache, CI 로그에서 확인합니다.  
2. 공격 노출 시간대에 `npm install`, `npm ci`, Docker build가 실행된 runner의 npm 토큰, GitHub PAT, SSH 키, 클라우드 자격증명을 교체합니다.  
3. 셀프 호스티드 runner와 컨테이너 빌드 캐시에서 악성 패키지 재사용 가능성을 제거합니다.

**Config** 4\. MCP 설정 JSON에서 command, args, 파일 쓰기, 네트워크, 터널 동작을 인벤토리로 만듭니다. 5\. 토큰 전달과 대상 검증 부재를 MCP 서버 금지 조건으로 둡니다.

**Spring / JVM** 6\. Spring Security `7.0.5`, Spring Authorization Server `1.5.7`, Spring Boot `4.0.6`/`3.5.14` 적용 여부를 확인합니다. 7\. JDK/JRE, CI 이미지, 런타임 이미지를 Oracle April 2026 CPU 라인과 대조합니다.

**Account** 8\. 로그인 이후 포인트·기프티콘·상품권 전환 흐름을 보안 이벤트로 연결합니다. 9\. PointPivot 침해지표(IOC)는 확정 증거가 아니라 보조 피벗 데이터로 표기합니다.

---

## 5\. Default Shift

Default Shift는 모든 것을 자동화하자는 말이 아닙니다. 보안 지식이 놓일 자리를 다시 정하는 일입니다. 어떤 지식은 구조에 내장하고, 어떤 지식은 사람의 판단으로 남기며, 어떤 지식은 팀이 함께 의미를 만들어야 합니다.

| 흐름 | 구조에 내장할 지식 | 사람의 판단으로 남길 지식 | 팀이 함께 정할 지식 |
| :---- | :---- | :---- | :---- |
| Build | 설치 스크립트 실행 기록, script 제한, secret 노출 범위 수집 | 이 runner를 침해된 환경으로 볼 것인가 | 어떤 패키지에 설치 스크립트 예외를 줄 것인가 |
| Config | MCP server allowlist, 토큰 대상 검증, command·file·network 권한 표시 | 이 도구를 팀 표준 통합으로 승인할 것인가 | 개발자 로컬 도구가 조직 권한에 닿는 경계는 어디인가 |
| Account | 저장 가치 이동 로그 연결, 단계적 인증, 이상 흐름 탐지 | 이 ATO 클러스터를 사고 대응으로 격상할 것인가 | 어떤 비즈니스 이벤트를 보안 이벤트로 볼 것인가 |

## 6\. Decision Point

1. 공격 노출 시간대에 `npm install`이 실행된 runner를 침해된 환경으로 볼 것인가?  
2. 특정 MCP 서버를 개인 설정으로 둘 것인가, 팀 표준 통합으로 승인할 것인가?  
3. 로그인 이후 포인트·기프티콘·상품권 전환을 이상거래로만 볼 것인가, 보안 사고 조건으로 올릴 것인가?

결정하지 않으면 기본값이 대신 결정합니다. 로그가 없으면 실행 여부를 판단할 수 없고, 승인자가 없으면 설정은 개인 취향이 되며, 보안 이벤트 정의가 없으면 돈이 빠져나간 뒤에야 사고가 보입니다.

## 7\. Team Conversation

- 기본값 하나: 어떤 설치·설정·계정 흐름을 더 이상 개인 주의에 맡기지 않을 것입니까?  
- 승인 인터페이스 하나: 누가 어떤 증거를 보고 예외를 승인합니까?  
- 공동 질문 하나: 우리 조직에서 "정상 흐름"처럼 보이지만 실제로 실행 권한이나 수익화 권한을 가진 경로는 무엇입니까?

이 대화가 끝났을 때 문서만 남으면 실패입니다. CI 로그 정책, MCP 설정 인벤토리, 저장 가치 보안 이벤트 정의 중 하나는 실제 기본값으로 내려야 합니다.

---

## 참고자료

- [https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/](https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/)  
- [https://modelcontextprotocol.io/docs/learn/architecture](https://modelcontextprotocol.io/docs/learn/architecture)  
- [https://modelcontextprotocol.io/docs/tutorials/security/security\_best\_practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)  
- [https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/](https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/)  
- [https://devblogs.microsoft.com/devops/axios-npm-supply-chain-compromise-guidance-for-azure-pipelines-customers/](https://devblogs.microsoft.com/devops/axios-npm-supply-chain-compromise-guidance-for-azure-pipelines-customers/)  
- [https://github.com/windshock/pointpivot](https://github.com/windshock/pointpivot)  
- [https://github.com/advisories/GHSA-fw8c-xr5c-95f9](https://github.com/advisories/GHSA-fw8c-xr5c-95f9)  
- [https://github.com/windshock/PoisonChain](https://github.com/windshock/PoisonChain)  
- [https://nodejs.org/en/blog/vulnerability](https://nodejs.org/en/blog/vulnerability)  
- [https://spring.io/security/cve-2026-22752/](https://spring.io/security/cve-2026-22752/)  
- [https://spring.io/security/cve-2026-22751/](https://spring.io/security/cve-2026-22751/)  
- [https://spring.io/security/cve-2026-40976/](https://spring.io/security/cve-2026-40976/)  
- [https://spring.io/security/cve-2026-40971/](https://spring.io/security/cve-2026-40971/)  
- [https://www.oracle.com/security-alerts/cpuapr2026.html](https://www.oracle.com/security-alerts/cpuapr2026.html)  
- [https://docs.oracle.com/en-us/iaas/releasenotes/java-management/jdk-cpu-april-2026.htm](https://docs.oracle.com/en-us/iaas/releasenotes/java-management/jdk-cpu-april-2026.htm)  
- [https://www.ox.security/blog/the-mother-of-all-ai-supply-chains-critical-systemic-vulnerability-at-the-core-of-the-mcp/](https://www.ox.security/blog/the-mother-of-all-ai-supply-chains-critical-systemic-vulnerability-at-the-core-of-the-mcp/)  
- [https://www.ox.security/blog/mcp-supply-chain-advisory-rce-vulnerabilities-across-the-ai-ecosystem/](https://www.ox.security/blog/mcp-supply-chain-advisory-rce-vulnerabilities-across-the-ai-ecosystem/)

