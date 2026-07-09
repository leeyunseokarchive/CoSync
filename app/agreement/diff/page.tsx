"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useMemo } from "react";
import { TopNav } from "../../../components/TopNav";
import { Footer } from "../../../components/Footer";
import { useUserProfile } from "../../../components/useUserProfile";
import { useTeams } from "../../../components/useTeams";
import { useAgreements } from "../../../components/useAgreements";
import { CAT_LABELS } from "../../../lib/gap";
import { QUESTION_META } from "../../../lib/agreementClauses";
import type { Clause } from "../../../lib/agreementClauses";
import type { OnboardingAnswers } from "../../../lib/gap";
import { isPremium } from "../../../lib/premium";

type DiffRow = {
  field: string;
  cat: number;
  kind: "unchanged" | "changed" | "added" | "removed";
  from?: Clause;
  to?: Clause;
};

function computeDiff(from: Clause[], to: Clause[]): DiffRow[] {
  const fromMap = new Map(from.map((c) => [c.field, c]));
  const toMap = new Map(to.map((c) => [c.field, c]));
  const fields = Array.from(new Set([...from.map((c) => c.field), ...to.map((c) => c.field)]));
  return fields.map((field) => {
    const f = fromMap.get(field);
    const t = toMap.get(field);
    const cat = (t ?? f)!.cat;
    if (f && t) return { field, cat, kind: f.text === t.text ? "unchanged" : "changed", from: f, to: t };
    if (t) return { field, cat, kind: "added", to: t };
    return { field, cat, kind: "removed", from: f };
  });
}

const KIND_LABEL: Record<DiffRow["kind"], string> = {
  unchanged: "유지",
  changed: "변경",
  added: "추가",
  removed: "삭제",
};

function AgreementDiffInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();
  const { teams } = useTeams();
  const queryTeamId = searchParams ? searchParams.get("teamId") : null;
  const teamId = queryTeamId || profile?.lastActiveTeamId || profile?.teamIds?.[0] || teams[0]?.id;
  const fromV = Number(searchParams?.get("from"));
  const toV = Number(searchParams?.get("to"));

  const { agreements, loading } = useAgreements(teamId);
  const fromDoc = agreements.find((a) => a.version === fromV);
  const toDoc = agreements.find((a) => a.version === toV);

  React.useEffect(() => {
    if (!profileLoading && profile && !isPremium(profile)) {
      router.replace("/agreement/preview");
    }
  }, [profile, profileLoading, router]);

  const rows = useMemo(
    () => (fromDoc && toDoc ? computeDiff(fromDoc.clauses, toDoc.clauses) : []),
    [fromDoc, toDoc]
  );
  const changedRows = rows.filter((r) => r.kind !== "unchanged");

  return (
    <main className="page agreement-diff-page">
      <TopNav links={[{ label: "히스토리", href: `/agreement/history${teamId ? `?teamId=${teamId}` : ""}` }, { label: "합의서", href: `/agreement/document${teamId ? `?teamId=${teamId}` : ""}` }]} active="버전 비교" />

      <section className="container diff-body">
        <div className="diff-head">
          <div className="diff-label">VERSION DIFF</div>
          <h1>버전 비교 <span className="diff-versions">v{fromV} → v{toV}</span></h1>
          <p className="diff-sub">
            {loading ? "로딩 중..." : fromDoc && toDoc
              ? `변경 ${changedRows.length}개 · 유지 ${rows.length - changedRows.length}개`
              : "비교할 버전을 찾을 수 없습니다."}
          </p>
        </div>

        {!loading && (!fromDoc || !toDoc) && (
          <div className="card diff-card">
            <Link href={`/agreement/history${teamId ? `?teamId=${teamId}` : ""}`} className="diff-link">히스토리로 돌아가기</Link>
          </div>
        )}

        {fromDoc && toDoc &&
          CAT_LABELS.map((catLabel, cat) => {
            const catRows = rows.filter((r) => r.cat === cat);
            if (catRows.length === 0) return null;
            return (
              <div key={cat} className="diff-chapter">
                <h2>제{cat + 1}장. {catLabel}</h2>
                <div className="diff-rows">
                  {catRows.map((r) => (
                    <div key={r.field} className={`card diff-row ${r.kind}`}>
                      <div className="diff-row-head">
                        <span className="diff-row-title">
                          {QUESTION_META[r.field as keyof OnboardingAnswers]?.label ?? r.field}
                        </span>
                        <span className={`diff-kind ${r.kind}`}>{KIND_LABEL[r.kind]}</span>
                      </div>
                      {r.kind === "unchanged" && <div className="diff-text">{r.to!.text}</div>}
                      {r.kind === "added" && <div className="diff-text added">{r.to!.text}</div>}
                      {r.kind === "removed" && <div className="diff-text removed">{r.from!.text}</div>}
                      {r.kind === "changed" && (
                        <div className="diff-compare">
                          <div>
                            <div className="diff-side-label">v{fromV}</div>
                            <div className="diff-text removed">{r.from!.text}</div>
                          </div>
                          <div>
                            <div className="diff-side-label">v{toV}</div>
                            <div className="diff-text added">{r.to!.text}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </section>

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        .diff-body { padding: 48px 0 80px; display: flex; flex-direction: column; gap: 28px; }
        .diff-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 2px; color: #5858e2; margin-bottom: 8px; }
        .diff-head h1 { font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .diff-versions { color: #5858e2; font-weight: 700; font-size: 0.7em; }
        .diff-sub { font-size: 0.92rem; color: #64748b; }
        .diff-card { padding: 32px; text-align: center; }
        .diff-link { color: #5858e2; font-weight: 700; }
        .diff-chapter h2 { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
        .diff-rows { display: flex; flex-direction: column; gap: 10px; }
        .diff-row { padding: 18px 20px; }
        .diff-row.unchanged { opacity: 0.65; }
        .diff-row-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .diff-row-title { font-size: 0.92rem; font-weight: 700; color: #0f172a; }
        .diff-kind { font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: #f1f5f9; color: #64748b; }
        .diff-kind.changed { background: #fef3c7; color: #b45309; }
        .diff-kind.added { background: #ecfdf5; color: #059669; }
        .diff-kind.removed { background: #fee2e2; color: #b91c1c; }
        .diff-text { font-size: 0.87rem; color: #334155; line-height: 1.7; border-radius: 10px; padding: 10px 12px; background: #f8fafc; }
        .diff-text.added { background: #ecfdf5; }
        .diff-text.removed { background: #fef2f2; text-decoration: none; }
        .diff-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 700px) { .diff-compare { grid-template-columns: 1fr; } }
        .diff-side-label { font-size: 0.72rem; font-weight: 700; color: #94a3b8; margin-bottom: 4px; }
      `}} />
    </main>
  );
}

export default function AgreementDiffPage() {
  return (
    <Suspense>
      <AgreementDiffInner />
    </Suspense>
  );
}
