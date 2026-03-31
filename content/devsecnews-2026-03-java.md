# DevSecNews 2026-03 — Java 보안 요약(개발자용)

## 이달의 한 줄 메시지

**3월 핵심어: supply-chain trust(공급망 신뢰) · parser differential(파서 해석 차이) · implicit lookup(묵시적 변수 탐색)**

신뢰하던 보안 스캐너가 크리덴셜 탈취 도구로 전락했고, WAF와 백엔드는 같은 요청을 서로 다르게 읽었으며, CAPTCHA는 LLM 에이전트 앞에서 사실상 공짜로 뚫렸습니다. 세 사건 모두 '알아서 안전하게 처리될 것'이라는 암묵적 신뢰에서 비롯됐습니다.

**한 줄 결론: 신뢰하지 말고 검증하세요 — 도구도, 파서도, 사용자 구분도.**

---


# (1) Editor’s Pick

이번 달 Editor’s Pick은 Trivy 공급망 공격입니다. 3월 19일, 위협 그룹 TeamPCP가 Aqua Security의 Trivy 스캐너를 장악해 CI/CD 파이프라인 수천 개에 크리덴셜 탈취 페이로드를 심었습니다. 보안 스캐너 자체가 공격 벡터가 된 사건으로, GitHub Actions의 mutable tag 신뢰 모델과 시크릿 관리의 구조적 취약점이 드러났습니다. 아래 분석 글을 권장합니다.

- **Wiz Research** — 공격 타임라인과 다중 생태계 확산 경로를 정리한 기술 분석입니다. [Source] https://www.wiz.io/blog/trivy-compromised-teampcp-supply-chain-attack (2026-03-20)
- **CrowdStrike** — trivy-action 태그 포이즈닝의 탐지·조사·대응 절차를 다룹니다. [Source] https://www.crowdstrike.com/en-us/blog/from-scanner-to-stealer-inside-the-trivy-action-supply-chain-compromise/ (2026-03-21)
- **Microsoft Security** — 영향 판별, 시크릿 회전, 파이프라인 격리에 대한 방어 가이드입니다. [Source] https://www.microsoft.com/en-us/security/blog/2026/03/24/detecting-investigating-defending-against-trivy-supply-chain-compromise/ (2026-03-24)

두 번째 Pick은 이번 호 Netty HRS(CVE-2026-33870)와 직결되는 WAF/IPS/IDS 탐지 공백 분석입니다. 시그니처 우회가 아니라 WAF–프록시–백엔드 간 파싱 불일치가 진짜 원인이라는 점을 1,207개 우회 사례로 입증합니다. 함께 읽으면 좋은 참고자료: @JeppW의 Funky Chunks 연구(chunk extension 모호성을 이용한 HRS), xclow3n의 Cloudflare Pingora request smuggling 분석, nginx chunk-line CRLF 엄격화 패치 논의.

- **windshock** — WAF/IPS/IDS 탐지 공백 구조 분석: 프로토콜 비동기화부터 경로 정규화까지. [Source] https://windshock.github.io/ko/post/2026-03-13-waf-ips-ids-detection-gap-analysis/ (2026-03-13)
- **windshock** — waf-ips-ids-retest: 가설 기반 WAF 탐지 공백 재테스트 프레임워크. [Source] https://github.com/windshock/waf-ips-ids-retest (2026-03)
- **@JeppW** — Funky Chunks: 모호한 chunk line terminator를 악용한 request smuggling 원본 연구. [Source] https://w4ke.info/2025/06/18/funky-chunks.html (2025-06-18)
- **xclow3n** — Breaking Pingora: Cloudflare 프록시의 HTTP request smuggling과 cache poisoning 분석. [Source] https://xclow3n.github.io/post/6/ (2026-02-25)
- **Cloudflare** — Pingora request smuggling 취약점 대응 및 패치 블로그. [Source] https://blog.cloudflare.com/resolving-a-request-smuggling-vulnerability-in-pingora/ (2026-03-04)
- **Netty Advisory** — GHSA-pwqr-wmgm-9rr8 / CVE-2026-33870: chunk extension 파싱 오류 기반 request smuggling. [Source] https://github.com/netty/netty/security/advisories/GHSA-pwqr-wmgm-9rr8 (2026-03-26)
- **nginx-devel** — chunk-size line CRLF 엄격 적용 패치 논의 (RFC 9112 §7.1 준수). [Source] https://mailman.nginx.org/pipermail/nginx-devel/2024-January/5CQQCHFYQMXTBAK7H2FITLVQQS5ECFFM.html (2024-01)

세 번째 Pick은 CAPTCHA 우회 PoC입니다. 2025년 대규모 해킹 사건들의 여파로 유출된 ID/PW·신분증 등 개인정보를 활용한 크레덴셜 스터핑과, 급전 목적으로 타인 명의 폰을 개통하는 '내구제' 명의도용이 급증했습니다. 이에 대한 대응으로 CAPTCHA 강화가 확산되고 있지만, Playwright + Whisper + LLM 에이전트 조합이면 비용 $0, 100% 로컬에서 CAPTCHA가 자동 우회됩니다. DOM 난독화는 더 이상 유효한 방어가 아니며, CAPTCHA 의존 전략 자체를 재검토해야 합니다.

- **windshock** — CAPTCHA 우회 PoC와 방어 전략: LLM 에이전트가 바꿔놓은 게임의 규칙. [Source] https://windshock.github.io/ko/post/2026-03-30-captcha-bypass-poc-defense-strategy/ (2026-03-30)

크레덴셜 스터핑과 명의도용 관련 참고자료:
- **BJC저널** — 가전 구독 내구제 대출 사기 실태 보도. '나를 구제하는 대출'의 현재 형태를 취재한 기사입니다. [Source] https://journal.kbjc.net/news/articleView.html?idxno=20638 (2025-08)
- **일요시사** — 2025년 통신분쟁 2123건 역대 최대, 명의도용 217건(10.2%)이며 미해결률 39.8%. [Source] https://www.ilyosisa.co.kr/news/article.html?no=254600 (2026-02)
- **서울경제** — SKT·KT·쿠팡 유출 여파로 M-safer 가입제한 서비스 이용이 2년 만에 16배 급증. [Source] https://v.daum.net/v/20251202154625602 (2025-12)


# (2) 이번 달 요약


## 핵심 뉴스 TOP 5

1. **Spring 관리 경로·보안 헤더 취약점 (CVE-2026-22731 / 22732 / 22733)**  
   Actuator 경로와 애플리케이션 경로가 겹치면서 인증 우회와 보안 헤더 누락이 동시에 발생합니다. 관리 경로 하위에 비즈니스 엔드포인트를 배치한 경우 두 문제가 한꺼번에 열립니다.  
   [Source] https://spring.io/security/cve-2026-22731 (2026-03-19) · https://spring.io/security/cve-2026-22732 (2026-03-19) · https://spring.io/security/cve-2026-22733 (2026-03-19)

   `basicConstraints` 우회, RSA-PKCS 서명 위조, Ed25519 서명 위조가 같은 날 공개됐습니다. PKI 검증은 보안의 마지막 보루입니다—하나만 뚫려도 신뢰 체계 전체가 무너집니다.  
   [Source] https://github.com/digitalbazaar/forge/security/advisories/GHSA-2328-f5f3-gj25 (2026-03-26)

3. **Netty · ZooKeeper 네트워크 경계 해석 차이 (CVE-2026-33870 / 24281)**  
   Netty는 chunked extension 파싱 불일치로 request smuggling이, ZooKeeper는 reverse DNS 의존 호스트 검증에서 우회가 발생했습니다. 프록시와 백엔드가 요청 경계를 다르게 해석하는 순간 네트워크 방어는 의미를 잃습니다.  
   [Source] https://github.com/netty/netty/security/advisories/GHSA-pwqr-wmgm-9rr8 (2026-03-26) · https://lists.apache.org/thread/088ddsbrzhd5lxzbqf5n24yg0mwh9jt2 (2026-03-07)

   prototype이 오염된 상태에서 partial 이름을 프로퍼티 직접 조회로 찾아 XSS로 이어집니다. 템플릿 엔진이 "이름을 알아서 찾아주는" 편의 기능이 곧 공격 경로가 됩니다.  
   [Source] https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-2qvq-rjwj-gvw9 (2026-03-26)

   POSIX 문자 클래스 처리 오류로 glob 매칭 범위가 의도와 다르게 넓어집니다. glob를 권한 판단의 단일 근거로 쓰면, edge case 하나로 허용 범위가 늘어납니다.  
   [Source] https://github.com/micromatch/picomatch/security/advisories/GHSA-3v7f-55p6-f55p (2026-03-25)

---

<!--CARD
{"id":"top5-1","kind":"summary","domain":"common","header":"핵심 뉴스","title":"3월 핵심 뉴스 TOP 5","bodyMd":"1. **Spring** — Actuator 경로 충돌로 인증 우회 + 보안 헤더 누락 (CVE-2026-22731/22732/22733)\n2. **node-forge** — 인증서 체인·RSA·Ed25519 서명 검증 3종 실패 (CVE-2026-33896/33894/33895)\n3. **Netty·ZooKeeper** — chunked extension 파싱 불일치 + reverse DNS 우회 (CVE-2026-33870/24281)\n4. **Handlebars** — prototype 오염 + implicit lookup → XSS (CVE-2026-33916)\n5. **Picomatch** — POSIX 클래스 처리 오류로 glob 매칭 범위 확대 (CVE-2026-33672)","actionMd":"각 항목의 상세 분석과 패치 가이드는 본문 (2) Node.js, (3) Java 섹션을 참고하세요.","source":"https://spring.io/security/cve-2026-22731"}
-->

---
## 왜 반복되는가

3월에 나온 취약점들은 모두 “라이브러리 또는 인프라가 알아서 처리해줄 것”이라는 기대에서 비롯됐습니다. prototype chain lookup, parser differential, reverse DNS fallback — 이 세 패턴의 공통점은 편의를 위해 암묵적으로 열어둔 경로입니다.

**세 가지 구조적 원칙을 이번 달 PR에 반영하세요.**

1. **암묵적 경로를 끊으세요.**  
   이름 조회에는 `hasOwn`, 경로 판단에는 prefix 분리, DNS 검증에는 SAN 직접 비교. 편의를 위한 fallback은 보안 경계 밖으로 내보냅니다.  
   [Source] https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-2qvq-rjwj-gvw9 (2026-03-26) · https://github.com/netty/netty/security/advisories/GHSA-pwqr-wmgm-9rr8 (2026-03-26)

2. **관리 경로와 비즈니스 경로를 URI prefix부터 분리하세요.**  
   Actuator · CloudFoundry · Health group 경로 하위에 비즈니스 엔드포인트를 배치하지 않습니다. 두 경로는 다른 접근 제어 정책을 가져야 합니다.  
   [Source] https://spring.io/security/cve-2026-22731 (2026-03-19) · https://spring.io/security/cve-2026-22733 (2026-03-19)

3. **보안 의존성 업데이트에는 경계 테스트를 묶으세요.**  
   버전을 올리는 것만으로는 부족합니다. 보안 헤더 존재, 요청 경계 일치, 호스트 검증, 인증서/서명 검증 테스트를 같은 PR에 포함해야 다음 릴리스에서 같은 경로가 다시 열리지 않습니다.  
   [Source] https://spring.io/security/cve-2026-22732 (2026-03-19) · https://github.com/digitalbazaar/forge/security/advisories/GHSA-2328-f5f3-gj25 (2026-03-26)
## 이번 달 취약 개발 패턴 Top 10

### Node.js


### 1) partial/template 이름을 plain property lookup으로 해석

3월 Handlebars XSS의 직접 원인입니다. `object[key]` 형태의 동적 조회는 prototype 체인까지 탐색합니다. **템플릿 이름 조회에는 반드시 `Object.hasOwn()` 검사를 추가하세요.**

```js
// ❌ 취약
const partial = options.partials[name]

// ✅ 안전
if (!Object.hasOwn(options.partials ?? {}, name)) throw new Error('blocked')
const partial = options.partials[name]
```

[Source] https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-2qvq-rjwj-gvw9 (2026-03-26)

---

### 2) 인증서 제약 조건을 체인 검증에 통합하지 않음

`basicConstraints`가 불일치하는 인증서를 체인에 섞어 검증을 우회합니다. **체인 검증 이후 `basicConstraints` · keyUsage 검사를 별도 단계로 명시적으로 추가하세요.**

```js
// ❌ 취약: 체인 검증만으로 끝
if (forge.pki.verifyCertificateChain(caStore, chain)) return true

// ✅ 안전: 체인 검증 + 제약 조건 검사
if (!forge.pki.verifyCertificateChain(caStore, chain)) throw new Error('chain invalid')
assertBasicConstraints(chain)   // cA 플래그, pathLen 확인
assertKeyUsage(chain)           // 서명 용도 일치 확인
```

[Source] https://github.com/digitalbazaar/forge/security/advisories/GHSA-2328-f5f3-gj25 (2026-03-26)

---

### 3) 서명 형식 오류를 사전 차단하지 않고 검증 함수에 바로 전달

ASN.1 extra field나 Ed25519 경계값이 붙은 서명이 검증 함수를 통과합니다. **서명 검증 경로에 canonical encoding 확인을 별도 게이트로 추가하세요.**

```js
// ❌ 취약: malformed 입력이 그대로 전달됨
publicKey.verify(digest, signature)

// ✅ 안전: encoding 검사 → 길이 확인 → 검증
if (!isCanonicalEncoding(signature)) throw new Error('blocked')
if (signature.length !== expectedLen) throw new Error('blocked')
publicKey.verify(digest, signature)
```

[Source] https://github.com/digitalbazaar/forge/security/advisories/GHSA-ppp5-5v6c-4jwp (2026-03-26) · https://github.com/digitalbazaar/forge/security/advisories/GHSA-q67f-28xg-22rw (2026-03-26)

---

### 4) glob 결과를 권한 판단의 단일 근거로 사용

glob 엔진의 edge case 하나로 경로 필터를 벗어납니다. **glob는 후보를 줄이는 1차 필터로만 쓰고, 최종 판단은 정규화된 경로 prefix 비교로 확정하세요.**

```js
// ❌ 취약: glob 하나로 접근 허용 결정
if (isMatch(userPath, pattern)) allow()

// ✅ 안전: 정규화 → prefix 검사 → glob (방어 순서 준수)
const resolved = path.resolve(ROOT, userPath)
if (!resolved.startsWith(ROOT + path.sep)) throw new Error('traversal blocked')
if (!isMatch(resolved, pattern)) throw new Error('pattern blocked')
allow()
```

[Source] https://github.com/micromatch/picomatch/security/advisories/GHSA-3v7f-55p6-f55p (2026-03-25)

---

### 5) 패치 적용 후 보안 회귀 테스트를 생략

버전만 올리고 테스트를 추가하지 않으면, 다음 릴리스에서 같은 경로로 다시 열립니다. **보안 관련 의존성 업데이트는 회귀 테스트 추가와 같은 PR에서 처리하세요.**

```js
// ❌ 취약: 버전 업데이트만 반영
// package.json: "handlebars": "^4.7.9"  — 테스트 없음

// ✅ 안전: 업데이트 PR에 아래 테스트 케이스를 함께 포함
// ① prototype pollution → hasOwn 차단 확인
// ② chain validation → basicConstraints·keyUsage 검사 통과 확인
// ③ signature → malformed ASN.1 / S >= L 입력 거부 확인
// ④ glob + path → traversal 시도 차단 확인
```

[Source] https://github.com/digitalbazaar/forge/security/advisories/GHSA-2328-f5f3-gj25 (2026-03-26) · https://github.com/micromatch/picomatch/security/advisories/GHSA-3v7f-55p6-f55p (2026-03-25)

---

### Java


### 6) 보안 헤더가 응답에 포함됐다고 가정

헤더를 설정 코드에 추가했다고 실제 응답에 들어간다는 보장이 없습니다. **설정 코드와 응답 검증 테스트를 항상 함께 유지하세요.**

```java
// ❌ 취약
http.headers(h -> h.frameOptions(f -> f.sameOrigin()));
// 여기서 끝 — 실제 응답에 포함됐는지 미확인

// ✅ 안전: 응답 검증 테스트를 같은 PR에 포함
mockMvc.perform(get("/secure"))
    .andExpect(header().string("X-Frame-Options", "SAMEORIGIN"))
    .andExpect(header().exists("Cache-Control"));
```

[Source] https://spring.io/security/cve-2026-22732 (2026-03-19)

---

### 7) 애플리케이션 경로를 인프라 경로 하위에 배치

인프라 경로(Actuator, CF) 하위에 비즈니스 엔드포인트가 있으면, 인프라 접근 제어 정책이 비즈니스 로직에 의도치 않게 적용됩니다. **관리 경로와 비즈니스 경로는 URI prefix부터 분리하세요.**

```yaml
# ❌ 취약: 비즈니스 엔드포인트가 Actuator 경로 하위에 위치
management.endpoint.health.group.liveness.additional-path=server:/healthz
# 비즈니스 컨트롤러: /healthz/admin (→ Actuator permitAll 적용됨)

# ✅ 안전: 인프라 전용 prefix로 분리
management.endpoint.health.group.liveness.additional-path=server:/infra/healthz
# 비즈니스 컨트롤러: /api/admin (별도 보안 정책 적용)
```

[Source] https://spring.io/security/cve-2026-22731 (2026-03-19) · https://spring.io/security/cve-2026-22733 (2026-03-19)

---

### 8) 프록시와 백엔드가 동일한 요청 경계를 파싱한다고 가정

구성 요소마다 HTTP 파서가 다릅니다. 한쪽이 다르게 해석하면 그 틈이 smuggling 경로가 됩니다. **HTTP 파서 관련 업데이트에는 프록시-백엔드 일치 통합 테스트를 필수로 포함하세요.**

```java
// ❌ 취약: 파서 업데이트 후 일치 검증 없음
pipeline.addLast(new HttpServerCodec());
// → 패치 전 버전에서 프록시와 백엔드가 다르게 파싱 가능

// ✅ 안전: 파서 업데이트 + 통합 테스트 세트
pipeline.addLast(new HttpServerCodec());  // 4.1.132.Final 이상
// + chunked extension CRLF 포함 요청에 대한 400 응답 테스트
```

[Source] https://github.com/netty/netty/security/advisories/GHSA-pwqr-wmgm-9rr8 (2026-03-26)

---

### 9) reverse DNS 결과를 신뢰 경계로 사용

PTR 레코드는 누구나 설정할 수 있습니다. **TLS 호스트 검증은 접속 대상 인증서의 SAN/CN 직접 비교로 수행하세요.**

```java
// ❌ 취약: reverse DNS로 호스트 확인 — PTR 레코드 조작으로 우회
String host = inetAddress.getCanonicalHostName();  // reverse DNS 조회
verifyCertificate(host, cert);

// ✅ 안전: 요청한 호스트명을 그대로 사용 — reverse DNS 조회 없음
String host = requestedHostname;  // 사용자가 지정한 호스트명
verifySAN(host, cert);
```

[Source] https://lists.apache.org/thread/088ddsbrzhd5lxzbqf5n24yg0mwh9jt2 (2026-03-07)

---

### 10) 패치 적용 후 경계 테스트를 배포 게이트에서 제외

수정된 버전이라도 경계 테스트 없이 배포하면 누락이 남습니다. **보안 패치는 경계 테스트 추가와 같은 배포 단위로 묶으세요.**

```java
// ❌ 취약: dependency 버전만 올리고 끝
// pom.xml: spring-security-web → 6.5.9 (테스트 없음)

// ✅ 안전: 아래 4가지를 같은 PR/릴리스 게이트에 포함
// ① 보안 헤더 → X-Frame-Options, Cache-Control 응답 포함 확인
// ② Actuator 경로 → 비즈니스 엔드포인트 404 확인
// ③ chunked extension → 프록시-백엔드 파싱 일치 확인
// ④ TLS 호스트 → SAN/CN 불일치 인증서 거부 확인
```

[Source] https://spring.io/security/cve-2026-22732 (2026-03-19) · https://github.com/netty/netty/security/advisories/GHSA-pwqr-wmgm-9rr8 (2026-03-26)

---
### 한 문장 결론

> 이름 조회에 `hasOwn`, 경로 매핑에 prefix 분리, 파서에 일치 테스트, 호스트 검증에 SAN 직접 비교 — 이 네 가지를 이번 달 PR에 넣으면 3월 이슈 전부를 커버합니다.

---

# (3) Java

3월 Java 쪽에서는 관리 경로 충돌, parser differential, reverse DNS fallback — 운영 편의를 위해 남겨둔 우회 경로가 공격 표면이 된 패턴이 반복됐습니다.  
Spring은 인프라 경로와 비즈니스 경로가 섞였고, Netty · ZooKeeper는 파서/DNS 해석 차이가 원인이었습니다.

**공통 교훈: 편의용 우회 경로는 신뢰 경계 밖으로 빼야 합니다.**

## (3.1) CVE 요약 표

| CVE | 영향 버전 | 공격 영향 (C/I/A) | 실제 악용 | 권장 조치 | 출처 |
|---|---|---|---|---|---|
| CVE-2026-22732 | `spring-security-web` <= 5.7.14 / 5.8.0~5.8.16 / 6.0.0~6.3.10 / 6.4.0~6.4.13 / 6.5.0~6.5.8 / 7.0.0~7.0.3 | C/I | 보고 없음 | `spring-security-web` 6.5.9 / 7.0.4 이상으로 업데이트. 응답에 보안 헤더 포함 여부 테스트 추가. | https://spring.io/security/cve-2026-22732 (2026-03-19) |
| CVE-2026-22731 | `spring-boot-starter-actuator` 3.4.0~3.4.14 / 3.5.0~3.5.11 / 4.0.0~4.0.3 | I | 보고 없음 | `spring-boot-starter-actuator` 3.5.12 / 4.0.4 이상으로 업데이트. 애플리케이션 경로를 Actuator 경로 하위에 배치하지 않음. | https://spring.io/security/cve-2026-22731 (2026-03-19) |
| CVE-2026-22733 | `spring-boot-starter-actuator` 2.7.0~2.7.31 / 3.3.0~3.3.17 / 3.4.0~3.4.14 / 3.5.0~3.5.11 / 4.0.0~4.0.3 | I | 보고 없음 | `spring-boot-starter-actuator` 3.5.12 / 4.0.4 이상으로 업데이트. CloudFoundry Actuator 경로와 애플리케이션 경로 분리. | https://spring.io/security/cve-2026-22733 (2026-03-19) |
| CVE-2026-33870 | `netty-codec-http` <= 4.1.131.Final / <= 4.2.10.Final | I | 보고 없음 | `netty-codec-http` 4.1.132.Final / 4.2.12.Final 이상으로 업데이트. 프록시-백엔드 파싱 일치 테스트 추가. | https://github.com/netty/netty/security/advisories/GHSA-pwqr-wmgm-9rr8 (2026-03-26) |
| CVE-2026-24281 | `zookeeper` >= 3.8.0, < 3.8.6 / >= 3.9.0, < 3.9.5 | C/I | 보고 없음 | `zookeeper` 3.8.6 / 3.9.5 이상으로 업데이트. reverse DNS fallback 의존 호스트 검증 제거. | https://github.com/advisories/GHSA-7xrh-hqfc-g7qr (2026-03-07) |

## (3.2) 항목별 상세 설명

### 빠른 영향 확인

```bash
# Maven 의존 트리에서 영향 패키지 확인
mvn -q -DskipTests dependency:tree \
  | grep -Ei "spring-security-web|spring-boot-starter-actuator|netty-codec-http|org.apache.zookeeper:zookeeper" \
  || true
```

영향 버전이 확인되면 패치 버전으로 즉시 업데이트합니다.

---

<a id="java-cve-2026-22732"></a>
### CVE-2026-22732: Spring Security 보안 헤더 미기록

**무엇이 문제인가**

Spring Security가 설정된 보안 헤더를 실제 응답에 포함시키지 않는 버그입니다. `Cache-Control`, `X-Frame-Options`, `X-Content-Type-Options` 등이 누락될 수 있습니다. 헤더를 설정했다고 해서 실제로 기록된다고 보장할 수 없습니다.

**패치 방법**: `spring-security-web` 6.5.9 / 7.0.4 이상으로 업데이트. 보안 헤더가 응답에 실제로 포함되는지 검증하는 테스트를 추가합니다.

```java
// ❌ 취약: 설정만 하고 응답에 실제로 들어가는지 확인하지 않음
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.headers(headers -> headers
        .frameOptions(frame -> frame.sameOrigin())
        .cacheControl(Customizer.withDefaults())
        .contentTypeOptions(Customizer.withDefaults())
    );
    // 헤더가 설정됐다고 응답에 포함되는 것은 아님 (CVE-2026-22732)
    return http.build();
}

// ✅ 안전: 설정 코드 + 응답 검증 테스트를 세트로 유지
// [보안 설정 — 변경 없음]
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.headers(headers -> headers
        .frameOptions(frame -> frame.sameOrigin())
        .cacheControl(Customizer.withDefaults())
        .contentTypeOptions(Customizer.withDefaults())
    );
    return http.build();
}

// [필수 추가] 응답 헤더 존재 여부를 테스트로 고정
@SpringBootTest
@AutoConfigureMockMvc
class SecurityHeadersTest {

    @Autowired MockMvc mockMvc;

    @Test
    void secureEndpoint_shouldIncludeAllSecurityHeaders() throws Exception {
        mockMvc.perform(get("/api/data"))
            // 브라우저 클릭재킹 방어
            .andExpect(header().string("X-Frame-Options", "SAMEORIGIN"))
            // 캐시 제어 (인증 정보 노출 방지)
            .andExpect(header().exists("Cache-Control"))
            // MIME 스니핑 방지
            .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }
}
```

[Source] https://spring.io/security/cve-2026-22732 (2026-03-19)

---

<a id="java-cve-2026-22731"></a>
### CVE-2026-22731: Spring Boot Actuator Health group 경로 인증 우회

**무엇이 문제인가**

Actuator Health group의 `additional-path`로 지정한 경로 하위에 비즈니스 엔드포인트가 있으면, Actuator의 접근 제어가 해당 엔드포인트에 잘못 적용되어 인증 없이 접근됩니다.

**패치 방법**: `spring-boot-starter-actuator` 3.5.12 / 4.0.4 이상으로 업데이트. 비즈니스 엔드포인트를 Actuator 경로 하위에서 빼냅니다.

```yaml
# ❌ 취약: /healthz 하위에 비즈니스 엔드포인트가 존재
# application.yaml
management:
  endpoint:
    health:
      group:
        liveness:
          additional-path: "server:/healthz"

# 비즈니스 컨트롤러가 /healthz/admin 에 매핑돼 있다면
# → Actuator의 permitAll() 정책이 /admin 에도 적용됨 (의도치 않은 인증 우회)
```

```java
// ✅ 안전: 인프라 경로와 비즈니스 경로 URI prefix부터 분리

// [application.yaml 수정]
// management.endpoint.health.group.liveness.additional-path=server:/infra/healthz
// 비즈니스 컨트롤러는 /api/** 또는 /admin/** 에 배치

// [검증 테스트]
@Test
void actuatorPath_shouldNotExposeBusinessEndpoints() throws Exception {
    // Actuator 경로(/actuator/**)에서 비즈니스 엔드포인트가 노출되지 않아야 함
    mockMvc.perform(get("/actuator/admin"))
        .andExpect(status().isNotFound());   // 404여야 함

    // 비즈니스 엔드포인트는 인증 필요
    mockMvc.perform(get("/api/admin"))
        .andExpect(status().isUnauthorized());  // 401이어야 함
}
```

[Source] https://spring.io/security/cve-2026-22731 (2026-03-19)

---

<a id="java-cve-2026-22733"></a>
### CVE-2026-22733: Spring Boot CloudFoundry Actuator 경로 인증 우회

**무엇이 문제인가**

CVE-2026-22731과 같은 패턴이지만 CloudFoundry Actuator 경로에서 발생합니다. CF 환경에서 `/cloudfoundryapplication` 하위에 비즈니스 엔드포인트가 있으면 인증이 우회됩니다.

**패치 방법**: `spring-boot-starter-actuator` 3.5.12 / 4.0.4 이상으로 업데이트. CloudFoundry 경로와 애플리케이션 경로를 완전히 분리합니다.

```java
// ❌ 취약: CF 환경에서 비즈니스 엔드포인트가 /cloudfoundryapplication 하위에 위치
// /cloudfoundryapplication/admin → 인증 우회 가능

// ✅ 안전: CF 경로를 명시적으로 차단하고 일반 보안 정책과 분리
@Bean
public SecurityFilterChain cfSecurityFilterChain(HttpSecurity http) throws Exception {
    http
        // CF Actuator 경로는 CF 내부 접근만 허용
        .securityMatcher("/cloudfoundryapplication/**")
        .authorizeHttpRequests(auth -> auth
            .anyRequest().hasRole("CF_INTERNAL")
        );
    return http.build();
}

// [검증 테스트]
@Test
void cfActuatorPath_shouldRejectExternalAccess() throws Exception {
    mockMvc.perform(get("/cloudfoundryapplication/admin"))
        .andExpect(status().isForbidden());  // 일반 사용자는 접근 불가
}
```

[Source] https://spring.io/security/cve-2026-22733 (2026-03-19)

---

<a id="java-cve-2026-33870"></a>
### CVE-2026-33870: Netty HTTP Request Smuggling

**무엇이 문제인가**

chunked transfer encoding의 extension 값에서 quoted-string 안에 CR/LF가 들어가면, 프록시와 Netty 백엔드가 요청 경계를 다르게 해석합니다. 이 불일치를 이용해 밀수 요청(smuggled request)을 끼워 넣을 수 있습니다.

**패치 방법**: `netty-codec-http` 4.1.132.Final / 4.2.12.Final 이상으로 업데이트. 프록시-백엔드 파싱 일치 테스트를 추가합니다.

```java
// ❌ 취약: HttpServerCodec 단독 사용, 파싱 일치 검증 없음
pipeline.addLast(new HttpServerCodec());
pipeline.addLast(new HttpObjectAggregator(65536));
pipeline.addLast(new MyBusinessHandler());
// → 프록시가 다르게 파싱한 요청이 MyBusinessHandler에 도달할 수 있음

// ✅ 안전: 패치 버전 사용 + 통합 테스트로 파싱 일치 확인
pipeline.addLast(new HttpServerCodec());
pipeline.addLast(new HttpObjectAggregator(65536));
pipeline.addLast(new MyBusinessHandler());

// [필수 추가] 프록시-백엔드 파싱 일치 통합 테스트
@Test
void chunkedExtensionWithCRLF_shouldBeRejectedByBackend() {
    // CR/LF가 포함된 chunked extension을 가진 요청 구성
    String smuggledRequest =
        "POST /api/transfer HTTP/1.1\r\n" +
        "Host: backend\r\n" +
        "Transfer-Encoding: chunked\r\n\r\n" +
        "5;ext=\"foo\r\nGET /admin HTTP/1.1\r\nHost: backend\r\n\r\n\"\r\n" +
        "hello\r\n0\r\n\r\n";

    // 정상 처리되면 smuggling 가능 → 테스트 실패여야 함
    assertThat(sendToBackend(smuggledRequest).statusCode())
        .isEqualTo(400);  // 잘못된 요청으로 거부해야 함
}
```

[Source] https://github.com/netty/netty/security/advisories/GHSA-pwqr-wmgm-9rr8 (2026-03-26)

---

<a id="java-cve-2026-24281"></a>
### CVE-2026-24281: ZooKeeper 호스트 검증 우회

**무엇이 문제인가**

TLS 호스트 검증 시 `InetAddress.getCanonicalHostName()`을 통한 reverse DNS 조회를 사용하면, 공격자가 PTR 레코드를 조작해 검증을 우회할 수 있습니다. reverse DNS는 신뢰할 수 있는 검증 수단이 아닙니다.

**패치 방법**: `zookeeper` 3.8.6 / 3.9.5 이상으로 업데이트. 호스트 검증을 TLS 인증서의 SAN(Subject Alternative Name) / CN 직접 비교로 고정합니다.

```java
// ❌ 취약: reverse DNS 결과로 호스트 검증 — PTR 레코드 조작으로 우회 가능
public boolean verifyHostname(InetAddress address, X509Certificate cert) {
    // getCanonicalHostName()은 reverse DNS 조회를 수행함
    // 공격자가 PTR 레코드를 'trusted.internal.corp'로 조작하면 통과됨
    String resolvedHost = address.getCanonicalHostName();
    return verifyAgainstCert(resolvedHost, cert);
}

// ✅ 안전: 연결 대상 호스트명을 인증서 SAN/CN과 직접 비교
public boolean verifyHostname(String requestedHost, X509Certificate cert) {
    // reverse DNS 조회 없이, 사용자가 요청한 호스트명을 그대로 사용
    // → PTR 레코드 조작 공격 원천 차단

    // 1단계: SAN에서 dNSName 목록 추출
    Collection<List<?>> sans = cert.getSubjectAlternativeNames();
    if (sans != null) {
        for (List<?> san : sans) {
            Integer type = (Integer) san.get(0);
            if (type == 2) {  // dNSName
                String dnsName = (String) san.get(1);
                if (hostnameMatches(requestedHost, dnsName)) return true;
            }
        }
    }

    // 2단계: SAN이 없는 경우 CN으로 폴백 (레거시 호환)
    String cn = extractCN(cert.getSubjectX500Principal().getName());
    if (cn != null && hostnameMatches(requestedHost, cn)) return true;

    throw new SSLException(
        "Hostname verification failed: '" + requestedHost + "' not in cert SAN/CN"
    );
}

private boolean hostnameMatches(String hostname, String pattern) {
    // 와일드카드 매칭 지원 (*.example.com 형태)
    if (pattern.startsWith("*.")) {
        String domain = pattern.substring(2);
        return hostname.endsWith("." + domain) &&
               hostname.indexOf('.') == hostname.lastIndexOf("." + domain) - hostname.length() + domain.length() + 1;
    }
    return hostname.equalsIgnoreCase(pattern);
}

// [검증 테스트]
@Test
void reverseDnsManipulation_shouldNotBypassHostVerification() {
    // PTR 레코드가 trusted.corp를 가리켜도, SAN에 없으면 거부
    X509Certificate cert = loadCert("attacker.example.com");
    assertThrows(SSLException.class,
        () -> verifyHostname("trusted.corp", cert));
}
```

[Source] https://lists.apache.org/thread/088ddsbrzhd5lxzbqf5n24yg0mwh9jt2 (2026-03-07)

---


---

# (4) 개발자 체크리스트

<!--CARD
{"id":"lesson-1","kind":"insight","domain":"insight","header":"이번 달 교훈","title":"① 암묵적 경로를 신뢰한다","bodyMd":"Handlebars는 partial 이름을 prototype chain에서 찾고, Picomatch는 glob 결과를 권한 판단에 그대로 씁니다. node-forge는 malformed 입력을 사전 차단 없이 검증 함수에 넘깁니다.\n\n**공통점:** \"라이브러리가 알아서 걸러줄 것\"이라는 기대가 공격 경로를 만듭니다.\n\n**원칙:** 이름 조회에 `hasOwn`, glob에 정규화 경로 교차 검증, 서명에 형식 사전 검사를 기본값으로 적용하세요.","actionMd":"obj[name] 대신 Object.hasOwn(obj, name) 검사를 추가합니다.","source":"https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-2qvq-rjwj-gvw9"}
-->
<!--CARD
{"id":"lesson-2","kind":"insight","domain":"insight","header":"이번 달 교훈","title":"② 관리 경로와 비즈니스 경로가 섞여 있다","bodyMd":"Spring Boot Actuator의 health group 경로 아래에 비즈니스 엔드포인트가 배치되면, Actuator의 permitAll() 정책이 그대로 적용됩니다.\n\n**공통점:** 관리 인프라와 애플리케이션이 URI prefix를 공유하면 접근 제어가 의도치 않게 상속됩니다.\n\n**원칙:** management.endpoints.web.base-path를 /internal/mgmt 등 전용 prefix로 분리하고, 비즈니스 경로는 /api/** 에만 배치하세요.","actionMd":"Actuator 경로 아래 비즈니스 엔드포인트를 즉시 제거합니다.","source":"https://spring.io/security/cve-2026-22731"}
-->
<!--CARD
{"id":"lesson-3","kind":"insight","domain":"insight","header":"이번 달 교훈","title":"③ 프록시와 백엔드가 같은 규칙을 보지 않는다","bodyMd":"Netty는 chunked extension의 quoted string을 다르게 파싱해 요청 경계가 어긋납니다. ZooKeeper는 reverse DNS 결과를 호스트 검증에 사용해 인증서 SAN과 불일치합니다.\n\n**공통점:** 두 컴포넌트가 같은 입력을 다른 규칙으로 해석하면 경계가 무너집니다. WAFFLED 연구의 1,207개 우회 사례도 같은 뿌리입니다.\n\n**원칙:** 보안 업데이트에 프록시-백엔드 파서 일치 테스트를 묶고, 호스트 검증은 SAN 직접 비교로 전환하세요.","actionMd":"프록시-백엔드 요청 경계 일치 테스트를 CI에 추가합니다.","source":"https://github.com/netty/netty/security/advisories/GHSA-pwqr-wmgm-9rr8"}
-->
<!--CARD
{"id":"tools-1","kind":"insight","domain":"common","header":"셀프 체크","title":"개발자 셀프 체크 가이드 & 툴","bodyMd":"1. **보안 감사 자동화** — oh-my-secuaudit\nSAST·SCA·DAST·아키텍처 리뷰 통합 스킬\n\n2. **WAF 탐지 검증** — waf-ips-ids-retest\nTC-24 smuggling 프로브 포함 재테스트\n\n3. **의존성 점검** — npm audit · mvn dependency-check\n\n4. **내구제·명의도용 실태** — BJC저널 / 일요시사\n통신분쟁 역대 최대, 미해결률 39.8%\n\n5. **유출 영향 확인** — M-safer 가입제한\n2년 만에 16배 급증 (서울경제)","actionMd":"위 도구들을 CI/CD와 개인 점검에 활용하세요.","source":"https://github.com/windshock/oh-my-secuaudit"}
-->

1. `npm ls handlebars node-forge picomatch --depth=3`로 영향 버전을 먼저 확인합니다. [Source] https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-2qvq-rjwj-gvw9 (2026-03-26)
2. `handlebars`를 4.7.9 이상으로 업데이트하고, partial 이름 조회에 `Object.hasOwn()` 검사를 추가합니다. [Source] https://github.com/advisories/GHSA-2qvq-rjwj-gvw9 (2026-03-26)
3. `node-forge`를 1.4.0 이상으로 업데이트하고, 인증서 체인 검증 테스트를 다시 실행합니다. [Source] https://github.com/digitalbazaar/forge/security/advisories/GHSA-2328-f5f3-gj25 (2026-03-26)
4. 서명 검증 로직이 malformed RSA-PKCS 및 Ed25519 입력을 거부하는지 회귀 테스트를 추가합니다. [Source] https://github.com/digitalbazaar/forge/security/advisories/GHSA-q67f-28xg-22rw (2026-03-26)
5. `picomatch`를 4.0.4 / 3.0.2 / 2.3.2 이상으로 업데이트하고, glob 결과를 권한 판단의 단일 근거로 사용하지 않습니다. [Source] https://github.com/micromatch/picomatch/security/advisories/GHSA-3v7f-55p6-f55p (2026-03-25)
6. `mvn -q -DskipTests dependency:tree | grep -Ei "spring-security-web|spring-boot-starter-actuator|netty-codec-http|org.apache.zookeeper:zookeeper" || true`로 영향 버전을 확인합니다. [Source] https://spring.io/security/cve-2026-22732 (2026-03-19)
7. `spring-security-web`을 6.5.9 / 7.0.4 이상으로 업데이트하고, 응답에 보안 헤더가 실제로 포함되는지 테스트를 추가합니다. [Source] https://spring.io/security/cve-2026-22732 (2026-03-19)
8. `spring-boot-starter-actuator`를 3.5.12 / 4.0.4 이상으로 업데이트하고, 애플리케이션 엔드포인트를 Actuator 경로 하위에서 제거합니다. [Source] https://spring.io/security/cve-2026-22731 (2026-03-19)
9. `netty-codec-http`를 4.1.132.Final / 4.2.12.Final 이상으로 업데이트하고, 프록시-백엔드 파서 일치 테스트를 추가합니다. [Source] https://github.com/netty/netty/security/advisories/GHSA-pwqr-wmgm-9rr8 (2026-03-26)
10. `zookeeper`를 3.8.6 / 3.9.5 이상으로 업데이트하고, reverse DNS에 의존하는 호스트 검증 구성을 제거합니다. [Source] https://lists.apache.org/thread/088ddsbrzhd5lxzbqf5n24yg0mwh9jt2 (2026-03-07)

---


---

# (5) 참고자료

- https://www.wiz.io/blog/trivy-compromised-teampcp-supply-chain-attack
- https://www.crowdstrike.com/en-us/blog/from-scanner-to-stealer-inside-the-trivy-action-supply-chain-compromise/
- https://www.microsoft.com/en-us/security/blog/2026/03/24/detecting-investigating-defending-against-trivy-supply-chain-compromise/
- https://windshock.github.io/ko/post/2026-03-13-waf-ips-ids-detection-gap-analysis/
- https://github.com/windshock/waf-ips-ids-retest
- https://w4ke.info/2025/06/18/funky-chunks.html
- https://xclow3n.github.io/post/6/
- https://blog.cloudflare.com/resolving-a-request-smuggling-vulnerability-in-pingora/
- https://github.com/netty/netty/security/advisories/GHSA-pwqr-wmgm-9rr8
- https://mailman.nginx.org/pipermail/nginx-devel/2024-January/5CQQCHFYQMXTBAK7H2FITLVQQS5ECFFM.html
- https://windshock.github.io/ko/post/2026-03-30-captcha-bypass-poc-defense-strategy/
- https://journal.kbjc.net/news/articleView.html?idxno=20638
- https://www.ilyosisa.co.kr/news/article.html?no=254600
- https://v.daum.net/v/20251202154625602
- https://spring.io/security/cve-2026-22731
- https://spring.io/security/cve-2026-22732
- https://spring.io/security/cve-2026-22733
- https://github.com/digitalbazaar/forge/security/advisories/GHSA-2328-f5f3-gj25
- https://lists.apache.org/thread/088ddsbrzhd5lxzbqf5n24yg0mwh9jt2
- https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-2qvq-rjwj-gvw9
- https://github.com/micromatch/picomatch/security/advisories/GHSA-3v7f-55p6-f55p
- https://spring.io/security/cve-2026-22731"}
- https://github.com/digitalbazaar/forge/security/advisories/GHSA-ppp5-5v6c-4jwp
- https://github.com/digitalbazaar/forge/security/advisories/GHSA-q67f-28xg-22rw
- https://github.com/advisories/GHSA-7xrh-hqfc-g7qr
- https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-2qvq-rjwj-gvw9"}
- https://github.com/netty/netty/security/advisories/GHSA-pwqr-wmgm-9rr8"}
- https://github.com/windshock/oh-my-secuaudit"}
- https://github.com/advisories/GHSA-2qvq-rjwj-gvw9
