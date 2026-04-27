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
          <h1 className="section-title-premium">격차 리포트</h1>
          <div className="premium-divider"></div>
          {selectedPair && (
            <div className="gap-pair-label-premium">
              비교 대상: {selectedPair.a.name} · {selectedPair.b.name}
            </div>
          )}
          {isCreator && selectedPairId && (
            <button 
              className="btn premium-back-btn" 
              onClick={() => setSelectedPairId(null)} 
              type="button"
            >
              요약으로 돌아가기
            </button>
          )}
        </div>
      </div>

      <section className="container gap-wrap" style={{ position: "relative", zIndex: 10, marginTop: "-40px" }}>
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
                  {teamInsight.gapScore === "CRITICAL" && "위험 단계: 즉시 조율 필요"}
                  {teamInsight.gapScore === "HIGH" && "주의 단계: 조율 필요"}
                  {teamInsight.gapScore === "MID" && "점검 단계: 조율 필요"}
                  {teamInsight.gapScore === "LOW" && "안정 단계: 양호"}
                </div>
              </div>
              <div className="insight-copy">
                <div className="insight-tag">AI ANALYSIS SUMMARY</div>
                <p className="insight-text">{teamInsight.text}</p>
                <div className="insight-stats" style={{ display: "flex", gap: "16px", fontSize: "14px", marginTop: "4px" }}>
                  <div><strong>차이 항목:</strong> {teamInsight.diffCount ?? 0}개</div>
                  <div><strong style={{ color: "var(--brand)" }}>고위험 충돌:</strong> {teamInsight.highRiskCount ?? 0}개</div>
                </div>
                <div className="insight-stats" style={{ fontSize: "14px", marginTop: "4px" }}>
                  <strong>최우선 조율 항목:</strong> {teamInsight.topPriorityLabels ?? "없음"}
                </div>
                <div className="insight-tip" style={{ marginTop: "8px" }}>팁: 인식 차이가 큰 항목부터 우선적으로 논의하세요.</div>
              </div>
            </div>

            <div className="card gap-matrix">
              <div className="matrix-head">
                <h2>영역별 상세 데이터 시각화</h2>
                <div className="legend">
                  <span className="dot match" /> 일치
                  <span className="dot diff" /> 일반 차이
                  <span className="dot conflict" /> 고위험 충돌
                </div>
              </div>
              <p className="matrix-note">
                각 매트릭스 영역을 탭하여 해당 항목의 답변 비교를 확인할 수 있습니다.
              </p>
              <div className="matrix-table">
                <div className="matrix-spacer" />
                <div className="matrix-x">
                  <span>Q1</span>
                  <span>Q2</span>
                  <span>Q3</span>
                  <span>Q4</span>
                </div>
                <div className="matrix-row">
                  <div className="matrix-y">의사결정/권한</div>
                  {issues.slice(0, 4).map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      className={`matrix-cell ${issue.status}`}
                      onClick={() => issue.status !== "match" && setSelectedIssue(issue.id)}
                    />
                  ))}
                </div>
                <div className="matrix-row">
                  <div className="matrix-y">역할/책임</div>
                  {issues.slice(4, 8).map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      className={`matrix-cell ${issue.status}`}
                      onClick={() => issue.status !== "match" && setSelectedIssue(issue.id)}
                    />
                  ))}
                </div>
                <div className="matrix-row">
                  <div className="matrix-y">이탈/권한정리</div>
                  {issues.slice(8, 12).map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      className={`matrix-cell ${issue.status}`}
                      onClick={() => issue.status !== "match" && setSelectedIssue(issue.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="premium-cards-section">
              <div className="teaser-header">
                <h2>프리미엄 행동 지침</h2>
                <p>팀의 구체적인 리스크를 확인하고 완벽한 합의안을 만드세요.</p>
              </div>
              
              <div className="premium-card-list">
                {/* Card 1 */}
                <div className="premium-item-card">
                  <div className="card-header">
                    <h3 className="card-emoji-title">🚨 가장 먼저 정리해야 할 합의 안건 TOP 3</h3>
                    <p className="clear-text">현재 팀의 가장 치명적인 잠재 리스크 1위는 <strong>[{teamInsight.topPriorityIssuesArray?.[0]?.label ?? "의견 충돌 영역"}]</strong> 입니다.</p>
                  </div>
                  <div className="card-blur-area">
                    <p>이 안건이 위험한 이유는 양측이 기대하는 역할과 권한의 경계가 완전히 다르기 때문입니다. 특히 위기 상황이 발생했을 때 책임 소재를 두고 극심한 갈등이 발생할 수 있습니다.</p>
                    <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginBottom: "12px", color: "var(--muted)" }}>
                      <li>2위: {teamInsight.topPriorityIssuesArray?.[1]?.label ?? "이탈 업무 인수인계 및 권한 회수 타이밍"}</li>
                      <li>3위: {teamInsight.topPriorityIssuesArray?.[2]?.label ?? "퍼포먼스 조치와 창업 멤버의 역할 한계"}</li>
                    </ul>
                    <p>데이터에 따르면 이러한 형태의 의견 불일치를 가진 팀 중 60%가 1년 내에 핵심 멤버의 이탈을 경험했습니다.</p>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => setShowSubscribe(true)}>
                        <span className="lock-icon" style={{ fontSize: "16px", marginBottom: "0", marginRight: "6px", display: "inline-block" }}>🔒</span> 리포트 잠금해제
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="premium-item-card">
                  <div className="card-header">
                    <h3 className="card-emoji-title">💣 항목별 상세 리스크 시나리오</h3>
                    <p className="clear-text">이 갈등이 초기에 해결되지 않을 경우 예상되는 최악의 결과는...</p>
                  </div>
                  <div className="card-blur-area">
                    <p>결정적 순간에 업무 마비가 발생하며, 감정적 골이 깊어져 결국 지분 분쟁으로 이어질 확률이 85% 이상으로 분석됩니다. 특히 퇴사 시점에서의 보상 요구와 관련하여 법적 분쟁으로 비화될 수 있으며, 이는 후속 투자 유치에 치명적인 결격 사유로 작용합니다. 창업자 간의 신뢰가 무너지는 순간 회사의 핵심 자산인 지식 재산권(IP)의 귀속 문제까지 얽히게 됩니다.</p>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => setShowSubscribe(true)}>
                        <span className="lock-icon" style={{ fontSize: "16px", marginBottom: "0", marginRight: "6px", display: "inline-block" }}>🔒</span> 시나리오 보기
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="premium-item-card">
                  <div className="card-header">
                    <h3 className="card-emoji-title">💬 바로 쓸 수 있는 합의 질문</h3>
                    <p className="clear-text">이견을 좁히기 위해 당장 내일 던져야 할 첫 번째 질문:</p>
                  </div>
                  <div className="card-blur-area">
                    <div className="chat-bubble">Q. "만약 1년 뒤 누군가 팀의 기대치만큼 성과를 내지 못한다면, 우리는 그 사람의 역할을 어떻게 재조정할 것인가요?"</div>
                    <div className="chat-bubble">Q. "가장 힘든 시기가 왔을 때, 서로의 번아웃을 방지하기 위한 최소한의 규칙은 무엇으로 정할까요?"</div>
                    <div className="chat-bubble">Q. "회사의 자금이 바닥나기 3개월 전, 우리는 어떤 기준으로 급여 삭감이나 추가 자금 투입을 결정할 것인가요?"</div>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => setShowSubscribe(true)}>
                        <span className="lock-icon" style={{ fontSize: "16px", marginBottom: "0", marginRight: "6px", display: "inline-block" }}>🔒</span> 질문 리스트 보기
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="premium-item-card">
                  <div className="card-header">
                    <h3 className="card-emoji-title">🧭 합의 기준 선택지와 추천 방향</h3>
                    <p className="clear-text">수많은 창업팀의 데이터를 기반으로 한 가장 안전한 선택지는...</p>
                  </div>
                  <div className="card-blur-area">
                    <div className="option-box">
                      <h4>옵션 A: 즉시 지분 회수 및 권한 정지 (강력 추천 ⭐)</h4>
                      <p>사유: 스타트업 초기 단계에서는 빠른 의사결정과 보안 유지 필수적이며, 온정주의적 접근은 회사의 존립을 위태롭게 만듭니다.</p>
                    </div>
                    <div className="option-box">
                      <h4>옵션 B: 유예 기간 부여 후 순차적 회수</h4>
                      <p>사유: 인수인계가 필수적인 직무인 경우, 최소한의 협조를 이끌어내기 위해 2~4주의 유예를 둘 수 있습니다.</p>
                    </div>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => setShowSubscribe(true)}>
                        <span className="lock-icon" style={{ fontSize: "16px", marginBottom: "0", marginRight: "6px", display: "inline-block" }}>🔒</span> 추천 가이드 보기
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 5 */}
                <div className="premium-item-card">
                  <div className="card-header">
                    <h3 className="card-emoji-title">📄 합의안 초안 자동 생성</h3>
                    <p className="clear-text">논의된 내용을 바탕으로 즉시 서명 가능한 계약서 조항:</p>
                  </div>
                  <div className="card-blur-area doc-style-area">
                    <p><strong>제 1조 (목적)</strong> 본 조항은 창업자 간의 역할 분담과 기여도 평가 기준을 명확히 하고...</p>
                    <p><strong>제 4조 (지분 회수)</strong> 이탈 시의 지분은 기여도에 따라 다음과 같이 정산한다. 이탈자가 악의적인 영업 방해를...</p>
                    <p><strong>제 7조 (의사결정)</strong> 중대한 사안에 대한 이견 발생 시, 대표이사가 최종 결정권을 가지되...</p>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => setShowSubscribe(true)}>
                        <span className="lock-icon" style={{ fontSize: "16px", marginBottom: "0", marginRight: "6px", display: "inline-block" }}>🔒</span> 초안 생성하기
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
                  if (s === "diff") return "일반 차이";
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
