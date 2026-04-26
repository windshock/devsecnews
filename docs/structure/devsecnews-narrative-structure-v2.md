# DevSecNews Narrative Structure v2

## Purpose

DevSecNews should evolve from a monthly vulnerability summary into a monthly design review of security knowledge.

The goal is not to make readers memorize every control or default. The goal is to explain, month by month, **why certain security knowledge must move from human attention into default design, platform guardrails, visibility, and decision interfaces**.

This structure is based on the philosophy from `security-knowledge-to-default-design`:

```text
Some security knowledge should be embedded into defaults.
Some security knowledge should remain a human decision.
Some security knowledge must be created together through team discussion.
```

DevSecNews should therefore answer four questions every month:

```text
What signal did this month reveal?
What pattern connects the incidents?
What design gap made the pattern possible?
What should become default, visible, or explicitly decided?
```

## Why the old structure is not enough

The old Node.js / Java / Common taxonomy is useful for lookup, but it makes the report feel like a classified advisory digest. That is not the strongest identity for DevSecNews.

DevSecNews should lead with meaning, not taxonomy.

The technical details still matter, but they should support the monthly thesis. They should not be the first organizing principle.

## New structure

```markdown
# DevSecNews YYYY-MM
## <Monthly Thesis>

## 1. Signal
## 2. Pattern
## 3. Design Failure
## 4. Default Shift
## 5. Decision Point
## 6. Team Conversation
## 7. Field Notes
```

The reading flow becomes:

```text
Signal -> Pattern -> Design Failure -> Default Shift -> Decision Point -> Team Conversation -> Technical Evidence
```

This is intentionally different from a CVE digest.

## 1. Signal

### Role

Open with the one signal this month is sending.

This is not a summary of all issues. It is the interpretive lens for the month.

### Requirements

- One memorable sentence.
- Avoid abstract security slogans.
- Prefer concrete surfaces from the month: commands, settings, flows, interfaces, permissions, evidence.
- Avoid direct instruction too early.
- Prefer a sentence or question that creates curiosity and frames the rest of the report.

### 2026-04 recommended title

```text
개발 패키지 설치 명령(npm install), AI 도구 설정, 로그인 성공 — 어디까지 보이고 있습니까?
```

This title is intentionally concrete. It names the three surfaces that made April different:

```text
Build: 개발 패키지 설치 명령(npm install)
Config: AI 도구 설정
Account: 로그인 성공
```

It avoids the generic phrase `공격 경로` in the headline and turns the issue into a visibility question.

### Supporting line

```text
4월호는 설치, 설정, 계정 흐름 뒤에서 실제로 무엇이 실행되고 기록되는지 묻습니다.
```

### Avoid as opening thesis

```text
실행은 조용히 지나가고, 사고는 나중에 보입니다.
```

This is conceptually accurate, but too literary and not clickable enough as a headline.

Also avoid:

```text
평범한 흐름이 공격 경로가 됐다
```

This is too generic and can describe almost any security incident.

## 2. Pattern

### Role

Show the repeated pattern across incidents.

This section answers:

```text
What did these incidents have in common?
```

### 2026-04 example

```text
Axios: package installation became code execution.
MCP: configuration became local tool execution.
ATO: login became stored-value monetization.
```

The point is not that developers forgot something. The point is that execution occurred through ordinary-looking paths.

## 3. Design Failure

### Role

Explain the design gap behind the pattern.

This is the philosophical center of the report.

It should avoid shallow explanations such as:

```text
Users should be more careful.
Developers should remember this.
Teams should read the advisory.
```

Instead, it should explain why the issue escapes human attention:

```text
The execution path was not visible.
It looked like normal work.
Evidence was not preserved by default.
Ownership of the path was unclear.
```

### 2026-04 example

```text
The April incidents were not primarily memory failures. They were visibility and ownership failures. Installation, configuration, and account flows all looked like normal operations, but each carried execution or monetization power that was not visible by default.
```

## 4. Default Shift

### Role

Translate the design failure into a shift in default thinking.

This is not a checklist. It is a before/after change in mental model.

### Format

| Area | Old default | New default |
|---|---|---|
| Build | Installation resolves dependencies | Installation can execute code |
| Config | Tool configuration is personal productivity | Tool configuration is an execution boundary |
| Account | Login is the security event | Post-login value movement is also the security event |

### 2026-04 examples

```text
Build logs should not be treated as secondary debugging artifacts. They are primary evidence for supply-chain compromise.
```

```text
MCP configuration should not be treated as personal developer preference. It is a declaration of tool execution authority.
```

```text
ATO detection should not end at authentication. Stored-value movement is where the business impact is completed.
```

## 5. Decision Point

### Role

Separate what can become default from what must remain a human decision.

This prevents DevSecNews from becoming an automation-only manifesto.

### Questions to include

```text
What can be embedded as a default?
What must be reviewed as an exception?
Who owns the decision?
What evidence is required for that decision?
```

### 2026-04 examples

```text
Should this CI environment be treated as compromised and trigger credential rotation?
Should this MCP tool be approved as a team-standard integration?
Should this ATO cluster be escalated from anomaly monitoring to incident response?
```

## 6. Team Conversation

### Role

Create shared knowledge that cannot be fully automated or transmitted as a rule.

This is where DevSecNews becomes a team conversation starter rather than a static advisory.

### 2026-04 examples

```text
Which execution paths in our team are invisible until something breaks?
Which developer-local settings create organization-level risk?
Which post-login value movements are security events rather than product events?
```

## 7. Field Notes

### Role

Put technical details here.

Node.js, Java, CVEs, affected versions, references, and tool notes still belong in the report, but as evidence and implementation material.

### Suggested subsections

```markdown
## 7.1 Node.js / npm
## 7.2 Java / Spring / JVM
## 7.3 AI / MCP / Development Environment
## 7.4 Account Security / ATO
## 7.5 Tools and References
```

Every major technical item should include:

```text
Default-design takeaway:
What does this incident teach us about visibility, ownership, defaults, or decision boundaries?
```

## 2026-04 structure example

```markdown
# DevSecNews 2026-04
## 개발 패키지 설치 명령(npm install), AI 도구 설정, 로그인 성공 — 어디까지 보이고 있습니까?

## 1. Signal
4월호는 설치, 설정, 계정 흐름 뒤에서 실제로 무엇이 실행되고 기록되는지 묻습니다.

## 2. Pattern
- Axios: 설치가 실행이 되었습니다.
- MCP: 설정이 로컬 도구 실행으로 이어졌습니다.
- ATO: 로그인 이후 자산 흐름에서 피해가 완성됐습니다.

## 3. Design Failure
이번 이슈들은 사람이 기억하지 못해서만 발생한 문제가 아닙니다. 실행 경로가 정상 흐름 안에 숨어 있었고, 그 경로가 기본적으로 기록·검토·소유되지 않았기 때문입니다.

## 4. Default Shift
| Area | Old default | New default |
|---|---|---|
| Build | Installation resolves dependencies | Installation can execute code |
| Config | Tool configuration is personal productivity | Tool configuration is an execution boundary |
| Account | Login is the security event | Post-login value movement is also the security event |

## 5. Decision Point
- Which build environments should be treated as compromised?
- Which MCP tools should be approved as team standards?
- Which ATO flows should be escalated to incident response?

## 6. Team Conversation
- Where are our invisible execution paths?
- What evidence would we need after an incident?
- Which defaults should platform/security teams own?

## 7. Field Notes
- Axios npm supply-chain compromise
- PoisonChain
- MCP / AI development environment
- mcpguard
- ATO supply chain
- PointPivot
- Spring / Java advisories
```

## Relationship to existing pipeline

This PR does not yet change build scripts. It proposes a content structure that can be adopted first by the 2026-04 issue.

If the HTML/card generator assumes fixed numbered sections, the generator should be updated later to recognize semantic sections rather than fixed numeric labels.

Recommended migration path:

```text
Phase 1: Add this structure guide.
Phase 2: Rewrite 2026-04 content using this structure.
Phase 3: Update card-generation prompt/template to use Signal / Pattern / Default Shift.
Phase 4: Update renderer if section anchors or cards depend on the old numbering.
```

## Editorial rule

Each monthly issue should contain one polished thesis, not many competing slogans.

For 2026-04, recommended thesis:

```text
개발 패키지 설치 명령(npm install), AI 도구 설정, 로그인 성공 — 어디까지 보이고 있습니까?
```

Supporting line:

```text
4월호는 설치, 설정, 계정 흐름 뒤에서 실제로 무엇이 실행되고 기록되는지 묻습니다.
```

Avoid leading with:

```text
자동 실행 경로를 통제하세요
```

That sentence is actionable, but it is too directive for the opening thesis. It can be used later in Default Shift or CTA copy.
