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
import { computeGapSummary, getIssueStatus, type IssueStatus } from "../../lib/gap";
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
      gapScore: "LOW" | "MID" | "HIGH" | "CRITICAL";
      rawScore: number;
    }>;
    const creatorMember = members.find((member) => member.id === teamCreator);
    if (!creatorMember) return [];

    if (user.uid === teamCreator) {
      return members
        .filter((member) => member.id !== teamCreator)
        .map((member) => {
          const { gapCount, gapScore, rawScore } = computeGapSummary([
            creatorMember.answers ?? {},
            member.answers ?? {}
          ]);
          return {
            id: `${creatorMember.id}-${member.id}`,
            a: creatorMember,
            b: member,
            gapCount,
            gapScore,
            rawScore
          };
        });
    }

    const me = members.find((member) => member.id === user.uid);
    if (!me) return [];
    const { gapCount, gapScore, rawScore } = computeGapSummary([
      creatorMember.answers ?? {},
      me.answers ?? {}
    ]);
    return [
      {
        id: `${creatorMember.id}-${me.id}`,
        a: creatorMember,
        b: me,
        gapCount,
        gapScore,
        rawScore
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
      status: IssueStatus;
      leftValue: string;
      rightValue: string;
      insight: string;
    }>;
    const left = selectedPair.a.answers ?? {};
    const right = selectedPair.b.answers ?? {};

    const createIssue = (id: string, label: string, leftVal: string | undefined, rightVal: string | undefined, toxicPairs: [string, string][], insight: string) => {
      const status = getIssueStatus(leftVal, rightVal, toxicPairs);
      return {
        id,
        label,
        status,
        conflict: status === "diff" || status === "conflict",
        leftValue: leftVal || "미입력",
        rightValue: rightVal || "미입력",
        insight
      };
    };

    return [
      createIssue("q1", "의사결정 구조", left.decisionStructure, right.decisionStructure, [["1", "4"]], "의사결정 시스템에 대한 관점 차이입니다. 권한과 자율성에 대한 철학이 다릅니다."),
      createIssue("q2", "실패 대처", left.decisionFailure, right.decisionFailure, [["1", "3"], ["1", "4"]], "실패의 리스크를 대하는 태도 차이입니다. 회사 자산과 기회비용 인식에서 갈등이 시작될 수 있습니다."),
      createIssue("q3", "50:50 결단", left.actionVsConsensus, right.actionVsConsensus, [["1", "2"], ["2", "4"]], "교착 상태에서 총대를 메는 방식에 대한 이견입니다. 강행과 타협 사이에서 감정이 상할 수 있습니다."),
      createIssue("q4", "교착 시간 인내", left.deadlockTolerance, right.deadlockTolerance, [["1", "4"]], "시간에 대한 민감도(Urgency) 갭입니다. 업무 지연을 대하는 스트레스 임계점이 다릅니다."),
      createIssue("q5", "회색지대 업무 배정", left.extraWorkPriority, right.extraWorkPriority, [["3", "4"]], "담당자가 없는 일을 누구 기준으로 배정할지에 대한 차이입니다. 효율을 우선할지, 공평한 분담을 우선할지에 따라 불만이 쌓일 수 있습니다."),
      createIssue("q6", "업무 몰입 시간 기대", left.extraWorkPrinciple, right.extraWorkPrinciple, [["1", "4"]], "창업 초기 서로에게 기대하는 시간 투입 수준의 차이입니다. 누군가에게는 기본 몰입으로 보이는 기준이, 다른 누군가에게는 과도한 요구로 느껴질 수 있습니다."),
      createIssue("q7", "퍼포먼스 조치", left.underperformanceAction, right.underperformanceAction, [["3", "4"]], "가장 치명적인 리스크입니다. 역량 부족 파운더를 단호하게 쳐낼지, 의리로 끌고 갈 것인지에 대한 지분 소송의 불씨입니다."),
      createIssue("q8", "협업 운영 방식", left.workstyleConstraint, right.workstyleConstraint, [["1", "4"]], "자율 운영과 구조화된 운영 중 어디에 무게를 둘지에 대한 차이입니다. 협업 리듬이 맞지 않으면 실행 속도와 피로도가 함께 흔들릴 수 있습니다."),
      createIssue("q9", "이탈 업무 인수인계", left.handoverMethod, right.handoverMethod, [["1", "4"]], "이별의 순간 윤리에 대한 시각차입니다. 최악의 상황 시 회사의 자원을 악의적으로 방치할 가능성을 봅니다."),
      createIssue("q10", "우선 정리 권한", left.exitRecoveryPriority, right.exitRecoveryPriority, [["1", "2"], ["2", "3"], ["2", "4"]], "무엇이 회사 운영의 핵심 리스크인지에 대한 판단 차이입니다. 결과물, 관리자 권한, 운영 정보, 커뮤니케이션 채널 중 무엇을 먼저 통제할지 기준이 갈립니다."),
      createIssue("q11", "권한 차단 타이밍", left.exitCleanupTiming, right.exitCleanupTiming, [["1", "4"]], "보안 위협의 당장 차단과 서류상 절차 유예의 심각한 대립 포인트입니다."),
      createIssue("q12", "이탈 시 지분 정리", left.exitDisputeResolution, right.exitDisputeResolution, [["1", "4"], ["2", "4"]], "지분 정리에서 무엇을 가장 우선 기준으로 삼을지에 대한 차이입니다. 확정 지분, 누적 기여, 인수인계, 귀책 사유 중 무엇을 더 중요하게 보는지가 크게 갈릴 수 있습니다.")
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
    const { gapCount, gapScore, rawScore } = computeGapSummary(memberAnswers);
    const counts = {
      decision: issues.slice(0, 4).filter((issue) => issue.conflict).length,
      role: issues.slice(4, 8).filter((issue) => issue.conflict).length,
      exit: issues.slice(8, 12).filter((issue) => issue.conflict).length
    };
    const sorted = [
      { key: "decision", label: "의사결정/권한", count: counts.decision },
      { key: "role", label: "역할/책임", count: counts.role },
      { key: "exit", label: "이탈/권한정리", count: counts.exit }
    ].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    const second = sorted[1];

    const diffCount = issues.filter((i) => i.status === "diff" || i.status === "conflict").length;
    const highRiskCount = issues.filter((i) => i.status === "conflict").length;
    
    const topPriorityIssuesList = issues.filter((i) => i.status === "conflict");
    if (topPriorityIssuesList.length < 3) {
      topPriorityIssuesList.push(...issues.filter((i) => i.status === "diff").slice(0, 3 - topPriorityIssuesList.length));
    }
    const topPriorityIssuesArray = topPriorityIssuesList.slice(0, 3);
    const topPriorityLabels = topPriorityIssuesArray.length > 0 ? topPriorityIssuesArray.map(i => i.label).join(", ") : "없음";

    const leadSentence = (() => {
      if (gapScore === "CRITICAL") return "팀 와해로 이어질 수 있는 치명적인 인식 차이가 존재합니다!";
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

    return { 
      gapCount, 
      gapScore, 
      text: `${leadSentence} ${detailSentence}`,
      diffCount,
      highRiskCount,
      topPriorityLabels,
      topPriorityIssuesArray,
      rawScore
    };
  }, [members, issues]);

  const alignmentScore = useMemo(() => {
    if (teamInsight.rawScore === undefined) return 86;
    return Math.max(0, Math.round(100 - (teamInsight.rawScore / 54) * 100));
  }, [teamInsight.rawScore]);

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

      <div className="gap-hero-premium">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="gap-breadcrumb-premium">분석 결과 · 인식 격차 리포트</div>
          <h1 className="section-title-premium">GAP REPORT</h1>
          <div className="premium-divider"></div>
          {selectedPair && (
            <div className="gap-pair-label-premium">
              비교 대상: {selectedPair.a.name} · {selectedPair.b.name}
            </div>
          )}
          {isCreator && selectedPairId && (
            <button 
              className="premium-back-btn" 
              onClick={() => setSelectedPairId(null)} 
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              요약으로 돌아가기
            </button>
          )}
        </div>
      </div>

      <section className="container gap-wrap" style={{ position: "relative", zIndex: 10, marginTop: "-40px" }}>
        {isCreator && !selectedPair && (
          <div 
            className="gap-pair-grid"
            style={pairs.length <= 1 ? { display: "flex", justifyContent: "center" } : {}}
          >
            {membersLoading && <div className="card gap-summary" style={{ width: "100%", maxWidth: "600px" }}>요약 카드 준비 중...</div>}
            {!membersLoading && pairs.length === 0 && (
              <div className="card gap-summary" style={{ width: "100%", maxWidth: "600px", textAlign: "center" }}>아직 비교할 팀원이 없습니다.</div>
            )}
            {!membersLoading &&
              pairs.map((pair) => (
                <button
                  key={pair.id}
                  className="card gap-summary gap-pair"
                  type="button"
                  style={pairs.length === 1 ? { width: "100%", maxWidth: "600px" } : {}}
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

            <div className="card gap-insight-card">
              <div className="insight-header">
                <h2>팀 인사이트 요약</h2>
              </div>
              <div className="gap-insight-summary">
              <div className="insight-gauge">
                <div className="gauge-shell">
                  <div className="gauge-fill" style={{ "--fill": `${alignmentScore}` } as CSSProperties} />
                  <div className="gauge-core">
                    <div className="gauge-value">{alignmentScore}%</div>
                    <div className="gauge-label">Alignment Score</div>
                  </div>
                </div>
                <div className={`score-pill ${teamInsight.gapScore.toLowerCase()}`}>
                  {teamInsight.gapScore === "CRITICAL" && "위험 단계: 즉시 조율 필요"}
                  {teamInsight.gapScore === "HIGH" && "주의 단계: 조율 필요"}
                  {teamInsight.gapScore === "MID" && "점검 단계: 조율 필요"}
                  {teamInsight.gapScore === "LOW" && "안정 단계: 양호"}
                </div>
              </div>
              <div className="insight-copy">
                <div className="insight-tag">AI ANALYSIS SUMMARY</div>
                <p className="insight-text">{teamInsight.text}</p>
                <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Row 1: Number Stats */}
                  <div className="insight-stats-grid">
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>총 차이 항목</span>
                      <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a" }}>{teamInsight.diffCount ?? 0}<span style={{ fontSize: "1rem", fontWeight: "600", color: "#94a3b8", marginLeft: "4px" }}>개</span></div>
                    </div>
                    <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.85rem", color: "#ef4444", fontWeight: "600" }}>고위험 충돌 (High Risk)</span>
                      <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#ef4444" }}>{teamInsight.highRiskCount ?? 0}<span style={{ fontSize: "1rem", fontWeight: "600", color: "rgba(239,68,68,0.5)", marginLeft: "4px" }}>개</span></div>
                    </div>
                  </div>

                  {/* Row 2: Priority Items */}
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }}></span>
                      <span style={{ fontSize: "0.9rem", color: "#334155", fontWeight: "700" }}>최우선 조율 권장 항목</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {teamInsight.topPriorityLabels ? teamInsight.topPriorityLabels.split(",").map((label, idx) => (
                        <span key={idx} style={{ background: "#fef3c7", color: "#d97706", padding: "6px 12px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600" }}>
                          {label.trim()}
                        </span>
                      )) : <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>없음</span>}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "16px", background: "linear-gradient(to right, rgba(99, 102, 241, 0.08), transparent)", borderLeft: "3px solid #6366f1", padding: "16px 20px", borderRadius: "0 12px 12px 0", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ fontSize: "1.1rem" }}>💡</span>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#334155", lineHeight: "1.5" }}>
                    <strong>전문가의 팁:</strong> 위에서 도출된 <span style={{ color: "#6366f1", fontWeight: "600" }}>최우선 조율 항목</span>부터 먼저 대화의 안건으로 삼아보세요. 갈등의 골이 깊어지기 전에 룰을 정하는 것이 가장 안전합니다.
                  </p>
                </div>
              </div>
              </div>
            </div>

            <div className="card gap-heatmap-card">
              <div className="heatmap-header">
                <div className="heatmap-title-row">
                  <h2 className="heatmap-title">
                    영역별 상세 데이터 시각화 <span className="heatmap-subtitle">(Heatmap)</span>
                  </h2>
                  <div className="heatmap-legend">
                    <div className="legend-item"><span className="legend-dot alignment"></span> 일치 (Alignment)</div>
                    <div className="legend-item"><span className="legend-dot conflict"></span> 갈등 (Conflict)</div>
                  </div>
                </div>
                <div className="heatmap-instruction">
                  <span className="instruction-icon">💡</span> 히트맵의 갈등 영역(보라색)을 <strong>클릭</strong>하면 실제 응답 차이와 상세 분석을 확인할 수 있습니다.
                </div>
              </div>

              <div className="heatmap-grid">
                {/* Header Row */}
                <div className="hm-cell hm-corner"></div>
                <div className="hm-cell hm-col-header">
                  <div className="hm-en">OPERATIONS</div>
                  <div className="hm-kr">(운영방식)</div>
                </div>
                <div className="hm-cell hm-col-header">
                  <div className="hm-en">AUTHORITY</div>
                  <div className="hm-kr">(의사결정권)</div>
                </div>
                <div className="hm-cell hm-col-header">
                  <div className="hm-en">EXIT</div>
                  <div className="hm-kr">(투자회수)</div>
                </div>

                {/* Row 1: HIGH */}
                <div className="hm-cell hm-row-header">
                  <div className="hm-en">HIGH</div>
                  <div className="hm-kr">(심각한 차이)</div>
                </div>
                <button type="button" className={`hm-cell hm-item ${issues[0].status}`} onClick={() => setSelectedIssue(issues[0].id)}>Q1</button>
                <button type="button" className={`hm-cell hm-item ${issues[4].status}`} onClick={() => setSelectedIssue(issues[4].id)}>Q5</button>
                <button type="button" className={`hm-cell hm-item ${issues[8].status}`} onClick={() => setSelectedIssue(issues[8].id)}>Q9</button>

                {/* Row 2: MODERATE */}
                <div className="hm-cell hm-row-header">
                  <div className="hm-en">MODERATE</div>
                  <div className="hm-kr">(조율 필요)</div>
                </div>
                <button type="button" className={`hm-cell hm-item ${issues[1].status}`} onClick={() => setSelectedIssue(issues[1].id)}>Q2</button>
                <button type="button" className={`hm-cell hm-item ${issues[5].status}`} onClick={() => setSelectedIssue(issues[5].id)}>Q6</button>
                <button type="button" className={`hm-cell hm-item ${issues[9].status}`} onClick={() => setSelectedIssue(issues[9].id)}>Q10</button>

                {/* Row 3: LOW */}
                <div className="hm-cell hm-row-header">
                  <div className="hm-en">LOW</div>
                  <div className="hm-kr">(원만한 합의)</div>
                </div>
                <button type="button" className={`hm-cell hm-item ${issues[2].status}`} onClick={() => setSelectedIssue(issues[2].id)}>Q3</button>
                <button type="button" className={`hm-cell hm-item ${issues[6].status}`} onClick={() => setSelectedIssue(issues[6].id)}>Q7</button>
                <button type="button" className={`hm-cell hm-item ${issues[10].status}`} onClick={() => setSelectedIssue(issues[10].id)}>Q11</button>

                {/* Row 4: BASELINE */}
                <div className="hm-cell hm-row-header">
                  <div className="hm-en">BASELINE</div>
                  <div className="hm-kr">(공통 기반)</div>
                </div>
                <button type="button" className={`hm-cell hm-item ${issues[3].status}`} onClick={() => setSelectedIssue(issues[3].id)}>Q4</button>
                <button type="button" className={`hm-cell hm-item ${issues[7].status}`} onClick={() => setSelectedIssue(issues[7].id)}>Q8</button>
                <button type="button" className={`hm-cell hm-item ${issues[11].status}`} onClick={() => setSelectedIssue(issues[11].id)}>Q12</button>
              </div>

              {/* Help Box */}
              <div className="heatmap-help-box">
                <div className="help-title">
                  <span className="help-icon">❓</span> 어떻게 읽나요?
                </div>
                <ul className="help-list">
                  <li>각 열은 운영 방식(Q1-Q4), 의사결정권(Q5-Q8), 투자 회수(Q9-Q12) 영역을 나타냅니다.</li>
                  <li>색상이 짙을수록 해당 질문에서 팀원들의 의견이 강하게 충돌하거나 일치함을 의미합니다.</li>
                  <li><strong className="text-green">초록색 셀</strong>은 긍정적 합의, <strong className="text-purple">보라색 셀</strong>은 인식의 격차(갈등 가능성)를 나타냅니다.</li>
                  <li>상단의 'High' 영역에 보라색 셀이 많을수록 시급한 조율이 필요한 항목입니다.</li>
                </ul>
              </div>

              <div className="heatmap-actions">
                <button type="button" className="btn hm-guide-btn" onClick={() => setShowSubscribe(true)}>
                  📄 히트맵 상세 분석 가이드 확인하기 <span className="arrow">→</span>
                </button>
              </div>

              <div className="heatmap-alert">
                <div className="alert-icon">🤖</div>
                <div className="alert-content">
                  <div className="alert-title">AI 생성 상세 리포트 준비됨</div>
                  <div className="alert-desc">운영 방식, 의사결정권, 투자 회수 영역에 대한 팀원의 인식 차이를 심층 분석한 12개 질문에 대한 텍스트 가이드를 확인할 수 있습니다.</div>
                </div>
              </div>
            </div>

            {/* Side-by-Side Wrapper for Desktop */}
            <style dangerouslySetInnerHTML={{__html: `
              .scenario-review-wrapper {
                display: flex;
                flex-direction: column;
                gap: 60px;
                width: 100%;
                margin: 60px 0;
              }
              @media (min-width: 900px) {
                .scenario-review-wrapper {
                  flex-direction: row;
                  align-items: flex-start;
                  justify-content: center;
                  gap: 40px;
                }
                .worst-case-scenario-section, .reviews-section.clean-reviews-section {
                  flex: 1;
                  max-width: 500px;
                  margin: 0;
                  padding: 0;
                }
              }
              .worst-case-scenario-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
              }
              .clean-reviews-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
              }
              .clean-reviews-grid {
                display: flex;
                flex-direction: column;
                gap: 20px;
                width: 100%;
              }
              .clean-review-card {
                background: #ffffff;
                border-radius: 16px;
                padding: 28px 32px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
                display: flex;
                flex-direction: column;
                text-align: left;
              }
              .clean-review-stars {
                color: #d4af37;
                font-size: 1.1rem;
                letter-spacing: 2px;
                margin-bottom: 16px;
              }
              .clean-review-text {
                font-size: 1rem;
                line-height: 1.6;
                color: #1f2937;
                font-weight: 400;
                margin-bottom: 24px;
                word-break: keep-all;
              }
              .clean-review-text strong {
                font-weight: 700;
                color: #111827;
              }
              .clean-review-author {
                font-size: 0.85rem;
                color: #6b7280;
              }
            `}} />
            <div className="scenario-review-wrapper">
              {/* Worst Case Scenario Teaser */}
              <div className="worst-case-scenario-section">
                <div className="teaser-header">
                  <h2>발생할 수 있는 최악의 시나리오</h2>
                  <p>기준 없이 구두로만 합의된 동업은 결국 이런 결과를 맞이합니다.</p>
                </div>
                <img src="/comic_ip_new.jpg" alt="최악의 시나리오 만화" className="scenario-comic-img" style={{ width: "100%", display: "block" }} />
              </div>

              {/* Clean White Cards Reviews Section */}
              <div className="reviews-section clean-reviews-section">
              <div className="teaser-header">
                <h2 style={{ color: "#000" }}>REVIEWS</h2>
                <p>이미 수많은 초기 창업팀이 CoSync로 빈틈없는 합의를 마쳤습니다.</p>
              </div>
              
              <div className="clean-reviews-grid">
                <div className="clean-review-card">
                  <div className="clean-review-stars">★★★★★</div>
                  <p className="clean-review-text">
                    “전에는 기능 우선순위 하나에도 2~3시간씩 끝장토론을 했지만, <strong>결정 기준과 최종 책임자를 정한 뒤에는 비슷한 안건도 1시간 이내에 결론</strong>을 낼 수 있었습니다. 실행 속도가 확연히 달라졌어요.”
                  </p>
                  <div className="clean-review-author">초기 스타트업 CEO · 31세</div>
                </div>

                <div className="clean-review-card">
                  <div className="clean-review-stars">★★★★★</div>
                  <p className="clean-review-text">
                    “친한 선배라 돈이나 지분 문제를 먼저 꺼내기 어려웠는데, <strong>객관적인 데이터로 대화의 물꼬를 트니 감정 상할 일 없이</strong> 운영 기준을 문서화할 수 있었습니다. 진짜 꼭 필요했던 서비스예요.”
                  </p>
                  <div className="clean-review-author">기창업(2y) 공동창업 준비 중 · 23세</div>
                </div>

                <div className="clean-review-card">
                  <div className="clean-review-stars">★★★★★</div>
                  <p className="clean-review-text">
                    “대화는 많이 했지만 늘 겉도는 느낌이었어요. CoSync로 진단해보니 <strong>우리가 어떤 부분에서 동상이몽을 하고 있었는지</strong> 한눈에 보였습니다. 덕분에 갈등 없이 안전한 지분 구조를 합의했어요.”
                  </p>
                  <div className="clean-review-author">초기 스타트업 공동창업자 · 29세</div>
                </div>
              </div>
            </div>
            </div>

            <div className="premium-cards-section">
              <div className="teaser-header">
                <div className="legal-badge" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))", border: "1px solid rgba(139, 92, 246, 0.2)", color: "#a78bfa", padding: "8px 18px", borderRadius: "999px", fontSize: "0.85rem", fontWeight: "600", marginBottom: "20px", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.05)" }}>
                  <span style={{ fontSize: "1rem" }}>⚖️</span> 주주간계약 자문 변호사 MOU 체결 & 법률 검토 완료
                </div>
                <h2>프리미엄 팀 합의 솔루션</h2>
                <p>주주간계약 전 반드시 필요한 맞춤형 운영 및 권리관계 합의서를 완성하세요.</p>
              </div>
              
              <div className="premium-card-list">
                {/* Card 1 */}
                <div className="premium-item-card">
                  <div className="card-header" style={{ marginBottom: "12px" }}>
                    <h3 className="card-emoji-title">🚨 변호사가 경고하는 치명적 법적 리스크</h3>
                    <p className="clear-text">현재 팀의 가장 위험한 잠재 분쟁 1위는 <strong>[{teamInsight.topPriorityIssuesArray?.[0]?.label ?? "지분/권한 충돌"}]</strong> 입니다.</p>
                  </div>
                  <div className="clear-preview" style={{ marginBottom: "8px" }}>
                    <p style={{ fontSize: "0.95rem", color: "#334155", lineHeight: "1.6" }}>
                      이 안건을 문서화하지 않을 경우, 공동창업자 이탈 시 지분 회수가 불가능해져 <strong>후속 투자가 전면 무산</strong>될 수 있습니다.
                    </p>
                  </div>
                  <div className="card-blur-area" style={{ marginTop: "8px" }}>
                    <p>법정 분쟁 시 평균 1년 이상의 시간과 막대한 소송 비용이 발생합니다.</p>
                    <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginBottom: "12px", color: "var(--muted)" }}>
                      <li>주의 안건: {teamInsight.topPriorityIssuesArray?.[1]?.label ?? "이탈 업무 인수인계"}</li>
                      <li>주의 안건: {teamInsight.topPriorityIssuesArray?.[2]?.label ?? "퍼포먼스 한계 조치"}</li>
                      <li>주의 안건: {teamInsight.topPriorityIssuesArray?.[3]?.label ?? "의사결정 교착상태 해결"}</li>
                      <li>주의 안건: {teamInsight.topPriorityIssuesArray?.[4]?.label ?? "비밀유지 및 겸업금지 위반"}</li>
                    </ul>
                    <p>데이터에 따르면 초기 합의를 문서화하지 않은 팀의 60%가 1년 내에 이탈 및 지분 분쟁을 겪습니다.</p>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => setShowSubscribe(true)}>
                        <span className="lock-icon" style={{ fontSize: "16px", marginBottom: "0", marginRight: "6px", display: "inline-block" }}>🔒</span> 우리 팀 맞춤 합의서 완성하기
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="premium-item-card">
                  <div className="card-header" style={{ marginBottom: "12px" }}>
                    <h3 className="card-emoji-title">💬 감정 소모 없는 1:1 합의 질문 셋</h3>
                    <p className="clear-text">돈과 권한 문제, 친할수록 꺼내기 어렵습니다. 지금 바로 공유할 수 있는 객관적인 질문:</p>
                  </div>
                  <div className="clear-preview">
                    <div className="chat-bubble" style={{ borderLeft: "3px solid #6366f1", fontWeight: "500" }}>
                      Q. "[{teamInsight.topPriorityIssuesArray?.[0]?.label ?? "핵심 안건"}]에 대한 명확한 기준 부재로 특정 팀원의 업무 기여도가 현저히 떨어졌을 때, 이를 입증하고 지분이나 권한을 재조정할 수 있는 객관적인 합의 문서가 존재하나요?"
                    </div>
                  </div>
                  <div className="card-blur-area" style={{ marginTop: "4px" }}>
                    <div className="chat-bubble">Q. "[{teamInsight.topPriorityIssuesArray?.[1]?.label ?? "업무 몰입 시간"}]에 관한 약정 미이행 시, 해당 팀원의 남은 지분 베스팅(Vesting)을 중단하고 기부여 지분을 회수할 객관적 기준이 존재하나요?"</div>
                    <div className="chat-bubble">Q. "특정 이사가 [{teamInsight.topPriorityIssuesArray?.[2]?.label ?? "투자 회수"}]와 관련해 회사의 이익에 반하는 결정을 내릴 경우, 소수 지분권자가 이를 견제할 수 있는 권리 보호 장치가 있나요?"</div>
                    <div className="chat-bubble">Q. "개인 사정으로 3개월 이상 정상적인 직무 수행이 불가능해질 경우, 해당 팀원의 기존 지분율과 급여 지급 기준은 어떻게 조정되나요?"</div>
                    <div className="chat-bubble">Q. "투자 유치 시 기존 주주들의 지분 희석을 방어하기 위한 우선매수권(Right of First Refusal) 및 동반매도요구권(Drag-along) 조항이 팀원 간 합의되어 있나요?"</div>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => setShowSubscribe(true)}>
                        <span className="lock-icon" style={{ fontSize: "16px", marginBottom: "0", marginRight: "6px", display: "inline-block" }}>🔒</span> 우리 팀 맞춤 합의서 완성하기
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="premium-item-card">
                  <div className="card-header" style={{ marginBottom: "12px" }}>
                    <h3 className="card-emoji-title">🧭 시장 표준(Market Standard) 기반 합의 가이드</h3>
                    <p className="clear-text">성공한 스타트업들이 채택한 가장 안전하고 검증된 운영 기준은...</p>
                  </div>
                  <div className="clear-preview">
                    <div className="option-box" style={{ borderColor: "#cbd5e1", background: "#f1f5f9" }}>
                      <h4 style={{ color: "#0f172a", fontWeight: "700" }}>옵션 A: {teamInsight.topPriorityIssuesArray?.[0]?.label ?? "주요 안건"}에 대한 명시적 기준 설정 (전문가 추천 ⭐)</h4>
                      <p style={{ color: "#475569", fontSize: "0.9rem" }}>사유: 성공하는 스타트업은 가장 갈등 확률이 높은 위 안건에 대해 온정주의적 접근을 버리고, 초기부터 명확한 페널티와 시장 표준을 적용하여 회사의 존립을 보호합니다.</p>
                    </div>
                  </div>
                  <div className="card-blur-area" style={{ marginTop: "12px" }}>
                    <div className="option-box">
                      <h4>옵션 B: 베스팅(Vesting) 조건부 순차적 회수</h4>
                      <p>사유: 기여 기간에 비례하여 지분을 확정하되, 이탈 시 남은 지분은 액면가로 강제 회수하는 조항을 포함해야 합니다.</p>
                    </div>
                    <div className="option-box">
                      <h4>옵션 C: 동반매도요구권(Drag-Along) 포함</h4>
                      <p>사유: 추후 M&A나 매각 시 소수 지분권자가 반대하더라도 강제로 함께 매각할 수 있는 권리를 두어 엑싯을 보장해야 합니다.</p>
                    </div>
                    <div className="option-box">
                      <h4>옵션 D: 이사회 중심의 만장일치 의결</h4>
                      <p>사유: 가장 안전해 보이지만 실제로는 교착 상태를 유발할 위험이 커 시장에서는 절대 권장하지 않는 방식입니다.</p>
                    </div>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => setShowSubscribe(true)}>
                        <span className="lock-icon" style={{ fontSize: "16px", marginBottom: "0", marginRight: "6px", display: "inline-block" }}>🔒</span> 우리 팀 맞춤 합의서 완성하기
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 5 */}
                <div className="premium-item-card">
                  <div className="card-header" style={{ marginBottom: "12px" }}>
                    <h3 className="card-emoji-title">📄 주주간계약 전 필수 합의 문서 생성 및 버전 관리</h3>
                    <p className="clear-text">막연했던 대화를 명확한 운영규칙과 권리관계 합의 문서로. 팀의 성장에 맞춰 지속적으로 업데이트하세요:</p>
                  </div>
                  <div className="clear-preview doc-style-area">
                    <p style={{ fontFamily: "monospace", fontSize: "0.95rem", background: "#f8fafc", padding: "12px", borderLeft: "3px solid #6366f1", borderRadius: "6px", color: "#334155" }}>
                      <strong>제 4조 ({teamInsight.topPriorityIssuesArray?.[0]?.label ?? "핵심 안건"}의 처리)</strong><br/> 위 조항과 관련하여 창업 멤버 간의 중대한 이견이나 성과 미달이 발생할 시, 본 합의서는 다음 기준에 따라 조율한다...
                    </p>
                  </div>
                  <div className="card-blur-area doc-style-area" style={{ marginTop: "12px" }}>
                    <p><strong>제 5조 ({teamInsight.topPriorityIssuesArray?.[1]?.label ?? "후속 조치"})</strong> 발생한 문제에 대하여 시장 표준에 따라 대표이사가 선제적으로...</p>
                    <p><strong>제 6조 (주식 매수 선택권 및 부여 기준)</strong> 인재 영입을 위한 스톡옵션 풀(Pool)은 총 발행 주식의 10% 범위 내에서...</p>
                    <p><strong>제 7조 (영업비밀 유지 의무)</strong> 본 합의서 체결 이후 지득한 회사의 기술, 재무, 인적 자원 등 일체의 정보는...</p>
                    <p><strong>제 8조 (경업 금지 의무)</strong> 퇴사 후 최소 2년간 회사가 영위하는 동종 업종의 창업 및 취업을...</p>
                    <p style={{ marginTop: "12px", borderTop: "1px dashed var(--border)", paddingTop: "12px", color: "var(--primary)" }}><strong>🔄 버전 1.0 생성됨 (변경 이력 추적 중)</strong></p>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => setShowSubscribe(true)}>
                        <span className="lock-icon" style={{ fontSize: "16px", marginBottom: "0", marginRight: "6px", display: "inline-block" }}>🔒</span> 우리 팀 맞춤 합의서 완성하기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
              <span className={`pill ${issues.find((issue) => issue.id === selectedIssue)?.status}`}>
                {(() => {
                  const s = issues.find((issue) => issue.id === selectedIssue)?.status;
                  if (s === "conflict") return "고위험 충돌";
                  if (s === "diff") return "조율 필요";
                  if (s === "unanswered") return "판단 불가";
                  return "일치";
                })()}
              </span>
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
                상세 리스크 및 합의 세션 시작하기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
