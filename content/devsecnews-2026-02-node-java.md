# DevSecNews 2026-02 — Node.js/Java 보안 요약(개발자용)

# (0) Editor's Note

이번 달 Editors Pick은 Google Responsible AI Progress Report 2026을 검토한 관점에서 정리했습니다. 보고서의 핵심은 에이전트 안전을 User Alignment Critic, Agent Origin Sets, Mandatory Human Oversight로 다층 통제하는 구조입니다. 동시에 모델 기반 통제의 한계(우회·공모·인지 프레이밍 왜곡)도 남아 있어, 이번 달 이슈는 패치와 신뢰 경계 정책을 함께 적용하는 항목으로 선정했습니다. 자세한 메모는 https://github.com/windshock/devsecnews/blob/main/editorial/2026-02/01.md 를 참고해야 합니다. [Source] https://ai.google/static/documents/ai-responsibility-update-2026.pdf (날짜 미표기)

두 번째 Editors Pick은 ClawHub/ClawdBot 악성 스킬 캠페인 분석입니다. 최근 공격은 SKILL.md 내부 페이로드를 외부 웹사이트로 분리해 정적 스캐닝을 우회하는 방향으로 진화했습니다. 이 때문에 스킬 파일만 검사하지 말고 prerequisite 설치 유도 링크와 런타임 네트워크 행위를 함께 점검해야 합니다. 자세한 메모는 https://github.com/windshock/devsecnews/blob/main/editorial/2026-02/02.md 를 참고해야 합니다. [Source] https://opensourcemalware.com/blog/malicious-clawhub-skills-hide-in-plain-sight (2026-02-09)

<!--CARD
{"id":"editorial-1","kind":"editorial","domain":"editorial","header":"에디터 노트","title":"Editors Pick (2026-02): Google Responsible AI Progress Report 2026 관점","bodyMd":"이번 달 Editors Pick은 Google Responsible AI Progress Report 2026을 검토한 관점에서 정리했습니다.\n\n핵심은 User Alignment Critic, Agent Origin Sets, Mandatory Human Oversight로 구성된 다층 통제 구조입니다.\n\n동시에 모델 기반 통제의 한계(우회·공모·인지 프레이밍 왜곡)가 남아 있어, 이번 달 이슈는 패치와 신뢰 경계 정책을 함께 적용하는 항목으로 선정했습니다.\n\n자세한 메모는 https://github.com/windshock/devsecnews/blob/main/editorial/2026-02/01.md 를 참고해야 합니다.","source":"https://ai.google/static/documents/ai-responsibility-update-2026.pdf"}
-->
<!--CARD
{"id":"editorial-2","kind":"editorial","domain":"editorial","header":"에디터 노트","title":"Editors Pick (2026-02): ClawHub/ClawdBot 악성 스킬 캠페인","bodyMd":"두 번째 Editors Pick은 ClawHub/ClawdBot 악성 스킬 캠페인 분석입니다.\n\n최근 공격은 SKILL.md 내부 페이로드를 외부 웹사이트로 분리해 정적 스캐닝을 우회하는 방향으로 진화했습니다.\n\n스킬 파일 정적 검사만으로는 부족하므로 prerequisite 설치 유도 링크와 런타임 네트워크 행위를 함께 점검해야 합니다.\n\n자세한 메모는 https://github.com/windshock/devsecnews/blob/main/editorial/2026-02/02.md 를 참고해야 합니다.","source":"https://opensourcemalware.com/blog/malicious-clawhub-skills-hide-in-plain-sight"}
-->

# (1) Summary

- Swiper는 옵션 병합 과정에서 Prototype Pollution이 가능한 취약점(CVE-2026-27212)이 공개됐습니다. `swiper`를 11.2.10/12.0.2 이상으로 업데이트하고 사용자 입력 객체 직접 병합을 중지해야 합니다. [Source] https://github.com/advisories/GHSA-hmx5-qpq5-p643 (2026-02-19)
- OpenClaw는 `apply_patch` 경로 검증 미흡으로 workspace 밖 파일 쓰기/삭제가 가능한 취약점이 공개됐습니다. 도구 실행 경로를 샌드박스로 고정하고 최신 버전으로 업데이트해야 합니다. [Source] https://github.com/advisories/GHSA-r5fq-947m-xm57 (2026-02-19)
- OpenClaw는 safeBins 처리에서도 정보 노출/우회 관련 취약점이 동시에 공개됐습니다. 안전 명령 allowlist와 출력 제한을 함께 적용해야 합니다. [Source] https://github.com/advisories/GHSA-6c9j-x93c-rw6j (2026-02-19)
- Apache Tomcat은 클라이언트 인증 우회(CVE-2025-66614)와 보안 제약 우회(CVE-2026-24733)가 2월에 공개됐습니다. 9.0.99/10.1.35/11.0.3 이상으로 즉시 업데이트해야 합니다. [Source] https://github.com/advisories/GHSA-fpj8-gq4v-p354 (2026-02-17)
- Apache Avro Java SDK는 코드 인젝션(CVE-2025-33042)이 공개됐습니다. `org.apache.avro:avro`를 패치 버전으로 올리고 schema 입력 검증을 강화해야 합니다. [Source] https://github.com/advisories/GHSA-rp46-r563-jrc7 (2026-02-13)
- 이번 달 공통 포인트는 “입력값 자체보다 신뢰 경계(병합/경로/프로토콜)가 무너지면 즉시 취약점으로 연결된다”는 점입니다. 패치와 설정 변경을 같은 PR에서 함께 반영해야 합니다. [Source] https://github.com/advisories/GHSA-qq5r-98hh-rxc9 (2026-02-17)

<!--CARD
{"id":"summary-1","kind":"summary","domain":"node","header":"요약","title":"Swiper Prototype Pollution","bodyMd":"옵션 병합 과정에서 Prototype Pollution 취약점이 공개됐습니다.","whyMd":"사용자 입력 객체를 직접 병합하면 전역 오염으로 이어질 수 있습니다.","impactMd":"권한 우회 또는 예기치 않은 코드 흐름이 발생할 수 있습니다.","actionMd":"swiper를 11.2.10/12.0.2 이상으로 업데이트합니다.","source":"https://github.com/advisories/GHSA-hmx5-qpq5-p643"}
-->
<!--CARD
{"id":"summary-2","kind":"summary","domain":"node","header":"요약","title":"OpenClaw Path Traversal","bodyMd":"apply_patch 경로 검증 미흡으로 workspace 밖 파일 조작이 가능했습니다.","whyMd":"경로 정규화 누락은 샌드박스 경계를 무너뜨립니다.","impactMd":"로컬 파일 변조/삭제로 이어질 수 있습니다.","actionMd":"도구 실행 경로를 샌드박스로 고정하고 업데이트합니다.","source":"https://github.com/advisories/GHSA-r5fq-947m-xm57"}
-->
<!--CARD
{"id":"summary-3","kind":"summary","domain":"node","header":"요약","title":"OpenClaw safeBins 정보 노출","bodyMd":"safeBins 처리에서 정보 노출 취약점이 공개됐습니다.","whyMd":"명령 안전장치의 누락은 우회 경로를 만듭니다.","impactMd":"내부 파일/실행 정보 노출 가능성이 증가합니다.","actionMd":"안전 명령 allowlist와 출력 제한을 적용합니다.","source":"https://github.com/advisories/GHSA-6c9j-x93c-rw6j"}
-->
<!--CARD
{"id":"summary-4","kind":"summary","domain":"java","header":"요약","title":"Tomcat 인증/제약 우회","bodyMd":"Tomcat에서 인증 우회와 제약 우회가 2월에 공지됐습니다.","whyMd":"프로토콜/인증 경계가 맞닿은 구간은 우회 표면이 됩니다.","impactMd":"보호 경로 접근 허용으로 이어질 수 있습니다.","actionMd":"Tomcat을 패치 버전으로 즉시 업데이트합니다.","source":"https://github.com/advisories/GHSA-fpj8-gq4v-p354"}
-->
<!--CARD
{"id":"summary-5","kind":"summary","domain":"java","header":"요약","title":"Avro Java SDK 코드 인젝션","bodyMd":"Avro Java SDK 코드 인젝션 취약점이 공개됐습니다.","whyMd":"schema 처리 경로가 입력 검증 없이 노출되면 위험합니다.","impactMd":"원격 코드 실행 가능성으로 확장될 수 있습니다.","actionMd":"org.apache.avro:avro를 패치 버전으로 업데이트합니다.","source":"https://github.com/advisories/GHSA-rp46-r563-jrc7"}
-->
<!--CARD
{"id":"summary-6","kind":"summary","domain":"common","header":"요약","title":"공통: 신뢰 경계 고정","bodyMd":"병합/경로/프로토콜 경계 검증 누락이 공통 원인이었습니다.","whyMd":"취약점은 대부분 경계 처리 코드에서 시작됩니다.","impactMd":"패치 후에도 동일 패턴으로 재발할 수 있습니다.","actionMd":"패치와 설정 변경을 같은 PR에서 반영합니다.","source":"https://github.com/advisories/GHSA-qq5r-98hh-rxc9"}
-->

<!--CARD
{"id":"checklist-1","kind":"checklist","header":"체크리스트","title":"이번 달 개발자 체크리스트(10)","bodyMd":"1. swiper를 11.2.10/12.0.2 이상으로 업데이트합니다.\n2. merge 전에 위험 키를 제거합니다.\n3. OpenClaw를 최신 버전으로 업데이트합니다.\n4. OpenClaw 실행 경로를 workspace 하위로 강제합니다.\n5. safeBins allowlist와 출력 제한을 적용합니다.\n6. Tomcat을 9.0.99/10.1.35/11.0.3 이상으로 올립니다.\n7. 인증/보안 제약 매핑을 재검증합니다.\n8. org.apache.avro:avro를 패치 버전으로 올립니다.\n9. Avro schema 입력 검증을 선행합니다.\n10. CI에서 취약 버전 탐지 시 배포를 중단합니다.","actionMd":"이번 카드의 항목을 완료 처리합니다.","source":"https://github.com/advisories/GHSA-hmx5-qpq5-p643"}
-->

# (2) Node.js

## (2.1) CVE/이슈 표

| CVE | 영향 버전 | 공격 영향(C/I/A) | 악용 여부(in-the-wild) | 권장 조치(업데이트/완화책) | Source URL |
|---|---|---|---|---|---|
| CVE-2026-27212 | `swiper` < 11.2.10 또는 12.0.0~12.0.1 | I | 확인 불가 | `swiper`를 11.2.10/12.0.2 이상으로 업데이트하고 untrusted 객체 직접 merge를 중지합니다. | https://github.com/advisories/GHSA-hmx5-qpq5-p643 (2026-02-19) |
| GHSA-r5fq-947m-xm57 | `openclaw` (공지 참조) | C/I | 확인 불가 | OpenClaw를 업데이트하고 `apply_patch` 대상 경로를 workspace 내부로 제한합니다. | https://github.com/advisories/GHSA-r5fq-947m-xm57 (2026-02-19) |
| GHSA-6c9j-x93c-rw6j | `openclaw` (공지 참조) | C | 확인 불가 | safeBins allowlist를 강화하고 명령 출력/에러 노출을 제한합니다. | https://github.com/advisories/GHSA-6c9j-x93c-rw6j (2026-02-19) |

## (2.2) 항목별 설명

### 영향 여부 자가진단 (빠른 확인)

```bash
npm ls swiper openclaw --depth=2
npm audit --omit=dev
```

영향 버전이 확인되면 패치 버전으로 즉시 업데이트해야 합니다.

<a id="node-swiper-cve-2026-27212"></a>
### CVE-2026-27212: Swiper Prototype Pollution

옵션 병합에 사용자 입력 객체가 직접 들어가면 프로토타입 오염이 발생할 수 있습니다. 위험 키를 제거한 뒤 병합하고 패치 버전으로 업데이트해야 합니다. [Source] https://github.com/advisories/GHSA-hmx5-qpq5-p643 (2026-02-19)

<a id="node-openclaw-ghsa-r5fq-947m-xm57"></a>
### GHSA-r5fq-947m-xm57: OpenClaw `apply_patch` Path Traversal

경로 검증이 약하면 workspace 밖 파일 조작이 가능합니다. `apply_patch` 대상 경로를 workspace 내부로 강제하고 도구를 최신 버전으로 업데이트해야 합니다. [Source] https://github.com/advisories/GHSA-r5fq-947m-xm57 (2026-02-19)

<a id="node-openclaw-ghsa-6c9j-x93c-rw6j"></a>
### GHSA-6c9j-x93c-rw6j: OpenClaw safeBins 정보 노출

safeBins 처리 경계가 약하면 명령/파일 관련 정보 노출로 이어질 수 있습니다. 안전 명령 allowlist를 강화하고 출력 제한을 적용해야 합니다. [Source] https://github.com/advisories/GHSA-6c9j-x93c-rw6j (2026-02-19)

## (2.3) 이번 달 취약 개발 패턴 Top 5

<a id="node-pattern-1"></a>
### 1) 설정 객체를 사용자 입력과 그대로 병합

공격자는 `__proto__` 키를 주입해 런타임 객체를 오염시킵니다. 병합 전에 위험 키를 제거하고 스키마 검증을 통과한 필드만 반영해야 합니다.

안 좋은 예:

```js
Object.assign(config, req.body.params)
```

안전한 대안:

```js
const { __proto__, constructor, prototype, ...safe } = req.body.params || {}
Object.assign(config, safe)
```

객체 병합 지점은 스키마 검증 통과 입력만 허용하도록 고정해야 합니다.
[Source] https://github.com/advisories/GHSA-hmx5-qpq5-p643 (2026-02-19)

### 2) 경로 정규화 없이 파일 수정 기능을 노출

공격자는 `../` 경로를 이용해 작업 디렉터리 밖 파일을 조작합니다. 파일 수정 기능은 기준 루트 경로를 강제하고 탈출 시 즉시 차단해야 합니다.

안 좋은 예:

```js
fs.writeFileSync(userInput.path, content)
```

안전한 대안:

```js
const p = path.resolve(ROOT, userInput.path)
if (!p.startsWith(ROOT + path.sep)) throw new Error("blocked")
fs.writeFileSync(p, content)
```

파일 수정 API 앞단에 경로 정규화 검증을 강제해야 합니다.
[Source] https://github.com/advisories/GHSA-r5fq-947m-xm57 (2026-02-19)

### 3) 안전 명령 allowlist를 운영 중에 완화

공격자는 완화된 allowlist를 우회 경로로 사용합니다. 안전 명령 목록을 고정하고 예외 허용은 운영 승인 절차로 제한해야 합니다.

안 좋은 예:

```js
ALLOWED_CMDS.add(userInput.command)
```

안전한 대안:

```js
if (!ALLOWED_CMDS.has(userInput.command)) throw new Error("blocked")
```

명령 allowlist 변경은 코드 리뷰 필수 항목으로 고정해야 합니다.
[Source] https://github.com/advisories/GHSA-6c9j-x93c-rw6j (2026-02-19)

### 4) 취약 버전 범위를 CI에서 차단하지 않음

공격자는 공개된 affected version 범위를 기준으로 자동 스캔합니다. 취약 범위 탐지 시 배포를 중단하도록 파이프라인을 구성해야 합니다.

안 좋은 예:

```js
// audit 경고만 출력하고 배포 진행
```

안전한 대안:

```js
// high/critical 취약점이 있으면 배포 파이프라인 중단
```

취약 버전 차단 게이트를 CI 기본 정책으로 고정해야 합니다.
[Source] https://github.com/advisories/GHSA-hmx5-qpq5-p643 (2026-02-19)

### 5) 패치 후 경계 테스트를 생략

공격자는 패치 누락 경로나 설정 회귀를 노립니다. 보안 경계 테스트를 릴리스 게이트에 포함해야 합니다.

안 좋은 예:

```js
// 기능 테스트만 통과하면 배포
```

안전한 대안:

```js
// merge/path/allowlist 보안 테스트를 릴리스 게이트에 포함
```

보안 회귀 테스트를 릴리스 체크리스트에 고정해야 합니다.
[Source] https://github.com/advisories/GHSA-r5fq-947m-xm57 (2026-02-19)

# (3) Java

## (3.1) CVE/이슈 표

| CVE | 영향 버전 | 공격 영향(C/I/A) | 악용 여부(in-the-wild) | 권장 조치(업데이트/완화책) | Source URL |
|---|---|---|---|---|---|
| CVE-2025-66614 | Apache Tomcat (공지 참조) | C/I | 확인 불가 | Tomcat을 9.0.99/10.1.35/11.0.3 이상으로 올리고 클라이언트 인증 설정을 재검증합니다. | https://github.com/advisories/GHSA-fpj8-gq4v-p354 (2026-02-17)<br>https://cveawg.mitre.org/api/cve/CVE-2025-66614 (날짜 미표기) |
| CVE-2026-24733 | Apache Tomcat (공지 참조) | I | 확인 불가 | HTTP/0.9 우회 경로를 차단하고 보안 제약 매핑을 재검증합니다. | https://github.com/advisories/GHSA-qq5r-98hh-rxc9 (2026-02-17)<br>https://cveawg.mitre.org/api/cve/CVE-2026-24733 (날짜 미표기) |
| CVE-2025-33042 | `org.apache.avro:avro` (공지 참조) | C/I | 확인 불가 | Avro Java SDK를 패치 버전으로 업데이트하고 schema 처리 입력 검증을 강화합니다. | https://github.com/advisories/GHSA-rp46-r563-jrc7 (2026-02-13)<br>https://cveawg.mitre.org/api/cve/CVE-2025-33042 (날짜 미표기) |

## (3.2) 항목별 설명

### 영향 여부 자가진단 (빠른 확인)

```bash
mvn -q -DskipTests dependency:tree | grep -Ei "tomcat-catalina|org.apache.avro:avro" || true
```

영향 버전이 확인되면 패치 버전으로 즉시 업데이트해야 합니다.

<a id="java-cve-2025-66614"></a>
### CVE-2025-66614: Tomcat 클라이언트 인증 우회

클라이언트 인증 경계가 무너지면 보호 자원 접근 검증이 우회될 수 있습니다. Tomcat을 패치 버전으로 업데이트하고 인증 커넥터 설정을 재검증해야 합니다. [Source] https://github.com/advisories/GHSA-fpj8-gq4v-p354 (2026-02-17)
[Source] https://tomcat.apache.org/security-11.html (2026-02-17)

<a id="java-cve-2026-24733"></a>
### CVE-2026-24733: Tomcat 보안 제약 우회(HTTP/0.9)

레거시 프로토콜 경로를 통한 보안 제약 우회가 가능하면 경로 기반 접근제어가 무력화됩니다. HTTP/0.9 경로를 차단하고 보안 제약 매핑을 다시 점검해야 합니다. [Source] https://github.com/advisories/GHSA-qq5r-98hh-rxc9 (2026-02-17)
[Source] https://tomcat.apache.org/security-10.html (2026-02-17)

<a id="java-cve-2025-33042"></a>
### CVE-2025-33042: Apache Avro Java SDK 코드 인젝션

Schema/데이터 처리 경로에서 입력 검증이 약하면 코드 인젝션으로 이어질 수 있습니다. Avro SDK를 패치 버전으로 업데이트하고 schema 입력 검증을 강화해야 합니다. [Source] https://github.com/advisories/GHSA-rp46-r563-jrc7 (2026-02-13)
[Source] https://cveawg.mitre.org/api/cve/CVE-2025-33042 (날짜 미표기)

## (3.3) 이번 달 취약 개발 패턴 Top 5

### 1) 인증 커넥터 설정을 기본값으로 운영

공격자는 기본 설정이 남아 있는 인증 경계를 우회합니다. 인증 설정을 운영 기준으로 명시하고 릴리스마다 재검증해야 합니다.

안 좋은 예:

```xml
<Connector protocol="HTTP/1.1" clientAuth="false" />
```

안전한 대안:

```xml
<Connector protocol="HTTP/1.1" clientAuth="true" />
```

인증 설정 검증을 배포 전 체크리스트에 고정해야 합니다.
[Source] https://github.com/advisories/GHSA-fpj8-gq4v-p354 (2026-02-17)

### 2) 레거시 프로토콜 경로를 방치

공격자는 레거시 경로를 통해 접근제어를 우회합니다. HTTP/0.9 등 불필요한 경로를 비활성화하고 보안 제약 매핑을 검증해야 합니다.

안 좋은 예:

```text
프로토콜 호환성을 위해 레거시 처리 경로를 기본 허용
```

안전한 대안:

```text
레거시 프로토콜 경로를 비활성화하고 허용 목록만 운영
```

레거시 경로 차단 정책을 기본값으로 고정해야 합니다.
[Source] https://github.com/advisories/GHSA-qq5r-98hh-rxc9 (2026-02-17)

### 3) schema 처리 입력에 타입/길이 검증 누락

공격자는 schema 처리 경로에 비정상 입력을 주입합니다. schema 필드 타입/길이/허용 값 검증을 선행해야 합니다.

안 좋은 예:

```java
Schema schema = new Schema.Parser().parse(userInputSchema);
```

안전한 대안:

```java
if (userInputSchema.length() > MAX_SCHEMA_SIZE) throw new IllegalArgumentException();
Schema schema = new Schema.Parser().parse(userInputSchema);
```

schema 처리 API 앞단에 입력 검증 공통 모듈을 강제해야 합니다.
[Source] https://github.com/advisories/GHSA-rp46-r563-jrc7 (2026-02-13)

### 4) 취약 버전 범위를 빌드 정책에 반영하지 않음

공격자는 공개된 영향 버전을 기준으로 스캔합니다. 취약 범위가 감지되면 빌드를 실패 처리해야 합니다.

안 좋은 예:

```text
SCA 결과를 리포트로만 남기고 배포 진행
```

안전한 대안:

```text
Tomcat/Avro 취약 범위 탐지 시 배포 파이프라인 중단
```

CI 정책에 취약 버전 차단 규칙을 고정해야 합니다.
[Source] https://github.com/advisories/GHSA-rp46-r563-jrc7 (2026-02-13)

### 5) 패치 후 보안 회귀 테스트를 생략

공격자는 패치 누락 경로나 설정 회귀를 노립니다. 보안 회귀 테스트를 릴리스 게이트에 포함해야 합니다.

안 좋은 예:

```text
기능 테스트만 통과하면 배포
```

안전한 대안:

```text
보안 경로 테스트(인증/접근제어/schema 처리)를 릴리스 게이트에 포함
```

보안 회귀 테스트를 릴리스 기준으로 고정해야 합니다.
[Source] https://tomcat.apache.org/security-11.html (2026-02-17)

# (4) 공통 트렌드/권장사항

- Node.js와 Java 모두에서 취약점 핵심은 “신뢰 경계 처리”였습니다. 입력 병합/경로/프로토콜 검증을 코드 레벨에서 강제해야 합니다. [Source] https://github.com/advisories/GHSA-hmx5-qpq5-p643 (2026-02-19)
- 패키지 업데이트만으로는 재발을 막기 어렵습니다. 패치와 설정 변경을 같은 릴리스에 반영해야 합니다. [Source] https://github.com/advisories/GHSA-qq5r-98hh-rxc9 (2026-02-17)
<a id="common-ci-gate"></a>
- 취약 버전 차단을 CI 게이트로 강제하는 방식이 가장 빠른 재발 방지책입니다. 영향을 받는 버전 탐지 시 배포를 중단해야 합니다. [Source] https://github.com/advisories/GHSA-rp46-r563-jrc7 (2026-02-13)

# (6) 참고자료

- https://github.com/advisories/GHSA-hmx5-qpq5-p643
- https://github.com/advisories/GHSA-r5fq-947m-xm57
- https://github.com/advisories/GHSA-6c9j-x93c-rw6j
- https://github.com/advisories/GHSA-fpj8-gq4v-p354
- https://github.com/advisories/GHSA-qq5r-98hh-rxc9
- https://github.com/advisories/GHSA-rp46-r563-jrc7
- https://tomcat.apache.org/security-11.html
- https://tomcat.apache.org/security-10.html
- https://cveawg.mitre.org/api/cve/CVE-2025-66614
- https://cveawg.mitre.org/api/cve/CVE-2026-24733
- https://cveawg.mitre.org/api/cve/CVE-2025-33042
- https://ai.google/static/documents/ai-responsibility-update-2026.pdf
- https://github.com/windshock/devsecnews/blob/main/editorial/2026-02/01.md
- https://opensourcemalware.com/blog/malicious-clawhub-skills-hide-in-plain-sight
- https://github.com/windshock/devsecnews/blob/main/editorial/2026-02/02.md
