"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import React, { Suspense, useState, useEffect } from "react";
import { TopNav } from "../../../components/TopNav";
import { Footer } from "../../../components/Footer";
import { useAuth } from "../../../components/AuthContext";
import { useUserProfile } from "../../../components/useUserProfile";
import { useTeams } from "../../../components/useTeams";
import { useTeamMembers } from "../../../components/useTeamMembers";
import { useAgreements } from "../../../components/useAgreements";
import { db } from "../../../lib/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { groupByChapter } from "../../../lib/agreementClauses";
import { BadgeCheck, CheckCircle2, Clock } from "lucide-react";

function AgreementConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { teams } = useTeams();
  const queryTeamId = searchParams ? searchParams.get("teamId") : null;
  const teamId = queryTeamId || profile?.lastActiveTeamId || profile?.teamIds?.[0] || teams[0]?.id;

  useEffect(() => {
    if (!profileLoading && profile && profile.plan !== "premium") {
      router.replace("/agreement/preview");
    }
  }, [profile, profileLoading, router]);

  const { members, loading: membersLoading } = useTeamMembers(teamId);
  const { agreements, loading: agreementsLoading } = useAgreements(teamId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [adoptChecked, setAdoptChecked] = useState(false);

  const loading = membersLoading || agreementsLoading;
  const pending = agreements.find((a) => a.status === "pending_confirmation");
  const latestConfirmed = agreements.find((a) => a.status === "confirmed");
  const target = pending || latestConfirmed;

  const myConfirmed = Boolean(user && target?.confirmations?.[user.uid]);
  const confirmedCount = target ? Object.keys(target.confirmations || {}).length : 0;

  const handleConfirm = async () => {
    if (!user || !teamId || !pending) return;
    setBusy(true);
    setError(null);
    try {
      await runTransaction(db, async (tx) => {
        const teamRef = doc(db, "teams", teamId);
        const teamSnap = await tx.get(teamRef);
        if (!teamSnap.exists()) throw new Error("Team not found");
        const memberUids: string[] = teamSnap.data()?.members || [];
        if (!memberUids.includes(user.uid)) {
          throw new Error("User is not a member of this team");
        }

        const agreementRef = doc(db, "teams", teamId, "agreements", pending.id);
        const snap = await tx.get(agreementRef);
        if (!snap.exists()) throw new Error("Agreement not found");

        const cur = snap.data() || {};
        const confirmed = new Set(Object.keys(cur.confirmations || {}));
        confirmed.add(user.uid);
        const allConfirmed = memberUids.every((m) => confirmed.has(m));

        tx.update(agreementRef, {
          [`confirmations.${user.uid}`]: serverTimestamp(),
          ...(allConfirmed ? { status: "confirmed" } : {}),
        });
      });
    } catch (e) {
      console.error(e);
      setError("확정 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page agreement-confirm-page">
      <TopNav links={[{ label: "합의 세션", href: `/consensus${teamId ? `?teamId=${teamId}` : ""}` }, { label: "히스토리", href: `/agreement/history${teamId ? `?teamId=${teamId}` : ""}` }]} active="합의안 확정" />

      <section className="container confirm-body">
        {error && <div className="card confirm-error">{error}</div>}
        {loading && <div className="card confirm-card">로딩 중...</div>}

        {!loading && !target && (
          <div className="card confirm-card">
            확정 대기 중인 합의안이 없습니다.{" "}
            <Link href={`/consensus${teamId ? `?teamId=${teamId}` : ""}`} className="confirm-link">합의 세션으로 이동</Link>
          </div>
        )}

        {!loading && target && (
          <>
            <div className="confirm-head">
              <div className="confirm-badge">
                {target.status === "confirmed"
                  ? `전원 확정 완료 (${confirmedCount}/${members.length})`
                  : `확정 진행 중 (${confirmedCount}/${members.length})`}
              </div>
              <h1>창업 팀 간 구조적 합의안 확정</h1>
              <p className="confirm-sub">거버넌스 체계 구축을 위한 최종 의사결정 단계입니다. — v{target.version}</p>
            </div>

            <div className="confirm-grid">
              <div className="card confirm-panel">
                <h2 className="confirm-panel-title">참여자 확정 상태</h2>
                <p className="confirm-panel-sub">모든 구성원 확정 완료 시 문서가 최종 확정됩니다.</p>
                <div className="confirm-members">
                  {members.map((m) => {
                    const done = Boolean(target.confirmations?.[m.id]);
                    return (
                      <div key={m.id} className={`confirm-member ${done ? "done" : ""}`}>
                        <div className="confirm-member-name">
                          {m.name}
                          {m.id === user?.uid ? " (나)" : ""}
                          <span className="confirm-member-role">{m.role}</span>
                        </div>
                        <div className={`confirm-member-status ${done ? "done" : ""}`}>
                          {done ? <><CheckCircle2 size={15} /> 확정 완료</> : <><Clock size={15} /> 대기 중</>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card confirm-panel">
                <h2 className="confirm-panel-title">최종 동의 확인</h2>
                <p className="confirm-panel-sub">내용을 확인하고 최종 합의를 완료합니다.</p>
                {target.status === "confirmed" || myConfirmed ? (
                  <div className="confirm-done-note">
                    <BadgeCheck size={18} />
                    {target.status === "confirmed" ? "본 합의안은 팀원 전원의 합의를 통해 확정되었습니다." : "확정을 완료했습니다. 다른 팀원의 확정을 기다리고 있습니다."}
                    {target.status === "confirmed" && (
                      <button className="btn btn-primary confirm-doc-btn" onClick={() => router.push(`/agreement/document?teamId=${teamId}&version=${target.version}`)}>
                        최종 문서 보기 →
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <label className="confirm-check">
                      <input type="checkbox" checked={agreeChecked} onChange={(e) => setAgreeChecked(e.target.checked)} />
                      최종 합의안 내용을 모두 검토하였으며, 내용에 이견이 없음을 확인합니다.
                    </label>
                    <label className="confirm-check">
                      <input type="checkbox" checked={adoptChecked} onChange={(e) => setAdoptChecked(e.target.checked)} />
                      본 합의안을 CoSync 플랫폼 내 공식 운영 기준으로 채택하는 것에 동의합니다.
                    </label>
                    <button
                      className="btn btn-primary confirm-doc-btn"
                      disabled={busy || !agreeChecked || !adoptChecked}
                      onClick={handleConfirm}
                    >
                      최종 확정하기
                    </button>
                    <Link href={`/consensus?teamId=${teamId}`} className="confirm-back-link">
                      이전 단계로 돌아가서 수정하기
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="card confirm-preview">
              <h2 className="confirm-panel-title">합의안 미리보기</h2>
              {groupByChapter(target.clauses).map((ch) => (
                <div key={ch.cat} className="confirm-chapter">
                  <h3>제{ch.cat + 1}장. {ch.label}</h3>
                  <ol>
                    {ch.clauses.map((c) => (
                      <li key={c.field}>{c.text}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        .confirm-body { padding: 48px 0 80px; display: flex; flex-direction: column; gap: 24px; }
        .confirm-card { padding: 32px; text-align: center; color: #64748b; }
        .confirm-error { padding: 14px 20px; background: #fef2f2; color: #b91c1c; font-size: 0.87rem; font-weight: 600; }
        .confirm-link { color: #5858e2; font-weight: 700; }
        .confirm-head { text-align: center; }
        .confirm-badge { display: inline-block; border: 1px solid #c7d2fe; color: #4338ca; font-size: 0.8rem; font-weight: 700; padding: 6px 16px; border-radius: 999px; margin-bottom: 16px; }
        .confirm-head h1 { font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .confirm-sub { font-size: 0.95rem; color: #64748b; }
        .confirm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 760px) { .confirm-grid { grid-template-columns: 1fr; } }
        .confirm-panel { padding: 28px; }
        .confirm-panel-title { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .confirm-panel-sub { font-size: 0.85rem; color: #64748b; margin-bottom: 20px; }
        .confirm-members { display: flex; flex-direction: column; gap: 10px; }
        .confirm-member { display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; }
        .confirm-member.done { background: #f8faff; }
        .confirm-member-name { font-size: 0.92rem; font-weight: 700; color: #0f172a; }
        .confirm-member-role { margin-left: 8px; font-size: 0.72rem; font-weight: 700; color: #6d28d9; background: #ede9fe; padding: 2px 8px; border-radius: 999px; }
        .confirm-member-status { display: flex; align-items: center; gap: 5px; font-size: 0.82rem; font-weight: 600; color: #94a3b8; }
        .confirm-member-status.done { color: #059669; }
        .confirm-check { display: flex; gap: 10px; align-items: flex-start; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; font-size: 0.87rem; color: #334155; line-height: 1.6; cursor: pointer; }
        .confirm-check input { margin-top: 3px; }
        .confirm-doc-btn { width: 100%; padding: 14px; margin-top: 8px; font-size: 0.95rem; }
        .confirm-doc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .confirm-back-link { display: block; text-align: center; margin-top: 12px; font-size: 0.85rem; color: #64748b; }
        .confirm-done-note { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; font-size: 0.9rem; color: #059669; font-weight: 600; line-height: 1.6; }
        .confirm-preview { padding: 28px; }
        .confirm-chapter { margin-top: 16px; }
        .confirm-chapter h3 { font-size: 0.95rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .confirm-chapter ol { padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
        .confirm-chapter li { font-size: 0.88rem; color: #334155; line-height: 1.7; }
      `}} />
    </main>
  );
}

export default function AgreementConfirmPage() {
  return (
    <Suspense>
      <AgreementConfirmInner />
    </Suspense>
  );
}
