## [정보보호팀] 2026년 3월 DevSecNews 발행 안내

안녕하세요, 정보보호팀입니다.

2026년 3월 DevSecNews를 발행했습니다.

이번 호부터 뉴스레터 양식을 새로 바꿨습니다. 그동안 CVE 패치 목록 위주로 전달해 드렸는데, 읽기 불편하다는 피드백을 반영해 구성을 개편했습니다.
- **Editor's Pick 강화** — 그 달의 핵심 보안 이슈를 선별해 배경·영향·대응까지 깊이 있게 다룹니다.
- **카드뉴스 한/영 전환** — 우측 상단 🇰🇷/🇺🇸 버튼으로 한국어↔영어 전환이 가능합니다. 영문이 필요한 해외 팀이나 외국인 동료에게도 공유할 수 있습니다.
- **반복 패턴 분석** — 개별 CVE 패치 안내에 그치지 않고, 취약점들이 왜 반복되는지 공통 코드 패턴을 정리했습니다.

📋 [리포트](https://windshock.github.io/devsecnews/devsecnews-2026-03-node-java.html)　🃏 [카드뉴스](https://windshock.github.io/devsecnews/cards/devsecnews-2026-03-node-java/cards.html)

---

### ■ Editor's Pick

**① Trivy 공급망 공격 — 보안 스캐너가 해킹 도구가 된 사건**

3월 19일, 위협 그룹 TeamPCP가 오픈소스 보안 스캐너 Trivy를 장악했습니다. GitHub Actions에서 자동 실행되는 이 도구의 플러그인 저장소가 탈취되어, CI/CD 빌드 서버에 저장된 GitHub 토큰·AWS 키·NPM 토큰 등 인증 정보가 외부로 유출됐습니다. 워크플로우 YAML을 변경하지 않아도, mutable tag를 악용한 태그 포이즈닝으로 악성 코드가 실행되는 구조였습니다.

"보안 도구니까 안전하겠지"라는 신뢰가 역이용된 사건입니다. CI/CD 참조는 반드시 커밋 SHA로 고정하고, 영향 기간(3/19~22) 사용된 시크릿은 즉시 교체해야 합니다.

- [Wiz Research — 공격 타임라인·확산 경로 분석](https://www.wiz.io/blog/trivy-compromised-teampcp-supply-chain-attack)
- [CrowdStrike — 탐지·조사·대응 절차](https://www.crowdstrike.com/en-us/blog/from-scanner-to-stealer-inside-the-trivy-action-supply-chain-compromise/)
- [Microsoft Security — 시크릿 회전·파이프라인 격리 가이드](https://www.microsoft.com/en-us/security/blog/2026/03/24/detecting-investigating-defending-against-trivy-supply-chain-compromise/)

**② WAF 탐지 우회 연구 — 방화벽이 같은 요청을 다르게 읽는 구조적 문제**

시그니처 우회가 아닙니다. 웹 방화벽(WAF)·프록시·백엔드 서버가 같은 HTTP 요청을 서로 다른 규칙으로 해석하기 때문에 탐지 공백이 생기는 것입니다. WAFFLED 연구에서 1,207가지 우회 경로가 확인됐고, 이번 달 Netty HRS 취약점(CVE-2026-33870)도 같은 구조적 원인입니다.

방화벽은 "정상"으로 통과시킨 요청이, 백엔드에서는 SQLi·XSS·경로 탐색 공격으로 실행될 수 있습니다. 규칙 기반 탐지만으로는 한계가 있으며, 파서 일치 테스트를 병행해야 합니다.

- [windshock — WAF/IPS/IDS 탐지 공백 구조 분석](https://windshock.github.io/ko/post/2026-03-13-waf-ips-ids-detection-gap-analysis/)
- [windshock — waf-ips-ids-retest 프레임워크](https://github.com/windshock/waf-ips-ids-retest)
- [Funky Chunks — chunk line 모호성 기반 request smuggling 연구](https://w4ke.info/2025/06/18/funky-chunks.html)
- [xclow3n — Cloudflare Pingora request smuggling 분석](https://xclow3n.github.io/post/6/)
- [Netty Advisory — CVE-2026-33870](https://github.com/netty/netty/security/advisories/GHSA-pwqr-wmgm-9rr8)

**③ CAPTCHA 무력화 PoC — AI가 사람/봇 구분을 무의미하게 만들다**

2025년 대규모 개인정보 유출 이후, 유출된 ID/PW를 활용한 크레덴셜 스터핑과 명의도용('내구제')이 급증했습니다. 대응으로 CAPTCHA 강화가 확산되고 있지만, Playwright + Whisper + LLM 에이전트 조합으로 비용 $0, 100% 로컬 환경에서 시각/음성 CAPTCHA를 5초 이내·85%+ 정확도로 자동 통과하는 PoC가 공개되었습니다.

DOM 난독화는 더 이상 유효한 방어가 아닙니다. CAPTCHA 의존 전략을 재검토하고, MFA·행동 기반 탐지·속도 제한을 병행해야 합니다.

- [windshock — CAPTCHA 우회 PoC와 방어 전략](https://windshock.github.io/ko/post/2026-03-30-captcha-bypass-poc-defense-strategy/)
- [BJC저널 — 가전 구독 내구제 대출 사기 실태](https://journal.kbjc.net/news/articleView.html?idxno=20638)
- [일요시사 — 2025 통신분쟁 역대 최대, 명의도용 217건](https://www.ilyosisa.co.kr/news/article.html?no=254600)
- [서울경제 — M-safer 이용 2년 만에 16배 급증](https://v.daum.net/v/20251202154625602)

---

### ■ 이번 달 취약점에서 반복된 코드 패턴 3가지

이번 달 공개된 취약점 10건을 분석하면, 같은 원인이 반복해서 나타납니다.

---

**① 라이브러리의 암묵적 탐색 경로를 그대로 신뢰**

Handlebars 템플릿 엔진은 이름을 찾을 때 원래 데이터뿐 아니라 JavaScript 객체의 숨겨진 속성까지 탐색합니다. Picomatch는 "이 경로에 접근해도 되는가?"를 판단할 때 패턴 매칭 결과를 별도 검증 없이 그대로 믿습니다.

```diff
- // ❌ prototype chain까지 탐색됨
- const partial = obj[name];
+ // ✅ 자기 자신의 속성만 확인
+ if (!Object.hasOwn(obj, name)) throw new Error('unknown partial');
+ const partial = obj[name];
```

```diff
- // ❌ glob 결과를 권한 판단에 직접 사용
- if (picomatch.isMatch(userPath, allowedGlob)) grant();
+ // ✅ 정규화 후 교차 검증
+ const normalized = path.resolve(userPath);
+ if (normalized.startsWith(SAFE_ROOT) && picomatch.isMatch(normalized, allowedGlob)) grant();
```

---

**② 관리 경로와 비즈니스 경로가 같은 URL 아래에 섞여 있음**

Spring의 시스템 관리용 URL(Actuator) 아래에 일반 서비스 API를 배치하면, 관리 경로에 적용된 "누구나 접근 가능" 정책이 서비스 API에도 그대로 적용됩니다.

```diff
- // ❌ Actuator 경로 아래 비즈니스 API 배치
- management.endpoints.web.base-path=/api/health
- // → /api/health/** 전체가 permitAll() 상속

+ // ✅ 관리/비즈니스 경로 완전 분리
+ management.endpoints.web.base-path=/internal/mgmt
+ // 비즈니스는 /api/** 에만 배치
```

---

**③ 프록시와 백엔드가 같은 요청을 서로 다른 규칙으로 해석**

Netty에서는 프록시와 서버가 HTTP 요청의 길이를 다르게 계산해서 한 요청 안에 숨겨진 두 번째 요청이 통과됩니다. ZooKeeper에서는 접속한 서버의 도메인 이름을 역방향으로 조회해서 검증하는데, 인증서에 적힌 이름과 달라 검증이 우회됩니다.

```diff
- // ❌ reverse DNS로 호스트 검증
- String host = InetAddress.getByName(addr).getHostName();
- if (host.equals(expectedHost)) verify();

+ // ✅ 인증서 SAN과 직접 비교
+ Collection<List<?>> sans = cert.getSubjectAlternativeNames();
+ if (sans.stream().anyMatch(e -> e.get(1).equals(expectedHost))) verify();
```

> 이번 달 확인된 1,207가지 WAF 우회 경로도 프록시와 백엔드의 파싱 규칙 차이에서 비롯됩니다. 보안 업데이트 시 프록시-백엔드 간 요청 해석이 일치하는지 함께 테스트해 주세요.

---

해당 패턴이 우리 서비스 코드에 존재하는지 점검이 필요합니다.
상세 CVE 목록과 패치 가이드는 리포트를 참고해 주시기 바랍니다.

문의사항은 정보보호팀으로 연락 주시기 바랍니다.

감사합니다.
