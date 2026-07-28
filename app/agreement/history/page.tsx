"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect } from "react";
import { TopNav } from "../../../components/TopNav";
import { Footer } from "../../../components/Footer";
import { useUserProfile } from "../../../components/useUserProfile";
import { useTeams } from "../../../components/useTeams";
import { useAgreements } from "../../../components/useAgreements";
import { isPremium } from "../../../lib/premium";
import { FileText, GitCompare } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

const fmtDate = (ts: Timestamp | null | undefined) =>
  ts?.toDate ? ts.toDate().toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

function AgreementHistoryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading: profileLoading } = useUserProfile();
  const { teams } = useTeams();
  const queryTeamId = searchParams ? searchParams.get("teamId") : null;
  const teamId = queryTeamId || profile?.lastActiveTeamId || profile?.teamIds?.[0] || teams[0]?.id;

  useEffect(() => {
    if (!profileLoading && profile && !isPremium(profile)) {
      router.replace("/agreement/preview");
    }
  }, [profile, profileLoading, router]);

  const { agreements, loading } = useAgreements(teamId);

  return (
    <main className="page agreement-history-page">
      <TopNav links={[{ label: "합의 세션", href: `/consensus${teamId ? `?teamId=${teamId}` : ""}` }, { label: "합의서", href: `/agreement/document${teamId ? `?teamId=${teamId}` : ""}` }]} active="히스토리" />

      <section className="container history-body">
        <div className="history-head">
          <div className="history-label">VERSION HISTORY</div>
          <h1>합의 히스토리</h1>
          <p className="history-sub">확정된 합의안의 버전 기록입니다.</p>
        </div>

        {loading && <div className="card history-card">로딩 중...</div>}
        {!loading && agreements.length === 0 && (
          <div className="card history-card">
            아직 생성된 합의안이 없습니다.{" "}
            <Link href={`/consensus${teamId ? `?teamId=${teamId}` : ""}`} className="history-link">합의 세션 시작하기</Link>
          </div>
        )}

        <div className="history-list">
          {agreements.map((a, idx) => {
            const prev = agreements[idx + 1];
            return (
              <div key={a.id} className="card history-item">
                <div className="history-item-main">
                  <div className="history-version">v{a.version}</div>
                  <div>
                    <div className="history-item-title">
                      합의안 v{a.version}
                      <span className={`history-status ${a.status}`}>
                        {a.status === "confirmed" ? "확정" : "확정 대기"}
                      </span>
                    </div>
                    <div className="history-item-meta">
                      {fmtDate(a.createdAt)} · {a.createdByName} 생성 · 조항 {a.clauses.length}개
                    </div>
                  </div>
                </div>
                <div className="history-item-actions">
                  <Link href={`/agreement/document?teamId=${teamId}&version=${a.version}`} className="btn btn-ghost history-btn">
                    <FileText size={14} /> 문서 보기
                  </Link>
                  {prev && (
                    <Link href={`/agreement/diff?teamId=${teamId}&from=${prev.version}&to=${a.version}`} className="btn btn-ghost history-btn">
                      <GitCompare size={14} /> v{prev.version}과 비교
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        .history-body { padding: 48px 0 80px; display: flex; flex-direction: column; gap: 24px; }
        .history-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 2px; color: #5858e2; margin-bottom: 8px; }
        .history-head h1 { font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .history-sub { font-size: 0.95rem; color: #64748b; }
        .history-card { padding: 32px; text-align: center; color: #64748b; }
        .history-link { color: #5858e2; font-weight: 700; }
        .history-list { display: flex; flex-direction: column; gap: 12px; }
        .history-item { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 24px; flex-wrap: wrap; }
        .history-item-main { display: flex; align-items: center; gap: 16px; }
        .history-version { width: 48px; height: 48px; border-radius: 12px; background: #ede9fe; color: #6d28d9; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .history-item-title { font-size: 1rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px; }
        .history-status { font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: #fef3c7; color: #b45309; }
        .history-status.confirmed { background: #ecfdf5; color: #059669; }
        .history-item-meta { font-size: 0.82rem; color: #94a3b8; margin-top: 4px; }
        .history-item-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .history-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; font-size: 0.82rem; }
        .btn-ghost { background: #f1f5f9; color: #334155; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; text-decoration: none; }
      `}} />
    </main>
  );
}

export default function AgreementHistoryPage() {
  return (
    <Suspense>
      <AgreementHistoryInner />
    </Suspense>
  );
}
