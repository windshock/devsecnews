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

# (7) 참고자료

- https://nodejs.org/en/blog/vulnerability/december-2025-security-releases
- https://skyve.org/blog/2026/1/12/security-advisory-cve-2025-10492-jaspersoft-library-deserialisation-vulnerability
- https://cwiki.apache.org/confluence/display/WW/S2-069
- https://spring.io/security/cve-2026-22718
