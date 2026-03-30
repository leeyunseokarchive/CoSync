"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useAuth } from "../../components/AuthContext";
import { useUserProfile } from "../../components/useUserProfile";
import { useTeams } from "../../components/useTeams";
import { useTeamMembers } from "../../components/useTeamMembers";
import { computeGapSummary } from "../../lib/gap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function GapReportPage() {
  const [showSubscribe, setShowSubscribe] = useState(false);
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { teams } = useTeams();
  const [teamName, setTeamName] = useState("격차 리포트");
  const [teamCreator, setTeamCreator] = useState<string | null>(null);
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const activeTeamId = profile?.lastActiveTeamId || profile?.teamIds?.[0] || teams[0]?.id;
  const { members, loading: membersLoading } = useTeamMembers(activeTeamId);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!activeTeamId) return;
      const snap = await getDoc(doc(db, "teams", activeTeamId));
      if (snap.exists()) {
        const data = snap.data() as { name?: string; createdBy?: string };
        setTeamName(data.name || "격차 리포트");
        setTeamCreator(data.createdBy || null);
      }
    };
    fetchTeam();
  }, [activeTeamId]);

  const pairs = useMemo(() => {
    if (!user || !teamCreator) return [] as Array<{
      id: string;
      a: (typeof members)[number];
      b: (typeof members)[number];
      gapCount: number;
      gapScore: "LOW" | "MID" | "HIGH";
    }>;
    const creatorMember = members.find((member) => member.id === teamCreator);
    if (!creatorMember) return [];

    if (user.uid === teamCreator) {
      return members
        .filter((member) => member.id !== teamCreator)
        .map((member) => {
          const { gapCount, gapScore } = computeGapSummary([
            creatorMember.answers ?? {},
            member.answers ?? {}
          ]);
          return {
            id: `${creatorMember.id}-${member.id}`,
            a: creatorMember,
            b: member,
            gapCount,
            gapScore
          };
        });
    }

    const me = members.find((member) => member.id === user.uid);
    if (!me) return [];
    const { gapCount, gapScore } = computeGapSummary([
      creatorMember.answers ?? {},
      me.answers ?? {}
    ]);
    return [
      {
        id: `${creatorMember.id}-${me.id}`,
        a: creatorMember,
        b: me,
        gapCount,
        gapScore
      }
    ];
  }, [user, teamCreator, members]);

  const isCreator = Boolean(user && teamCreator && user.uid === teamCreator);

  const selectedPair = useMemo(() => {
    if (!pairs.length) return null;
    if (!selectedPairId) return isCreator ? null : pairs[0];
    return pairs.find((pair) => pair.id === selectedPairId) ?? pairs[0];
  }, [pairs, selectedPairId, isCreator]);

  const issues = useMemo(() => {
    if (!selectedPair) return [] as Array<{
      id: string;
      label: string;
      conflict: boolean;
      leftValue: string;
      rightValue: string;
      insight: string;
    }>;
    const left = selectedPair.a.answers ?? {};
    const right = selectedPair.b.answers ?? {};

    const formatDeadlock = (answers: typeof left) => {
      if (answers.deadlockRepeat || answers.deadlockDays) {
        return `동일 안건 ${answers.deadlockRepeat || 0}회 또는 ${answers.deadlockDays || 0}일 경과`;
      }
      return "미입력";
    };
    const formatConflict = (answers: typeof left) => {
      if (answers.conflictRepeat || answers.conflictWeeks) {
        return `동일 문제 ${answers.conflictRepeat || 0}회 또는 ${answers.conflictWeeks || 0}주`;
      }
      return "미입력";
    };
    const formatExitCleanup = (answers: typeof left) => {
      if (answers.exitCleanupHours || answers.exitCleanupDays) {
        return `이탈 확정 후 ${answers.exitCleanupHours || 0}시간 또는 ${answers.exitCleanupDays || 0}일 이내`;
      }
      return "미입력";
    };
    const joinList = (list?: string[]) => (list && list.length ? list.join(", ") : "미입력");

    return [
      {
        id: "decision-structure",
        label: "결정 구조",
        conflict: (left.decisionStructure ?? "") !== (right.decisionStructure ?? ""),
        leftValue: left.decisionStructure || "미입력",
        rightValue: right.decisionStructure || "미입력",
        insight: "의사결정 구조가 다르면 책임 배분과 실행 속도에서 마찰이 생길 수 있습니다."
      },
      {
        id: "decision-confirm",
        label: "확정 방식",
        conflict: (left.decisionConfirmation ?? "") !== (right.decisionConfirmation ?? ""),
        leftValue: left.decisionConfirmation || "미입력",
        rightValue: right.decisionConfirmation || "미입력",
        insight: "안건 확정 방식이 다르면 승인 루트가 달라져 충돌이 발생할 수 있습니다."
      },
      {
        id: "deadlock",
        label: "교착 기준",
        conflict: formatDeadlock(left) !== formatDeadlock(right),
        leftValue: formatDeadlock(left),
        rightValue: formatDeadlock(right),
        insight: "교착 기준이 다르면 합의 시점이 달라져 실행 우선순위가 어긋날 수 있습니다."
      },
      {
        id: "work-principle",
        label: "업무 처리 원칙",
        conflict: (left.extraWorkPrinciple ?? "") !== (right.extraWorkPrinciple ?? ""),
        leftValue: left.extraWorkPrinciple || "미입력",
        rightValue: right.extraWorkPrinciple || "미입력",
        insight: "추가 업무 처리 원칙이 다르면 역할 기대치가 흔들릴 수 있습니다."
      },
      {
        id: "work-priority",
        label: "업무 우선 기준",
        conflict:
          `${left.extraWorkPriority ?? ""}|${left.allocationRule ?? ""}|${left.workType ?? ""}` !==
          `${right.extraWorkPriority ?? ""}|${right.allocationRule ?? ""}|${right.workType ?? ""}`,
        leftValue: [left.extraWorkPriority, left.allocationRule, left.workType].filter(Boolean).join(" / ") || "미입력",
        rightValue: [right.extraWorkPriority, right.allocationRule, right.workType].filter(Boolean).join(" / ") || "미입력",
        insight: "업무 분배 기준이 다르면 공정성 인식과 책임 범위에서 갈등이 생길 수 있습니다."
      },
      {
        id: "role-boundary",
        label: "역할 경계/부담",
        conflict:
          `${joinList(left.boundaryTasks)}|${joinList(left.burdenTasks)}|${joinList(left.motivationChoices)}|${formatConflict(left)}` !==
          `${joinList(right.boundaryTasks)}|${joinList(right.burdenTasks)}|${joinList(right.motivationChoices)}|${formatConflict(right)}`,
        leftValue: `${joinList(left.boundaryTasks)} / ${joinList(left.burdenTasks)} / ${formatConflict(left)}`,
        rightValue: `${joinList(right.boundaryTasks)} / ${joinList(right.burdenTasks)} / ${formatConflict(right)}`,
        insight: "역할 경계 인식이 다르면 반복 업무에서 부담이 편중될 수 있습니다."
      },
      {
        id: "exit-recover",
        label: "회수·정리 항목",
        conflict: joinList(left.exitRecoveryItems) !== joinList(right.exitRecoveryItems),
        leftValue: joinList(left.exitRecoveryItems),
        rightValue: joinList(right.exitRecoveryItems),
        insight: "이탈 시 회수 항목이 다르면 권한 공백이나 자산 유실 위험이 생깁니다."
      },
      {
        id: "handover",
        label: "인수인계 방식",
        conflict: (left.handoverMethod ?? "") !== (right.handoverMethod ?? ""),
        leftValue: left.handoverMethod || "미입력",
        rightValue: right.handoverMethod || "미입력",
        insight: "인수인계 방식이 다르면 업무 공백 기간이 길어질 수 있습니다."
      },
      {
        id: "cleanup",
        label: "권한 정리 기한",
        conflict: formatExitCleanup(left) !== formatExitCleanup(right),
        leftValue: formatExitCleanup(left),
        rightValue: formatExitCleanup(right),
        insight: "정리 기한이 다르면 리스크 대응 속도와 책임 범위에서 충돌이 발생합니다."
      }
    ];
  }, [selectedPair]);

  const diffIssues = useMemo(() => {
    return issues.filter((issue) => issue.conflict);
  }, [issues]);

  const teamInsight = useMemo(() => {
    if (!members.length) {
      return {
        gapCount: 0,
        gapScore: "LOW" as const,
        text: "아직 팀 데이터가 충분하지 않습니다. 온보딩 진단을 완료하면 팀 인사이트가 생성됩니다."
      };
    }
    const memberAnswers = members.map((member) => member.answers ?? {});
    const { gapCount, gapScore } = computeGapSummary(memberAnswers);
    const counts = {
      decision: issues.slice(0, 3).filter((issue) => issue.conflict).length,
      role: issues.slice(3, 6).filter((issue) => issue.conflict).length,
      exit: issues.slice(6, 9).filter((issue) => issue.conflict).length
    };
    const sorted = [
      { key: "decision", label: "의사결정/권한", count: counts.decision },
      { key: "role", label: "역할/책임", count: counts.role },
      { key: "exit", label: "이탈/권한정리", count: counts.exit }
    ].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    const second = sorted[1];

    const leadSentence = (() => {
      if (gapScore === "HIGH") return "합의 기준에서 차이가 크게 확인됩니다.";
      if (gapScore === "MID") return "전반적인 기준은 맞아가고 있으나 일부 영역에서 차이가 보입니다.";
      return "합의 기준이 전반적으로 잘 맞습니다.";
    })();

    const detailSentence = (() => {
      if (gapScore === "LOW") return "현재 흐름을 유지하며 필요한 부분만 보완하는 것이 적절합니다.";
      if (top.count === 0) return "추가 논의가 필요한 영역을 빠르게 정리하면 실행 안정성이 높아집니다.";
      if (second.count > 0 && top.count === second.count) {
        return `${top.label}과 ${second.label}에서 유사한 수준의 조율 필요성이 확인됩니다.`;
      }
      return `${top.label}에서 조율 필요성이 가장 크게 나타납니다.`;
    })();

    return { gapCount, gapScore, text: `${leadSentence} ${detailSentence}` };
  }, [members, issues]);

  const alignmentScore = useMemo(() => {
    if (teamInsight.gapScore === "HIGH") return 42;
    if (teamInsight.gapScore === "MID") return 64;
    return 86;
  }, [teamInsight.gapScore]);

  const slides = [
    { title: "합의 세션", src: "/preview/agreement-confirm.png" },
    { title: "계약서 생성", src: "/preview/document-view.png" },
    { title: "구체적인 질문 리스트", src: "/preview/questions.png" },
    { title: "AI 추천 문구", src: "/preview/version-diff.png" },
    { title: "히스토리 관리", src: "/preview/version-history.png" },
    { title: "최종 합의", src: "/preview/consensus.png" }
  ];

  return (
    <main className="page gap-page">
      <TopNav links={[{ label: "대시보드", href: "/workspace" }]} active="리포트" />

      <section className="container gap-wrap">
        <div className="gap-hero">
          <div>
            <div className="gap-breadcrumb">분석 결과 · 인식 격차 리포트</div>
            <h1 className="section-title">격차 리포트</h1>
            {selectedPair && (
              <div className="gap-pair-label">
                비교 대상: {selectedPair.a.name} · {selectedPair.b.name}
              </div>
            )}
          </div>
          {isCreator && selectedPairId && (
            <button className="btn btn-ghost small" onClick={() => setSelectedPairId(null)} type="button">
              요약으로 돌아가기
            </button>
          )}
        </div>
        {isCreator && !selectedPair && (
          <div className="gap-pair-grid">
            {membersLoading && <div className="card gap-summary">요약 카드 준비 중...</div>}
            {!membersLoading && pairs.length === 0 && (
              <div className="card gap-summary">아직 비교할 팀원이 없습니다.</div>
            )}
            {!membersLoading &&
              pairs.map((pair) => (
                <button
                  key={pair.id}
                  className="card gap-summary gap-pair"
                  type="button"
                  onClick={() => setSelectedPairId(pair.id)}
                >
                  <div>
                    <div className="summary-title">비교 대상</div>
                    <div className="summary-value">
                      {pair.a.name} · {pair.b.name}
                    </div>
                  </div>
                  <div>
                    <div className="summary-title">GAP SCORE</div>
                    <div className={`summary-value ${pair.gapScore?.toLowerCase()}`}>
                      {pair.gapScore}
                    </div>
                  </div>
                  <div>
                    <div className="summary-title">이해차이 항목</div>
                    <div className="summary-value">{pair.gapCount}개</div>
                  </div>
                  <div className="summary-note">요약 카드를 눌러 상세 격차 리포트를 확인하세요.</div>
                </button>
              ))}
          </div>
        )}

        {selectedPair && (
          <>
            <div className="card gap-status">
              <div className="status-grid">
                <div className="status-col">
                  <span className="status-label">공식 합의</span>
                  <div className="status-value">미확정</div>
                </div>
                <div className="status-col">
                  <span className="status-label">버전 기록</span>
                  <div className="status-value">없음</div>
                </div>
                <div className="status-col">
                  <span className="status-label">합의 조항</span>
                  <div className="status-value muted">생성되지 않음</div>
                </div>
              </div>
              <div className="status-note">
                <span className="pulse-dot" />
                <span>현재 팀 기준은 문서로 고정되지 않았습니다. 아래의 격차를 먼저 확인하세요.</span>
              </div>
            </div>

            <h2>팀 인사이트 요약</h2>
            <div className="card gap-insight-summary">
              <div className="insight-gauge">
                <div className="gauge-shell">
                  <div className="gauge-fill" style={{ "--fill": `${alignmentScore}` } as CSSProperties} />
                  <div className="gauge-core">
                    <div className="gauge-value">{alignmentScore}%</div>
                    <div className="gauge-label">Alignment Score</div>
                  </div>
                </div>
                <div className={`score-pill ${teamInsight.gapScore.toLowerCase()}`}>
                  {teamInsight.gapScore === "HIGH" && "주의 단계: 조율 필요"}
                  {teamInsight.gapScore === "MID" && "점검 단계: 조율 필요"}
                  {teamInsight.gapScore === "LOW" && "안정 단계: 양호"}
                </div>
              </div>
              <div className="insight-copy">
                <div className="insight-tag">AI ANALYSIS SUMMARY</div>
                <p className="insight-text">{teamInsight.text}</p>
                <div className="insight-tip">팁: 인식 차이가 큰 항목부터 우선적으로 논의하세요.</div>
              </div>
            </div>

            <div className="card gap-matrix">
              <div className="matrix-head">
                <h2>영역별 상세 데이터 시각화</h2>
                <div className="legend">
                  <span className="dot green" /> Alignment
                  <span className="dot purple" /> Conflict
                </div>
              </div>
              <p className="matrix-note">
                각 매트릭스 영역을 탭하여 해당 항목의 답변 비교를 확인할 수 있습니다.
              </p>
              <div className="matrix-table">
                <div className="matrix-spacer" />
                <div className="matrix-x">
                  <span>결정 구조</span>
                  <span>업무 분배</span>
                  <span>권한 정리</span>
                </div>
                <div className="matrix-row">
                  <div className="matrix-y">의사결정/권한</div>
                  {issues.slice(0, 3).map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      className={`matrix-cell ${issue.conflict ? "mid" : "good"}`}
                      onClick={() => issue.conflict && setSelectedIssue(issue.id)}
                    />
                  ))}
                </div>
                <div className="matrix-row">
                  <div className="matrix-y">역할/책임</div>
                  {issues.slice(3, 6).map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      className={`matrix-cell ${issue.conflict ? "mid" : "good"}`}
                      onClick={() => issue.conflict && setSelectedIssue(issue.id)}
                    />
                  ))}
                </div>
                <div className="matrix-row">
                  <div className="matrix-y">이탈/권한정리</div>
                  {issues.slice(6, 9).map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      className={`matrix-cell ${issue.conflict ? "mid" : "good"}`}
                      onClick={() => issue.conflict && setSelectedIssue(issue.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="card gap-cta highlight">
              <div className="cta-content">
                <h3>진행하고 계약서를 생성하세요</h3>
                <p>핵심 기준을 정렬하고 팀의 실행력을 강화할 수 있습니다.</p>
              </div>
              <button
                className="btn btn-primary cta-btn"
                type="button"
                onClick={() => setShowSubscribe(true)}
              >
                합의 세션 시작하기
              </button>
            </div>
          </>
        )}
      </section>

      <Footer />

      {showSubscribe && (
        <div className="subscribe-backdrop" role="dialog" aria-modal="true">
          <div className="subscribe-card">
            <button
              className="close"
              type="button"
              onClick={() => setShowSubscribe(false)}
              aria-label="닫기"
            >
              ✕
            </button>
            <h3>프리미엄 플로우로 합의를 완성하세요</h3>
            <p>
              계약서 생성, 버전 히스토리, 합의 확정까지 이어지는 프리미엄
              워크플로우가 곧 제공됩니다.
            </p>
            <div className="preview-slider">
              <Swiper
                modules={[Autoplay, Pagination, Keyboard]}
                autoplay={{ delay: 2400, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                keyboard={{ enabled: true }}
                loop
                spaceBetween={16}
              >
                {slides.map((slide) => (
                  <SwiperSlide key={slide.title}>
                    <div className="slide-frame">
                      <img src={slide.src} alt={slide.title} />
                    </div>
                    <div className="slider-caption">{slide.title}</div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            <div className="subscribe-actions">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setShowSubscribe(false)}
              >
                나중에
              </button>
              <button className="btn btn-primary" type="button">
                구독 시작하기 →
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPair && selectedIssue && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-top">
              <span className="pill">CONFLICT</span>
              <button className="close" type="button" onClick={() => setSelectedIssue(null)}>
                ✕
              </button>
            </div>
            <h2>{issues.find((issue) => issue.id === selectedIssue)?.label}</h2>
            <div className="modal-grid">
              <div className="modal-user">
                <div className="user-head">
                  <div className="avatar">{selectedPair.a.name?.[0] ?? "?"}</div>
                  <div className="user-name">{selectedPair.a.name}</div>
                </div>
                <div className="quote">
                  {issues.find((issue) => issue.id === selectedIssue)?.leftValue}
                </div>
              </div>
              <div className="modal-user">
                <div className="user-head">
                  <div className="avatar">{selectedPair.b.name?.[0] ?? "?"}</div>
                  <div className="user-name">{selectedPair.b.name}</div>
                </div>
                <div className="quote">
                  {issues.find((issue) => issue.id === selectedIssue)?.rightValue}
                </div>
              </div>
            </div>
            <div className="insight">
              <span className="spark">✦</span>
              <div>
                <div className="insight-title">GAP INSIGHT</div>
                <p>{issues.find((issue) => issue.id === selectedIssue)?.insight}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" type="button" onClick={() => setSelectedIssue(null)}>
                닫기
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setSelectedIssue(null);
                  setShowSubscribe(true);
                }}
              >
                합의 세션 시작하기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
