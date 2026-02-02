# DevSecNews 2026-01 — Node.js/Java 보안 요약(개발자용)

# (0) Editor's Note

Moltbot/ClawdBot(OpenClaw) 생태계 위협 동향의 핵심은 “관리 인터페이스 노출 + 느슨한 공급망 통제”가 결합되면 계정 탈취로 직결된다는 점입니다. 백엔드/관리 포트가 외부에 열려 있고 토큰·키가 평문으로 남아 있으면, 공격자는 별도 취약점 없이 takeover를 시작합니다.

또한 악성 스킬/플러그인 캠페인은 설치 유도만으로도 피해를 만듭니다. 승인된 스킬만 허용하고, 실행은 샌드박스로 제한하며, 외부 실행 파일/암호 ZIP/보안 경고 무시는 금지해야 합니다.

Node.js 쪽은 async_hooks가 켜진 상태에서 재귀 기반 스택 오버플로가 “잡히지 않는 장애”로 이어질 수 있습니다. 런타임 업데이트와 재귀 깊이 제한을 기본값으로 두고, 문제 재현 테스트를 빌드 파이프라인에 포함하는 게 안전합니다.

자세히 보기: https://github.com/windshock/devsecnews/blob/main/editorial/2026-01/01.md
https://github.com/windshock/devsecnews/blob/main/editorial/2026-01/02.md

# (1) Summary

- Node.js는 20/22/24/25 라인 보안 릴리스를 배포했습니다. 이번 달은 권한 모델과 `vm` 타임아웃 이슈가 핵심이어서 런타임을 보안 릴리스 버전으로 업데이트해야 합니다. [Source] https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)
- 권한 모델의 symlink 우회(CVE-2025-55130)는 문자열 경로 검증을 깨뜨립니다. 그래서 허용 경로는 `realpath(심볼릭 링크 해소 경로)` 기준 allowlist로 검증해야 합니다. [Source] https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)
- 권한 모델의 UDS(로컬 소켓) 우회(CVE-2026-21636)는 네트워크 차단을 무력화합니다. 소켓 경로는 입력에서 직접 받지 말고 allowlist로 고정해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2026-21636 (날짜 미표기)
- Struts S2-069(XXE, CVE-2025-68493)는 XML 파서 기본값이 공격 통로가 됩니다. Struts를 6.1.1 이상으로 올리고, XML 파서에서 DTD/외부 엔티티를 비활성화해야 합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19)
- JasperReports 역직렬화(CVE-2025-10492)는 외부 템플릿/직렬화 입력이 곧 RCE로 이어집니다. 템플릿 업로드는 차단하고, 필요하면 격리된 렌더러로 분리해야 합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)
- EOL 개발 도구 확장(CVE-2026-22718)은 패치가 없습니다. 확장을 제거하고 워크스페이스 신뢰는 기본 거부로 둬야 합니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-13)

<!--CARD
{"id":"editorial-1","kind":"editorial","header":"에디터 노트","title":"Moltbot/ClawdBot(OpenClaw) 위협 동향 + async_hooks 장애 포인트","bodyMd":"Moltbot/ClawdBot(OpenClaw) 생태계 위협 동향의 핵심은 “관리 인터페이스 노출 + 느슨한 공급망 통제”가 결합되면 계정 탈취로 직결된다는 점입니다. 백엔드/관리 포트가 외부에 열려 있고 토큰·키가 평문으로 남아 있으면, 공격자는 별도 취약점 없이 takeover를 시작합니다.\n\n악성 스킬/플러그인 캠페인은 설치 유도만으로도 피해를 만듭니다. 승인된 스킬만 허용하고, 실행은 샌드박스로 제한하며, 외부 실행 파일/암호 ZIP/보안 경고 무시는 금지해야 합니다.\n\nNode.js 쪽은 async_hooks가 켜진 상태에서 재귀 기반 스택 오버플로가 “잡히지 않는 장애”로 이어질 수 있습니다. 런타임 업데이트와 재귀 깊이 제한을 기본값으로 두고, 문제 재현 테스트를 빌드 파이프라인에 포함하는 게 안전합니다.\n\n자세히 보기: https://github.com/windshock/devsecnews/blob/main/editorial/2026-01/01.md\nhttps://github.com/windshock/devsecnews/blob/main/editorial/2026-01/02.md","source":"https://github.com/windshock/devsecnews/blob/main/editorial/2026-01/01.md"}
-->
<!--CARD
{"id":"summary-1","kind":"summary","header":"요약","title":"Node.js 보안 릴리스 업데이트","bodyMd":"20/22/24/25 라인 보안 릴리스가 나왔습니다. 권한 모델과 vm 타임아웃 이슈가 핵심입니다.","whyMd":"런타임 취약점은 앱 코드 경계 밖에서 바로 노출됩니다.","impactMd":"메모리 노출·권한 우회로 이어질 수 있습니다.","actionMd":"런타임을 보안 릴리스 버전으로 업데이트합니다.","source":"https://nodejs.org/es/blog/vulnerability/december-2025-security-releases "}
-->
<!--CARD
{"id":"summary-2","kind":"summary","header":"요약","title":"symlink 우회 경로 검증","bodyMd":"권한 모델의 문자열 기반 경로 검증이 우회됩니다. realpath 기준으로 바꿉니다.","whyMd":"symlink 체인은 allowlist를 쉽게 탈출합니다.","impactMd":"허용 디렉터리 밖 파일 접근이 가능합니다.","actionMd":"realpath 기반 allowlist로 경로를 검증합니다.","source":"https://nodejs.org/es/blog/vulnerability/december-2025-security-releases "}
-->
<!--CARD
{"id":"summary-3","kind":"summary","header":"요약","title":"UDS 우회 차단","bodyMd":"UDS 경로 입력을 허용하면 네트워크 차단이 무력화됩니다.","whyMd":"로컬 소켓은 내부 서비스 접근 통로입니다.","impactMd":"권한 경계를 넘어 내부 소켓에 접근합니다.","actionMd":"UDS 경로는 allowlist로 고정합니다.","source":"https://cveawg.mitre.org/api/cve/CVE-2026-21636 "}
-->
<!--CARD
{"id":"summary-4","kind":"summary","header":"요약","title":"Struts S2-069(XXE)","bodyMd":"XML 파서 기본값이 남아 있으면 XXE가 열립니다.","whyMd":"외부 엔티티/DTD가 공격 경로가 됩니다.","impactMd":"내부 파일 노출이나 SSRF로 이어집니다.","actionMd":"Struts를 6.1.1 이상으로 업데이트합니다.","source":"https://cwiki.apache.org/confluence/display/WW/S2-069 "}
-->
<!--CARD
{"id":"summary-5","kind":"summary","header":"요약","title":"JasperReports 역직렬화 경계","bodyMd":"외부 템플릿/직렬화 입력이 RCE로 이어집니다.","whyMd":"역직렬화 입력은 가젯 체인으로 연결됩니다.","impactMd":"서비스 계정 권한으로 코드가 실행됩니다.","actionMd":"템플릿 업로드를 차단합니다.","source":"https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability "}
-->
<!--CARD
{"id":"summary-6","kind":"summary","header":"요약","title":"EOL 확장 즉시 제거","bodyMd":"EOL 개발 도구는 패치가 없습니다. 확장을 즉시 제거합니다.","whyMd":"개발자 PC에서 명령 실행으로 이어집니다.","impactMd":"로컬 권한으로 임의 명령이 실행됩니다.","actionMd":"확장을 제거하고 워크스페이스 신뢰를 기본 거부로 둡니다.","source":"https://spring.io/security/cve-2026-22718 "}
-->


# (5) 이번 달 개발자 체크리스트

1. Node.js 런타임을 보안 릴리스 버전으로 업데이트해야 합니다. [Source] https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)
2. 권한 모델 경로 검증은 `realpath(심볼릭 링크 해소 경로)` 기준 allowlist로 바꿔야 합니다. [Source] https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)
3. `vm`+`timeout` 조합으로 유저 코드를 실행하지 말고, 필요하면 별도 프로세스/컨테이너로 격리하세요. [Source] https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)
4. UDS(로컬 소켓) 경로는 입력에서 직접 받지 말고 allowlist로 고정해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2026-21636 (날짜 미표기)
5. Struts는 6.1.1 이상으로 올려야 합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19)
6. XML 파서에서 DTD/외부 엔티티를 비활성화해야 합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19)
7. JasperReports 외부 템플릿 업로드/로딩 경로는 차단하세요. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)
8. JasperReports 관련 컴포넌트는 최신 패치 버전으로 올려야 합니다. [Source] https://community.jaspersoft.com/advisories/jaspersoft-security-advisory-september-16-2025-jaspersoft-library-cve-2025-10492-r6 (2025-09-16)
9. Spring CLI VSCode 확장은 제거하세요. [Source] https://spring.io/security/cve-2026-22718 (2026-01-13)
10. 신뢰되지 않은 워크스페이스는 기본 거부로 둬야 합니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-13)

<!--CARD
{"id":"checklist-1","kind":"checklist","header":"체크리스트","title":"이번 달 개발자 체크리스트(10)","bodyMd":"1. Node.js 런타임을 보안 릴리스 버전으로 업데이트합니다.\n2. 권한 모델 경로 검증은 realpath 기준 allowlist로 바꿉니다.\n3. vm+timeout 조합으로 유저 코드를 실행하지 않고 격리합니다.\n4. UDS 경로는 allowlist로 고정합니다.\n5. Struts를 6.1.1 이상으로 업데이트합니다.\n6. XML 파서에서 DTD/외부 엔티티를 비활성화합니다.\n7. JasperReports 외부 템플릿 업로드/로딩 경로를 차단합니다.\n8. JasperReports 관련 컴포넌트를 최신 패치로 업데이트합니다.\n9. Spring CLI VSCode 확장을 제거합니다.\n10. 신뢰되지 않은 워크스페이스는 기본 거부로 둡니다.","actionMd":"이번 카드의 항목을 완료 처리합니다.","source":"https://nodejs.org/es/blog/vulnerability/december-2025-security-releases "}
-->

# (2) Node.js

## (2.1) CVE/이슈 표

| CVE | 영향 버전 | 공격 영향(C/I/A) | 악용 여부(in-the-wild) | 권장 조치(업데이트/완화책) | Source URL |
|---|---|---|---|---|---|
| CVE-2025-55131 | Node.js v20/v22/v24/v25 (Active release lines) | C/I | 확인 불가 | Node.js를 보안 릴리스 버전으로 업데이트하고 `vm`+`timeout` 조합을 격리/제거합니다. | https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)<br>https://cveawg.mitre.org/api/cve/CVE-2025-55131 (날짜 미표기) |
| CVE-2025-55130 | Node.js permission model 사용 시(v20/v22/v24/v25) | C/I | 확인 불가 | Node.js를 업데이트하고 허용 경로를 realpath 기준 allowlist로 검증하며 symlink 체인을 차단합니다. | https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)<br>https://cveawg.mitre.org/api/cve/CVE-2025-55130 (날짜 미표기) |
| CVE-2026-21636 | Node.js v25 `--permission` 사용 시 | C/I | 확인 불가 | `--permission`을 보안 경계로 쓰지 않고 UDS 경로 allowlist 및 OS 격리로 보완합니다. | https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)<br>https://cveawg.mitre.org/api/cve/CVE-2026-21636 (날짜 미표기) |
| CVE-2025-55132 | Node.js v20/v22/v24/v25 (permission model 사용 시) | I | 확인 불가 | `fs.futimes()` 사용 여부를 점검하고 보안 의미로 타임스탬프를 신뢰하지 않도록 설계를 바꿉니다. | https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)<br>https://cveawg.mitre.org/api/cve/CVE-2025-55132 (날짜 미표기) |

## (2.2) 항목별 설명

### Node.js 보안 릴리스 (Active release lines)

Node.js가 여러 취약점을 패치한 보안 릴리스를 내놨습니다. 런타임을 최신 보안 버전으로 업데이트합니다. [Source] https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)

### 영향 여부 자가진단 (빠른 확인)

지금 쓰고 있는 런타임 버전과 권한 모델 옵션을 켜뒀는지 확인합니다.

```bash
node -v
ps aux | grep -E "node .*--permission|node .*--allow-fs-" | grep -v grep || true
```

설정된 게 있다면 보안 릴리스 버전으로 업데이트합니다.

### CVE-2025-55131: `vm`+`timeout` 쓰면 메모리 샐 수 있음

`vm` 모듈에서 `timeout`으로 실행을 강제로 끊으면, 버퍼 초기화가 제대로 안 돼서 이전 메모리에 있던 데이터가 노출될 수 있습니다. `vm`으로 유저 코드를 돌리는 건 위험하니 별도 프로세스나 컨테이너로 격리합니다. [Source] https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-55131 (날짜 미표기)

### CVE-2025-55130: 권한 모델, symlink로 우회 가능

`--allow-fs-read` 같은 옵션만 믿으면 안 됩니다. 입력 경로와 symlink 조합으로 권한 밖의 파일에 접근할 수 있습니다. 허용 경로는 반드시 `realpath(심볼릭 링크 해소 경로)` 기준으로 검증합니다. [Source] https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-55130 (날짜 미표기)

### CVE-2026-21636: 네트워크 막아도 UDS(로컬 소켓)는 뚫림

`--permission`으로 네트워크를 막아도 UDS 연결은 열릴 수 있습니다. UDS 경로는 입력에서 직접 받지 말고 allowlist로 고정합니다. [Source] https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)
[Source] https://cveawg.mitre.org/api/cve/CVE-2026-21636 (날짜 미표기)

### CVE-2025-55132: `fs.futimes()`로 타임스탬프 조작

읽기 권한만 있어도 파일 타임스탬프를 바꿀 수 있습니다. 타임스탬프를 보안 신호로 쓰고 있다면 설계를 바꿉니다. [Source] https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-55132 (날짜 미표기)

## (2.3) 이번 달 취약 개발 패턴 Top 5

### 1) “permission 모델을 켰으니 안전”이라는 가정

공격자는 symlink/UDS 같은 우회 경로로 “권한 옵션의 의도”와 다른 접근을 만듭니다. 허용 경로/소켓 경로를 allowlist로 고정합니다. 런타임을 업데이트합니다.

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
[Source] https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)

### 2) symlink/realpath를 고려하지 않은 “경로 검증”

공격자는 문자열 기반 경로 체크를 우회해 허용 디렉터리 밖 파일에 접근합니다. `realpath(심볼릭 링크 해소 경로)` 기준 allowlist 검증을 적용합니다.

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
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-55130 (날짜 미표기)

### 3) `vm`에서 유저 코드를 돌리고 timeout으로 끊기

공격자는 타이밍 경합으로 버퍼 초기화/정리 타이밍을 흔들어 정보 노출을 유도합니다. 유저 코드는 별도 프로세스/컨테이너로 격리합니다. 결과는 IPC로만 받습니다.

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
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-55131 (날짜 미표기)

### 4) UDS 경로를 입력으로 받아 내부 소켓에 연결

공격자는 네트워크 권한 경계를 우회하기 위해 로컬 소켓(UDS) 경로를 입력으로 주입합니다. UDS 경로는 allowlist로 고정하고 입력에서 직접 받지 않습니다.

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
[Source] https://cveawg.mitre.org/api/cve/CVE-2026-21636 (날짜 미표기)

### 5) 파일 타임스탬프를 보안 신호로 신뢰

공격자는 메타데이터(타임스탬프) 조작 가능성을 악용합니다. 타임스탬프를 보안 판단에 직접 쓰지 않고 별도 감사 이벤트로 전환합니다.

안 좋은 예:

```js
if (stat.mtimeMs < lastSeen) deny() // 타임스탬프를 보안 판단으로 사용
```

안전한 대안:

```js
// 파일 내용 해시/서명 검증 + 별도 감사 이벤트 기록으로 전환
```

팀 규칙으로 고정합니다.
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-55132 (날짜 미표기)

팀이 오늘 적용할 규칙/코드 조치를 PR 체크리스트에 반영합니다.

## (2.4) 운영 참고(선택)

# (3) Java

## (3.1) CVE/이슈 표

| CVE | 영향 버전 | 공격 영향(C/I/A) | 악용 여부(in-the-wild) | 권장 조치(업데이트/완화책) | Source URL |
|---|---|---|---|---|---|
| CVE-2025-68493 (S2-069) | Apache Struts 영향 버전(공지 참조) | C/I/A | 확인 불가 | Struts를 6.1.1 이상으로 업데이트하고 XML 파서에서 DTD/외부 엔티티를 비활성화합니다. | https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19)<br>https://cveawg.mitre.org/api/cve/CVE-2025-68493 (날짜 미표기) |
| CVE-2025-10492 | JasperReports 관련 컴포넌트(공지 참조) | C/I/A | 확인 불가 | JasperReports 컴포넌트를 업데이트하고 외부 템플릿/직렬화 입력 경로를 차단합니다. | https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)<br>https://cveawg.mitre.org/api/cve/CVE-2025-10492 (날짜 미표기) |
| CVE-2026-22718 | Spring CLI VSCode Extension <= 0.9.0 (EOL) | C/I | 확인 불가 | 해당 확장을 제거하고 워크스페이스 신뢰를 기본 거부로 설정합니다. | https://spring.io/security/cve-2026-22718 (2026-01-13)<br>https://cveawg.mitre.org/api/cve/CVE-2026-22718 (날짜 미표기) |

## (3.2) 항목별 설명

### CVE-2025-68493 (S2-069): Struts XXE 다시 등장

XML 파서 기본값을 그대로 쓰면 XXE 공격에 또 당할 수 있습니다. Struts를 6.1.1 이상으로 올리고 XML 파서에서 DTD/외부 엔티티를 비활성화합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19)
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-68493 (날짜 미표기)

### CVE-2025-10492: JasperReports 역직렬화 입력

리포트 템플릿을 업로드받아서 그대로 렌더링하면 RCE로 이어집니다. 템플릿 업로드를 차단합니다. 필요하면 격리된 환경에서만 렌더링합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-10492 (날짜 미표기)

### CVE-2026-22718: 개발 도구 확장이 뚫리는 경우

EOL된 개발 도구는 패치가 없습니다. 확장을 제거합니다. 워크스페이스 신뢰를 기본 거부로 둡니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-13)
[Source] https://cveawg.mitre.org/api/cve/CVE-2026-22718 (날짜 미표기)

### 영향 여부 자가진단(빠른 확인)

아래 명령으로 의존성(Struts/JasperReports)과 개발 도구(취약 확장) 설치 여부를 확인합니다.

```bash
mvn -q -DskipTests dependency:tree | grep -Ei "struts2|jasperreports" || true
code --list-extensions | grep -Ei "spring|cli" || true
```

영향 가능성이 있으면 라이브러리를 업데이트하고 확장을 제거합니다.

## (3.3) 이번 달 취약 개발 패턴 Top 5

### 1) 외부 입력(XML)을 파서 기본값으로 처리

공격자는 XXE/정보 노출을 노리고 파서 기본값을 악용합니다. 외부 엔티티/DTD를 비활성화합니다. 허용 스키마만 처리합니다.

안 좋은 예:

```java
Document doc = DocumentBuilderFactory.newInstance()
  .newDocumentBuilder()
  .parse(inputStream);
```

안전한 대안:

```java
DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
f.setFeature("http:apache.org/xml/features/disallow-doctype-decl", true);
f.setFeature("http:xml.org/sax/features/external-general-entities", false);
f.setFeature("http:xml.org/sax/features/external-parameter-entities", false);
```

팀 규칙으로 고정합니다.
[Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19)

### 2) EOL Struts를 그대로 유지

공격자는 패치가 없는 EOL 버전을 노립니다. Struts를 6.1.1 이상으로 업데이트합니다.

안 좋은 예:

```text
Struts 2.x EOL 버전을 그대로 운영
```

안전한 대안:

```text
Struts 6.1.1 이상으로 업데이트
```

팀 규칙으로 고정합니다.
[Source] https://www.mail-archive.com/announcements%40struts.apache.org/msg00144.html (2026-01-11)

### 3) JasperReports 템플릿 업로드를 신뢰

공격자는 템플릿=코드 경로를 노립니다. 템플릿 업로드를 차단합니다. 격리된 렌더러에서만 처리합니다.

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

### 4) JasperReports 역직렬화 입력 경로를 열어둠

공격자는 역직렬화 입력을 통해 가젯 체인을 구성합니다. 외부 직렬화 입력을 차단합니다. 최신 패치로 업데이트합니다.

안 좋은 예:

```java
loadReportFrom(userSuppliedBytes);
```

안전한 대안:

```java
// 외부 직렬화 입력을 차단하고 공식 패치 버전으로 업데이트합니다.
```

팀 규칙으로 고정합니다.
[Source] https://community.jaspersoft.com/advisories/jaspersoft-security-advisory-september-16-2025-jaspersoft-library-cve-2025-10492-r6 (2025-09-16)

### 5) 개발툴/확장이 실행하는 명령을 프로젝트 입력이 좌우

공격자는 레포/워크스페이스 설정으로 개발자 PC에서 명령 실행을 유도합니다. 취약 확장을 제거합니다. 워크스페이스 신뢰를 기본 거부로 둡니다.

안 좋은 예:

```text
workspace 설정값 -> shell command 문자열로 결합 -> 실행
```

안전한 대안:

```text
확장 설치 allowlist + 신뢰되지 않은 워크스페이스 기본 거부 + EOL 확장 제거
```

팀 규칙으로 고정합니다.
[Source] https://spring.io/security/cve-2026-22718 (2026-01-13)

팀이 오늘 적용할 규칙/코드 조치를 PR 체크리스트에 반영합니다.

## (3.4) 운영 참고(선택)

# (4) 공통 트렌드/권장사항

- 권한 모델은 보안 경계로 단정하면 우회가 나옵니다. 런타임을 업데이트합니다. 경로/UDS allowlist를 기본으로 둡니다. [Source] https://nodejs.org/es/blog/vulnerability/december-2025-security-releases (2026-01-13)
- XML 파서 기본값은 공격 통로가 됩니다. DTD/외부 엔티티를 비활성화합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19)
- 템플릿/직렬화 입력은 코드 실행으로 이어집니다. 템플릿 업로드를 차단합니다. [Source] https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability (2026-01-12)
- EOL 개발 도구는 패치가 없습니다. 확장을 제거합니다. [Source] https://spring.io/security/cve-2026-22718 (2026-01-13)

# (6) 참고자료

- https://nodejs.org/es/blog/vulnerability/december-2025-security-releases
- https://cveawg.mitre.org/api/cve/CVE-2025-55131
- https://cveawg.mitre.org/api/cve/CVE-2025-55130
- https://cveawg.mitre.org/api/cve/CVE-2026-21636
- https://cveawg.mitre.org/api/cve/CVE-2025-55132
- https://cwiki.apache.org/confluence/display/WW/S2-069
- https://www.mail-archive.com/announcements%40struts.apache.org/msg00144.html
- https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability
- https://community.jaspersoft.com/advisories/jaspersoft-security-advisory-september-16-2025-jaspersoft-library-cve-2025-10492-r6
- https://cveawg.mitre.org/api/cve/CVE-2025-68493
- https://cveawg.mitre.org/api/cve/CVE-2025-10492
- https://spring.io/security/cve-2026-22718
- https://cveawg.mitre.org/api/cve/CVE-2026-22718
