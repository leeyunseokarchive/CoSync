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

