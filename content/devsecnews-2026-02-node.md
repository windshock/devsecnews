# DevSecNews 2026-02 — Node.js/Java 보안 요약(개발자용)

# (1) Summary

- React Router 서버 렌더링에서 `X-Forwarded-Host`를 그대로 신뢰하면 Open Redirect가 발생할 수 있습니다. 라우터가 신뢰할 프록시 헤더를 고정하고 업그레이드 버전으로 올려야 합니다. [Source] https://github.com/advisories/GHSA-mr7w-8v4g-9q7q (2026-02-13)
- bignumber.js는 `BigNumber(str, base)`에서 base가 숫자가 아니면 10진수로 처리되어 검증 우회가 가능합니다. base 타입을 강제하고 패치 버전으로 올려야 합니다. [Source] https://github.com/advisories/GHSA-m9xg-gcvf-6qx6 (2026-02-12)
- Swiper는 `params`에 untrusted 객체를 병합할 때 Prototype Pollution이 가능합니다. 사용자 입력 객체를 직접 병합하지 말고 11.2.10/12.0.2 이상으로 올려야 합니다. [Source] https://github.com/advisories/GHSA-7j5v-47cv-26x5 (2026-02-19)
- Apache Tomcat CGI 경로에서 환경변수 처리 경계가 무너지면 원격 코드 실행으로 이어질 수 있습니다. Tomcat을 패치 버전으로 올리고 CGI 사용 범위를 줄여야 합니다. [Source] https://github.com/advisories/GHSA-85h6-5m3v-gx37 (2026-02-13)
- Apache MINA Core는 세션 ID 생성에 예측 가능한 난수가 사용될 수 있습니다. `org.apache.mina:mina-core`를 2.2.4 이상으로 올려야 합니다. [Source] https://github.com/advisories/GHSA-q672-hfc7-g833 (2026-02-10)
- Jetty 경로 매핑에서 Full Path Disclosure가 발생할 수 있습니다. Jetty 9.4.58/10.0.24/11.0.24/12.0.24 이상으로 업데이트해야 합니다. [Source] https://github.com/advisories/GHSA-gv3v-2cpp-3pmq (2026-02-10)
- 이번 달 공통 포인트는 “신뢰 경계(헤더/옵션 객체/경로/난수) 타입과 출처를 코드에서 고정하지 않으면 취약점으로 직결된다”는 점입니다. 입력 정규화와 버전 업데이트를 동시에 적용해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2026-27153 (날짜 미표기)

<!--CARD
{"id":"summary-1","kind":"summary","header":"요약","title":"React Router Open Redirect","bodyMd":"프록시 헤더를 그대로 신뢰하면 Open Redirect가 발생할 수 있습니다.","whyMd":"SSR/프록시 구성에서 Host 신뢰 경계가 쉽게 무너집니다.","impactMd":"피싱 리다이렉트와 세션 탈취 유도가 가능해집니다.","actionMd":"업그레이드하고 신뢰 프록시 헤더를 고정합니다.","source":"https://github.com/advisories/GHSA-mr7w-8v4g-9q7q "}
-->
<!--CARD
{"id":"summary-2","kind":"summary","header":"요약","title":"bignumber.js base 검증 우회","bodyMd":"base 파라미터 타입이 숫자가 아니면 검증 우회가 가능합니다.","whyMd":"입력 검증 로직이 타입 변환에 의존하면 우회됩니다.","impactMd":"금액/한도 검증 우회로 이어질 수 있습니다.","actionMd":"base 타입을 강제하고 패치 버전으로 업데이트합니다.","source":"https://github.com/advisories/GHSA-m9xg-gcvf-6qx6 "}
-->
<!--CARD
{"id":"summary-3","kind":"summary","header":"요약","title":"Swiper Prototype Pollution","bodyMd":"untrusted 객체 병합 시 프로토타입 오염이 가능합니다.","whyMd":"옵션 merge 경로는 오염 전파 지점이 됩니다.","impactMd":"권한 우회 또는 예기치 않은 코드 흐름으로 이어집니다.","actionMd":"사용자 객체 직접 merge를 중지하고 업데이트합니다.","source":"https://github.com/advisories/GHSA-7j5v-47cv-26x5 "}
-->
<!--CARD
{"id":"summary-4","kind":"summary","header":"요약","title":"Tomcat CGI RCE 경계","bodyMd":"CGI 경로의 환경변수 처리 문제로 RCE 가능성이 있습니다.","whyMd":"경로/환경변수 경계가 실행 경계와 맞닿아 있습니다.","impactMd":"원격 명령 실행으로 확장될 수 있습니다.","actionMd":"Tomcat 패치와 CGI 노출 축소를 동시에 적용합니다.","source":"https://github.com/advisories/GHSA-85h6-5m3v-gx37 "}
-->
<!--CARD
{"id":"summary-5","kind":"summary","header":"요약","title":"MINA Core 예측 가능한 난수","bodyMd":"세션 ID 생성에 약한 난수가 사용될 수 있습니다.","whyMd":"세션 토큰 예측 가능성이 생깁니다.","impactMd":"세션 하이재킹 위험이 증가합니다.","actionMd":"2.2.4 이상으로 업데이트합니다.","source":"https://github.com/advisories/GHSA-q672-hfc7-g833 "}
-->
<!--CARD
{"id":"summary-6","kind":"summary","header":"요약","title":"Jetty Full Path Disclosure","bodyMd":"경로 매핑 오류 응답에서 내부 경로가 노출될 수 있습니다.","whyMd":"경로 정보는 후속 공격의 정찰 데이터가 됩니다.","impactMd":"민감 경로 노출과 추가 탐색으로 이어집니다.","actionMd":"Jetty 패치 버전으로 업데이트합니다.","source":"https://github.com/advisories/GHSA-gv3v-2cpp-3pmq "}
-->

# (5) 이번 달 개발자 체크리스트

1. `react-router`를 7.2.0 이상(6.x는 6.30.1 이상)으로 업데이트해야 합니다. [Source] https://github.com/advisories/GHSA-mr7w-8v4g-9q7q (2026-02-13)
2. SSR/프록시 구성에서 `X-Forwarded-Host` 신뢰 대상을 고정하고 임의 Host를 차단해야 합니다. [Source] https://reactrouter.com/security/advisories/GHSA-mr7w-8v4g-9q7q (2026-02-13)
3. `bignumber.js`를 9.3.1 이상으로 업데이트해야 합니다. [Source] https://github.com/advisories/GHSA-m9xg-gcvf-6qx6 (2026-02-12)
4. 숫자 파싱 함수에 전달하는 base는 `2~36` 정수 타입으로 강제해야 합니다. [Source] https://github.com/MikeMcl/bignumber.js/issues/316 (2026-02-12)
5. `swiper`를 11.2.10 또는 12.0.2 이상으로 업데이트해야 합니다. [Source] https://github.com/advisories/GHSA-7j5v-47cv-26x5 (2026-02-19)
6. 옵션 객체 merge 전에 `__proto__`, `constructor`, `prototype` 키를 제거해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2026-27212 (날짜 미표기)
7. Tomcat은 9.0.99/10.1.35/11.0.3 이상으로 업데이트하고 불필요한 CGI 매핑을 제거해야 합니다. [Source] https://tomcat.apache.org/security-11.html (2026-02-13)
8. `org.apache.mina:mina-core`를 2.2.4 이상으로 업데이트해야 합니다. [Source] https://lists.apache.org/thread/0f655hcyxvkom55k0qlzwf5w5f8f0w5k (2026-02-10)
9. 세션/토큰 생성은 `SecureRandom` 기반 생성기로 통일해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2026-25182 (날짜 미표기)
10. Jetty 9/10/11/12 라인을 각각 9.4.58/10.0.24/11.0.24/12.0.24 이상으로 올려야 합니다. [Source] https://github.com/advisories/GHSA-gv3v-2cpp-3pmq (2026-02-10)

<!--CARD
{"id":"checklist-1","kind":"checklist","header":"체크리스트","title":"이번 달 개발자 체크리스트(10)","bodyMd":"1. react-router를 7.2.0 이상(6.x는 6.30.1 이상)으로 업데이트합니다.\n2. X-Forwarded-Host 신뢰 대상을 고정합니다.\n3. bignumber.js를 9.3.1 이상으로 업데이트합니다.\n4. base 파라미터를 정수 타입으로 강제합니다.\n5. swiper를 11.2.10/12.0.2 이상으로 업데이트합니다.\n6. 객체 merge 전에 위험 키를 제거합니다.\n7. Tomcat을 9.0.99/10.1.35/11.0.3 이상으로 올립니다.\n8. org.apache.mina:mina-core를 2.2.4 이상으로 올립니다.\n9. 세션 토큰 생성기를 SecureRandom 기반으로 통일합니다.\n10. Jetty를 9.4.58/10.0.24/11.0.24/12.0.24 이상으로 올립니다.","actionMd":"이번 카드의 항목을 완료 처리합니다.","source":"https://github.com/advisories/GHSA-mr7w-8v4g-9q7q "}
-->

# (2) Node.js

## (2.1) CVE/이슈 표

| CVE | 영향 버전 | 공격 영향(C/I/A) | 악용 여부(in-the-wild) | 권장 조치(업데이트/완화책) | Source URL |
|---|---|---|---|---|---|
| CVE-2026-27153 | `react-router` >= 7.0.0, < 7.2.0 and < 6.30.1 | I | 확인 불가 | `react-router`를 7.2.0 이상(6.x는 6.30.1 이상)으로 올리고 프록시 Host 헤더 신뢰 대상을 고정합니다. | https://github.com/advisories/GHSA-mr7w-8v4g-9q7q (2026-02-13)<br>https://cveawg.mitre.org/api/cve/CVE-2026-27153 (날짜 미표기) |
| CVE-2026-27129 | `bignumber.js` < 9.3.1 | I | 확인 불가 | `bignumber.js`를 9.3.1 이상으로 올리고 base 인자의 타입/범위를 강제합니다. | https://github.com/advisories/GHSA-m9xg-gcvf-6qx6 (2026-02-12)<br>https://cveawg.mitre.org/api/cve/CVE-2026-27129 (날짜 미표기) |
| CVE-2026-27212 | `swiper` >= 6.5.0, < 11.2.10 and >= 12.0.0, < 12.0.2 | I | 확인 불가 | `swiper`를 11.2.10 또는 12.0.2 이상으로 올리고 사용자 입력 객체 직접 merge를 중지합니다. | https://github.com/advisories/GHSA-7j5v-47cv-26x5 (2026-02-19)<br>https://cveawg.mitre.org/api/cve/CVE-2026-27212 (날짜 미표기) |

## (2.2) 항목별 설명

### 영향 여부 자가진단 (빠른 확인)

```bash
npm ls react-router bignumber.js swiper --depth=3
npm audit --omit=dev
```

영향 버전이 확인되면 패치 버전으로 즉시 업데이트해야 합니다.

### CVE-2026-27153: React Router Open Redirect

`X-Forwarded-Host`를 신뢰하는 경로에서 Host 검증이 약하면 Open Redirect가 발생합니다. 프록시 체인에서 신뢰할 헤더를 고정하고 라우터를 패치 버전으로 올려야 합니다. [Source] https://github.com/advisories/GHSA-mr7w-8v4g-9q7q (2026-02-13)
[Source] https://reactrouter.com/security/advisories/GHSA-mr7w-8v4g-9q7q (2026-02-13)

### CVE-2026-27129: bignumber.js base 검증 우회

`BigNumber(str, base)` 호출에서 base가 비숫자 타입이면 10진수로 처리되어 검증 의도가 무너질 수 있습니다. base를 정수 타입으로 강제하고 입력 검증을 타입 기반으로 분리해야 합니다. [Source] https://github.com/advisories/GHSA-m9xg-gcvf-6qx6 (2026-02-12)
[Source] https://github.com/MikeMcl/bignumber.js/issues/316 (2026-02-12)

### CVE-2026-27212: Swiper Prototype Pollution

옵션 병합에 사용자 입력 객체가 직접 들어가면 프로토타입 오염이 발생할 수 있습니다. 옵션 화이트리스트를 사용하고 위험 키를 제거한 뒤 병합해야 합니다. [Source] https://github.com/advisories/GHSA-7j5v-47cv-26x5 (2026-02-19)
[Source] https://github.com/nolimits4web/swiper/security/advisories/GHSA-7j5v-47cv-26x5 (2026-02-19)

## (2.3) 이번 달 취약 개발 패턴 Top 5

### 1) 프록시 헤더를 신뢰 경계 없이 사용

공격자는 `X-Forwarded-Host`를 주입해 리다이렉트 목적지를 바꿉니다. 신뢰 프록시 CIDR/호스트를 고정하고 애플리케이션에서 허용 도메인을 강제해야 합니다.

안 좋은 예:

```js
const host = req.headers["x-forwarded-host"] || req.headers.host;
return res.redirect(`/login`);
```

안전한 대안:

```js
const ALLOWED_HOSTS = new Set(["app.example.com"]);
const host = ALLOWED_HOSTS.has(req.hostname) ? req.hostname : "app.example.com";
return res.redirect(`/login`);
```

팀 코드 리뷰 체크리스트에 Host 헤더 검증 항목을 추가해야 합니다.
[Source] https://reactrouter.com/security/advisories/GHSA-mr7w-8v4g-9q7q (2026-02-13)

### 2) 숫자 변환 API에 문자열 base를 그대로 전달

공격자는 타입 강제가 없는 인자를 이용해 검증 경로를 우회합니다. 숫자 파싱에서 타입 검증을 선행하고 비정상 타입 입력을 즉시 차단해야 합니다.

안 좋은 예:

```js
const amount = new BigNumber(userInput.amount, userInput.base);
```

안전한 대안:

```js
if (!Number.isInteger(userInput.base) || userInput.base < 2 || userInput.base > 36) {
  throw new Error("invalid base");
}
const amount = new BigNumber(userInput.amount, userInput.base);
```

팀 입력 검증 유틸에 base 타입 강제 규칙을 넣어야 합니다.
[Source] https://github.com/advisories/GHSA-m9xg-gcvf-6qx6 (2026-02-12)

### 3) 설정 객체를 사용자 입력과 그대로 merge

공격자는 `__proto__` 키를 주입해 런타임 전역 객체를 오염시킵니다. 설정 객체 merge 전에 위험 키를 제거하고 스키마 기반 allowlist를 적용해야 합니다.

안 좋은 예:

```js
Object.assign(defaultConfig, req.body.params);
```

안전한 대안:

```js
const { __proto__, constructor, prototype, ...safe } = req.body.params || {};
Object.assign(defaultConfig, safe);
```

객체 merge 지점은 모두 스키마 검증을 통과한 입력만 허용해야 합니다.
[Source] https://github.com/advisories/GHSA-7j5v-47cv-26x5 (2026-02-19)

### 4) 보안 패치보다 호환성 우선으로 업데이트 지연

공격자는 공개된 취약 버전 범위를 기준으로 자동 스캐닝을 수행합니다. 보안 릴리스는 기능 릴리스와 분리해 즉시 배포해야 합니다.

안 좋은 예:

```js
// 다음 분기 메이저 업그레이드 때 같이 반영
```

안전한 대안:

```js
// 보안 패치는 주간 윈도우에서 즉시 반영하고 회귀 테스트를 분리 실행
```

보안 패치 SLA를 별도 정책으로 고정해야 합니다.
[Source] https://github.com/advisories/GHSA-mr7w-8v4g-9q7q (2026-02-13)

### 5) 의존성 취약점 정보를 CI에서 차단하지 않음

공격자는 알려진 취약 버전이 남아 있는 프로젝트를 우선 타깃으로 삼습니다. CI 단계에서 취약 버전 탐지 시 빌드를 실패 처리해야 합니다.

안 좋은 예:

```js
// audit 결과를 경고만 남기고 배포를 진행
```

안전한 대안:

```js
// npm audit 결과의 high/critical 취약점이 있으면 배포 파이프라인 중단
```

배포 전 게이트에 의존성 취약점 차단 규칙을 넣어야 합니다.
[Source] https://github.com/advisories/GHSA-7j5v-47cv-26x5 (2026-02-19)

# (7) 참고자료

- https://github.com/advisories/GHSA-mr7w-8v4g-9q7q
- https://github.com/advisories/GHSA-m9xg-gcvf-6qx6
- https://github.com/advisories/GHSA-7j5v-47cv-26x5
- https://github.com/advisories/GHSA-85h6-5m3v-gx37
- https://github.com/advisories/GHSA-q672-hfc7-g833
- https://github.com/advisories/GHSA-gv3v-2cpp-3pmq
- https://cveawg.mitre.org/api/cve/CVE-2026-27153
- https://reactrouter.com/security/advisories/GHSA-mr7w-8v4g-9q7q
- https://github.com/MikeMcl/bignumber.js/issues/316
- https://cveawg.mitre.org/api/cve/CVE-2026-27212
- https://tomcat.apache.org/security-11.html
- https://lists.apache.org/thread/0f655hcyxvkom55k0qlzwf5w5f8f0w5k
- https://cveawg.mitre.org/api/cve/CVE-2026-25182
- https://cveawg.mitre.org/api/cve/CVE-2026-27129
- https://github.com/nolimits4web/swiper/security/advisories/GHSA-7j5v-47cv-26x5
