# DevSecNews 2026-04 Deep Research Result

이 문서는 2026년 4월호 DevSecNews(Node.js/Java) 보강을 위해 수행한 Deep Research 결과를 보존한다.  
목적은 `content/devsecnews-2026-04-node-java.md`를 직접 덮어쓰는 것이 아니라, 이후 다른 LLM/편집자가 원고에 반영할 수 있도록 검증된 후보와 남은 공백을 표시하는 것이다.

## 1. Executive Summary

4월호의 중심은 개별 런타임 취약점보다 **신뢰하던 자동화 경로가 실행 경로로 바뀌는 구조적 문제**다.

- Node.js 공식 취약점 피드 기준으로는 2026년 4월 신규 Node.js core 보안 릴리스가 뚜렷하게 확인되지 않았다. 4월 Node.js/npm의 핵심 이슈는 Axios npm 공급망 사고다.
- Axios 사고는 maintainer 계정/단말 침해와 공식 npm 배포 경로 남용, `postinstall` 기반 RAT 실행, 사후 흔적 제거가 결합된 공급망 사고다.
- Java/Spring/JVM 쪽은 4월 21일~23일 사이 Spring Security, Spring Boot, Oracle Java SE 공식 보안 권고가 확인되어 Java 섹션 보강에 바로 사용할 수 있다.
- MCP/AI 개발환경은 단일 CVE보다 local MCP server, JSON 설정, model-controlled tools, server instructions, token scope가 결합되는 구조적 리스크로 다루는 편이 적절하다.
- ATO는 로그인 이벤트가 아니라 stored-value 탈취, 현금화, 선불유심/텔레그램/스팸 인프라로 이어지는 운영형 공급망으로 설명하는 편이 적절하다.

4월호 편집 프레임은 다음 문장으로 유지하는 것을 권장한다.

```text
자동화된 신뢰를 통제하세요 — 빌드도, 설정도, 계정 흐름도.
```

## 2. Confirmed Items for Inclusion

### 2.1 Axios npm supply chain compromise

- 분류: Node.js / npm / Supply Chain
- 포함 판단: Include
- 공식/고신뢰 출처일:
  - Axios maintainer issue: 2026-04-02
  - Microsoft 대응 글: 2026-04-01
  - CISA alert: 2026-04-20, 본문 전체 확인 제한/스니펫 수준 확인
  - GHSA advisory: 2026-03-31
- 핵심 내용:
  - `axios@1.14.1`, `axios@0.30.4`가 악성 버전으로 게시됨.
  - `plain-crypto-js@4.2.1`이 의존성으로 주입됨.
  - `postinstall` 훅이 OS별 2단계 RAT을 설치.
  - 설치/실행된 머신은 fully compromised로 간주해야 함.
  - `setup.js` 삭제 및 `package.json` clean stub 교체로 사후 파일시스템 검사만으로는 감염 여부 판단이 어려움.
- 개발자 조치:
  - 공격 시간대의 `npm install` / `npm ci` / Docker build / cache restore 로그를 확인.
  - 감염 가능 환경의 npm token, GitHub PAT, SSH key, cloud credential을 다른 머신에서 회전.
  - lockfile뿐 아니라 build log를 1차 증거로 보존.
  - npm trusted publishing/OIDC/provenance 적용 검토.
- Sources:
  - https://github.com/axios/axios/issues/10636 (2026-04-02)
  - https://github.com/advisories/GHSA-fw8c-xr5c-95f9 (2026-03-31)
  - https://cloud.google.com/blog/topics/threat-intelligence/north-korea-threat-actor-targets-axios-npm-package (2026-03-31)
  - https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/ (2026-04-01)
  - https://www.cisa.gov/news-events/alerts/2026/04/20/supply-chain-compromise-impacts-axios-node-package-manager (2026-04-20, access limited)
  - https://github.com/windshock/PoisonChain (2026-04 확인)
  - https://github.com/windshock/PoisonChain/blob/main/public/docs/axios-npm-supply-chain-attack-report.md (2026-04 확인)
  - https://docs.npmjs.com/trusted-publishers (2026-04 확인)

### 2.2 Node.js core April 2026 status

- 분류: Node.js
- 포함 판단: Include as context, not as vulnerability item
- 공식 공지일: 해당 없음
- 핵심 내용:
  - Node.js 공식 vulnerability blog 기준으로 2026년 4월 신규 Node.js core 보안 릴리스는 명확히 확인되지 않았다.
  - 따라서 Node.js 섹션은 억지로 core CVE를 채우기보다 Axios/npm 공급망 사고 중심으로 구성하는 것이 적절하다.
- 개발자 조치:
  - 4월호에서 “Node.js core CVE 없음”을 짧게 언급하고, npm 공급망/빌드 로그/배포 신뢰 문제로 초점을 이동.
- Sources:
  - https://nodejs.org/en/blog/vulnerability (2026-04 확인)

### 2.3 MCP / AI development environment supply-chain risk

- 분류: Common / AI Supply Chain / Dev Environment
- 포함 판단: Include
- 공식/고신뢰 출처일:
  - MCP spec/security docs: 2025~2026 확인
  - MCP tool annotations blog: 2026-03-16
  - OX Security MCP advisory/research: 2026-04-15
- 핵심 내용:
  - MCP server primitives에서 tools는 model-controlled로 정의된다.
  - local MCP server 설치는 곧 local command execution 경로가 될 수 있다.
  - server instructions와 tool annotations는 enforcement가 아니라 soft signal이다.
  - broad scope token, token passthrough, SSRF, confused deputy, local server compromise가 공식 보안 문서에서 다뤄진다.
  - OX Security는 MCP 생태계에서 UI injection, hardening bypass, zero-click prompt injection, malicious marketplace distribution 계열을 제시했다. 단, 구체 수치/영향 범위는 제3자 연구기관 발표 의존도가 높으므로 중간 신뢰도로 다루는 것이 안전하다.
- 개발자 조치:
  - MCP 설정 JSON을 코드 리뷰와 CI 검증 대상으로 포함.
  - local MCP server one-click 설치 시 exact command, args, network/file scope를 사용자에게 명시.
  - sandbox, scope minimization, token audience 검증, host-level approval을 기본 정책으로 설정.
  - `mcpguard` 공개 URL이 나오면 MCP 설정 검증 도구로 연결.
- Sources:
  - https://modelcontextprotocol.io/specification/2025-06-18/server (2026-04 확인)
  - https://modelcontextprotocol.io/docs/learn/server-concepts (2026-04 확인)
  - https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices (2026-04 확인)
  - https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1024 (2025-07-21, 2026-04 확인)
  - https://blog.modelcontextprotocol.io/posts/2025-11-03-using-server-instructions/ (2025-11-03)
  - https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/ (2026-03-16)
  - https://www.ox.security/blog/the-mother-of-all-ai-supply-chains-critical-systemic-vulnerability-at-the-core-of-the-mcp/ (2026-04-15)
  - https://www.ox.security/blog/mcp-supply-chain-advisory-rce-vulnerabilities-across-the-ai-ecosystem/ (2026-04-15)
  - 사용자 첨부 PDF `AI 기반 보안 위협 확산에 따른 긴급 대응 로드맵` (2026-04, public URL 없음)

### 2.4 ATO supply chain and PointPivot

- 분류: Common / Account Security / Fraud Supply Chain
- 포함 판단: Include, but mark as OSINT-based
- 공식/고신뢰 출처일:
  - 사용자 블로그: 2026-04-07
  - PointPivot repo: 2026-04 확인
- 핵심 내용:
  - ATO는 로그인 성공/실패 이벤트 하나가 아니라 stored-value 탈취와 현금화로 이어지는 운영형 공급망이다.
  - PointPivot은 국내 기프티콘·포인트 서비스를 노리는 사기 조직의 IP, 텔레그램, 사이트를 추적하는 OSINT 데이터베이스다.
  - Cluster #1은 credential stuffing, 포인트/기프티콘 현금화, 선불유심/내구제 스팸, 텔레그램 유입으로 이어지는 운영 모델을 제시한다.
  - 2026-04-13 자동 요약 기준 seed 65개, pivot 포함 82개 IP, 19개 텔레그램 핸들, 26개 피해 사이트가 정리된 것으로 확인.
  - 법집행기관 자료 수준의 확정 증거는 아니므로 신뢰도는 중간으로 표시하는 것이 적절하다.
- 개발자 조치:
  - CAPTCHA만 강화하지 말고, 포인트 전환, 기프티콘 발행, 계정 recovery, 연락처 변경, 결제수단 변경에 step-up auth 적용.
  - 로그인 로그와 stored-value 사용 로그, 디바이스, IP, 텔레그램/게시판 스팸 IOC를 연결해 모니터링.
- Sources:
  - https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/ (2026-04-07)
  - https://github.com/windshock/pointpivot (2026-04 확인)
  - https://github.com/windshock/pointpivot/blob/main/data/campaigns.md (2026-04 확인)
  - https://github.com/windshock/pointpivot/blob/main/reports/summary.md (2026-04 확인)
  - https://github.com/windshock/pointpivot/blob/main/data/ioc_registry.md (2026-04 확인)
  - https://windshock.github.io/ko/post/2026-03-30-captcha-bypass-poc-defense-strategy/ (2026-03-30)

## 3. Confirmed Java / Spring / JVM Items

### 3.1 Spring Security Authorization Server metadata validation flaw

- 분류: Java / Spring Security / Authorization Server
- 포함 판단: Include
- 공식 공지일: 2026-04-21
- Advisory: `CVE-2026-22752`
- 핵심 내용:
  - dynamic client registration endpoint가 특정 client metadata를 충분히 검증하지 않음.
  - Initial Access Token을 가진 공격자가 악성 client를 등록해 Stored XSS, Privilege Escalation, SSRF를 유도할 수 있음.
- 영향 버전:
  - Spring Security `7.0.0 - 7.0.4`
  - Spring Authorization Server `1.3.0 - 1.3.10`
  - Spring Authorization Server `1.4.0 - 1.4.9`
  - Spring Authorization Server `1.5.0 - 1.5.6`
- 수정 버전:
  - Spring Security `7.0.5`
  - Spring Authorization Server `1.3.11`, `1.4.10`, `1.5.7`
- 개발자 조치:
  - dynamic client registration 활성화 여부 확인.
  - 영향 버전 사용 시 즉시 업그레이드.
  - client metadata validation과 redirect URI/metadata allowlist 검토.
- Source:
  - https://spring.io/security/cve-2026-22752/ (2026-04-21)

### 3.2 Spring Security JdbcOneTimeTokenService race condition

- 분류: Java / Spring Security
- 포함 판단: Include
- 공식 공지일: 2026-04-21
- Advisory: `CVE-2026-22751`
- 핵심 내용:
  - `JdbcOneTimeTokenService`를 사용하는 One-Time Token 로그인에서 TOCTOU race condition이 발생할 수 있음.
  - 단일 one-time token이 복수 세션 인증에 재사용될 수 있음.
- 영향 버전:
  - Spring Security `6.4.0 - 6.4.15`
  - Spring Security `6.5.0 - 6.5.9`
  - Spring Security `7.0.0 - 7.0.4`
- 수정 버전:
  - `6.4.16`, `6.5.10`, `7.0.5`
- 개발자 조치:
  - OTT 로그인 사용 여부 확인.
  - 동시 요청 재현 테스트 추가.
  - 영향 버전 사용 시 즉시 업그레이드.
- Source:
  - https://spring.io/security/cve-2026-22751/ (2026-04-21)

### 3.3 Spring Boot default security filter chain flaw

- 분류: Java / Spring Boot
- 포함 판단: Include
- 공식 공지일: 2026-04-23
- Advisory: `CVE-2026-40976`
- 심각도: Critical
- 핵심 내용:
  - 특정 조건에서 기본 web security filter chain이 무력화되어 전체 endpoint에 unauthorized access가 가능해질 수 있음.
- 영향 조건:
  - servlet 기반 web application
  - 별도 Spring Security 구성이 없음
  - `spring-boot-actuator-autoconfigure` 의존
  - `spring-boot-health`에는 의존하지 않음
- 영향 버전:
  - Spring Boot `4.0.0 - 4.0.5`
- 수정 버전:
  - Spring Boot `4.0.6`
- 개발자 조치:
  - Boot 4.0.x 사용 여부 확인.
  - actuator/health/security auto-config 조합 점검.
  - 영향 조건이면 즉시 4.0.6 이상으로 업그레이드.
- Source:
  - https://spring.io/security/cve-2026-40976/ (2026-04-23)

### 3.4 Spring Boot RabbitMQ TLS hostname verification flaw

- 분류: Java / Spring Boot / Messaging
- 포함 판단: Include
- 공식 공지일: 2026-04-23
- Advisory: `CVE-2026-40971`
- 핵심 내용:
  - RabbitMQ auto-configuration이 SSL bundle을 사용할 때 hostname verification을 수행하지 않음.
  - broker 위·변조나 MITM 조건에서 TLS 보안 기대가 깨질 수 있음.
- 영향 버전:
  - Spring Boot `4.0.0 - 4.0.5`
  - Spring Boot `3.5.0 - 3.5.13`
- 수정 버전:
  - `4.0.6`, `3.5.14`
- 개발자 조치:
  - RabbitMQ SSL bundle 사용 여부 확인.
  - 영향 버전 사용 시 즉시 업그레이드.
  - 메시징 경로의 TLS hostname verification 테스트 추가.
- Source:
  - https://spring.io/security/cve-2026-40971/ (2026-04-23)

### 3.5 Oracle Java SE April 2026 Critical Patch Update

- 분류: Java / JVM / Oracle CPU
- 포함 판단: Include
- 공식 공지일: 2026-04-21
- 핵심 내용:
  - Oracle April 2026 CPU에서 Java SE 신규 패치 11건이 공개됨.
  - 이 중 7건은 인증 없이 원격 악용 가능하다고 명시됨.
  - JAXP, Networking, JSSE, JGSS, Libraries, Security 등 다양한 기반 컴포넌트가 포함됨.
- 업데이트 라인:
  - `26.0.1`
  - `25.0.3`
  - `21.0.11`
  - `17.0.19`
  - `11.0.31`
  - `8u491`
- 개발자 조치:
  - 운영 JDK/JRE inventory를 CPU 라인 기준으로 대조.
  - 컨테이너 base image, CI image, runtime image를 함께 갱신.
  - Spring 패치와 별도로 JVM CPU 적용 여부를 추적.
- Sources:
  - https://www.oracle.com/security-alerts/cpuapr2026.html (2026-04-21)
  - https://docs.oracle.com/en-us/iaas/releasenotes/java-management/jdk-cpu-april-2026.htm (2026-04-21)
  - https://blogs.oracle.com/security/april-2026-critical-patch-update-released (2026-04-21)

## 4. Items to Mark as Review / Medium Confidence

### 4.1 CISA Axios alert

- 상태: Review / limited access
- 이유:
  - CISA alert URL은 확인되었으나 본문 전체 접근이 제한되어 스니펫 수준으로만 확인됨.
  - 원고에는 “CISA도 2026-04-20에 관련 alert를 게시했다” 정도로만 사용하고, 세부 내용은 Axios maintainer/GHSA/Microsoft/Google 근거를 우선하는 것이 안전하다.
- Source:
  - https://www.cisa.gov/news-events/alerts/2026/04/20/supply-chain-compromise-impacts-axios-node-package-manager (2026-04-20, access limited)

### 4.2 OX Security MCP impact numbers

- 상태: Review / medium confidence
- 이유:
  - MCP 구조 리스크 자체는 공식 MCP security docs와 일치한다.
  - 다만 OX가 제시한 영향 수치, CVE 수, registry poisoning 규모 등은 제3자 연구기관 발표에 크게 의존하므로 숫자는 보수적으로 인용해야 한다.
- Source:
  - https://www.ox.security/blog/the-mother-of-all-ai-supply-chains-critical-systemic-vulnerability-at-the-core-of-the-mcp/ (2026-04-15)
  - https://www.ox.security/blog/mcp-supply-chain-advisory-rce-vulnerabilities-across-the-ai-ecosystem/ (2026-04-15)

### 4.3 ATO/PointPivot OSINT conclusions

- 상태: Review / medium confidence
- 이유:
  - PointPivot은 공개 OSINT 기반으로 유용하지만 법집행기관 수사자료 수준의 확정 자료는 아니다.
  - 원고에서는 “국내형 ATO/CaaS 인프라를 OSINT로 추적하는 도구”로 설명하고, 확정적 범죄 귀속 표현은 피하는 것이 안전하다.
- Sources:
  - https://github.com/windshock/pointpivot (2026-04 확인)
  - https://github.com/windshock/pointpivot/blob/main/data/campaigns.md (2026-04 확인)
  - https://github.com/windshock/pointpivot/blob/main/reports/summary.md (2026-04 확인)

### 4.4 Korean policy / uploaded PDF claims

- 상태: Review / internal-source only
- 이유:
  - 사용자 첨부 PDF에는 과기정통부 긴급 보안점검 공문, 24시간 신고 의무, 매출액 3% 과징금 등 정책 문맥이 포함되어 있다.
  - 공개 1차 출처와 완전 대조하지 못했으므로 원고에서는 “사용자 첨부 브리핑 기준” 또는 “내부 참고자료 기준”으로 표시하는 것이 적절하다.
- Sources:
  - 사용자 첨부 PDF `AI 기반 보안 위협 확산에 따른 긴급 대응 로드맵` (public URL 없음)
  - https://www.kisa.kr/401/form?lang_type=KO&postSeq=3616 (2026-03-10, 공급망 보안 관련 공개자료)

## 5. Suggested Insertions for Other LLMs

다른 LLM이 `content/devsecnews-2026-04-node-java.md`에 반영할 때는 다음 순서를 권장한다.

1. Node.js 섹션에서 “추가 Node.js/npm 4월 항목” placeholder를 제거하고, “Node.js core 4월 신규 릴리스 부재 + Axios 공급망 중심”으로 정리.
2. Java 섹션 placeholder를 Spring Security/Spring Boot/Oracle CPU 5개 항목으로 교체.
3. MCP 공통 트렌드에는 공식 MCP security docs, SEP-1024, OX Security 2026-04-15 연구를 추가하되, OX 수치는 중간 신뢰도로 표시.
4. ATO 공통 트렌드에는 PointPivot을 OSINT 기반 도구로 연결하고, 법집행기관 수준의 확정 표현은 피함.
5. 참고자료에는 본문에 실제 사용한 URL만 넣고, URL 문자열을 본문과 완전히 일치시킴.

## 6. Remaining Gaps

- 국내 정책/공문 1차 출처 대조:
  - PDF의 “과기정통부 사이버침해대응과-721”, “침해사고 24시간 내 신고”, “매출액 3% 과징금”의 공개 문서 확인 필요.
- MCP 공식 대응 추적:
  - 2026-04-15 이후 Anthropic / MCP maintainers / SDK repos의 공식 advisory, issue, patch, governance update 확인 필요.
- ATO 공급망 외부 검증:
  - PointPivot/블로그의 OSINT 결론을 언론 보도, 수사기관 자료, 판결문 수준 자료로 교차 검증하면 신뢰도 상승.
- Java 섹션 확장 후보:
  - Apache Tomcat / Jetty / Netty / Quarkus / Red Hat 계열의 2026-04 공식 advisory 추가 탐색.
- 도구 링크 공백:
  - `mcpguard` 공개 URL 미확인.

## 7. Reference Inventory

### Axios and Node.js

- https://github.com/axios/axios/issues/10636 (2026-04-02)
- https://github.com/advisories/GHSA-fw8c-xr5c-95f9 (2026-03-31)
- https://cloud.google.com/blog/topics/threat-intelligence/north-korea-threat-actor-targets-axios-npm-package (2026-03-31)
- https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/ (2026-04-01)
- https://www.cisa.gov/news-events/alerts/2026/04/20/supply-chain-compromise-impacts-axios-node-package-manager (2026-04-20, access limited)
- https://github.com/windshock/PoisonChain (2026-04 확인)
- https://github.com/windshock/PoisonChain/blob/main/public/docs/axios-npm-supply-chain-attack-report.md (2026-04 확인)
- https://docs.npmjs.com/trusted-publishers (2026-04 확인)
- https://nodejs.org/en/blog/vulnerability (2026-04 확인)

### MCP and AI supply chain

- https://modelcontextprotocol.io/specification/2025-06-18/server (2026-04 확인)
- https://modelcontextprotocol.io/docs/learn/server-concepts (2026-04 확인)
- https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices (2026-04 확인)
- https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1024 (2025-07-21, 2026-04 확인)
- https://github.com/modelcontextprotocol/modelcontextprotocol/issues/544 (2025-05-18, 2026-04 확인)
- https://blog.modelcontextprotocol.io/posts/2025-11-03-using-server-instructions/ (2025-11-03)
- https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/ (2026-03-16)
- https://www.ox.security/blog/the-mother-of-all-ai-supply-chains-critical-systemic-vulnerability-at-the-core-of-the-mcp/ (2026-04-15)
- https://www.ox.security/blog/mcp-supply-chain-advisory-rce-vulnerabilities-across-the-ai-ecosystem/ (2026-04-15)
- 사용자 첨부 PDF `AI 기반 보안 위협 확산에 따른 긴급 대응 로드맵` (2026-04, public URL 없음)

### ATO and PointPivot

- https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/ (2026-04-07)
- https://github.com/windshock/pointpivot (2026-04 확인)
- https://github.com/windshock/pointpivot/blob/main/data/campaigns.md (2026-04 확인)
- https://github.com/windshock/pointpivot/blob/main/reports/summary.md (2026-04 확인)
- https://github.com/windshock/pointpivot/blob/main/data/ioc_registry.md (2026-04 확인)
- https://windshock.github.io/ko/post/2026-03-30-captcha-bypass-poc-defense-strategy/ (2026-03-30)

### Java / Spring / JVM

- https://spring.io/security/cve-2026-22752/ (2026-04-21)
- https://spring.io/security/cve-2026-22751/ (2026-04-21)
- https://spring.io/security/cve-2026-40976/ (2026-04-23)
- https://spring.io/security/cve-2026-40971/ (2026-04-23)
- https://spring.io/security/ (2026-04 확인)
- https://www.oracle.com/security-alerts/cpuapr2026.html (2026-04-21)
- https://docs.oracle.com/en-us/iaas/releasenotes/java-management/jdk-cpu-april-2026.htm (2026-04-21)
- https://blogs.oracle.com/security/april-2026-critical-patch-update-released (2026-04-21)

### Korean policy context

- https://www.kisa.kr/401/form?lang_type=KO&postSeq=3616 (2026-03-10, supply-chain security related public material)
- 사용자 첨부 PDF `AI 기반 보안 위협 확산에 따른 긴급 대응 로드맵` (2026-04, public URL 없음)
