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

# (3) Java

## (3.1) CVE/이슈 표

| CVE | 영향 버전 | 공격 영향(C/I/A) | 악용 여부(in-the-wild) | 권장 조치(업데이트/완화책) | Source URL |
|---|---|---|---|---|---|
| CVE-2026-21530 | `org.apache.tomcat:tomcat-catalina` 11.0.0-M1~11.0.2, 10.1.0-M1~10.1.34, 9.0.0.M1~9.0.98 | C/I | 확인 불가 | Tomcat을 11.0.3/10.1.35/9.0.99 이상으로 올리고 CGI 매핑을 최소화합니다. | https://github.com/advisories/GHSA-85h6-5m3v-gx37 (2026-02-13)<br>https://cveawg.mitre.org/api/cve/CVE-2026-21530 (날짜 미표기) |
| CVE-2026-25182 | `org.apache.mina:mina-core` < 2.2.4 | C/I | 확인 불가 | `org.apache.mina:mina-core`를 2.2.4 이상으로 올리고 세션/토큰 생성기를 `SecureRandom`으로 통일합니다. | https://github.com/advisories/GHSA-q672-hfc7-g833 (2026-02-10)<br>https://cveawg.mitre.org/api/cve/CVE-2026-25182 (날짜 미표기) |
| CVE-2026-25544 | `org.eclipse.jetty:jetty-project` < 9.4.58, < 10.0.24, < 11.0.24, < 12.0.24 | C | 확인 불가 | Jetty를 9.4.58/10.0.24/11.0.24/12.0.24 이상으로 올리고 오류 응답에 경로 노출을 차단합니다. | https://github.com/advisories/GHSA-gv3v-2cpp-3pmq (2026-02-10)<br>https://cveawg.mitre.org/api/cve/CVE-2026-25544 (날짜 미표기) |

## (3.2) 항목별 설명

### 영향 여부 자가진단 (빠른 확인)

```bash
mvn -q -DskipTests dependency:tree | grep -Ei "tomcat-catalina|mina-core|jetty" || true
```

영향 버전이 확인되면 패치 버전으로 즉시 업데이트해야 합니다.

### CVE-2026-21530: Apache Tomcat CGI 경로 RCE 위험

CGI 관련 환경변수 처리 경로가 공격자 입력과 맞닿으면 명령 실행 경계가 무너질 수 있습니다. Tomcat을 패치 버전으로 올리고 CGI 사용 범위를 최소화해야 합니다. [Source] https://github.com/advisories/GHSA-85h6-5m3v-gx37 (2026-02-13)
[Source] https://tomcat.apache.org/security-11.html (2026-02-13)

### CVE-2026-25182: Apache MINA 예측 가능한 난수 사용

예측 가능한 난수로 세션 식별자를 만들면 세션 추측 공격이 쉬워집니다. `mina-core`를 업데이트하고 난수 생성기를 `SecureRandom`으로 고정해야 합니다. [Source] https://github.com/advisories/GHSA-q672-hfc7-g833 (2026-02-10)
[Source] https://lists.apache.org/thread/0f655hcyxvkom55k0qlzwf5w5f8f0w5k (2026-02-10)

### CVE-2026-25544: Jetty Full Path Disclosure

오류 응답이나 경로 처리 실패 시 내부 경로가 노출되면 공격 표면 정찰이 쉬워집니다. Jetty를 패치 버전으로 올리고 에러 핸들러에서 절대 경로 노출을 제거해야 합니다. [Source] https://github.com/advisories/GHSA-gv3v-2cpp-3pmq (2026-02-10)
[Source] https://github.com/jetty/jetty.project/security/advisories/GHSA-vjv5-gp2w-65vm (2026-02-10)

## (3.3) 이번 달 취약 개발 패턴 Top 5

### 1) CGI 기능을 기본 활성 상태로 두고 운영

공격자는 CGI 실행 경로를 통해 환경변수/명령 실행 경계를 노립니다. 필요한 경로만 허용하고 나머지는 비활성화해야 합니다.

안 좋은 예:

```xml
<servlet-mapping>
  <servlet-name>cgi</servlet-name>
  <url-pattern>/*</url-pattern>
</servlet-mapping>
```

안전한 대안:

```xml
<servlet-mapping>
  <servlet-name>cgi</servlet-name>
  <url-pattern>/cgi-bin/*</url-pattern>
</servlet-mapping>
```

CGI 매핑은 최소 경로로 축소하고 접근 제어를 추가해야 합니다.
[Source] https://tomcat.apache.org/security-11.html (2026-02-13)

### 2) 세션 토큰을 약한 난수로 생성

공격자는 토큰 패턴을 수집해 세션 추측 성공률을 높입니다. 세션/토큰 생성은 `SecureRandom` 기반 구현으로 통일해야 합니다.

안 좋은 예:

```java
String token = Long.toHexString(System.currentTimeMillis()) + userId;
```

안전한 대안:

```java
SecureRandom r = new SecureRandom();
byte[] b = new byte[32];
r.nextBytes(b);
String token = Base64.getUrlEncoder().withoutPadding().encodeToString(b);
```

인증 토큰 생성 유틸을 단일 구현으로 강제해야 합니다.
[Source] https://github.com/advisories/GHSA-q672-hfc7-g833 (2026-02-10)

### 3) 에러 응답에 내부 파일 경로를 포함

공격자는 경로 정보를 이용해 후속 파일 접근/탐색 공격을 준비합니다. 에러 응답은 일반화된 메시지로 고정하고 내부 경로는 로그로만 남겨야 합니다.

안 좋은 예:

```java
return Response.status(500).entity(e.getMessage()).build();
```

안전한 대안:

```java
return Response.status(500).entity("internal error").build();
```

예외 처리 공통 모듈에서 경로/스택 노출을 차단해야 합니다.
[Source] https://github.com/advisories/GHSA-gv3v-2cpp-3pmq (2026-02-10)

### 4) 취약 버전 범위를 SCA 정책에 반영하지 않음

공격자는 공개된 affected range를 기준으로 자동화 스캔을 수행합니다. 빌드 시점에 취약 범위 차단 규칙을 적용해야 합니다.

안 좋은 예:

```text
SCA 결과를 리포트만 남기고 빌드를 통과
```

안전한 대안:

```text
CVE-2026-21530/CVE-2026-25182/CVE-2026-25544 범위 탐지 시 빌드를 실패 처리
```

Maven Enforcer나 CI 정책으로 취약 범위 차단을 강제해야 합니다.
[Source] https://cveawg.mitre.org/api/cve/CVE-2026-21530 (날짜 미표기)

### 5) 런타임 에러 처리와 보안 로그를 같은 채널로 관리

공격자는 로그 노이즈가 높은 구간에서 탐지 회피를 시도합니다. 보안 이벤트 로그를 별도 채널로 분리해 탐지 신호를 유지해야 합니다.

안 좋은 예:

```text
애플리케이션 에러 로그와 보안 이벤트 로그를 단일 스트림으로 수집
```

안전한 대안:

```text
보안 이벤트는 별도 인덱스와 별도 알림 규칙으로 분리
```

보안 이벤트 스키마를 팀 표준으로 고정해야 합니다.
[Source] https://github.com/advisories/GHSA-85h6-5m3v-gx37 (2026-02-13)

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
- https://cveawg.mitre.org/api/cve/CVE-2026-21530
- https://cveawg.mitre.org/api/cve/CVE-2026-25544
- https://github.com/jetty/jetty.project/security/advisories/GHSA-vjv5-gp2w-65vm
