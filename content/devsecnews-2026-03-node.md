# DevSecNews 2026-03 — Node.js 보안 요약(개발자용)

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

   Actuator 경로와 애플리케이션 경로가 겹치면서 인증 우회와 보안 헤더 누락이 동시에 발생합니다. 관리 경로 하위에 비즈니스 엔드포인트를 배치한 경우 두 문제가 한꺼번에 열립니다.  
   [Source] https://spring.io/security/cve-2026-22731 (2026-03-19) · https://spring.io/security/cve-2026-22732 (2026-03-19) · https://spring.io/security/cve-2026-22733 (2026-03-19)

2. **node-forge 검증 실패 3종 세트 (CVE-2026-33896 / 33894 / 33895)**  
   `basicConstraints` 우회, RSA-PKCS 서명 위조, Ed25519 서명 위조가 같은 날 공개됐습니다. PKI 검증은 보안의 마지막 보루입니다—하나만 뚫려도 신뢰 체계 전체가 무너집니다.  
   [Source] https://github.com/digitalbazaar/forge/security/advisories/GHSA-2328-f5f3-gj25 (2026-03-26)

   Netty는 chunked extension 파싱 불일치로 request smuggling이, ZooKeeper는 reverse DNS 의존 호스트 검증에서 우회가 발생했습니다. 프록시와 백엔드가 요청 경계를 다르게 해석하는 순간 네트워크 방어는 의미를 잃습니다.  
   [Source] https://github.com/netty/netty/security/advisories/GHSA-pwqr-wmgm-9rr8 (2026-03-26) · https://lists.apache.org/thread/088ddsbrzhd5lxzbqf5n24yg0mwh9jt2 (2026-03-07)

4. **Handlebars implicit lookup XSS (CVE-2026-33916)**  
   prototype이 오염된 상태에서 partial 이름을 프로퍼티 직접 조회로 찾아 XSS로 이어집니다. 템플릿 엔진이 "이름을 알아서 찾아주는" 편의 기능이 곧 공격 경로가 됩니다.  
   [Source] https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-2qvq-rjwj-gvw9 (2026-03-26)

5. **Picomatch glob 경계 왜곡 (CVE-2026-33672)**  
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

# (3) Node.js

3월 Node.js 쪽에서는 "라이브러리가 알아서 찾아주겠지"라는 암묵적 가정이 연달아 깨졌습니다.  
Handlebars는 implicit lookup, node-forge는 검증 로직의 예외 처리 부재, Picomatch는 glob 파싱 차이가 각각의 원인이었습니다.

**공통 교훈: 편의 기능을 보안 경계 대신 쓰면 반드시 뚫립니다.**

## (2.1) CVE 요약 표

| CVE | 영향 버전 | 공격 영향 (C/I/A) | 실제 악용 | 권장 조치 | 출처 |
|---|---|---|---|---|---|
| CVE-2026-33916 | `handlebars` >= 4.0.0, < 4.7.9 | I | 보고 없음 | `handlebars` 4.7.9 이상으로 업데이트. partial 이름 조회 시 prototype 체인 차단. | https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-2qvq-rjwj-gvw9 (2026-03-26) |
| CVE-2026-33896 | `node-forge` <= 1.3.3 | C/I | 보고 없음 | `node-forge` 1.4.0 이상으로 업데이트. certificate chain 검증 테스트 재실행. | https://github.com/digitalbazaar/forge/security/advisories/GHSA-2328-f5f3-gj25 (2026-03-26) |
| CVE-2026-33894 | `node-forge` < 1.4.0 | I | 보고 없음 | `node-forge` 1.4.0 이상으로 업데이트. RSA-PKCS 서명 검증 회귀 테스트 추가. | https://github.com/digitalbazaar/forge/security/advisories/GHSA-ppp5-5v6c-4jwp (2026-03-26) |
| CVE-2026-33895 | `node-forge` < 1.4.0 | I | 보고 없음 | `node-forge` 1.4.0 이상으로 업데이트. Ed25519 경계값 서명 테스트 추가. | https://github.com/digitalbazaar/forge/security/advisories/GHSA-q67f-28xg-22rw (2026-03-26) |
| CVE-2026-33672 | `picomatch` >= 4.0.0, < 4.0.4 / >= 3.0.0, < 3.0.2 / < 2.3.2 | I | 보고 없음 | `picomatch` 4.0.4/3.0.2/2.3.2 이상으로 업데이트. glob 단독으로 권한 판단하지 않음. | https://github.com/micromatch/picomatch/security/advisories/GHSA-3v7f-55p6-f55p (2026-03-25) |

## (2.2) 항목별 상세 설명

### 빠른 영향 확인

```bash
# 의존 트리에서 영향 패키지 확인
npm ls handlebars node-forge picomatch --depth=3

# 개발 의존성 제외 보안 감사
npm audit --omit=dev
```

영향 버전이 확인되면 즉시 패치 버전으로 올립니다.

---

<a id="node-cve-2026-33916"></a>
### CVE-2026-33916: Handlebars partial lookup 기반 XSS

**무엇이 문제인가**

`options.partials[name]`처럼 대괄호로 프로퍼티를 직접 조회하면, 공격자가 `Object.prototype`에 심어둔 문자열이 partial 본문으로 흘러 들어갑니다. prototype pollution이 XSS와 결합한 패턴입니다.

**패치 방법**: `handlebars` 4.7.9 이상으로 업데이트. partial 이름은 반드시 `hasOwn` 검사를 통과한 경우에만 사용합니다.

```js
// ❌ 취약: 프로토타입 체인까지 탐색
function renderPartial(name, context, options) {
  const partial = options.partials[name]  // __proto__ 오염 값이 들어올 수 있음
  if (partial) return partial(context)
}

// ✅ 안전: own property만 허용
function renderPartial(name, context, options) {
  const partials = options.partials || {}

  // prototype 체인에서 올라온 값은 거부
  if (!Object.hasOwn(partials, name)) {
    throw new Error(`Unknown partial: "${name}"`)
  }

  const fn = partials[name]

  // 추가 방어: partial 본문이 함수 타입인지 확인
  if (typeof fn !== 'function') {
    throw new TypeError(`Partial "${name}" must be a function`)
  }

  return fn(context)
}
```

[Source] https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-2qvq-rjwj-gvw9 (2026-03-26)

---

<a id="node-cve-2026-33896"></a>
### CVE-2026-33896: node-forge `basicConstraints` 검증 우회

**무엇이 문제인가**

`basicConstraints` 검사가 느슨하면, CA 인증서 자격이 없는 인증서가 정상 체인에 끼어들 수 있습니다. 공격자가 발급한 가짜 인증서가 신뢰된 것처럼 통과됩니다.

**패치 방법**: `node-forge` 1.4.0 이상으로 업데이트. PKI 체인 검증 테스트를 다시 실행합니다.

```js
// ❌ 취약: 체인 검증 결과만 확인, 제약 조건 검사 없음
function verifyCertificate(cert, caStore) {
  const chain = forge.pki.verifyCertificateChain(caStore, [cert])
  return chain === true
}

// ✅ 안전: 체인 검증 + 제약 조건 명시적 확인
function verifyCertificate(cert, caStore) {
  // 1단계: 체인 자체 검증
  const chain = forge.pki.verifyCertificateChain(caStore, [cert])
  if (chain !== true) throw new Error('Certificate chain verification failed')

  // 2단계: basicConstraints 명시적 검사
  //        isCA=true인 인증서가 중간에 끼어 있는지 확인
  const bc = cert.getExtension('basicConstraints')
  if (!bc) throw new Error('Missing basicConstraints extension')
  if (bc.cA === true) throw new Error('Leaf cert must not have cA=true')

  // 3단계: keyUsage가 서명 용도와 일치하는지 확인
  const ku = cert.getExtension('keyUsage')
  if (!ku || !ku.digitalSignature) throw new Error('keyUsage mismatch')

  return true
}

// 회귀 테스트 예시
describe('certificate chain', () => {
  it('should reject cert with cA=true in basicConstraints', () => {
    expect(() => verifyCertificate(fakeCaCert, caStore)).toThrow()
  })
})
```

[Source] https://github.com/digitalbazaar/forge/security/advisories/GHSA-2328-f5f3-gj25 (2026-03-26)

---

<a id="node-cve-2026-33894"></a>
### CVE-2026-33894: node-forge RSA-PKCS 서명 위조

**무엇이 문제인가**

ASN.1 구조에 extra field가 붙은 malformed 서명을 정상으로 통과시키는 버그입니다. 서명 위조로 무결성 보증이 깨집니다.

**패치 방법**: `node-forge` 1.4.0 이상으로 업데이트. 검증 전 canonical encoding 확인 게이트를 추가합니다.

```js
// ❌ 취약: forge 내부 검증에만 의존, malformed 입력 사전 차단 없음
function verifySignature(publicKey, digest, signature) {
  return publicKey.verify(digest, signature)
}

// ✅ 안전: canonical 인코딩 확인 후 forge 검증 수행
function verifySignature(publicKey, digest, signature) {
  // 1단계: 서명 바이트가 canonical DER 인코딩인지 확인
  //        extra field가 붙은 구조를 사전에 차단
  if (!isCanonicalDerSignature(signature)) {
    throw new Error('Non-canonical signature encoding rejected')
  }

  // 2단계: 서명 길이가 키 크기와 일치하는지 확인
  const expectedLen = publicKey.n.bitLength() / 8
  if (signature.length !== expectedLen) {
    throw new Error(`Signature length mismatch: expected ${expectedLen}`)
  }

  // 3단계: forge로 실제 검증
  const valid = publicKey.verify(digest, signature)
  if (!valid) throw new Error('Signature verification failed')

  return true
}

function isCanonicalDerSignature(sig) {
  // DER 시퀀스 헤더(0x30) 확인
  if (sig[0] !== 0x30) return false
  // 선언된 길이와 실제 바이트 수가 일치해야 함 (trailing bytes 거부)
  const declaredLen = sig[1]
  return sig.length === declaredLen + 2
}

// 회귀 테스트 예시
describe('RSA-PKCS signature', () => {
  it('should reject signature with trailing bytes', () => {
    const malformed = Buffer.concat([validSignature, Buffer.from([0x00])])
    expect(() => verifySignature(pubKey, digest, malformed)).toThrow()
  })
})
```

[Source] https://github.com/digitalbazaar/forge/security/advisories/GHSA-ppp5-5v6c-4jwp (2026-03-26)

---

<a id="node-cve-2026-33895"></a>
### CVE-2026-33895: node-forge Ed25519 서명 위조

**무엇이 문제인가**

Ed25519 검증에서 `S < L` 조건 검사가 누락되어, 스칼라 값이 그룹 위수(L)를 초과한 위조 서명이 통과됩니다. 이는 표준 RFC 8032가 명시하는 필수 검사입니다.

**패치 방법**: `node-forge` 1.4.0 이상으로 업데이트. 경계값(S = L - 1, S = L, S = L + 1)을 포함한 테스트를 추가합니다.

```js
// ❌ 취약: S < L 범위 검사 없이 검증 통과
function verifyEd25519(publicKey, message, signature) {
  return ed25519.verify({ publicKey, message, signature })
}

// ✅ 안전: RFC 8032 준수 - S < L 조건 포함한 명시적 검증
// Ed25519 그룹 위수 L (little-endian 32 bytes)
const ED25519_L = Buffer.from(
  'edd3f55c1a631258d69cf7a2def9de1400000000000000000000000000000010',
  'hex'
)

function isScalarInRange(sigBytes) {
  // signature의 상위 32바이트가 S 값 (little-endian)
  const S = sigBytes.slice(32, 64)
  // little-endian 비교: S < L 여부 확인
  for (let i = 31; i >= 0; i--) {
    if (S[i] < ED25519_L[i]) return true
    if (S[i] > ED25519_L[i]) return false
  }
  return false  // S === L도 거부 (S < L이어야 함)
}

function verifyEd25519(publicKey, message, signature) {
  // 1단계: 서명 길이 확인 (R || S = 64 bytes)
  if (signature.length !== 64) {
    throw new Error('Ed25519 signature must be 64 bytes')
  }

  // 2단계: RFC 8032 §5.1.7 — S < L 강제
  if (!isScalarInRange(signature)) {
    throw new Error('Ed25519 scalar S out of range (must be S < L)')
  }

  // 3단계: 실제 서명 검증
  const valid = ed25519.verify({ publicKey, message, signature })
  if (!valid) throw new Error('Ed25519 signature verification failed')

  return true
}

// 회귀 테스트 예시
describe('Ed25519 signature', () => {
  it('should reject S >= L (boundary: S = L)', () => {
    const sig = Buffer.alloc(64)
    ED25519_L.copy(sig, 32)  // S = L
    expect(() => verifyEd25519(pubKey, msg, sig)).toThrow('out of range')
  })

  it('should reject S > L', () => {
    const sig = Buffer.alloc(64)
    ED25519_L.copy(sig, 32)
    sig[32]++  // S = L + 1
    expect(() => verifyEd25519(pubKey, msg, sig)).toThrow('out of range')
  })
})
```

[Source] https://github.com/digitalbazaar/forge/security/advisories/GHSA-q67f-28xg-22rw (2026-03-26)

---

<a id="node-cve-2026-33672"></a>
### CVE-2026-33672: Picomatch glob 매칭 왜곡

**무엇이 문제인가**

POSIX 문자 클래스(`[:alpha:]` 등) 처리에 오류가 있어, 경로 allowlist가 의도와 다르게 매칭됩니다. glob 결과를 권한 판단에 단독으로 사용하면 edge case 하나로 범위가 늘어납니다.

**패치 방법**: `picomatch` 4.0.4 / 3.0.2 / 2.3.2 이상으로 업데이트. glob 매칭 결과는 정규화된 경로 검사와 반드시 함께 씁니다.

```js
const path = require('path')
const { isMatch } = require('picomatch')

const ROOT = '/var/app/uploads'
const ALLOWED_PATTERN = '/var/app/uploads/**/*.{jpg,png,pdf}'

// ❌ 취약: glob 단독으로 파일 접근 허용 여부 결정
function canAccessFile_UNSAFE(userInput) {
  return isMatch(userInput, ALLOWED_PATTERN)
  // POSIX 클래스 버그로 '../../../etc/passwd' 같은 경로가 통과될 수 있음
}

// ✅ 안전: 경로 정규화 → 경계 검사 → glob 순서로 적용
function canAccessFile(userInput) {
  // 1단계: 경로 정규화 (../ traversal, 심볼릭 링크 제거)
  const resolved = path.resolve(ROOT, userInput)

  // 2단계: 반드시 ROOT 하위에 있는지 확인 (path traversal 방지)
  //        path.sep 포함으로 '/var/app/uploads_evil' 같은 경로도 차단
  if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) {
    throw new Error(`Path traversal detected: "${userInput}"`)
  }

  // 3단계: 정규화된 경로로 glob 매칭 (2차 필터)
  if (!isMatch(resolved, ALLOWED_PATTERN)) {
    throw new Error(`File type not allowed: "${resolved}"`)
  }

  return resolved  // 검증된 절대 경로 반환
}

// 회귀 테스트 예시
describe('file access control', () => {
  it('should block path traversal', () => {
    expect(() => canAccessFile('../../etc/passwd')).toThrow('Path traversal')
  })

  it('should block disallowed extensions', () => {
    expect(() => canAccessFile('report.sh')).toThrow('not allowed')
  })

  it('should allow valid uploads', () => {
    expect(canAccessFile('photo.jpg')).toBe(`${ROOT}/photo.jpg`)
  })
})
```

[Source] https://github.com/micromatch/picomatch/security/advisories/GHSA-3v7f-55p6-f55p (2026-03-25)

---


---

# (4) 참고자료

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
