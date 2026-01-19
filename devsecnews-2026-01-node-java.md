# DevSecNews 2026-01 — Node.js/Java 보안 요약(개발자용)

# (1) Summary

- Node.js는 보안 릴리스(Active release lines)에 다수 취약점을 패치했고, 특히 **권한 모델 우회**, **메모리 노출**, **권한 경계 관련 이슈**가 개발·운영 코드에 직접 영향을 줍니다. 런타임을 보안 릴리스 버전으로 업데이트합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
- Java 쪽은 “외부 입력을 XML/템플릿/직렬화로 처리”하는 경로가 계속 위험 지점으로 남아 있습니다. 외부 입력 기반 템플릿·직렬화 경로를 차단하거나 샌드박스로 분리합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)
- Apache Struts의 XXE 이슈(S2-069)는 “XML 파서 기본값”이 그대로 남아 있으면 다시 공격면이 됩니다. Struts를 패치 버전으로 올리고 XML 파서 보안 설정을 강제합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2026-01-11)
- 개발자 도구도 공격면으로 확인됐습니다(Spring CLI VSCode extension 명령 주입). 조직 표준 확장 목록에서 해당 확장을 제거하고 “워크스페이스 신뢰”를 기본 거부로 둡니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-16)

# (2) Node.js

## (2.1) CVE/이슈 표

| CVE | 영향 버전 | 공격 영향(C/I/A) | 악용 여부(in-the-wild) | 권장 조치(업데이트/완화책) | 관련 CWE | Source URL |
|---|---|---|---|---|---|---|
| CVE-2025-55131 | Node.js v20/v22/v24/v25 (Active release lines) | C | 확인 불가 | Node.js를 보안 릴리스 버전으로 업데이트하고 `vm`+`timeout` 조합을 격리/제거합니다. | CWE-200 | https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13) |
| CVE-2025-55130 | Node.js permission model 사용 시(v20/v22/v24/v25) | C/I | 확인 불가 | Node.js를 업데이트하고 허용 경로를 realpath 기준 allowlist로 검증하며 symlink 체인을 차단합니다. | CWE-22 | https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13) |
| CVE-2026-21636 | Node.js v25 `--permission` 사용 시 | C/I | 확인 불가 | `--permission`을 보안 경계로 쓰지 않고 UDS 경로 allowlist 및 OS 격리로 보완합니다. | CWE-269 | https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13) |
| CVE-2025-55132 | Node.js v20/v22/v24/v25 (permission model 사용 시) | I | 확인 불가 | `fs.futimes()` 사용 여부를 점검하고 보안 의미로 타임스탬프를 신뢰하지 않도록 설계를 바꿉니다. | CWE-284 | https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13) |

## (2.2) 항목별 설명

### Node.js 보안 릴리스(Active release lines)

Node.js는 다수 취약점 패치를 포함한 보안 릴리스를 공개했습니다. 런타임을 보안 릴리스 버전으로 업데이트합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

### CVE-2025-55131: `vm`+`timeout`에서 메모리 노출 가능

`vm` 모듈에서 `timeout`로 실행을 끊는 흐름이 있으면, 버퍼 초기화가 기대대로 동작하지 않아 이전 메모리 잔여가 노출될 수 있습니다. `vm`으로 “유저 코드”를 실행하는 구조를 별도 프로세스/컨테이너로 분리하고 런타임을 업데이트합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

### CVE-2025-55130: permission model 파일시스템 권한 우회(symlink)

`--allow-fs-read`/`--allow-fs-write`는 입력 경로와 symlink 체인 조합으로 우회될 수 있어 “옵션만으로” 보안 경계를 만들면 위험합니다. 허용 경로를 realpath 기준 allowlist로 검증하고 런타임을 업데이트합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

### CVE-2026-21636: `--permission`에서 UDS로 네트워크 제한 우회

네트워크 권한을 제한했다고 해도 UDS(Unix Domain Socket) 연결은 다른 경로로 열릴 수 있습니다. UDS 경로는 입력에서 직접 받지 않도록 하고 allowlist+정규화로 통제하며 필요하면 OS 격리를 적용합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

### CVE-2025-55132: `fs.futimes()`로 메타데이터(타임스탬프) 변경 가능

읽기 권한만 가정한 환경에서도 파일 타임스탬프가 변경될 수 있어, 타임라인 기반 감시/감사 로직이 깨질 수 있습니다. `fs.futimes()` 사용 여부를 점검하고 보안 의미로 파일 타임스탬프를 신뢰하지 않도록 설계를 바꿉니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

## (2.3) 이번 달 취약 개발 패턴 Top 5

### 1) “permission 모델을 켰으니 안전”이라는 가정

공격자는 symlink/UDS 같은 우회 경로로 “권한 옵션의 의도”와 다른 접근을 만들려고 합니다. 허용 경로/소켓 경로를 allowlist로 고정하고 런타임을 업데이트합니다.

안 좋은 예:

```js
// permission model을 켠 상태에서 입력을 그대로 신뢰
fs.readFileSync(userInput.path, "utf8")
```

안전한 대안:

```js
import path from "node:path"

const ROOT = "/srv/app/data"
const p = path.resolve(ROOT, userInput.path)
if (!p.startsWith(ROOT + path.sep)) throw new Error("blocked")
fs.readFileSync(p, "utf8")
```

관련 CWE + 정적분석/CodeQL 탐지 아이디어: CWE-22/CWE-269; “외부 입력이 fs/net/uds 경로로 흐르는지” 데이터흐름으로 탐지해 차단합니다. 룰로 고정합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

### 2) symlink/realpath를 고려하지 않은 “경로 검증”

공격자는 “문자열 기반 경로 체크”를 우회해 허용 디렉터리 밖 파일에 접근하려고 합니다. realpath 기준 allowlist 검증을 적용합니다.

안 좋은 예:

```js
if (!userInput.path.startsWith("/srv/app/data/")) throw new Error("blocked")
fs.readFileSync(userInput.path, "utf8")
```

안전한 대안:

```js
const real = fs.realpathSync(userInput.path)
if (!real.startsWith("/srv/app/data/")) throw new Error("blocked")
fs.readFileSync(real, "utf8")
```

관련 CWE + 정적분석/CodeQL 탐지 아이디어: CWE-22; “startsWith 기반 경로 검증 + 파일 접근” 패턴을 린트로 올립니다. 룰로 고정합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

### 3) `vm`에서 유저 코드를 돌리고 timeout으로 끊기

공격자는 타이밍 경합으로 버퍼 초기화/정리 타이밍을 흔들어 정보 노출이나 비정상 동작을 유도합니다. 유저 코드는 별도 프로세스/컨테이너로 분리하고 IPC로만 통신합니다.

안 좋은 예:

```js
vm.runInNewContext(untrustedCode, sandbox, { timeout: 50 })
```

안전한 대안:

```js
// untrusted code는 별도 프로세스/컨테이너에서 실행하고
// 결과만 IPC로 받습니다.
```

관련 CWE + 정적분석/CodeQL 탐지 아이디어: CWE-200; “vm.*에 untrustedCode가 전달되는지” 데이터흐름을 경고로 올립니다. 룰로 고정합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

### 4) UDS 경로를 입력으로 받아 내부 소켓에 연결

공격자는 네트워크 권한 경계를 우회하기 위해 로컬 소켓(UDS) 경로를 입력으로 주입하려고 합니다. UDS 경로는 allowlist로 고정하고 입력에서 직접 받지 않도록 설계를 바꿉니다.

안 좋은 예:

```js
net.connect(userInput.socketPath)
```

안전한 대안:

```js
const ALLOWED_UDS = new Set(["/run/app.sock"])
if (!ALLOWED_UDS.has(userInput.socketPath)) throw new Error("blocked")
net.connect(userInput.socketPath)
```

관련 CWE + 정적분석/CodeQL 탐지 아이디어: CWE-269; “userInput이 net.connect socketPath로 흐르는지” 데이터흐름을 탐지합니다. 룰로 고정합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

### 5) 파일 타임스탬프를 보안 신호로 신뢰

공격자는 로그/감사 흐름을 흐리게 만들기 위해 메타데이터(타임스탬프) 조작 가능성을 악용합니다. 타임스탬프를 보안 판단에 직접 쓰지 않고, 별도 감사 이벤트/해시 기반으로 설계를 바꿉니다.

안 좋은 예:

```js
if (stat.mtimeMs < lastSeen) deny() // 타임스탬프를 보안 판단으로 사용
```

안전한 대안:

```js
// 파일 내용 해시/서명 검증 + 별도 감사 이벤트 기록으로 전환
```

관련 CWE + 정적분석/CodeQL 탐지 아이디어: CWE-284/CWE-290; “mtime/atime 기반 보안 분기” 패턴을 탐지합니다. 룰로 고정합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

팀이 오늘 적용할 규칙/코드 조치를 팀 규칙과 PR 체크리스트에 반영합니다.

## (2.4) 운영 참고(선택)

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

리포트/템플릿 파이프라인이 “업로드/외부 파일”을 그대로 받아 처리하면 RCE로 연결됩니다. 템플릿 업로드를 차단하고 불가피하면 샌드박스에서만 처리하며 컴포넌트를 업데이트합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)

### CVE-2026-22718: 개발 도구(확장) 명령 주입

EOL 된 개발 도구는 “패치 없음”이 기본이어서, 취약점이 확인되면 제거가 사실상 유일한 대응입니다. 조직 표준 확장 목록에서 제거하고 신뢰되지 않은 워크스페이스 기본 거부를 적용합니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-16)
[Source] https://github.com/advisories/GHSA-h34g-p94m-h76q (날짜 미표기)

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

공격자는 gadget chain을 이용해 역직렬화 시점에 코드 실행을 노립니다. 외부 입력은 JSON/Protobuf로 전환하고 필요 시 allowlist 필터를 강제합니다.

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

# (4) 공통 트렌드/권장사항

- 권한/격리 기능을 “보안 경계”로 단정하면 우회가 나옵니다. 런타임 업데이트와 함께 OS/컨테이너 격리를 기본으로 적용합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
- XML/직렬화/템플릿은 입력이 곧 코드가 되는 지점이 생깁니다. 외부 입력 템플릿을 차단하고 불가피하면 격리된 렌더러에서만 처리합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)
- 개발 도구(EOL 확장)는 “패치 없음”이므로 취약점 확인 시 제거가 정답입니다. 조직 표준 확장 allowlist를 운영하고 취약 확장을 제거합니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-16)

# (5) 이번 달 개발자 체크리스트

1. Node.js 런타임을 보안 릴리스 버전으로 업데이트합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
2. `vm`+`timeout`으로 유저 코드를 돌리는 기능을 제거하거나 별도 프로세스/컨테이너로 격리합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
3. Node.js permission model 사용 시 realpath 기준 allowlist 검증과 symlink 체인 차단을 추가합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
4. `--permission` 사용 시 UDS 경로 입력을 allowlist로 고정하고 OS 격리(컨테이너/유저 분리)를 적용합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
5. `fs.futimes()` 사용 여부를 점검하고 보안 의미로 파일 타임스탬프를 신뢰하지 않도록 설계를 바꿉니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
6. Struts 사용 시 S2-069 패치 버전으로 업그레이드하고 XML 파서에서 DTD/외부 엔티티를 비활성화합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2026-01-11)
7. JasperReports 사용 시 외부 템플릿 업로드/로딩 경로를 차단하고 컴포넌트를 업데이트합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)
8. Spring CLI VSCode extension을 조직 표준에서 제거하고 개발자 PC에서 설치 여부를 점검해 제거합니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-16)
9. 워크스페이스 신뢰를 기본 거부로 두고 신뢰된 레포에서만 확장을 실행합니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-16)
10. “리포트/업로드/파서 진입” 경로는 보안 이벤트로 분리해 최소 메타데이터(요청 크기/파일 타입/해시/결과 코드)를 기록합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)

# (6) 패턴→팀 규칙(5)

1. Node.js permission model은 보안 경계로 쓰지 않고 realpath allowlist+OS 격리를 기본으로 둡니다.
2. 파일 경로는 문자열 검증이 아니라 정규화+realpath 기준으로만 검증합니다.
3. `vm`으로 유저 코드를 실행하지 않고 불가피하면 별도 프로세스/컨테이너로 격리합니다.
4. 네트워크 입력 처리에는 timeout/최대 크기/에러 핸들링을 코드로 고정합니다.
5. EOL 개발 도구/확장은 즉시 제거하고 조직 표준 allowlist로만 설치합니다.

# (7) 참고자료

- https://nodejs.org/en/blog/vulnerability/december-2025-security-releases
- https://cwiki.apache.org/confluence/display/WW/S2-069
- https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability
- https://spring.io/security/cve-2026-22718
- https://github.com/advisories/GHSA-h34g-p94m-h76q
