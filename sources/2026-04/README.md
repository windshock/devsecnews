# DevSecNews 2026-04 source packet

4월호 작성에 사용할 원본 재료와 파생 도구를 보관한다.

## 1. Axios npm 공급망 공격

- 원본 분석 보고서: https://github.com/windshock/PoisonChain/blob/main/public/docs/axios-npm-supply-chain-attack-report.md
- 대응 도구: https://github.com/windshock/PoisonChain
- 사용 위치 후보:
  - Node.js / npm 공급망 항목
  - 공통 트렌드: lockfile보다 build log가 중요한 사고 대응
  - 개발자 체크리스트: `npm install` 실행 이력, Jenkins/GitHub Actions 로그, 악성 버전 노출 시간대 확인

핵심 요약:

- `axios@1.14.1`, `axios@0.30.4`, `plain-crypto-js@4.2.1`이 악성 버전으로 사용됐다.
- `postinstall` 훅이 OS별 RAT을 내려받고 실행한다.
- `setup.js` 삭제와 `package.json` clean stub 교체로 사후 파일시스템 조사만으로는 실행 여부를 판단하기 어렵다.
- 실제 감염 판단에는 lockfile뿐 아니라 빌드 로그, 특히 `npm install` 실행 여부와 공격 노출 시간대가 중요하다.
- PoisonChain은 repo sweep, semver exposure, build-log inspection, maintainer/team attribution, team dashboard 생성을 목표로 한다.

## 2. MCP / AI 공급망 공격과 Shadow Dev-Environment

- 원본: 사용자 첨부 PDF `AI__1777179080.pdf`
- 추출 메모: `sources/2026-04/ai-mcp-security-roadmap-notes.md`
- 대응 도구: `mcpguard` 제작 중
- 사용 위치 후보:
  - 공통 트렌드: AI 개발환경과 MCP 공급망
  - Editor's Note: 자동화된 신뢰 경로
  - 체크리스트: AI IDE, MCP 설정 JSON, 터널링 도구, 외부 노출 차단, MFA, 행위 중심 모니터링

핵심 요약:

- 과기정통부 AI 보안 점검 협조 요청과 MCP 기반 공급망 리스크가 같은 시기에 부상했다.
- 쟁점은 단순 prompt injection이 아니라 `설정 파일(JSON) → 자동 실행 → 외부 연결` 구조다.
- AI IDE와 터널링 도구가 Shadow Dev-Environment를 만들 수 있다.
- 대응은 시그니처 탐지보다 실행 경로 통제, 설정 검증, 행위 기반 모니터링으로 이동해야 한다.

## 3. ATO 공급망 / 계정 탈취 구조

- 원본 글: https://windshock.github.io/ko/post/2026-04-07-dismantling-ato-supply-chain/
- 대응 도구: https://github.com/windshock/pointpivot
- 사용 위치 후보:
  - 공통 트렌드: 계정 탈취를 공급망으로 보기
  - 인증/ATO 방어 항목
  - 체크리스트: 로그인 이벤트 단독 대응이 아니라 수익화·인프라·텔레그램 유도·포인트 전환 흐름까지 추적

핵심 요약:

- ATO는 로그인 실패/성공 이벤트 하나로 끝나지 않는다.
- 유출 계정 → 포인트·기프티콘 탈취 → 현금화 → 가상자산 전환 → 다음 공격 인프라 재투자로 이어질 수 있다.
- CAPTCHA 강화만으로는 계정 탈취 공급망을 끊기 어렵다.
- PointPivot은 국내 기프티콘·포인트 서비스를 노리는 사기 조직의 IP, 텔레그램, 사이트를 추적하는 OSINT 데이터베이스다.

## 4. 4월호 편집 프레임 후보

```text
자동화된 신뢰를 통제하세요 — 빌드도, 설정도, 계정 흐름도.
```

보조 프레임:

```text
설정, 빌드, 로그인 — 자동화된 경로가 통제권 밖에서 실행됩니다.
```

## 5. 추가 조사 필요

- repo 프롬프트 기준상 Node.js 2개 이상, Java 2개 이상, 공통 1개 이상이 필요하다.
- 현재 확보된 재료는 Node.js/npm 공급망과 공통 트렌드에는 충분하지만, Java/Spring/JVM 항목은 별도 조사로 보강해야 한다.
- 4월 공식 공지/어드바이저리 게시일 기준으로만 포함해야 한다.
