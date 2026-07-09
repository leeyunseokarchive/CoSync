"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../components/AuthContext";
import { useUserProfile } from "../../components/useUserProfile";
import { useTeams } from "../../components/useTeams";
import { useTeamMembers } from "../../components/useTeamMembers";
import { useConsensus } from "../../components/useConsensus";
import { useAgreements } from "../../components/useAgreements";
import {
  CAT_LABELS,
  QUESTION_CONFIGS,
  getTeamIssueStatus,
  type IssueStatus,
  type OnboardingAnswers,
} from "../../lib/gap";
import {
  QUESTION_META,
  getClauseTemplate,
  buildClauses,
  type ResolvedItem,
  type ClauseOption,
} from "../../lib/agreementClauses";
import { propose, vote, reopen, finalizeAgreement, type ConsensusDoc } from "../../lib/consensus";
import { Check, X, ChevronDown, ChevronUp, FileCheck2, RotateCcw } from "lucide-react";

type ItemState =
  | { kind: "match" }
  | { kind: "unanswered" }
  | { kind: "needs-proposal" }
  | { kind: "voting"; doc: ConsensusDoc }
  | { kind: "resolved"; doc: ConsensusDoc };

function itemState(status: IssueStatus, doc: ConsensusDoc | undefined): ItemState {
  if (status === "match") return { kind: "match" };
  if (status === "unanswered") return { kind: "unanswered" };
  if (!doc) return { kind: "needs-proposal" };
  if (doc.status === "resolved") return { kind: "resolved", doc };
  return { kind: "voting", doc };
}

const CHIP: Record<ItemState["kind"], { label: string; cls: string }> = {
  match: { label: "자동 합의", cls: "chip-match" },
  unanswered: { label: "진단 미완료", cls: "chip-muted" },
  "needs-proposal": { label: "제안 필요", cls: "chip-needs" },
  voting: { label: "투표중", cls: "chip-voting" },
  resolved: { label: "합의 완료", cls: "chip-resolved" },
};

function ConsensusPageInner() {
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
  const { items, loading: consensusLoading } = useConsensus(teamId);
  const { agreements } = useAgreements(teamId);

  const [openField, setOpenField] = useState<string | null>(null);
  const [draftOption, setDraftOption] = useState<string>("");
  const [draftText, setDraftText] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberUids = useMemo(() => members.map((m) => m.id), [members]);
  const myName = profile?.name || user?.displayName || "";

  const rows = useMemo(
    () =>
      QUESTION_CONFIGS.map((q) => {
        const values = members.map((m) => m.answers?.[q.field]);
        const status = getTeamIssueStatus(values, q.toxicPairs);
        const state = itemState(status, items[q.field]);
        return { q, status, state };
      }),
    [members, items]
  );

  const gapRows = rows.filter((r) => r.state.kind !== "match" && r.state.kind !== "unanswered");
  const resolvedCount = gapRows.filter((r) => r.state.kind === "resolved").length;
  const allResolved = gapRows.length > 0 ? resolvedCount === gapRows.length : false;
  const answeredMatchRows = rows.filter((r) => r.state.kind === "match");
  const pendingAgreement = agreements.find((a) => a.status === "pending_confirmation");
  const canFinalize =
    (allResolved || (gapRows.length === 0 && answeredMatchRows.length > 0)) &&
    members.length >= 2 &&
    !pendingAgreement;

  const toggleOpen = (field: string) => {
    setOpenField((cur) => (cur === field ? null : field));
    setDraftOption("");
    setDraftText("");
  };

  const handlePickOption = (field: keyof OnboardingAnswers, option: string) => {
    setDraftOption(option);
    setDraftText(getClauseTemplate(field, option));
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      console.error(e);
      setError("처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  const handlePropose = (field: string) => {
    if (!user || !teamId || !draftOption || !draftText.trim()) return;
    run(async () => {
      await propose(teamId, field, user.uid, myName, draftOption, draftText.trim());
      setDraftOption("");
      setDraftText("");
    });
  };

  const handleVote = (field: string, doc: ConsensusDoc, choice: "approve" | "reject") => {
    if (!user || !teamId) return;
    run(() => vote(teamId, field, user.uid, choice, memberUids, doc));
  };

  const handleReopen = (field: string) => {
    if (!teamId) return;
    run(() => reopen(teamId, field));
  };

  const handleFinalize = () => {
    if (!user || !teamId) return;
    run(async () => {
      const resolved: Partial<Record<keyof OnboardingAnswers, ResolvedItem>> = {};
      for (const r of rows) {
        if (r.state.kind === "match") {
          const v = members[0]?.answers?.[r.q.field];
          if (v) resolved[r.q.field] = { option: v[0], source: "match" };
        } else if (r.state.kind === "resolved") {
          resolved[r.q.field] = {
            option: r.state.doc.resolvedOption || r.state.doc.proposal.option,
            text: r.state.doc.resolvedClause || r.state.doc.proposal.clauseText,
            source: "consensus",
          };
        }
      }
      const clauses = buildClauses(resolved);
      const nextVersion = (agreements[0]?.version ?? 0) + 1;
      await finalizeAgreement(teamId, user.uid, myName, clauses, nextVersion);
      router.push(`/agreement/confirm?teamId=${teamId}`);
    });
  };

  const loading = membersLoading || consensusLoading;

  return (
    <main className="page consensus-page">
      <TopNav links={[{ label: "대시보드", href: "/workspace" }, { label: "갭 리포트", href: `/gap-report${teamId ? `?teamId=${teamId}` : ""}` }]} active="합의 세션" />

      <section className="container consensus-body">
        <div className="consensus-head">
          <div className="consensus-label">AGREEMENT SESSION</div>
          <h1>팀 합의 세션</h1>
          <p className="consensus-sub">
            갭이 확인된 항목에 대해 합의안을 제안하고 전원 동의로 확정합니다.
            일치한 항목은 자동으로 합의서에 반영됩니다.
          </p>
          {teams.length > 0 && (
            <div className="consensus-team-picker">
              <span>현재 팀</span>
              <select
                className="consensus-team-select"
                value={teamId || ""}
                onChange={(e) => router.push(`/consensus?teamId=${e.target.value}`)}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          {gapRows.length > 0 && (
            <div className="consensus-progress">
              <div className="consensus-progress-text">
                합의 진행 {resolvedCount}/{gapRows.length}
              </div>
              <div className="consensus-progress-bar">
                <div
                  className="consensus-progress-fill"
                  style={{ width: `${Math.round((resolvedCount / gapRows.length) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {error && <div className="card consensus-error">{error}</div>}
        {loading && <div className="card consensus-card">로딩 중...</div>}
        {!loading && members.length < 2 && (
          <div className="card consensus-card">
            이 팀({teams.find((t) => t.id === teamId)?.name ?? "선택된 팀"})의 등록된 팀원이 {members.length}명입니다.
            합의 세션은 팀원이 2명 이상일 때 시작할 수 있습니다.
            {teams.length > 1 && " 위의 팀 선택에서 다른 팀으로 전환할 수 있습니다."}
          </div>
        )}

        {!loading && members.length >= 2 &&
          CAT_LABELS.map((catLabel, cat) => {
            const catRows = rows.filter((r) => r.q.cat === cat);
            if (catRows.length === 0) return null;
            return (
              <div key={cat} className="consensus-cat">
                <h2 className="consensus-cat-title">
                  제{cat + 1}장. {catLabel}
                </h2>
                <div className="consensus-items">
                  {catRows.map(({ q, state }) => {
                    const meta = QUESTION_META[q.field];
                    const chip = CHIP[state.kind];
                    const expandable = state.kind !== "unanswered";
                    const open = openField === q.field;
                    return (
                      <div key={q.field} className={`card consensus-item ${open ? "open" : ""}`}>
                        <button
                          type="button"
                          className="consensus-item-head"
                          onClick={() => expandable && toggleOpen(q.field)}
                          disabled={!expandable}
                        >
                          <span className="consensus-item-label">{meta.label}</span>
                          <span className={`consensus-chip ${chip.cls}`}>{chip.label}</span>
                          {expandable && (open ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                        </button>

                        {open && (
                          <div className="consensus-item-body">
                            <div className="consensus-positions">
                              {members.map((m) => {
                                const v = m.answers?.[q.field];
                                const opt = v ? v[0] : undefined;
                                return (
                                  <div key={m.id} className={`consensus-position ${m.id === user?.uid ? "me" : ""}`}>
                                    <div className="position-name">
                                      {m.name}
                                      {m.id === user?.uid ? " (나)" : ""}
                                    </div>
                                    <div className="position-answer">
                                      {opt ? meta.optionLabels[opt as ClauseOption] ?? opt : "미응답"}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {state.kind === "match" && (
                              <div className="consensus-note">
                                전원 답변 일치 — 아래 조항이 합의서에 자동 반영됩니다.
                                <div className="consensus-clause-preview">
                                  {getClauseTemplate(q.field, (members[0]?.answers?.[q.field] || "1")[0])}
                                </div>
                              </div>
                            )}

                            {state.kind === "resolved" && (
                              <div className="consensus-note resolved">
                                <Check size={15} /> 합의 완료 — 확정 조항:
                                <div className="consensus-clause-preview">
                                  {state.doc.resolvedClause || state.doc.proposal.clauseText}
                                </div>
                                <button className="btn btn-ghost reopen-btn" disabled={busy} onClick={() => handleReopen(q.field)}>
                                  <RotateCcw size={14} /> 재논의하기
                                </button>
                              </div>
                            )}

                            {state.kind === "voting" && (
                              <div className="consensus-vote">
                                <div className="vote-proposal">
                                  <div className="vote-proposal-meta">
                                    <strong>{state.doc.proposal.byName}</strong>님의 제안 —{" "}
                                    {meta.optionLabels[state.doc.proposal.option as ClauseOption]}
                                  </div>
                                  <div className="consensus-clause-preview">{state.doc.proposal.clauseText}</div>
                                </div>
                                <div className="vote-status">
                                  {members.map((m) => {
                                    const v = state.doc.votes?.[m.id];
                                    return (
                                      <span key={m.id} className={`vote-pill ${v || "pending"}`}>
                                        {m.name}: {v === "approve" ? "동의" : v === "reject" ? "반대" : "대기"}
                                      </span>
                                    );
                                  })}
                                </div>
                                {user && !state.doc.votes?.[user.uid] && (
                                  <div className="vote-actions">
                                    <button
                                      className="btn btn-primary"
                                      disabled={busy}
                                      onClick={() => handleVote(q.field, state.doc, "approve")}
                                    >
                                      <Check size={15} /> 동의
                                    </button>
                                    <button
                                      className="btn btn-ghost"
                                      disabled={busy}
                                      onClick={() => handleVote(q.field, state.doc, "reject")}
                                    >
                                      <X size={15} /> 반대
                                    </button>
                                  </div>
                                )}
                                {Object.values(state.doc.votes || {}).includes("reject") && (
                                  <div className="consensus-note rejected">
                                    반대 의견이 있습니다. 새 제안으로 다시 합의를 시작하세요.
                                  </div>
                                )}
                              </div>
                            )}

                            {(state.kind === "needs-proposal" ||
                              (state.kind === "voting" && Object.values(state.doc.votes || {}).includes("reject"))) && (
                              <div className="consensus-propose">
                                <div className="propose-title">
                                  {state.kind === "needs-proposal" ? "합의안 제안" : "새 제안"}
                                </div>
                                <div className="propose-options">
                                  {(["1", "2", "3", "4"] as const).map((opt) => (
                                    <button
                                      key={opt}
                                      type="button"
                                      className={`propose-option ${draftOption === opt ? "selected" : ""}`}
                                      onClick={() => handlePickOption(q.field, opt)}
                                    >
                                      {meta.optionLabels[opt]}
                                    </button>
                                  ))}
                                </div>
                                {draftOption && (
                                  <>
                                    <textarea
                                      className="propose-textarea"
                                      value={draftText}
                                      rows={3}
                                      onChange={(e) => setDraftText(e.target.value)}
                                    />
                                    <button
                                      className="btn btn-primary"
                                      disabled={busy || !draftText.trim()}
                                      onClick={() => handlePropose(q.field)}
                                    >
                                      제안하기
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        {!loading && members.length >= 2 && (
          <div className="consensus-finalize">
            <button className="btn btn-primary consensus-finalize-btn" disabled={!canFinalize || busy} onClick={handleFinalize}>
              <FileCheck2 size={17} /> 합의안 생성하기
            </button>
            {!canFinalize && (
              <div className="consensus-finalize-hint">
                {pendingAgreement ? (
                  <>
                    확정 대기 중인 합의안(v{pendingAgreement.version})이 있습니다.{" "}
                    <a href={`/agreement/confirm?teamId=${teamId}`} className="consensus-hint-link">확정 페이지로 이동</a>
                  </>
                ) : gapRows.length > 0
                  ? "모든 갭 항목이 합의 완료되면 합의안을 생성할 수 있습니다."
                  : "진단을 완료한 항목이 있어야 합의안을 생성할 수 있습니다."}
              </div>
            )}
          </div>
        )}
      </section>

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        .consensus-body { padding: 48px 0 80px; display: flex; flex-direction: column; gap: 40px; }
        .consensus-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 2px; color: #5858e2; margin-bottom: 12px; }
        .consensus-head h1 { font-size: clamp(1.8rem, 4vw, 2.4rem); font-weight: 800; color: #0f172a; margin-bottom: 12px; }
        .consensus-sub { font-size: 1rem; color: #64748b; line-height: 1.7; max-width: 600px; }
        .consensus-team-picker { margin-top: 24px; display: inline-flex; align-items: center; gap: 12px; font-size: 0.9rem; font-weight: 700; color: #64748b; }
        .consensus-team-select { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; font: inherit; font-size: 0.9rem; font-weight: 600; color: #0f172a; background: #fff; cursor: pointer; transition: all 0.2s; }
        .consensus-team-select:hover { border-color: #cbd5e1; }
        .consensus-progress { margin-top: 24px; max-width: 420px; }
        .consensus-progress-text { font-size: 0.9rem; font-weight: 700; color: #5858e2; margin-bottom: 8px; }
        .consensus-progress-bar { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
        .consensus-progress-fill { height: 100%; background: linear-gradient(90deg, #5858e2, #8b5cf6); border-radius: 999px; transition: width 0.3s ease-out; }
        .consensus-card { padding: 40px; text-align: center; color: #64748b; font-size: 1rem; line-height: 1.6; }
        .consensus-error { padding: 16px 24px; background: #fef2f2; color: #b91c1c; font-size: 0.9rem; font-weight: 600; border-radius: 12px; }
        .reopen-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; font-size: 0.85rem; margin-top: 12px; transition: background 0.2s; }
        .reopen-btn:hover { background: #e2e8f0; }
        .consensus-hint-link { color: #5858e2; font-weight: 700; text-decoration: none; }
        .consensus-hint-link:hover { text-decoration: underline; }
        .consensus-cat-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; }
        .consensus-items { display: flex; flex-direction: column; gap: 16px; }
        .consensus-item { padding: 0; overflow: hidden; border-radius: 16px; transition: box-shadow 0.2s; border: 1px solid #e2e8f0; }
        .consensus-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .consensus-item-head { width: 100%; display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: none; border: none; cursor: pointer; font: inherit; text-align: left; color: #334155; transition: background 0.2s; }
        .consensus-item-head:hover:not(:disabled) { background: #f8fafc; }
        .consensus-item-head:disabled { cursor: default; opacity: 0.6; }
        .consensus-item-label { flex: 1; font-size: 1.05rem; font-weight: 700; color: #0f172a; }
        .consensus-chip { font-size: 0.75rem; font-weight: 700; padding: 6px 12px; border-radius: 999px; white-space: nowrap; }
        .chip-match { background: #ecfdf5; color: #059669; }
        .chip-muted { background: #f1f5f9; color: #94a3b8; }
        .chip-needs { background: #fef3c7; color: #b45309; }
        .chip-voting { background: #ede9fe; color: #6d28d9; }
        .chip-resolved { background: #e0e7ff; color: #4338ca; }
        .consensus-item-body { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 24px; border-top: 1px solid #f1f5f9; padding-top: 24px; }
        .consensus-positions { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .consensus-position { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; background: #fafafa; }
        .consensus-position.me { border-color: #5858e2; background: #f5f5ff; }
        .position-name { font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 8px; }
        .position-answer { font-size: 0.95rem; font-weight: 600; color: #0f172a; line-height: 1.5; }
        .consensus-note { font-size: 0.95rem; color: #475569; line-height: 1.6; }
        .consensus-note.resolved { color: #4338ca; font-weight: 600; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .consensus-note.rejected { color: #b91c1c; font-weight: 600; padding: 12px 16px; background: #fef2f2; border-radius: 8px; }
        .consensus-clause-preview { width: 100%; margin-top: 12px; background: #f8fafc; border-radius: 12px; padding: 16px 20px; font-size: 0.95rem; color: #334155; font-weight: 400; line-height: 1.7; border: 1px solid #f1f5f9; }
        .vote-proposal-meta { font-size: 0.95rem; color: #334155; margin-bottom: 8px; }
        .vote-status { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
        .vote-pill { font-size: 0.85rem; font-weight: 600; padding: 6px 14px; border-radius: 999px; background: #f1f5f9; color: #64748b; }
        .vote-pill.approve { background: #ecfdf5; color: #059669; }
        .vote-pill.reject { background: #fee2e2; color: #b91c1c; }
        .vote-actions { display: flex; gap: 12px; margin-top: 16px; }
        .vote-actions .btn, .consensus-propose .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; font-size: 0.95rem; font-weight: 600; border-radius: 12px; transition: all 0.2s; }
        .btn-ghost { background: #f1f5f9; color: #334155; border: none; cursor: pointer; }
        .btn-ghost:hover:not(:disabled) { background: #e2e8f0; }
        .propose-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .consensus-propose { display: flex; flex-direction: column; gap: 16px; background: #fafafa; border-radius: 16px; padding: 24px; border: 1px solid #f1f5f9; }
        .propose-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
        .propose-option { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; background: #fff; cursor: pointer; font-size: 0.9rem; font-weight: 600; color: #334155; text-align: left; transition: all 0.2s; line-height: 1.5; }
        .propose-option:hover { border-color: #cbd5e1; }
        .propose-option.selected { border-color: #5858e2; background: #f5f5ff; color: #4338ca; box-shadow: 0 0 0 1px #5858e2; }
        .propose-textarea { width: 100%; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font: inherit; font-size: 0.95rem; line-height: 1.7; color: #334155; resize: vertical; transition: border-color 0.2s; }
        .propose-textarea:focus { outline: none; border-color: #5858e2; box-shadow: 0 0 0 3px rgba(88,88,226,0.1); }
        .consensus-finalize { text-align: center; padding-top: 24px; }
        .consensus-finalize-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 16px 40px; font-size: 1.05rem; font-weight: 700; border-radius: 14px; box-shadow: 0 4px 14px rgba(88,88,226,0.25); transition: all 0.2s; }
        .consensus-finalize-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(88,88,226,0.3); }
        .consensus-finalize-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; transform: none; }
        .consensus-finalize-hint { margin-top: 16px; font-size: 0.9rem; color: #64748b; line-height: 1.6; }
      `}} />
    </main>
  );
}

export default function ConsensusPage() {
  return (
    <Suspense fallback={<div className="page consensus-page"><div className="container" style={{padding:'48px 0',textAlign:'center',color:'#64748b'}}>로딩 중...</div></div>}>
      <ConsensusPageInner />
    </Suspense>
  );
}
