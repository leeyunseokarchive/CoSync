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

