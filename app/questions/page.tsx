"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useMemo } from "react";
import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import { useUserProfile } from "../../components/useUserProfile";
import { useTeams } from "../../components/useTeams";
import { useTeamMembers } from "../../components/useTeamMembers";
import { selectDeepQuestions } from "../../lib/deepQuestions";
import type { OnboardingAnswers } from "../../lib/gap";
import { MessageCircle, ArrowRight, Target } from "lucide-react";

function QuestionsInner() {
  const searchParams = useSearchParams();
  const { profile } = useUserProfile();
  const { teams } = useTeams();
  const queryTeamId = searchParams ? searchParams.get("teamId") : null;
  const teamId = queryTeamId || profile?.lastActiveTeamId || profile?.teamIds?.[0] || teams[0]?.id;
  const { members } = useTeamMembers(teamId);

  // gap-report와 동일한 방식으로 멤버 답변을 추출(각 멤버의 answers).
  const memberAnswers = useMemo<OnboardingAnswers[]>(
    () => members.map((m) => (m.answers ?? {}) as OnboardingAnswers),
    [members]
  );
  const items = useMemo(() => selectDeepQuestions(memberAnswers), [memberAnswers]);

  return (
    <main className="page questions-page">
      <TopNav
        links={[{ label: "갭 리포트", href: `/gap-report${teamId ? `?teamId=${teamId}` : ""}` }, { label: "합의 세션", href: `/consensus${teamId ? `?teamId=${teamId}` : ""}` }]}
        active="심층 질문"
      />

      <section className="container questions-body">
        <header className="questions-head">
          <div className="questions-eyebrow"><Target size={16} /> 진단 후 심층 대화</div>
          <h1 className="questions-title">지금 꼭 맞춰봐야 할 대화</h1>
          <p className="questions-sub">진단에서 서로 답이 갈린 항목입니다. 아래 순서대로 대화하면 합의가 쉬워집니다.</p>
        </header>

        {items.length === 0 && (
          <div className="card questions-empty">
            아직 심층 대화가 필요한 항목이 없어요. 팀원 2명 이상이 진단을 마치면 여기에 표시됩니다.
          </div>
        )}

        <div className="questions-list">
          {items.map(({ def, script, status }) => (
            <article key={def.id} className="card question-card">
              <div className="question-card-head">
                <span className={`question-badge ${status}`}>{status === "conflict" ? "충돌" : "차이"}</span>
                <h2 className="question-card-title">{def.label}</h2>
              </div>
              <p className="question-topic">{script.topic}</p>
              <div className="question-open">
                <MessageCircle size={16} />
                <span>“{script.open}”</span>
              </div>
              <ol className="question-steps">
                {script.steps.map((s, i) => (
                  <li key={i} className="question-step">
                    <div className="question-step-title">{i + 1}. {s.title}</div>
                    <ul className="question-step-qs">
                      {s.qs.map((q, j) => <li key={j}>{q}</li>)}
                    </ul>
                  </li>
                ))}
              </ol>
              <div className="question-guide"><strong>정하기 팁</strong> {script.guide}</div>
            </article>
          ))}
        </div>

        {items.length > 0 && (
          <div className="questions-cta">
            <Link href={`/consensus${teamId ? `?teamId=${teamId}` : ""}`} className="btn btn-primary questions-cta-btn">
              합의 세션으로 <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </section>

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        .questions-body { padding: 40px 0 80px; display: flex; flex-direction: column; gap: 24px; }
        .questions-head { text-align: center; display: flex; flex-direction: column; gap: 10px; align-items: center; }
        .questions-eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 0.95rem; font-weight: 700; color: #5858e2; background: #f5f5ff; padding: 6px 14px; border-radius: 999px; }
        .questions-title { font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 800; color: #0f172a; }
        .questions-sub { font-size: 1.05rem; color: #475569; line-height: 1.7; max-width: 560px; }
        .questions-empty { padding: 40px; text-align: center; color: #64748b; font-size: 1.05rem; }
        .questions-list { display: flex; flex-direction: column; gap: 20px; }
        .question-card { padding: 28px; display: flex; flex-direction: column; gap: 16px; }
        .question-card-head { display: flex; align-items: center; gap: 12px; }
        .question-badge { font-size: 0.85rem; font-weight: 700; padding: 5px 12px; border-radius: 999px; }
        .question-badge.conflict { background: #fee2e2; color: #b91c1c; }
        .question-badge.diff { background: #fef3c7; color: #b45309; }
        .question-card-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; }
        .question-topic { font-size: 1.05rem; color: #475569; font-weight: 600; }
        .question-open { display: flex; align-items: flex-start; gap: 8px; background: #f5f5ff; border-radius: 12px; padding: 14px 18px; color: #4338ca; font-size: 1.05rem; line-height: 1.6; font-weight: 600; }
        .question-steps { display: flex; flex-direction: column; gap: 14px; list-style: none; }
        .question-step-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .question-step-qs { list-style: disc; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; }
        .question-step-qs li { font-size: 1rem; color: #334155; line-height: 1.7; }
        .question-guide { font-size: 1rem; color: #334155; line-height: 1.7; background: #f8fafc; border-left: 3px solid #5858e2; border-radius: 8px; padding: 14px 18px; }
        .question-guide strong { color: #4338ca; display: block; margin-bottom: 4px; }
        .questions-cta { text-align: center; padding-top: 8px; }
        .questions-cta-btn { display: inline-flex; align-items: center; gap: 8px; padding: 16px 40px; font-size: 1.1rem; font-weight: 700; border-radius: 14px; }
      `}} />
    </main>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="page questions-page"><div className="container" style={{ padding: "48px 0", textAlign: "center", color: "#64748b" }}>로딩 중...</div></div>}>
      <QuestionsInner />
    </Suspense>
  );
}
