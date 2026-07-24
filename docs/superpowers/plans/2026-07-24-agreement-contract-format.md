# 합의서 양식 계약서화 (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 합의서 출력물([app/agreement/document/page.tsx](../../../app/agreement/document/page.tsx))을 전문·제N조·서명란·별지(조항 초안 골격)·디스클레이머를 갖춘 계약서 형식으로 격상한다.

**Architecture:** 데이터 모델 변경 없이 렌더링만 바꾼다. 별지 조항 초안은 새 순수 모듈 `lib/annexClauses.ts`에 배열로 두고 페이지에서 렌더한다. 미정 수치는 `[  ]` 빈칸으로 남겨 Phase 4(심층 진단 결과 주입)의 seam으로 삼는다.

**Tech Stack:** Next.js 16 (static export, `output: "export"`), React 18, TypeScript. 테스트는 `node --test`(node:test + node:assert), 네이티브 TS strip. 화면 검증은 Playwright 스크린샷([scripts/capture-screenshots.mjs](../../../scripts/capture-screenshots.mjs)).

## Global Constraints

- 데이터 모델·Firestore 스키마 변경 금지. 기존 데이터만 사용: 팀명(`team?.name`), `members[{id, name, role}]`, `doc.clauses`, `doc.confirmations`, `doc.version`, `doc.createdAt`, `doc.status`.
- 당사자 주민등록번호·주소 등 법적 신원정보 수집·표기 금지 (프리-리걸 유지).
- 별지 조항은 반드시 `DRAFT · 변호사 검토 전 법적 효력 없음` 배지를 달고, 미정 수치는 `[  ]` 빈칸으로 남긴다(허위 확정 금지). 이 안전장치는 타협하지 않는다.
- 최하단 디스클레이머 문구(정확히): `본 문서는 구성원 간 자율적 운영 합의로, 법적 계약(주주간계약서 등)을 대체하지 않습니다. 별지 조항은 표준 실무를 참고한 초안이며 변호사 검토 후 효력이 발생합니다.`
- 문구 인용은 spec [2026-07-24-agreement-contract-format-design.md](../specs/2026-07-24-agreement-contract-format-design.md)의 값을 그대로 쓴다.

---

### Task 1: 별지 조항 초안 모듈 (`lib/annexClauses.ts`)

**Files:**
- Create: `lib/annexClauses.ts`
- Test: `lib/annexClauses.test.ts`

**Interfaces:**
- Consumes: (없음)
- Produces:
  - `export type AnnexClause = { id: string; title: string; body: string }`
  - `export const ANNEX_CLAUSES: AnnexClause[]` — Task 3에서 `ANNEX_CLAUSES.map(...)`로 렌더.

- [ ] **Step 1: Write the failing test**

`lib/annexClauses.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { ANNEX_CLAUSES } from "./annexClauses.ts";

test("별지 조항은 비어있지 않고 각 항목이 id·title·body를 가진다", () => {
  assert.ok(ANNEX_CLAUSES.length >= 5);
  for (const c of ANNEX_CLAUSES) {
    assert.ok(c.id && c.title && c.body, `누락 필드: ${JSON.stringify(c)}`);
  }
});

test("id는 중복이 없다", () => {
  const ids = ANNEX_CLAUSES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("모든 조항 body에 최소 하나의 [ ] 빈칸이 있어 허위 확정을 만들지 않는다", () => {
  for (const c of ANNEX_CLAUSES) {
    assert.match(c.body, /\[[^\]]*\]/, `빈칸 없는 조항: ${c.id}`);
  }
});

test("핵심 하드 항목이 모두 포함된다", () => {
  const ids = new Set(ANNEX_CLAUSES.map((c) => c.id));
  for (const need of ["transfer", "vesting", "tagdrag", "noncompete", "penalty"]) {
    assert.ok(ids.has(need), `누락: ${need}`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test lib/annexClauses.test.ts`
Expected: FAIL — `Cannot find module './annexClauses.ts'`

- [ ] **Step 3: Write the module**

`lib/annexClauses.ts` (조항 문구는 [analysis 문서](../../shareholder-agreement-template-analysis.md) 2장 "표준 문구 예"를 재구성한 초안. 관행값 `[4]`/`[12]`도 대괄호로 감싸 빈칸/미확정임을 유지):

```ts
// Phase 1 별지: 주주간계약서 조항 "초안 골격". 미정 수치는 [  ] 빈칸으로 남긴다.
// Phase 4에서 심층 진단 결과로 빈칸을 채운다(그때 값 주입 함수 추가). 지금은 정적.
export type AnnexClause = { id: string; title: string; body: string };

export const ANNEX_CLAUSES: AnnexClause[] = [
  {
    id: "shares",
    title: "지분 보유 현황",
    body: "본 합의일 현재 각 구성원이 보유한 주식의 종류·수 및 지분율은 다음과 같다. 구성원별 보통주 [   ]주 ([  ]%)로 하며, 상세 내역은 별도 표로 확정한다.",
  },
  {
    id: "transfer",
    title: "주식양도 제한·우선매수권",
    body: "구성원은 회사 설립일로부터 [  ]개월간 다른 구성원의 사전 서면동의 없이 보유 주식을 제3자에게 양도할 수 없다. 양도 시 다른 구성원은 동일한 조건으로 먼저 매수할 권리(우선매수권)를 가지며, 통지받은 날로부터 [  ]일 이내에 매수 여부를 회신한다.",
  },
  {
    id: "vesting",
    title: "베스팅·클리프",
    body: "각 구성원이 보유한 주식은 본 합의일로부터 [4]년에 걸쳐 매월 균등하게 베스팅되며, 최초 [12]개월(클리프) 이내 퇴사 시 해당 기간의 주식은 베스팅되지 않는다.",
  },
  {
    id: "tagdrag",
    title: "동반매도·동반매각 (Tag/Drag-along)",
    body: "일방이 보유 주식을 제3자에게 매각하는 경우 다른 구성원은 동일한 조건으로 함께 매각할 것을 요구(동반매도)할 수 있다. 지분 [  ]% 이상을 보유한 구성원이 회사 지분 전부를 매각하기로 결정한 경우, 다른 구성원에게 동일한 조건의 동반매각을 요구할 수 있다.",
  },
  {
    id: "noncompete",
    title: "경업금지·비밀유지",
    body: "구성원은 재임 중 및 퇴임 후 [  ]년간 회사와 동일·유사한 사업을 영위하거나 경쟁사에 관여할 수 없다. 또한 재직 중 알게 된 영업비밀·고객정보·기술정보를 퇴임 후 [  ]년간 제3자에게 누설하거나 자기 목적으로 사용하지 않는다.",
  },
  {
    id: "deadlock",
    title: "교착 상태의 해소",
    body: "회사의 중요한 의사결정이 [  ]개월 이상 교착된 경우, 구성원은 우선 [  ]일간 성실히 협의하고, 그 기간 내 합의에 이르지 못하면 [제3자 중재 · Buy-Sell 등 사전 합의한 방식]에 따라 해소한다.",
  },
  {
    id: "penalty",
    title: "위약벌",
    body: "구성원이 본 별지 조항상의 의무를 위반하여 다른 구성원에게 손해가 발생한 경우, 위반 구성원은 손해배상금(위약벌)으로 금 [        ]원을 지급한다.",
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test lib/annexClauses.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/annexClauses.ts lib/annexClauses.test.ts
git commit -m "feat: add 별지 주주간계약서 조항 초안 모듈 (Phase 1)"
```

---

### Task 2: 본문 계약서화 — 전문·제N조·일반조항·서명란

**Files:**
- Modify: `app/agreement/document/page.tsx` (JSX + 동 파일 `<style>` 블록)

**Interfaces:**
- Consumes: 기존 `groupByChapter`(이미 import됨), `members`, `team`, `doc`, `fmtDate`.
- Produces: (없음 — 렌더링 변경)

TDD 미적용(순수 프리젠테이션). 편집 → 타입체크 → 스크린샷으로 검증한다.

- [ ] **Step 1: `doc` 정의 아래에 chapters 계산 추가**

[app/agreement/document/page.tsx:38-40](../../../app/agreement/document/page.tsx#L38-L40)의 `const doc = ...` 블록 **바로 아래**에 한 줄 추가:

```tsx
  const chapters = doc ? groupByChapter(doc.clauses) : [];
```

- [ ] **Step 2: 전문(preamble) 삽입**

`</header>`(현재 [82행](../../../app/agreement/document/page.tsx#L82)) **바로 아래**, `{groupByChapter(...)...}` 위에 삽입:

```tsx
              <section className="doc-preamble">
                <p className="doc-preamble-body">
                  본 합의는 {team?.name || "본 팀"}의 공동창업 구성원인 아래 당사자들이 팀의 운영 원칙과 상호 약속을 정함을 목적으로 한다.
                </p>
                {members.length > 0 && (
                  <div className="doc-preamble-parties">
                    {members.map((m) => (
                      <span key={m.id}>{m.name} ({m.role})</span>
                    ))}
                  </div>
                )}
                {doc.createdAt && (
                  <div className="doc-preamble-date">작성일: {fmtDate(doc.createdAt)}</div>
                )}
              </section>
```

- [ ] **Step 3: 장→조 전환 + 일반조항 2개 추가**

현재 챕터 렌더 블록([84-95행](../../../app/agreement/document/page.tsx#L84-L95))을 아래로 **교체**:

```tsx
              {chapters.map((ch, ci) => (
                <section key={ch.cat} className="doc-chapter">
                  <h2>제{ci + 1}조 ({ch.label})</h2>
                  <ol>
                    {ch.clauses.map((c, i) => (
                      <li key={c.field}>
                        <span className="doc-clause-num">{`①②③④⑤⑥⑦⑧⑨⑩`[i] ?? `${i + 1}.`}</span> {c.text}
                      </li>
                    ))}
                  </ol>
                </section>
              ))}

              <section className="doc-chapter">
                <h2>제{chapters.length + 1}조 (효력과 시행)</h2>
                <p className="doc-general-clause">
                  본 합의는 구성원 전원이 확정한 날부터 효력을 가지며, 구성원은 매 6개월마다 본 합의를 함께 재점검한다.
                </p>
              </section>
              <section className="doc-chapter">
                <h2>제{chapters.length + 2}조 (분쟁의 해결)</h2>
                <p className="doc-general-clause">
                  본 합의의 해석 또는 이행에 관하여 이견이 발생한 경우, 구성원은 우선 성실히 협의하여 해결한다.
                </p>
              </section>
```

- [ ] **Step 4: 참여자 목록 → 서명란 교체**

현재 footer의 `.doc-parties` 블록([98-106행](../../../app/agreement/document/page.tsx#L98-L106))을 아래로 **교체**:

```tsx
                <div className="doc-signatures">
                  <div className="doc-parties-label">서명</div>
                  {members.map((m) => (
                    <div key={m.id} className="doc-signature">
                      <span className="doc-signature-name">{m.name} ({m.role})</span>
                      <span className="doc-signature-line" />
                      <span className="doc-signature-status">
                        {doc.confirmations[m.id] ? `전자적 동의 ${fmtDate(doc.confirmations[m.id])}` : "미확정"}
                      </span>
                    </div>
                  ))}
                  {doc.createdAt && (
                    <div className="doc-signature-date">작성일 {fmtDate(doc.createdAt)}</div>
                  )}
                </div>
```

- [ ] **Step 5: 새 클래스 CSS 추가**

동 파일 `<style>` 블록([121-154행](../../../app/agreement/document/page.tsx#L121-L154)) 안, `.doc-chapter` 규칙들 뒤에 추가:

```css
        .doc-preamble { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
        .doc-preamble-body { font-size: 1.02rem; color: #334155; line-height: 1.9; }
        .doc-preamble-parties { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 0.98rem; color: #1f2430; font-weight: 600; }
        .doc-preamble-date { margin-top: 10px; font-size: 0.92rem; color: #64748b; }
        .doc-general-clause { font-size: 1.05rem; color: #334155; line-height: 1.8; }
        .doc-signatures { display: flex; flex-direction: column; gap: 12px; }
        .doc-signature { display: flex; align-items: baseline; gap: 12px; font-size: 1rem; color: #334155; }
        .doc-signature-name { min-width: 160px; font-weight: 600; }
        .doc-signature-line { flex: 1; border-bottom: 1px solid #cbd5e1; height: 1px; max-width: 180px; }
        .doc-signature-status { font-size: 0.9rem; color: #64748b; }
        .doc-signature-date { margin-top: 8px; font-size: 0.92rem; color: #64748b; }
```

- [ ] **Step 6: 타입체크**

Run: `npx tsc --noEmit`
Expected: 종료 코드 0, 출력 없음.

- [ ] **Step 7: 스크린샷 검증**

```bash
# dev 서버가 이미 떠 있지 않으면: npm run dev &  (포트 3000)
node scripts/capture-screenshots.mjs
```
Expected: `docs/captures/2026-07-24/agreement-document.png` 생성. 해당 이미지를 열어 전문·제1조~·제N조(효력/분쟁)·서명란이 계약서 형태로 렌더되고 조 번호가 1부터 연속인지 확인.

- [ ] **Step 8: Commit**

```bash
git add app/agreement/document/page.tsx
git commit -m "feat: 합의서 본문 계약서화 — 전문·제N조·일반조항·서명란 (Phase 1)"
```

---

### Task 3: 별지 조항 초안 + DRAFT 배지 + 최하단 디스클레이머

**Files:**
- Modify: `app/agreement/document/page.tsx` (import + JSX + `<style>`)

**Interfaces:**
- Consumes: `ANNEX_CLAUSES`(Task 1).
- Produces: (없음)

- [ ] **Step 1: import 추가**

파일 상단 import 목록([12행 `groupByChapter` import 부근](../../../app/agreement/document/page.tsx#L12))에 추가:

```tsx
import { ANNEX_CLAUSES } from "../../../lib/annexClauses";
```

- [ ] **Step 2: 빈칸 강조 렌더 헬퍼 추가**

`fmtDate` 정의([16-17행](../../../app/agreement/document/page.tsx#L16-L17)) 아래에 추가 (`[...]` 토큰을 회색 표시로 감싸 미확정임을 시각화):

```tsx
function renderWithBlanks(body: string): React.ReactNode {
  return body.split(/(\[[^\]]*\])/g).map((part, i) =>
    /^\[[^\]]*\]$/.test(part) ? (
      <mark key={i} className="doc-blank">{part}</mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}
```

(`React`는 [5행](../../../app/agreement/document/page.tsx#L5)에서 이미 import됨.)

- [ ] **Step 3: 별지 + 디스클레이머 JSX 삽입**

`</footer>`(현재 [111행](../../../app/agreement/document/page.tsx#L111)) **바로 아래**, `</article>` 위에 삽입:

```tsx
              <section className="doc-annex">
                <div className="doc-annex-badge">DRAFT · 변호사 검토 전 법적 효력 없음</div>
                <h2 className="doc-annex-title">[별지] 주주간계약서 조항 초안</h2>
                <ol className="doc-annex-list">
                  {ANNEX_CLAUSES.map((c, i) => (
                    <li key={c.id}>
                      <span className="doc-annex-clause-title">제{i + 1}조 ({c.title})</span>{" "}
                      <span className="doc-annex-clause-body">{renderWithBlanks(c.body)}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <p className="doc-disclaimer">
                본 문서는 구성원 간 자율적 운영 합의로, 법적 계약(주주간계약서 등)을 대체하지 않습니다. 별지 조항은 표준 실무를 참고한 초안이며 변호사 검토 후 효력이 발생합니다.
              </p>
```

- [ ] **Step 4: 별지·디스클레이머 CSS 추가**

`<style>` 블록의 `@media print` **앞**에 추가:

```css
        .doc-annex { margin-top: 40px; padding-top: 28px; border-top: 2px dashed #cbd5e1; break-before: page; }
        .doc-annex-badge { display: inline-block; border: 1.5px solid #b45309; color: #b45309; font-weight: 700; font-size: 0.78rem; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 6px; margin-bottom: 14px; }
        .doc-annex-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
        .doc-annex-list { list-style: none; display: flex; flex-direction: column; gap: 14px; }
        .doc-annex-list li { font-size: 1rem; line-height: 1.8; color: #334155; }
        .doc-annex-clause-title { font-weight: 700; color: #0f172a; }
        .doc-blank { background: #f1f5f9; color: #94a3b8; font-weight: 600; border-radius: 4px; padding: 0 2px; }
        .doc-disclaimer { margin-top: 28px; font-size: 0.76rem; line-height: 1.6; color: #94a3b8; }
```

`@media print` 블록 안에 배지가 흑백에서도 보이도록 추가:

```css
          .doc-annex-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .doc-blank { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
```

- [ ] **Step 5: 타입체크**

Run: `npx tsc --noEmit`
Expected: 종료 코드 0, 출력 없음.

- [ ] **Step 6: 스크린샷 검증**

```bash
node scripts/capture-screenshots.mjs
```
Expected: `docs/captures/2026-07-24/agreement-document.png`에 [별지] 주주간계약서 조항 초안(제1조~제7조), `DRAFT` 배지, `[  ]` 빈칸 회색 표시, 최하단 작은 글씨 디스클레이머가 보임.

- [ ] **Step 7: 정적 export 빌드 확인 (별지 import가 export를 깨지 않는지)**

Run: `npm run build`
Expected: 빌드 성공(`✓ Compiled`, export 완료).

- [ ] **Step 8: Commit**

```bash
git add app/agreement/document/page.tsx
git commit -m "feat: 별지 주주간계약서 조항 초안 + DRAFT 배지 + 디스클레이머 (Phase 1)"
```

---

### Task 4: analysis 문서 갱신

**Files:**
- Modify: `docs/shareholder-agreement-template-analysis.md`

**Interfaces:**
- Consumes: (없음)
- Produces: (없음)

- [ ] **Step 1: "현재 합의서 양식(Phase 1 반영)" 절 추가**

`## 3. CoSync 현재 조항 ↔ 표준 조항 매핑 표` **바로 앞**에 새 절을 삽입:

```markdown
## 2-b. 현재 합의서 양식 (Phase 1 반영)

합의서 문서([app/agreement/document/page.tsx](../app/agreement/document/page.tsx))는 Phase 1에서 계약서 형식으로 격상되었다.

- **전문**(당사자·목적·작성일), **제N조 (제목)** 본문 조항, **일반조항**(효력·시행 / 분쟁의 해결), **서명란**을 갖춘다.
- 문서 하단에 **[별지] 주주간계약서 조항 초안**([lib/annexClauses.ts](../lib/annexClauses.ts))이 조항 문장 형태로 렌더된다. 지분·양도제한·베스팅·tag/drag·경업금지·교착·위약벌을 담되, 미정 수치는 `[  ]` 빈칸으로 남긴다.
- 별지는 `DRAFT · 변호사 검토 전 법적 효력 없음` 배지와 최하단 비법률 디스클레이머를 함께 표기한다.
- 별지 빈칸은 **Phase 3(하드 항목 데이터 수집) → Phase 4(값 주입)** 에서 심층 진단 결과로 채워진다. 진단을 진행하지 않은 팀은 해당 빈칸만 비운 채로 합의안·계약서가 생성된다. 아래 4장의 정보 목록이 그 입력이다.
```

- [ ] **Step 2: 4장 도입부에 Phase 연결 한 줄 추가**

`## 4. 완성도 향상을 위한 보완 필수 정보 목록` 바로 아래 문단 끝에 한 문장 추가:

```markdown
(이 목록은 Phase 3에서 수집하고 Phase 4에서 별지 조항의 `[  ]` 빈칸을 채우는 데 쓰인다.)
```

- [ ] **Step 3: Commit**

```bash
git add docs/shareholder-agreement-template-analysis.md
git commit -m "docs: analysis 문서에 Phase 1 합의서 양식·별지 반영"
```

---

## Self-Review

**Spec coverage:**
- 전문 → Task 2 Step 2 ✓
- 제N장→제N조 순차 번호 → Task 2 Step 1·3 ✓ (빈 카테고리 시에도 index 기반 1부터 연속)
- 일반조항(효력·시행 / 분쟁해결) → Task 2 Step 3 ✓
- 서명란 → Task 2 Step 4 ✓
- 별지 조항 초안 골격 + 빈칸 + DRAFT 배지 → Task 1 + Task 3 ✓
- 최하단 작은 글씨 디스클레이머 → Task 3 Step 3 ✓
- lib/annexClauses.ts seam → Task 1 ✓
- 인쇄 처리(break-before, DRAFT 배지 흑백 가시성, print-color-adjust) → Task 3 Step 4 ✓
- analysis 문서 갱신 → Task 4 ✓
- 데이터 모델 불변 → 전 Task가 기존 데이터만 사용, 신규 파일은 정적 배열 ✓
- 검증(확정/미확정·결측·조 번호·PDF) → Task 2·3 스크린샷 + 빌드 ✓

**Placeholder scan:** 모든 코드 스텝에 실제 코드/문구 포함. "TODO/TBD" 없음. `[  ]`는 의도된 계약 빈칸(플레이스홀더 아님).

**Type consistency:** `AnnexClause {id,title,body}`가 Task 1 정의 ↔ Task 3 사용(`c.id`,`c.title`,`c.body`) 일치. `renderWithBlanks(body: string)` 정의·호출 일치. `chapters` 계산(Task 2 Step 1) ↔ 사용(Step 3) 일치.
