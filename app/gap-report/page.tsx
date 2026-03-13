"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
    return [
      {
        id: "deadlock",
        label: "교착 판단 기준",
        conflict:
          `${left.repeatCount ?? ""}|${left.timeElapsed ?? ""}|${left.timeElapsedUnit ?? ""}` !==
          `${right.repeatCount ?? ""}|${right.timeElapsed ?? ""}|${right.timeElapsedUnit ?? ""}`,
        leftValue:
          left.repeatCount || left.timeElapsed
            ? `동일 의견 ${left.repeatCount || 0}회 또는 ${left.timeElapsed || 0}${left.timeElapsedUnit || "시간"}`
            : "미입력",
        rightValue:
          right.repeatCount || right.timeElapsed
            ? `동일 의견 ${right.repeatCount || 0}회 또는 ${right.timeElapsed || 0}${right.timeElapsedUnit || "시간"}`
            : "미입력",
        insight:
          "교착 판단 기준이 다르면 합의 시점이 달라져 실행 우선순위가 어긋날 수 있습니다."
      },
      {
        id: "deadline",
        label: "결정 기한",
        conflict:
          `${left.decisionDeadline ?? ""}|${left.decisionDeadlineUnit ?? ""}` !==
          `${right.decisionDeadline ?? ""}|${right.decisionDeadlineUnit ?? ""}`,
        leftValue: left.decisionDeadline
          ? `판단 후 ${left.decisionDeadline}${left.decisionDeadlineUnit || "시간"} 이내`
          : "미입력",
        rightValue: right.decisionDeadline
          ? `판단 후 ${right.decisionDeadline}${right.decisionDeadlineUnit || "시간"} 이내`
          : "미입력",
        insight:
          "결정 기한이 다르면 리스크 감수 수준과 실행 속도에서 충돌이 발생합니다."
      },
      {
        id: "rule",
        label: "의사결정 규칙",
        conflict: (left.decisionRule ?? "") !== (right.decisionRule ?? ""),
        leftValue: left.decisionRule || "미입력",
        rightValue: right.decisionRule || "미입력",
        insight:
          "의사결정 규칙이 다르면 책임 범위와 권한 설정에서 갈등 가능성이 높습니다."
      },
      {
        id: "maker",
        label: "결정권자",
        conflict: (left.decisionMaker ?? "") !== (right.decisionMaker ?? ""),
        leftValue: left.decisionMaker || "미입력",
        rightValue: right.decisionMaker || "미입력",
        insight:
          "결정권자에 대한 인식 차이는 실행 지연과 책임 회피로 이어질 수 있습니다."
      }
    ];
  }, [selectedPair]);

  const diffLabels = useMemo(() => {
    return issues.filter((issue) => issue.conflict).map((issue) => issue.label);
  }, [issues]);

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
        <div className="gap-header">
          <div>
            <h1 className="section-title">{teamName} 격차 리포트</h1>
            <p className="section-sub">팀 생성자와 팀원 간 1:1 격차 리포트</p>
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
            <div className="card gap-summary">
              <div>
                <div className="summary-title">비교 대상</div>
                <div className="summary-value">
                  {selectedPair.a.name} · {selectedPair.b.name}
                </div>
              </div>
              <div>
                <div className="summary-title">결정 기준</div>
                <div className="summary-value">
                  {selectedPair.a.answers?.decisionRule || "미입력"} / {selectedPair.b.answers?.decisionRule || "미입력"}
                </div>
              </div>
              <div>
                <div className="summary-title">이해차이 항목</div>
                <div className="summary-value">{diffLabels.length}개</div>
              </div>
              <div className="summary-note">
                {diffLabels.length > 0
                  ? `핵심 이슈: ${diffLabels.join(", ")}`
                  : "현재 큰 격차가 발견되지 않았습니다."}
              </div>
            </div>

            <div className="card gap-insight detail">
              <div className="insight-left">
                <div className="donut">
                  <span>{selectedPair.gapScore}</span>
                </div>
                <div className="pill">GAP SCORE</div>
              </div>
              <div className="insight-body">
                <p>
                  {diffLabels.length > 0
                    ? `현재 ${diffLabels.join(", ")}에서 관점 차이가 확인됩니다. 합의 세션 전, 서로의 기준을 정렬하세요.`
                    : "현재 큰 격차가 발견되지 않았습니다. 합의 내용을 문서화해 팀 기준을 고정하세요."}
                </p>
                <div className="focus-grid">
                {diffLabels.length === 0 && (
                  <div className="focus-item">
                    <span className="focus-id">01</span>
                    <div>
                      <div className="focus-title">합의 문서화</div>
                      <div className="focus-sub">현재 합의된 기준을 문서로 확정</div>
                    </div>
                  </div>
                )}
                {diffLabels.map((label, idx) => (
                  <div className="focus-item" key={label}>
                    <span className="focus-id">{String(idx + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="focus-title">{label}</div>
                      <div className="focus-sub">팀 내 기준 차이를 좁히는 합의 필요</div>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>

            <div className="card gap-matrix">
              <div className="matrix-head">
                <h3>영역별 상세 데이터 시각화</h3>
                <div className="legend">
                  <span className="dot green" /> Alignment
                  <span className="dot purple" /> Conflict
                </div>
              </div>
              <div className="matrix-table">
                <div className="matrix-spacer" />
                <div className="matrix-x">
                  <span>권한 분배</span>
                  <span>결정 책임자</span>
                </div>
                <div className="matrix-row">
                  <div className="matrix-y">의사결정 속도</div>
                  {issues.slice(0, 2).map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      className={`matrix-cell ${issue.conflict ? "mid" : "good"}`}
                      onClick={() => issue.conflict && setSelectedIssue(issue.id)}
                    />
                  ))}
                </div>
                <div className="matrix-row">
                  <div className="matrix-y">교착 판단 방식</div>
                  {issues.slice(2, 4).map((issue) => (
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

            <div className="card gap-cta">
              <div>
                <h3>합의 세션을 진행하고 계약서를 생성하세요.</h3>
                <p>팀원의 편차를 줄이고 더욱 단단한 팀을 만듭니다.</p>
              </div>
              <button
                className="btn btn-primary"
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
            <h3>프리미엄 플랜으로 팀을 완성하세요</h3>
            <p>
              AI 합의 세션, 히스토리 관리, 계약서 생성까지 이어지는 프리미엄
              플랜으로 팀의 합의를 완성하세요.
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
