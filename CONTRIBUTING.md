# Contributing

## 새 월호 만들기

1. 템플릿 복사
   - `templates/devsecnews-YYYY-MM-node-java.md` → `devsecnews-YYYY-MM-node-java.md`
2. 내용 작성/갱신
   - URL은 Markdown 링크로 감싸지 말고 문자열 그대로 넣습니다.
   - 본문에 들어간 URL은 모두 `# (6) 참고자료`(또는 `# (7) 참고자료`)에 포함합니다.
3. 검증
   - `npm run verify -- --month YYYY-MM`
4. 산출물 생성
   - `npm run build:html -- --month YYYY-MM`
   - `npm run build:cards -- --month YYYY-MM`
   - (선택) `npm run build:html:all -- --month YYYY-MM`
5. 배포 준비
   - `npm run deploy -- --month YYYY-MM`

## 규칙(요약)
- URL 문자열은 정확히 동일해야 하며, 본문/참고자료에 상호 누락이 없어야 합니다.
- 카드뉴스용 메타는 `<!--CARD { ... } -->` 형식을 유지합니다.
- 대용량 수정 시에는 먼저 `npm run verify`로 URL 정합성을 확인합니다.
