# DevSecNews 2025-12 — Node.js/Java 보안 요약(개발자용)

# (1) Summary

- Node.js는 2025-12-15 보안 릴리스를 예고했습니다. 권한 모델 우회와 `vm` 타임아웃 기반 메모리 노출을 우선순위로 잡고 런타임을 보안 릴리스 버전으로 올려야 합니다. [Source] https://nodejs.org/ko/blog/vulnerability/december-2025-security-releases (2025-12-15)
- 권한 모델의 symlink 우회(CVE-2025-55130)는 문자열 경로 검증을 깨뜨립니다. 파일 접근 경계는 `realpath(심볼릭 링크 해소 경로)` 기준 allowlist로 고정해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2025-55130 (날짜 미표기)
- 권한 모델의 UDS(로컬 소켓) 우회(CVE-2026-21636)는 네트워크 차단을 무력화합니다. 소켓 경로는 입력에서 직접 받지 말고 코드 상수 allowlist로 박아야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2026-21636 (날짜 미표기)
- Struts S2-069(XXE, CVE-2025-68493)은 2025-12-19 공지된 보안 이슈입니다. Struts를 6.1.1 이상으로 올리고 XML 외부 엔티티를 즉시 차단해야 합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19)
- Apache Solr는 2025-12-09에 extraction 모듈의 XXE 이슈를 공지했습니다. SolrCell/Tika 경계에서는 파싱을 격리 실행으로 분리하고 업로드 입력을 제한해야 합니다. [Source] https://solr.apache.org/security.html (2025-12-09)
- Apache HttpComponents는 2025-12-16 HTTP/2 지원과 핵심 네트워킹 개선을 포함한 릴리스를 공지했습니다. HTTP 클라이언트/코어 버전은 기능 릴리스가 아니라 보안 경계 업데이트로 취급하고 바로 따라가야 합니다. [Source] https://hc.apache.org/news.html (2025-12-16)

<!--CARD
{"id":"summary-1","kind":"summary","header":"요약","domain":"node","title":"Node.js 보안 릴리스 우선 적용","bodyMd":"2025-12-15 보안 릴리스가 핵심입니다. 권한 모델과 vm 타임아웃 이슈를 먼저 봅니다.","whyMd":"런타임 취약점은 앱 코드 경계를 바로 넘어옵니다.","impactMd":"권한 우회·정보 노출로 이어질 수 있습니다.","actionMd":"런타임을 보안 릴리스 버전으로 업데이트해야 합니다.","source":"https://nodejs.org/ko/blog/vulnerability/december-2025-security-releases "}
-->
<!--CARD
{"id":"summary-2","kind":"summary","header":"요약","domain":"node","title":"symlink 우회는 realpath로 끊기","bodyMd":"문자열 경로 검증은 symlink 체인에서 깨집니다. realpath 기준 allowlist로 바꿉니다.","whyMd":"상대 경로 + symlink 조합이 경계를 탈출합니다.","impactMd":"허용 디렉터리 밖 파일 접근이 가능합니다.","actionMd":"허용 경로는 realpath 기준 allowlist로 고정해야 합니다.","source":"https://cveawg.mitre.org/api/cve/CVE-2025-55130 "}
-->
<!--CARD
{"id":"summary-3","kind":"summary","header":"요약","domain":"node","title":"UDS 우회는 입력 경로 차단","bodyMd":"UDS 경로를 입력에서 받으면 네트워크 차단이 무력화됩니다.","whyMd":"로컬 소켓은 내부 서비스로 가는 지름길입니다.","impactMd":"권한 경계를 넘어 내부 소켓에 접근합니다.","actionMd":"UDS 경로는 코드 상수 allowlist로 고정해야 합니다.","source":"https://cveawg.mitre.org/api/cve/CVE-2026-21636 "}
-->
<!--CARD
{"id":"summary-4","kind":"summary","header":"요약","domain":"java","title":"Struts S2-069는 XML 기본값 문제","bodyMd":"2025-12-19 공지된 Struts 보안 이슈입니다. XML 외부 엔티티가 핵심 통로입니다.","whyMd":"DTD/외부 엔티티가 열려 있으면 외부 입력이 곧 내부 조회가 됩니다.","impactMd":"정보 노출·SSRF로 이어질 수 있습니다.","actionMd":"Struts를 6.1.1 이상으로 업데이트해야 합니다.","source":"https://cwiki.apache.org/confluence/display/WW/S2-069 "}
-->
<!--CARD
{"id":"summary-5","kind":"summary","header":"요약","domain":"java","title":"Solr extraction 경계는 파싱 격리로 막기","bodyMd":"2025-12-09 공지된 Solr extraction 모듈 XXE 이슈입니다.","whyMd":"문서 파싱은 복잡하고 신뢰되지 않은 입력에 취약합니다.","impactMd":"파일 노출·내부 데이터 접근으로 이어질 수 있습니다.","actionMd":"파싱은 격리된 워커로 분리해야 합니다.","source":"https://solr.apache.org/security.html "}
-->
<!--CARD
{"id":"summary-6","kind":"summary","header":"요약","domain":"common","title":"네트워킹 릴리스는 보안 경계 업데이트로 취급","bodyMd":"2025-12-16 HttpComponents 릴리스는 HTTP/2 핵심 경계에 영향을 줍니다.","whyMd":"프로토콜 경계 이슈는 기능이 아니라 보안 경계 문제입니다.","impactMd":"요청 처리 경계가 흔들리면 보안 제어도 같이 흔들립니다.","actionMd":"HTTP 클라이언트/코어 버전은 빠르게 따라가야 합니다.","source":"https://hc.apache.org/news.html "}
-->

# (5) 이번 달 개발자 체크리스트

1. Node.js 런타임을 보안 릴리스 버전으로 업데이트해야 합니다. [Source] https://nodejs.org/ko/blog/vulnerability/december-2025-security-releases (2025-12-15)
2. 권한 모델 경로 검증은 `realpath(심볼릭 링크 해소 경로)` 기준 allowlist로 바꿔야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2025-55130 (날짜 미표기)
3. `vm`+`timeout` 조합으로 유저 코드를 실행하지 말고, 필요하면 별도 프로세스/컨테이너로 격리하세요. [Source] https://cveawg.mitre.org/api/cve/CVE-2025-55131 (날짜 미표기)
4. UDS(로컬 소켓) 경로는 입력에서 직접 받지 말고 코드 상수 allowlist로 고정해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2026-21636 (날짜 미표기)
5. Struts는 6.1.1 이상으로 올려야 합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19)
6. XML 파서에서 DTD/외부 엔티티를 비활성화해야 합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19)
7. Solr extraction 모듈을 쓰면 업로드 입력을 제한하고, 파싱은 격리된 워커로 분리해야 합니다. [Source] https://solr.apache.org/security.html (2025-12-09)
8. SolrCell/Tika 경계에서는 파싱 실패/예외를 보안 이벤트로 기록하고 재시도를 제한해야 합니다. [Source] https://solr.apache.org/security.html (2025-12-09)
9. HttpComponents Core/Client 릴리스는 기능 업데이트가 아니라 경계 업데이트로 보고 빠르게 따라가야 합니다. [Source] https://hc.apache.org/news.html (2025-12-16)
10. HTTP/2 경계 이슈는 애플리케이션 코드가 아니라 프로토콜 스택에서 먼저 해결해야 합니다. 클라이언트/코어 버전 고정을 팀 정책으로 승격해야 합니다. [Source] https://hc.apache.org/news.html (2025-12-16)

<!--CARD
{"id":"checklist-1","kind":"checklist","header":"체크리스트","title":"이번 달 개발자 체크리스트(10)","bodyMd":"1. Node.js 런타임을 보안 릴리스 버전으로 업데이트해야 합니다.\n2. 권한 모델 경로 검증은 realpath 기준 allowlist로 바꿔야 합니다.\n3. vm+timeout 조합으로 유저 코드를 실행하지 말고 격리하세요.\n4. UDS 경로는 코드 상수 allowlist로 고정해야 합니다.\n5. Struts는 6.1.1 이상으로 올려야 합니다.\n6. XML 파서에서 DTD/외부 엔티티를 비활성화해야 합니다.\n7. Solr extraction 모듈은 파싱을 격리된 워커로 분리해야 합니다.\n8. Solr 파싱 실패/예외는 보안 이벤트로 기록하고 재시도를 제한해야 합니다.\n9. HttpComponents Core/Client 릴리스는 경계 업데이트로 보고 따라가야 합니다.\n10. HTTP/2 경계 이슈는 프로토콜 스택 버전 고정 정책으로 승격해야 합니다.","actionMd":"이번 카드의 항목을 완료 처리합니다.","source":"https://nodejs.org/ko/blog/vulnerability/december-2025-security-releases "}
-->

# (2) Node.js

## (2.1) CVE/이슈 표

| CVE | 영향 버전 | 공격 영향(C/I/A) | 악용 여부(in-the-wild) | 권장 조치(업데이트/완화책) | Source URL |
|---|---|---|---|---|---|
| CVE-2025-55131 | Node.js 20.x, 22.x, 24.x, 25.x (`vm` + `timeout` 경로) | C/I | 확인 불가 | `vm` + `timeout` 조합을 보안 경계로 쓰지 말고, 유저 코드는 별도 프로세스/컨테이너로 격리해야 합니다. | https://nodejs.org/ko/blog/vulnerability/december-2025-security-releases (2025-12-15)<br>https://cveawg.mitre.org/api/cve/CVE-2025-55131 (날짜 미표기) |
| CVE-2025-55130 | Node.js permission model 사용 시 | C/I | 확인 불가 | 경로 검증은 문자열 비교를 버리고 `realpath` 기준 allowlist로 고정해야 합니다. | https://nodejs.org/ko/blog/vulnerability/december-2025-security-releases (2025-12-15)<br>https://cveawg.mitre.org/api/cve/CVE-2025-55130 (날짜 미표기) |
| CVE-2026-21636 | Node.js 25.x permission model 사용 시 (UDS) | C/I | 확인 불가 | UDS 경로를 입력에서 직접 받지 말고 코드 상수 allowlist로 고정해야 합니다. | https://nodejs.org/ko/blog/vulnerability/december-2025-security-releases (2025-12-15)<br>https://cveawg.mitre.org/api/cve/CVE-2026-21636 (날짜 미표기) |
| CVE-2025-55132 | Node.js permission model 사용 시 (`fs.futimes`) | I | 확인 불가 | `futimes()`로 의미 있는 보안 판단을 하지 말고, 타임스탬프는 감사/보안 근거에서 제외해야 합니다. | https://nodejs.org/ko/blog/vulnerability/december-2025-security-releases (2025-12-15)<br>https://cveawg.mitre.org/api/cve/CVE-2025-55132 (날짜 미표기) |

## (2.2) 항목별 설명

### December 2025 보안 릴리스는 “권한 모델 경계”를 시험한 달입니다

권한 모델을 보안 경계로 선언한 순간, 우회 경로(symlink, UDS, `futimes`)가 곧 공격 표면이 됩니다. 권한 모델 옵션은 곧 정책 코드이므로 버전 업데이트와 테스트를 한 세트로 묶어야 합니다. [Source] https://nodejs.org/ko/blog/vulnerability/december-2025-security-releases (2025-12-15)

### 영향 여부 자가진단 (빠른 확인)

지금 런타임 버전과 권한 모델 옵션 사용 여부를 먼저 확인합니다.

```bash
node -v
ps aux | grep -E "node .*--permission|node .*--allow-fs-|node .*--allow-net" | grep -v grep || true
```

권한 모델을 보안 경계로 쓰고 있다면 보안 릴리스 버전으로 올리고 우회 경로 테스트를 추가해야 합니다. [Source] https://nodejs.org/ko/blog/vulnerability/december-2025-security-releases (2025-12-15)

### CVE-2025-55131: `vm` + `timeout` 조합은 메모리 경계를 흐립니다

`vm`에서 `timeout`으로 실행을 강제 중단하면 버퍼가 0으로 채워지지 않는 경로가 열립니다. 유저 코드를 `vm`으로 직접 실행하는 설계는 폐기하고, 격리된 실행 단위로 분리해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2025-55131 (날짜 미표기)

### CVE-2025-55130: symlink 우회는 “문자열 경계”를 부숩니다

허용 경로를 문자열로 비교하면 symlink 체인에서 경계가 무너집니다. 파일 경계는 `realpath`로 먼저 해소한 뒤 allowlist로 고정해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2025-55130 (날짜 미표기)

### CVE-2026-21636: UDS는 네트워크 차단을 우회하는 로컬 통로입니다

`--allow-net`이 꺼져 있어도 UDS는 로컬 서비스로 붙을 수 있습니다. `socketPath` 같은 옵션을 입력에서 직접 받지 말고, 코드 상수 allowlist로 고정해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2026-21636 (날짜 미표기)

### CVE-2025-55132: 타임스탬프는 보안 판단 근거로 쓰면 안 됩니다

`futimes()`는 읽기 권한만 있어도 타임스탬프를 바꿀 수 있는 경로가 있었습니다. 타임스탬프 기반 보안 판단(최근 수정 여부 판단 등)은 설계에서 제거해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2025-55132 (날짜 미표기)

## (2.3) 이번 달 취약 개발 패턴 Top 5

### 패턴 1) 권한 모델 옵션을 “보안 경계 선언”으로 끝내기

왜 위험한지: 옵션은 선언이고, 경계는 우회 경로에서 깨집니다. 경계를 선언만 하고 우회 경로 테스트를 빼면 보안 경계가 문서에만 존재하게 됩니다.

안 좋은 예:

```js
// 옵션을 켰으니 안전하다고 가정
spawn("node", ["--permission", "app.js"]);
```

안전한 대안:

```js
// 옵션 + 우회 경로 테스트를 같이 고정
const allowed = new Set(["/srv/app/data"]);
function isAllowed(p) {
  const rp = fs.realpathSync(p);
  return allowed.has(rp);
}
```

옵션은 정책 코드로 취급하고, 우회 경로 테스트를 릴리스 체크리스트에 고정해야 합니다. [Source] https://nodejs.org/ko/blog/vulnerability/december-2025-security-releases (2025-12-15)

### 패턴 2) 파일 경계를 문자열로 비교하기

왜 위험한지: symlink 체인은 문자열 경계를 쉽게 탈출합니다. 경로는 해소하고 비교해야 경계가 됩니다.

안 좋은 예:

```js
if (userPath.startsWith("/srv/app/data")) {
  fs.readFileSync(userPath);
}
```

안전한 대안:

```js
const base = fs.realpathSync("/srv/app/data");
const target = fs.realpathSync(userPath);
if (target === base || target.startsWith(base + path.sep)) {
  fs.readFileSync(target);
}
```

허용 경로 비교는 `realpath` 이후 allowlist로 고정해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2025-55130 (날짜 미표기)

### 패턴 3) `vm`을 유저 코드 실행 경계로 쓰기

왜 위험한지: `vm`은 격리 경계가 아니라 실행 도구입니다. 타임아웃/리소스 경계까지 책임지지 않습니다.

안 좋은 예:

```js
vm.runInNewContext(code, sandbox, { timeout: 1000 });
```

안전한 대안:

```bash
# 유저 코드는 별도 프로세스/컨테이너에서 실행
node worker.js
```

유저 코드 실행은 런타임 옵션이 아니라 격리 단위로 설계해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2025-55131 (날짜 미표기)

### 패턴 4) 네트워크 차단을 TCP/HTTP로만 가정하기

왜 위험한지: 로컬 소켓은 네트워크 차단 정책의 사각지대가 되기 쉽습니다. 내부 서비스는 UDS로 더 자주 열려 있습니다.

안 좋은 예:

```js
// 외부 입력이 socketPath로 그대로 들어옴
net.connect({ socketPath: userInput });
```

안전한 대안:

```js
const sockets = {
  metrics: "/var/run/metrics.sock",
};
net.connect({ socketPath: sockets.metrics });
```

UDS 경로는 외부 입력에서 분리하고 코드 상수로 고정해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2026-21636 (날짜 미표기)

### 패턴 5) 타임스탬프를 보안 근거로 삼기

왜 위험한지: 타임스탬프는 변경 비용이 낮고 우회 경로가 자주 발견됩니다. 감사 로그와 보안 판단 근거는 분리해야 합니다.

안 좋은 예:

```js
if (stat.mtimeMs > lastSeen) {
  trustThisFile();
}
```

안전한 대안:

```js
// 보안 판단은 서명/해시/출처 기반으로 고정
verifySignature(file);
```

타임스탬프는 관측 지표로만 쓰고 보안 판단 근거에서 제외해야 합니다. [Source] https://cveawg.mitre.org/api/cve/CVE-2025-55132 (날짜 미표기)

## (2.4) 운영 참고(선택)

(비워 둠)

# (3) Java

## (3.1) CVE/이슈 표

| CVE | 영향 버전 | 공격 영향(C/I/A) | 악용 여부(in-the-wild) | 권장 조치(업데이트/완화책) | Source URL |
|---|---|---|---|---|---|
| CVE-2025-68493 | Struts 6.0.0 ~ 6.1.0 (XWork XML 파싱 경로) | C/I | 확인 불가 | Struts를 6.1.1 이상으로 업데이트하고, XML 외부 엔티티를 비활성화해야 합니다. | https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19) |
| CVE-2025-66516 | Apache Solr 6.2.0 ~ 9.10.0 (extraction 모듈 사용 시) | C/I | 확인 불가 | extraction 모듈 경계에서 파싱을 격리 실행으로 분리하고, 업로드 입력을 제한해야 합니다. | https://solr.apache.org/security.html (2025-12-09) |
| (이슈) HTTP/2 경계 업데이트 | Apache HttpComponents Core/Client 5.4/5.6 라인 | C/I | 확인 불가 | HTTP 스택 릴리스는 기능 업데이트가 아니라 경계 업데이트로 취급하고 빠르게 따라가야 합니다. | https://hc.apache.org/news.html (2025-12-16)<br>https://hc.apache.org/news.html (2025-12-22) |

## (3.2) 항목별 설명

### Struts S2-069: XML 기본값은 공격 경로입니다

오래된 XWork XML 파싱 경로는 외부 엔티티/DTD가 열리면 곧 XXE 통로가 됩니다. Struts 버전 업데이트와 XML 외부 엔티티 차단 설정을 같은 변경으로 묶어야 합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19)

### 영향 여부 자가진단 (빠른 확인)

Struts/Solr/HttpComponents 버전을 빠르게 점검합니다.

```bash
./gradlew dependencies --configuration runtimeClasspath | grep -E "struts|xwork|solr|tika|httpclient|httpcore" || true
mvn -q -DincludeScope=runtime dependency:tree | grep -E "struts|solr|tika|httpclient|httpcore" || true
```

취약 버전이 보이면 먼저 버전을 올리고, 파싱/HTTP 경계 설정을 기본값으로 고정해야 합니다. [Source] https://solr.apache.org/security.html (2025-12-09)

### Apache Solr 2025-12-09 공지: extraction 모듈 경계는 곧 파싱 경계입니다

Solr의 extraction 모듈은 내부적으로 Tika를 사용하며, PDF 파싱 경계는 곧 파일 접근 경계가 됩니다. SolrCell/Tika 경계는 애플리케이션 권한에서 분리하고 격리된 파싱 워커로 분리해야 합니다. [Source] https://solr.apache.org/security.html (2025-12-09)

### Apache HttpComponents 2025-12 릴리스: HTTP 스택을 경계 코드로 취급해야 합니다

HTTP/2 지원과 핵심 네트워킹 변경은 기능 이슈가 아니라 경계 이슈입니다. 클라이언트/코어 버전은 라이브러리 업데이트가 아니라 보안 경계 업데이트로 보고 빠르게 따라가야 합니다. [Source] https://hc.apache.org/news.html (2025-12-16)

## (3.3) 이번 달 취약 개발 패턴 Top 5

### 패턴 1) XML 파서를 “프레임워크 기본값”에 맡기기

왜 위험한지: XML 기본값은 외부 엔티티/DTD가 열려 있는 경우가 많습니다. 기본값은 기능 친화적이고, 보안 기본값은 아닙니다.

안 좋은 예:

```xml
<!-- 기본 XML 파서를 그대로 신뢰 -->
<constant name="xwork.someXmlSetting" value="default" />
```

안전한 대안:

```bash
-Djavax.xml.accessExternalDTD=""
-Djavax.xml.accessExternalSchema=""
-Djavax.xml.accessExternalStylesheet=""
```

XML 외부 엔티티 차단은 프레임워크 설정과 JVM 설정을 함께 고정해야 합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19)

### 패턴 2) 파싱 경계를 애플리케이션 권한으로 직접 실행하기

왜 위험한지: 파싱은 복잡하고 취약점 밀도가 높은 영역입니다. 애플리케이션 권한으로 직접 파싱하면 사고가 곧 권한 사고가 됩니다.

안 좋은 예:

```java
// 앱 권한으로 바로 파싱
parser.parse(uploadedStream, handler, metadata, context);
```

안전한 대안:

```bash
# 파싱은 격리된 워커/컨테이너에서 실행
./bin/parse-worker
```

문서 파싱은 라이브러리 사용 문제가 아니라 격리 실행 문제로 설계해야 합니다. [Source] https://solr.apache.org/security.html (2025-12-09)

### 패턴 3) 보안 공지를 “버전만 올리면 끝”으로 처리하기

왜 위험한지: 파싱/HTTP/권한 경계 이슈는 설정과 코드 경계까지 건드립니다. 버전 업데이트는 출발점이고, 경계 테스트가 본체입니다.

안 좋은 예:

```bash
./gradlew dependencies --write-locks
# 버전 잠금만 갱신하고 테스트는 생략
```

안전한 대안:

```bash
./gradlew test
./gradlew integrationTest
```

보안 업데이트는 버전, 설정, 경계 테스트를 한 묶음으로 처리해야 합니다. [Source] https://cwiki.apache.org/confluence/display/WW/S2-069 (2025-12-19)

### 패턴 4) HTTP 스택을 “네트워크 유틸”로만 취급하기

왜 위험한지: HTTP 스택은 경계 코드입니다. 프로토콜/파서/헤더 처리의 작은 차이가 곧 보안 경계 차이가 됩니다.

안 좋은 예:

```java
// HTTP 클라이언트 버전을 장기간 고정
implementation("org.apache.httpcomponents.client5:httpclient5:5.2.0")
```

안전한 대안:

```java
// 경계 코드는 릴리스 라인을 빠르게 따라감
implementation("org.apache.httpcomponents.client5:httpclient5:5.5.2")
```

HTTP 스택은 기능 라이브러리가 아니라 경계 코드로 취급하고 업데이트 정책을 분리해야 합니다. [Source] https://hc.apache.org/news.html (2025-12-22)

### 패턴 5) 경계 옵션을 선언하고 테스트로 고정하지 않기

왜 위험한지: 선언된 경계는 우회 경로가 등장하는 순간 무력화됩니다. 경계 옵션은 릴리스 테스트와 함께 살아 있어야 합니다.

안 좋은 예:

```text
"옵션을 켰다"는 문서만 있고, 경계 테스트는 없음
```

안전한 대안:

```text
경계 옵션은 테스트 케이스(우회 경로 포함)로 고정
```

경계 선언은 릴리스 테스트와 묶어야 실제 경계가 됩니다. [Source] https://solr.apache.org/security.html (2025-12-09)

## (3.4) 운영 참고(선택)

(비워 둠)

# (4) 공통 트렌드/권장사항

- “보안 옵션을 켰다”는 선언은 보안 경계가 아닙니다. symlink, UDS, XML 외부 엔티티처럼 경계를 깨는 우회 경로를 테스트로 고정해야 합니다. [Source] https://nodejs.org/ko/blog/vulnerability/december-2025-security-releases (2025-12-15)
- 파싱과 HTTP 스택은 기능이 아니라 경계 문제입니다. 파싱 격리와 HTTP 스택 업데이트 정책을 팀 규칙으로 승격해야 합니다. [Source] https://solr.apache.org/security.html (2025-12-09)
- 릴리스 노트와 보안 공지는 링크 모음이 아니라 정책 원천이어야 합니다. 공지의 권장 조치를 팀 기본 설정과 테스트 케이스로 승격해야 합니다. [Source] https://hc.apache.org/news.html (2025-12-16)

# (6) 참고자료

- https://nodejs.org/ko/blog/vulnerability/december-2025-security-releases
- https://cveawg.mitre.org/api/cve/CVE-2025-55130
- https://cveawg.mitre.org/api/cve/CVE-2026-21636
- https://cwiki.apache.org/confluence/display/WW/S2-069
- https://solr.apache.org/security.html
- https://hc.apache.org/news.html
- https://cveawg.mitre.org/api/cve/CVE-2025-55131
- https://cveawg.mitre.org/api/cve/CVE-2025-55132
