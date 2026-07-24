"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect } from "react";
import { TopNav } from "../../../components/TopNav";
import { Footer } from "../../../components/Footer";
import { useUserProfile } from "../../../components/useUserProfile";
import { useTeams } from "../../../components/useTeams";
import { useTeamMembers } from "../../../components/useTeamMembers";
import { useAgreements } from "../../../components/useAgreements";
import { groupByChapter } from "../../../lib/agreementClauses";
import { Printer, History } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

const fmtDate = (ts: Timestamp | null | undefined) =>
  ts?.toDate ? ts.toDate().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) : "";

function AgreementDocumentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading: profileLoading } = useUserProfile();
  const { teams } = useTeams();
  const queryTeamId = searchParams ? searchParams.get("teamId") : null;
  const teamId = queryTeamId || profile?.lastActiveTeamId || profile?.teamIds?.[0] || teams[0]?.id;
  const versionParam = searchParams ? searchParams.get("version") : null;

  useEffect(() => {
    if (!profileLoading && profile && profile.plan !== "premium") {
      router.replace("/agreement/preview");
    }
  }, [profile, profileLoading, router]);

  const { members } = useTeamMembers(teamId);
  const { agreements, loading } = useAgreements(teamId);
  const team = teams.find((t) => t.id === teamId);

  const doc = versionParam
    ? agreements.find((a) => a.version === Number(versionParam))
    : agreements.find((a) => a.status === "confirmed") || agreements[0];

  const chapters = doc ? groupByChapter(doc.clauses) : [];

  return (
    <main className="page agreement-document-page">
      <div className="no-print">
        <TopNav links={[{ label: "합의 세션", href: `/consensus${teamId ? `?teamId=${teamId}` : ""}` }, { label: "히스토리", href: `/agreement/history${teamId ? `?teamId=${teamId}` : ""}` }]} active="합의서" />
      </div>

      <section className="container document-body">
        {loading && <div className="card document-card no-print">로딩 중...</div>}
        {!loading && !doc && (
          <div className="card document-card no-print">
            합의서가 아직 없습니다.{" "}
            <Link href={`/consensus${teamId ? `?teamId=${teamId}` : ""}`} className="document-link">합의 세션 시작하기</Link>
          </div>
        )}

        {doc && (
          <>
            <div className="document-toolbar no-print">
              <div className={`document-status ${doc.status}`}>
                {doc.status === "confirmed" ? "최종 확정됨" : "확정 대기 중"} · v{doc.version}
              </div>
              <div className="document-actions">
                <Link href={`/agreement/history?teamId=${teamId}`} className="btn btn-ghost document-btn">
                  <History size={15} /> 버전 히스토리
                </Link>
                <button className="btn btn-primary document-btn" onClick={() => window.print()}>
                  <Printer size={15} /> PDF 내보내기
                </button>
              </div>
            </div>

            <article className="agreement-doc card">
              <header className="doc-header">
                <h1>창업 팀 간 구조적 합의안</h1>
                <div className="doc-subtitle">STRUCTURAL FOUNDING TEAM AGREEMENT</div>
                <div className="doc-meta">
                  {team?.name && <span>{team.name}</span>}
                  <span>v{doc.version}{doc.status === "confirmed" ? " Final" : " (Draft)"}</span>
                  {doc.createdAt && <span>{fmtDate(doc.createdAt)}</span>}
                </div>
              </header>

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

              <footer className="doc-footer">
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
                {doc.status === "confirmed" && (
                  <div className="doc-confirmed-note">본 합의안은 팀원 전원의 합의를 통해 확정되었습니다.</div>
                )}
                <div className="doc-generated">GENERATED BY COSYNC</div>
              </footer>
            </article>
          </>
        )}
      </section>

      <div className="no-print">
        <Footer />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .document-body { padding: 40px 0 80px; display: flex; flex-direction: column; gap: 20px; }
        .document-card { padding: 32px; text-align: center; color: #64748b; }
        .document-link { color: #5858e2; font-weight: 700; }
        .document-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .document-status { font-size: 0.82rem; font-weight: 700; padding: 6px 14px; border-radius: 999px; background: #fef3c7; color: #b45309; }
        .document-status.confirmed { background: #ecfdf5; color: #059669; }
        .document-actions { display: flex; gap: 8px; }
        .document-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; font-size: 0.87rem; }
        .btn-ghost { background: #f1f5f9; color: #334155; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; text-decoration: none; }
        .agreement-doc { padding: clamp(28px, 6vw, 64px); max-width: 820px; margin: 0 auto; width: 100%; }
        .doc-header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 24px; margin-bottom: 32px; }
        .doc-header h1 { font-size: clamp(1.7rem, 4.5vw, 2.4rem); font-weight: 800; color: #0f172a; margin-bottom: 6px; }
        .doc-subtitle { font-size: 0.75rem; letter-spacing: 2px; color: #94a3b8; font-weight: 600; }
        .doc-meta { margin-top: 14px; display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; font-size: 0.95rem; color: #64748b; }
        .doc-chapter { margin-bottom: 28px; }
        .doc-chapter h2 { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin-bottom: 12px; padding-left: 12px; border-left: 3px solid #5858e2; }
        .doc-chapter ol { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .doc-chapter li { font-size: 1.05rem; color: #334155; line-height: 1.8; }
        .doc-clause-num { color: #5858e2; font-weight: 700; margin-right: 2px; }
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
        .doc-footer { border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 12px; display: flex; flex-direction: column; gap: 16px; }
        .doc-parties-label { font-size: 0.85rem; font-weight: 700; color: #94a3b8; margin-bottom: 8px; letter-spacing: 1px; }
        .doc-party { font-size: 1rem; color: #334155; line-height: 1.8; }
        .doc-confirmed-note { text-align: center; font-size: 1rem; font-weight: 700; color: #059669; background: #ecfdf5; border-radius: 10px; padding: 12px; }
        .doc-generated { text-align: center; font-size: 0.68rem; letter-spacing: 3px; color: #cbd5e1; font-weight: 600; }
        @media print {
          .no-print { display: none !important; }
          .document-toolbar { display: none !important; }
          .page { background: #fff !important; }
          .document-body { padding: 0; }
          .agreement-doc { box-shadow: none !important; border: none !important; max-width: none; padding: 0; }
          @page { margin: 20mm; }
        }
      `}} />
    </main>
  );
}

export default function AgreementDocumentPage() {
  return (
    <Suspense>
      <AgreementDocumentInner />
    </Suspense>
  );
}
