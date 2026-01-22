# DevSecNews 2026-01 — Node.js/Java 보안 요약(개발자용)

# (1) Summary

- Node.js는 보안 릴리스(Active release lines)에 다수 취약점을 패치했고, 특히 **권한 모델 우회**, **메모리 노출**, **권한 경계 관련 이슈**가 개발·운영 코드에 직접 영향을 줍니다. 런타임을 보안 릴리스 버전으로 업데이트합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
- Java 쪽은 “외부 입력을 XML/템플릿/직렬화로 처리”하는 경로가 계속 위험 지점으로 남아 있습니다. 외부 입력 기반 템플릿·직렬화 경로를 차단하거나 샌드박스로 분리합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)
- Apache Struts의 XXE 이슈(S2-069)는 “XML 파서 기본값”이 그대로 남아 있으면 다시 공격면이 됩니다. Struts를 패치 버전으로 올리고 XML 파서 보안 설정을 강제합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2026-01-11)
- 개발자 도구도 공격면으로 확인됐습니다(Spring CLI VSCode extension 명령 주입). 조직 표준 확장 목록에서 해당 확장을 제거하고 “워크스페이스 신뢰”를 기본 거부로 둡니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-16)

# (3) Java

## (3.1) CVE/이슈 표

| CVE | 영향 버전 | 공격 영향(C/I/A) | 악용 여부(in-the-wild) | 권장 조치(업데이트/완화책) | 관련 CWE | Source URL |
|---|---|---|---|---|---|---|
| CVE-2025-68493 (S2-069) | Apache Struts 영향 버전(공지 참조) | C/I/A | 확인 불가 | Struts를 패치 버전으로 업데이트하고 XML 파서에서 DTD/외부 엔티티를 비활성화합니다. | CWE-611 | https://cwiki.apache.org/confluence/display/WW/S2-069 (2026-01-11) |
| CVE-2025-10492 | JasperReports 관련 컴포넌트(공지 참조) | C/I/A | 확인 불가 | JasperReports 관련 컴포넌트를 업데이트하고 외부 템플릿/직렬화 입력 경로를 차단합니다. | CWE-502 | https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12) |
| CVE-2026-22718 | Spring CLI VSCode Extension <= 0.9.0 (EOL) | C/I | 확인 불가 | 해당 확장을 제거하고 워크스페이스 신뢰를 기본 거부로 설정합니다. | CWE-78 | https://spring.io/security/cve-2026-22718 (2026-01-16)<br>https://github.com/advisories/GHSA-h34g-p94m-h76q (날짜 미표기) |

## (3.2) 항목별 설명

### CVE-2025-68493 (S2-069): Struts XXE 계열 입력 처리

XML 파서 기본값/구성요소 조합이 남아 있으면 XXE 계열 입력이 다시 공격 표면이 됩니다. Struts를 패치 버전으로 올리고 XML 파서에서 DTD/외부 엔티티를 비활성화합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2026-01-11)

### CVE-2025-10492: JasperReports 역직렬화/RCE 리스크

리포트/템플릿 파이프라인이 “업로드/외부 파일”을 그대로 받아 처리하면 RCE로 연결됩니다. 템플릿 업로드를 차단하고 불가피하면 격리된 실행 환경에서만 처리하며 컴포넌트를 업데이트합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)

### CVE-2026-22718: 개발 도구(확장) 명령 주입

EOL 된 개발 도구는 “패치 없음”이 기본이어서, 취약점이 확인되면 제거가 사실상 유일한 대응입니다. 조직 표준 확장 목록에서 제거하고 신뢰되지 않은 워크스페이스 기본 거부를 적용합니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-16)
[Source] https://github.com/advisories/GHSA-h34g-p94m-h76q (날짜 미표기)

### 영향 여부 자가진단(빠른 확인)

아래 명령으로 의존성(Struts/JasperReports)과 개발 도구(취약 확장) 설치 여부를 먼저 확인합니다.

```bash
mvn -q -DskipTests dependency:tree | grep -Ei "struts2|jasperreports" || true
code --list-extensions | grep -Ei "spring|cli" || true
```

영향 가능성이 있으면 버전을 올리거나(라이브러리) 제거합니다(개발 도구).

## (3.3) 이번 달 취약 개발 패턴 Top 5

### 1) 외부 입력(XML)을 파서 기본값으로 처리

공격자는 XXE/SSRF/정보 노출을 노리고 “파서 기본값”을 파고듭니다. 외부 엔티티/DTD를 비활성화하고 허용 스키마만 처리합니다.

안 좋은 예:

```java
Document doc = DocumentBuilderFactory.newInstance()
  .newDocumentBuilder()
  .parse(inputStream);
```

안전한 대안:

```java
DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
f.setFeature("http://xml.org/sax/features/external-general-entities", false);
f.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
```

관련 CWE + 정적분석/CodeQL 탐지 아이디어: CWE-611; “XML 파서 생성 후 보안 feature 미설정” 패턴을 탐지합니다.
룰로 고정합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2026-01-11)

### 2) Java 역직렬화를 입력 포맷으로 허용

공격자는 gadget chain(역직렬화로 이어지는 호출 연쇄)을 이용해 역직렬화 시점에 코드 실행을 노립니다. 외부 입력은 JSON/Protobuf로 전환하고 필요 시 allowlist 필터를 강제합니다.

안 좋은 예:

```java
Object obj = new ObjectInputStream(request.getInputStream()).readObject();
```

안전한 대안:

```java
// 외부 입력은 JSON/Protobuf로 받고 명시적 DTO로 파싱합니다.
```

관련 CWE + 정적분석/CodeQL 탐지 아이디어: CWE-502; “ObjectInputStream.readObject()에 request stream이 연결”되는 흐름을 차단합니다.
룰로 고정합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)

### 3) 리포트/템플릿 파이프라인에서 신뢰 경계를 지우는 패턴

공격자는 “템플릿=코드”가 되는 지점을 노립니다. 템플릿 업로드를 금지하거나 격리된 렌더러에서만 처리합니다.

안 좋은 예:

```java
compileAndRender(userUploadedTemplate);
```

안전한 대안:

```java
// 템플릿은 저장소에서만 로드하고 서명/해시로 무결성을 검증합니다.
```

관련 CWE + 정적분석/CodeQL 탐지 아이디어: CWE-94/CWE-502; “템플릿 업로드 → 컴파일/실행 API 호출” 흐름을 탐지합니다.
룰로 고정합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)

### 4) 개발툴/확장이 실행하는 명령을 프로젝트 입력이 좌우

공격자는 레포/워크스페이스 설정을 통해 개발자 PC에서 명령 실행을 유도합니다. 취약 확장을 제거하고 워크스페이스 신뢰를 기본 거부로 둡니다.

안 좋은 예:

```text
workspace 설정값 -> shell command 문자열로 결합 -> 실행
```

안전한 대안:

```text
확장 설치 allowlist + 신뢰되지 않은 워크스페이스 기본 거부 + EOL 확장 제거
```

관련 CWE + 정적분석/CodeQL 탐지 아이디어: CWE-78; “입력값을 쉘 커맨드로 조합” 규칙을 도구 정책으로 차단합니다.
룰로 고정합니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-16)

### 5) XML/직렬화 입력 경로를 로그/모니터링에서 빼버림

공격자는 탐지되지 않는 입력 경로로 반복 시도해 성공 확률을 올립니다. 파서 진입을 보안 이벤트로 분리해 메타데이터를 남깁니다.

안 좋은 예:

```text
/upload, /report 렌더 API는 요청 메타데이터를 거의 기록하지 않음
```

안전한 대안:

```text
요청 크기/파일 타입/해시/렌더 결과 코드 등 최소 메타데이터를 보안 이벤트로 기록
```

관련 CWE + 정적분석/CodeQL 탐지 아이디어: CWE-778; “업로드/리포트/파서 진입 API에서 로깅 누락”을 탐지하고 필수 필드를 고정합니다.
룰로 고정합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)

팀이 오늘 적용할 규칙/코드 조치를 팀 규칙과 PR 체크리스트에 반영합니다.

## (3.4) 운영 참고(선택)

# (7) 참고자료

- https://nodejs.org/en/blog/vulnerability/december-2025-security-releases
- https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability
- https://cwiki.apache.org/confluence/display/WW/S2-069
- https://spring.io/security/cve-2026-22718
- https://github.com/advisories/GHSA-h34g-p94m-h76q
- http://apache.org/xml/features/disallow-doctype-decl",
- http://xml.org/sax/features/external-general-entities",
- http://xml.org/sax/features/external-parameter-entities",
