# DevSecNews 2026-01 — Node.js/Java 보안 요약(개발자용)

# (1) Summary

- Node.js는 이번에 권한 모델, 파일 경로, 소켓 관련 취약점을 한꺼번에 패치했습니다. 바로 보안 릴리스 버전으로 올리세요. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
- Java는 외부 입력이 XML 파서나 템플릿 엔진으로 흘러들어가는 경로가 가장 위험합니다. 이쪽 경로를 아예 막거나 격리해야 안전합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)
- Struts(XXE, S2-069)는 XML 파서 기본값을 그대로 두면 공격 통로가 열립니다. 패치 버전으로 올리고 파서 보안 설정을 강제하세요. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2026-01-11)
- 개발자 도구(Spring CLI VSCode extension)에서 명령 주입이 발견됐습니다. 이미 EOL된 버전이라 패치가 없으니, 조직 표준 목록에서 빼고 바로 지워야 합니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-16)

<!--CARD
{"id":"summary-1","kind":"summary","header":"요약","title":"Node.js 권한 경계 패치","bodyMd":"이번 달은 권한 경계를 흔드는 이슈가 한꺼번에 공개됐습니다. 파일 경로와 로컬 소켓까지 같이 봅니다.","whyMd":"옵션만 믿으면 symlink/UDS 같은 우회 경로로 보안 경계가 깨집니다.","impactMd":"허용 범위를 벗어난 파일 접근이나 내부 소켓 접근이 생깁니다.","actionMd":"런타임을 보안 릴리스 버전으로 업데이트합니다.","source":"https://nodejs.org/en/blog/vulnerability/december-2025-security-releases"}
-->
<!--CARD
{"id":"summary-2","kind":"summary","header":"요약","title":"Java 입력 경계(XML/템플릿/직렬화)","bodyMd":"입력이 XML 파서나 템플릿, 역직렬화로 들어가는 지점이 문제의 시작입니다. 이 경로를 먼저 정리합니다.","whyMd":"‘입력=코드’가 되는 경로에서 가젯 체인이나 XXE로 이어집니다.","impactMd":"RCE나 정보 노출로 이어질 수 있습니다.","actionMd":"외부 입력 기반 템플릿·직렬화 경로를 차단하거나 격리합니다.","source":"https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability"}
-->
<!--CARD
{"id":"summary-3","kind":"summary","header":"요약","title":"Struts S2-069(XXE)","bodyMd":"XML 파서 기본값이 남아 있으면, XXE 입력이 다시 처리됩니다. 파서 설정이 곧 방어선입니다.","whyMd":"외부 엔티티/DTD가 살아 있으면 외부 자원 접근이 열립니다.","impactMd":"내부 자원 노출이나 SSRF 같은 파생 위험이 생깁니다.","actionMd":"Struts를 패치 버전으로 올리고 XML 파서 보안 설정을 강제합니다.","source":"https://cwiki.apache.org/confluence/display/WW/S2-069"}
-->
<!--CARD
{"id":"summary-4","kind":"summary","header":"요약","title":"개발자 도구(EOL 확장) 명령 주입","bodyMd":"개발자 도구 취약점은 서버보다 먼저 개발자 PC를 때립니다. EOL 확장은 패치가 없어서 제거가 빠릅니다.","whyMd":"레포/워크스페이스 입력이 확장 동작을 흔들어 로컬 실행으로 이어집니다.","impactMd":"개발자 PC에서 임의 명령 실행로 번질 수 있습니다.","actionMd":"조직 표준 확장 목록에서 해당 확장을 제거하고 워크스페이스 신뢰를 기본 거부로 둡니다.","source":"https://spring.io/security/cve-2026-22718"}
-->

# (2) Node.js

## (2.1) CVE/이슈 표

| CVE | 영향 버전 | 공격 영향(C/I/A) | 악용 여부(in-the-wild) | 권장 조치(업데이트/완화책) | Source URL |
|---|---|---|---|---|---|
| CVE-2025-55131 | Node.js v20/v22/v24/v25 (Active release lines) | C | 확인 불가 | Node.js를 보안 릴리스 버전으로 업데이트하고 `vm`+`timeout` 조합을 격리/제거합니다. | https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)<br>https://cveawg.mitre.org/api/cve/CVE-2025-55131 (날짜 미표기) |
| CVE-2025-55130 | Node.js permission model 사용 시(v20/v22/v24/v25) | C/I | 확인 불가 | Node.js를 업데이트하고 허용 경로를 realpath 기준 allowlist로 검증하며 symlink 체인을 차단합니다. | https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)<br>https://cveawg.mitre.org/api/cve/CVE-2025-55130 (날짜 미표기) |
| CVE-2026-21636 | Node.js v25 `--permission` 사용 시 | C/I | 확인 불가 | `--permission`을 보안 경계로 쓰지 않고 UDS 경로 allowlist 및 OS 격리로 보완합니다. | https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)<br>https://cveawg.mitre.org/api/cve/CVE-2026-21636 (날짜 미표기) |
| CVE-2025-55132 | Node.js v20/v22/v24/v25 (permission model 사용 시) | I | 확인 불가 | `fs.futimes()` 사용 여부를 점검하고 보안 의미로 타임스탬프를 신뢰하지 않도록 설계를 바꿉니다. | https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)<br>https://cveawg.mitre.org/api/cve/CVE-2025-55132 (날짜 미표기) |

## (2.2) 항목별 설명

### Node.js 보안 릴리스 (Active release lines)

Node.js가 여러 취약점을 패치한 보안 릴리스를 내놨습니다. 런타임을 최신 보안 버전으로 업데이트하는 게 가장 확실한 방법입니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

### 영향 여부 자가진단 (빠른 확인)

지금 쓰고 있는 런타임 버전과 권한 모델 옵션을 켜뒀는지 확인해 보세요.

```bash
node -v
ps aux | grep -E "node .*--permission|node .*--allow-fs-" | grep -v grep || true
```

설정된 게 있다면 보안 릴리스 버전으로 업데이트해야 합니다.

### CVE-2025-55131: `vm`+`timeout` 쓰면 메모리 샐 수 있음

`vm` 모듈에서 `timeout`으로 실행을 강제로 끊으면, 버퍼 초기화가 제대로 안 돼서 이전 메모리에 있던 데이터가 노출될 수 있습니다. `vm`으로 유저 코드를 돌리는 건 위험하니 별도 프로세스나 컨테이너로 격리하세요. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-55131 (날짜 미표기)

### CVE-2025-55130: 권한 모델, symlink로 우회 가능

`--allow-fs-read` 같은 옵션만 믿으면 안 됩니다. 입력 경로와 symlink 조합으로 권한 밖의 파일에 접근할 수 있거든요. 허용 경로는 반드시 심볼릭 링크를 푼 `realpath` 기준으로 검증해야 합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-55130 (날짜 미표기)

### CVE-2026-21636: 네트워크 막아도 UDS(로컬 소켓)는 뚫림

`--permission`으로 네트워크를 막아도 유닉스 도메인 소켓(UDS) 연결은 열릴 수 있습니다. UDS 경로는 사용자 입력으로 받지 말고, 화이트리스트로 고정해서 쓰세요. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
[Source] https://cveawg.mitre.org/api/cve/CVE-2026-21636 (날짜 미표기)

### CVE-2025-55132: `fs.futimes()`로 타임스탬프 조작

읽기 권한만 있어도 파일 타임스탬프를 바꿀 수 있다는 게 밝혀졌습니다. 이러면 감사 로그의 시점이 꼬일 수 있죠. 파일 타임스탬프를 보안 검증 수단으로 쓰고 있다면 설계를 바꿔야 합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-55132 (날짜 미표기)

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

팀 규칙으로 고정합니다.
[Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

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

팀 규칙으로 고정합니다.
[Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

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

팀 규칙으로 고정합니다.
[Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

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

팀 규칙으로 고정합니다.
[Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

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

팀 규칙으로 고정합니다.
[Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)

팀이 오늘 적용할 규칙/코드 조치를 PR 체크리스트에 반영합니다.

## (2.4) 운영 참고(선택)

# (3) Java

## (3.1) CVE/이슈 표

| CVE | 영향 버전 | 공격 영향(C/I/A) | 악용 여부(in-the-wild) | 권장 조치(업데이트/완화책) | Source URL |
|---|---|---|---|---|---|
| CVE-2025-68493 (S2-069) | Apache Struts 영향 버전(공지 참조) | C/I/A | 확인 불가 | Struts를 패치 버전으로 업데이트하고 XML 파서에서 DTD/외부 엔티티를 비활성화합니다. | https://cwiki.apache.org/confluence/display/WW/S2-069 (2026-01-11)<br>https://cveawg.mitre.org/api/cve/CVE-2025-68493 (날짜 미표기) |
| CVE-2025-10492 | JasperReports 관련 컴포넌트(공지 참조) | C/I/A | 확인 불가 | JasperReports 관련 컴포넌트를 업데이트하고 외부 템플릿/직렬화 입력 경로를 차단합니다. | https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)<br>https://cveawg.mitre.org/api/cve/CVE-2025-10492 (날짜 미표기) |
| CVE-2026-22718 | Spring CLI VSCode Extension <= 0.9.0 (EOL) | C/I | 확인 불가 | 해당 확장을 제거하고 워크스페이스 신뢰를 기본 거부로 설정합니다. | https://spring.io/security/cve-2026-22718 (2026-01-16)<br>https://github.com/advisories/GHSA-h34g-p94m-h76q (날짜 미표기)<br>https://cveawg.mitre.org/api/cve/CVE-2026-22718 (날짜 미표기) |

## (3.2) 항목별 설명

### CVE-2025-68493 (S2-069): Struts XXE 다시 등장

XML 파서 기본값을 그대로 쓰면 XXE 공격에 또 당할 수 있습니다. Struts를 패치하고, XML 파서 설정에서 DTD랑 외부 엔티티는 꼭 꺼두세요. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2026-01-11)
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-68493 (날짜 미표기)

### CVE-2025-10492: JasperReports, 템플릿 파일 조심

리포트 템플릿을 업로드받아서 그대로 렌더링하면 RCE로 이어집니다. 템플릿 업로드는 막고, 정 필요하다면 완전히 격리된 환경에서만 돌려야 합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-10492 (날짜 미표기)

### CVE-2026-22718: 개발 도구 확장이 뚫리는 경우

이미 지원 종료(EOL)된 개발 도구는 패치가 안 나옵니다. 취약점이 발견되면 바로 지우는 게 답입니다. 조직 차원에서 쓰는 확장 목록을 정해두고, 신뢰할 수 없는 워크스페이스는 기본적으로 차단하세요. [Source] https://spring.io/security/cve-2026-22718 (2026-01-16)
[Source] https://github.com/advisories/GHSA-h34g-p94m-h76q (날짜 미표기)
[Source] https://cveawg.mitre.org/api/cve/CVE-2026-22718 (날짜 미표기)

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

팀 규칙으로 고정합니다.
[Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2026-01-11)

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

팀 규칙으로 고정합니다.
[Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)

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

팀 규칙으로 고정합니다.
[Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)

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

팀 규칙으로 고정합니다.
[Source] https://spring.io/security/cve-2026-22718 (2026-01-16)

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

팀 규칙으로 고정합니다.
[Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)

팀이 오늘 적용할 규칙/코드 조치를 PR 체크리스트에 반영합니다.

## (3.4) 운영 참고(선택)

# (4) 공통 트렌드/권장사항

- 권한/격리 기능을 “보안 경계”로 단정하면 우회가 나옵니다. 런타임 업데이트와 함께 OS/컨테이너 격리를 기본으로 적용합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
- XML/직렬화/템플릿은 입력이 곧 코드가 되는 지점이 생깁니다. 외부 입력 템플릿을 차단하고 불가피하면 격리된 렌더러에서만 처리합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)
- 개발 도구(EOL 확장)는 “패치 없음”이므로 취약점 확인 시 제거가 정답입니다. 조직 표준 확장 allowlist를 운영하고 취약 확장을 제거합니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-16)

# (5) 이번 달 개발자 체크리스트

1. Node.js permission model은 보안 경계로 쓰지 않고 realpath allowlist+OS 격리를 기본으로 둡니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
2. 파일 경로는 문자열 검증이 아니라 정규화+realpath 기준으로만 검증합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
3. `vm`으로 유저 코드를 실행하지 않고 불가피하면 별도 프로세스/컨테이너로 격리합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
4. UDS(로컬 소켓) 경로는 입력에서 직접 받지 않고 allowlist로 고정합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
5. EOL 개발 도구/확장은 즉시 제거하고 조직 표준 allowlist로만 설치합니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-16)
6. Node.js 런타임을 보안 릴리스 버전으로 업데이트합니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
7. `fs.futimes()` 사용 여부를 점검하고 보안 의미로 파일 타임스탬프를 신뢰하지 않도록 설계를 바꿉니다. [Source] https://nodejs.org/en/blog/vulnerability/december-2025-security-releases (2026-01-13)
8. Struts 사용 시 S2-069 패치 버전으로 업그레이드하고 XML 파서에서 DTD/외부 엔티티를 비활성화합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2026-01-11)
9. JasperReports 사용 시 외부 템플릿 업로드/로딩 경로를 차단하고 컴포넌트를 업데이트합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)
10. 워크스페이스 신뢰를 기본 거부로 두고 신뢰된 레포에서만 확장을 실행합니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-16)

<!--CARD
{"id":"checklist-1","kind":"checklist","header":"체크리스트","title":"이번 달 개발자 체크리스트(10)","bodyMd":"1. Node.js permission model은 보안 경계로 쓰지 않고 realpath allowlist+OS 격리를 기본으로 둡니다.\n2. 파일 경로는 문자열 검증이 아니라 정규화+realpath 기준으로만 검증합니다.\n3. `vm`으로 유저 코드를 실행하지 않고 불가피하면 별도 프로세스/컨테이너로 격리합니다.\n4. UDS(로컬 소켓) 경로는 입력에서 직접 받지 않고 allowlist로 고정합니다.\n5. EOL 개발 도구/확장은 즉시 제거하고 조직 표준 allowlist로만 설치합니다.\n6. Node.js 런타임을 보안 릴리스 버전으로 업데이트합니다.\n7. `fs.futimes()` 사용 여부를 점검하고 보안 의미로 파일 타임스탬프를 신뢰하지 않도록 설계를 바꿉니다.\n8. Struts 사용 시 S2-069 패치 버전으로 업그레이드하고 XML 파서에서 DTD/외부 엔티티를 비활성화합니다.\n9. JasperReports 사용 시 외부 템플릿 업로드/로딩 경로를 차단하고 컴포넌트를 업데이트합니다.\n10. 워크스페이스 신뢰를 기본 거부로 두고 신뢰된 레포에서만 확장을 실행합니다.","actionMd":"이번 카드의 항목을 완료 처리합니다.","source":"https://nodejs.org/en/blog/vulnerability/december-2025-security-releases"}
-->

# (6) 참고자료

- https://nodejs.org/en/blog/vulnerability/december-2025-security-releases
- https://cveawg.mitre.org/api/cve/CVE-2025-55131
- https://cveawg.mitre.org/api/cve/CVE-2025-55130
- https://cveawg.mitre.org/api/cve/CVE-2026-21636
- https://cveawg.mitre.org/api/cve/CVE-2025-55132
- https://cwiki.apache.org/confluence/display/WW/S2-069
- https://cveawg.mitre.org/api/cve/CVE-2025-68493
- https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability
- https://cveawg.mitre.org/api/cve/CVE-2025-10492
- https://spring.io/security/cve-2026-22718
- https://github.com/advisories/GHSA-h34g-p94m-h76q
- https://cveawg.mitre.org/api/cve/CVE-2026-22718
