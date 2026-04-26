# DevSecNews 2026-04 Deep Research Brief

용도: 다른 LLM / Deep Research / 수동 조사자에게 넘길 4월호 보강 지시서.

> 상태 업데이트: 1차 Deep Research 결과는 `sources/2026-04/deep-research-result.md`에 보존했다. 이 brief는 이제 “무엇이 이미 확보됐고, 다음 LLM이 무엇을 반영하면 되는지”를 표시하는 인수인계 문서로 사용한다.

## 현재 확정된 4월호 편집 프레임

```text
자동화된 신뢰를 통제하세요 — 빌드도, 설정도, 계정 흐름도.
```

4월호는 단순 CVE 목록이 아니라 다음 세 흐름을 하나의 문제로 묶는다.

1. `npm install` / postinstall / CI build log — 빌드 자동화 경로
2. MCP / AI IDE / JSON 설정 / 터널링 — 설정 자동화 경로
3. ATO / credential stuffing / stored-value / crypto reinvestment — 계정 흐름 자동화 경로

## 이미 확보된 1차 자료

### Axios npm 공급망 공격

- https://github.com/windshock/PoisonChain/blob/main/public/docs/axios-npm-supply-chain-attack-report.md
- https://github.com/windshock/PoisonChain

확정 키워드:

- `axios@1.14.1`
- `axios@0.30.4`
- `plain-crypto-js@4.2.1`
- `postinstall`
- RAT
- build log
- Jenkins
- lockfile limitation
- PoisonChain

### MCP / AI 공급망 공격

- https://github.com/windshock/devsecnews/blob/main/sources/2026-04/ai-mcp-security-roadmap-notes.md

확정 키워드:

- MCP
- AI IDE
- Shadow Dev-Environment
- JSON 설정이 실행 경로가 되는 구조
- 터널링 도구
- 외부 노출 차단
- MFA
- 행위 중심 모니터링
- 과기정통부 긴급 보안점검 요청
- 정보통신망법 개정

### ATO 공급망

- https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/
- https://github.com/windshock/pointpivot

확정 키워드:

- ATO
- credential stuffing
- stored-value
- 포인트
- 기프티콘
- 가상자산 환류
- CaaS
- PointPivot

## Deep Research 결과로 확보된 항목

자세한 조사 결과와 reference inventory는 `sources/2026-04/deep-research-result.md`를 본다.

### Node.js / npm

- Axios npm 공급망 공격은 4월호 Node.js/npm 핵심 항목으로 유지한다.
- Node.js core 공식 vulnerability feed 기준으로는 2026년 4월 신규 core 보안 릴리스가 뚜렷하게 확인되지 않았다.
- 따라서 Node.js 섹션은 억지로 core CVE를 채우기보다 `Axios 공급망 사고 + build-log evidence + npm trusted publishing/provenance` 중심으로 정리한다.

주요 source 후보:

```text
https://github.com/axios/axios/issues/10636
https://github.com/advisories/GHSA-fw8c-xr5c-95f9
https://cloud.google.com/blog/topics/threat-intelligence/north-korea-threat-actor-targets-axios-npm-package
https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/
https://docs.npmjs.com/trusted-publishers
https://nodejs.org/en/blog/vulnerability
```

주의:

- CISA Axios alert URL은 확인됐지만 본문 접근이 제한적이었다. 세부 내용은 maintainer issue, GHSA, Microsoft, Google 근거를 우선한다.

### Java / Spring / JVM

다음 항목은 `content/devsecnews-2026-04-node-java.md`의 Java placeholder를 교체하는 데 사용할 수 있다.

1. Spring Security Authorization Server metadata validation flaw
   - CVE: `CVE-2026-22752`
   - 공지일: 2026-04-21
   - Source: https://spring.io/security/cve-2026-22752/

2. Spring Security JdbcOneTimeTokenService race condition
   - CVE: `CVE-2026-22751`
   - 공지일: 2026-04-21
   - Source: https://spring.io/security/cve-2026-22751/

3. Spring Boot default security filter chain flaw
   - CVE: `CVE-2026-40976`
   - 공지일: 2026-04-23
   - Source: https://spring.io/security/cve-2026-40976/

4. Spring Boot RabbitMQ TLS hostname verification flaw
   - CVE: `CVE-2026-40971`
   - 공지일: 2026-04-23
   - Source: https://spring.io/security/cve-2026-40971/

5. Oracle Java SE April 2026 Critical Patch Update
   - 공지일: 2026-04-21
   - Sources:
     - https://www.oracle.com/security-alerts/cpuapr2026.html
     - https://docs.oracle.com/en-us/iaas/releasenotes/java-management/jdk-cpu-april-2026.htm
     - https://blogs.oracle.com/security/april-2026-critical-patch-update-released

### MCP / AI 개발환경

외부 근거 보강용으로 다음을 사용할 수 있다.

```text
https://modelcontextprotocol.io/specification/2025-06-18/server
https://modelcontextprotocol.io/docs/learn/server-concepts
https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices
https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1024
https://blog.modelcontextprotocol.io/posts/2025-11-03-using-server-instructions/
https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/
https://www.ox.security/blog/the-mother-of-all-ai-supply-chains-critical-systemic-vulnerability-at-the-core-of-the-mcp/
https://www.ox.security/blog/mcp-supply-chain-advisory-rce-vulnerabilities-across-the-ai-ecosystem/
```

주의:

- MCP 구조 리스크는 공식 MCP 문서와 issue를 우선한다.
- OX Security의 2026-04-15 글은 좋은 보강자료지만 영향 수치와 규모 주장은 중간 신뢰도로 표시한다.

### ATO / Credential Stuffing

다음 자료를 공통 트렌드에 사용할 수 있다.

```text
https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/
https://github.com/windshock/pointpivot
https://github.com/windshock/pointpivot/blob/main/data/campaigns.md
https://github.com/windshock/pointpivot/blob/main/reports/summary.md
https://github.com/windshock/pointpivot/blob/main/data/ioc_registry.md
https://windshock.github.io/ko/post/2026-03-30-captcha-bypass-poc-defense-strategy/
```

주의:

- PointPivot은 OSINT 기반 도구로 설명한다.
- 범죄 조직 귀속은 확정 표현보다 “관찰된 캠페인/클러스터” 표현을 사용한다.

## 다음 LLM이 반영할 작업

1. `content/devsecnews-2026-04-node-java.md`의 Java placeholder를 Spring Security/Spring Boot/Oracle CPU 항목으로 교체한다.
2. Node.js 섹션의 “추가 Node.js/npm 4월 항목” placeholder를 제거하고, “Node.js core 신규 공식 릴리스 부재 + Axios 공급망 중심”으로 정리한다.
3. MCP 섹션에는 공식 MCP security docs와 OX 2026-04-15 자료를 reference로 추가한다.
4. ATO 섹션에는 PointPivot OSINT 자료를 reference로 추가하되 귀속 표현을 보수적으로 쓴다.
5. 참고자료에는 본문에 실제 사용한 URL만 남기고, URL 문자열을 본문과 완전히 일치시킨다.
6. 최종 편집 후 아래 명령을 실행한다.

```bash
npm run verify -- --month 2026-04
npm run build:cards -- --month 2026-04
npm run deploy -- --month 2026-04
```

## 남은 공백

- 국내 정책/공문 1차 출처 대조:
  - PDF의 “과기정통부 사이버침해대응과-721”, “침해사고 24시간 내 신고”, “매출액 3% 과징금” 공개 문서 확인 필요.
- MCP 공식 대응 추적:
  - 2026-04-15 이후 Anthropic / MCP maintainers / SDK repos의 공식 advisory, issue, patch, governance update 확인 필요.
- ATO 공급망 외부 검증:
  - PointPivot/블로그의 OSINT 결론을 언론 보도, 수사기관 자료, 판결문 수준 자료로 교차 검증하면 신뢰도 상승.
- Java 섹션 확장 후보:
  - Apache Tomcat / Jetty / Netty / Quarkus / Red Hat 계열 2026-04 공식 advisory 추가 탐색.
- 도구 링크 공백:
  - `mcpguard` 공개 URL 미확인.

## 최종 문서에 반영할 때 주의

- DevSecNews 프롬프트는 구조 번호를 고정한다.
- 참고자료에는 본문에서 실제 사용한 URL만 넣는다.
- 본문 URL과 참고자료 URL은 문자열이 완전히 같아야 한다.
- 각 항목은 실행 가능한 조치 문장으로 끝낸다.
