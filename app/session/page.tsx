"use client";

import Link from "next/link";
import { TopNav } from "../../components/TopNav";
import { useAppState } from "../../components/AppState";
import { Footer } from "../../components/Footer";

export default function SessionHomePage() {
  const { progress } = useAppState();
  const progressLabel = `${progress}%`;
  const memberProgress = Math.max(0, Math.min(100, progress));
  const canViewReport = memberProgress === 100;

  return (
    <main className="page session-page">
      <TopNav
        links={[
          { label: "대시보드", href: "/session" },
          { label: "합의 세션", href: "/onboarding/diagnosis" },
          { label: "리포트", href: "/gap-report" },
          { label: "팀 설정", href: "/team-setting" }
        ]}
        active="대시보드"
        showBell
      />

      <section className="container">
        <div className="session-steps">
          {[
            "운영 규칙",
            "의사결정",
            "역할 분담",
            "자금 규약",
            "최종 종료"
          ].map((label, index) => (
            <div
              key={label}
              className={`step-dot ${index === 3 ? "active" : ""} ${index < 3 ? "done" : ""}`}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{label}</small>
            </div>
          ))}
        </div>

        <div className="session-title">
          <div>
            <div className="section-sub">SESSION PROGRESS</div>
            <h2>창업 팀 구조적 합의 세션</h2>
          </div>
          <div className="team-pill">TEAM CODE: CS-7X29-BK</div>
        </div>

        <div className="session-grid">
          <div className="card session-card">
            <div className="session-head">
              <div>
                <h3>Governance Progress</h3>
                <p>팀의 모든 합의가 최종 리포트 생성</p>
              </div>
              <div className="progress-big">{progressLabel}</div>
            </div>
            <div className="progress-bar large">
              <span style={{ width: progressLabel }} />
            </div>

            <div className="member-list">
              <div className="member-row">
                <div className="member-avatar">HJ</div>
                <div>
                  <div className="member-name">황주명 (나)</div>
                  <div className="member-role">대표 · 진행중</div>
                </div>
                <div className="member-progress">
                  <span style={{ width: `${memberProgress}%` }} />
                </div>
                <span className="member-status">{memberProgress}%</span>
              </div>
              <div className="member-row">
                <div className="member-avatar">A</div>
                <div>
                  <div className="member-name">팀원 A</div>
                  <div className="member-role">CPO · 완료</div>
                </div>
                <div className="member-progress">
                  <span style={{ width: "100%" }} />
                </div>
                <span className="member-status">100%</span>
              </div>
            </div>

            <div className="button-row">
              <Link className="btn btn-ghost full" href="/onboarding/diagnosis">
                온보딩 질문으로 돌아가기
              </Link>
              <Link
                className={`btn btn-primary full ${canViewReport ? "" : "disabled"}`}
                href={canViewReport ? "/gap-report" : "#"}
                aria-disabled={!canViewReport}
              >
                진단 결과 보러가기
              </Link>
            </div>
            <div className="session-hint">
              팀원 1명 답변 대기중 · 마지막 활동 5분 전
            </div>
          </div>

          <div className="side-cards">
            <div className="card side-card">
              <div className="side-top">
                <span className="pill">GAP SCORE</span>
                <span className="badge">HIGH</span>
              </div>
              <h4>온보딩 진단 결과</h4>
              <p>
                창업자 간 의사결정 방식과 갈등 가능성이 높은 항목을 1개
                발견했습니다.
              </p>
              <Link href="/gap-report" className="link">
                Gap 리포트 보기 →
              </Link>
            </div>
            {/* <div className="card side-card">
              <div className="side-top">
                <span className="pill">AI 가이드</span>
              </div>
              <p>
                “지분 구조 설계 시 현재의 기여도뿐 아니라 미래의 기여 가능성 및
                변동성 조정도 포함하는 것이 유리합니다.”
              </p>
              <div className="side-meta">예상 소요 시간 약 15분</div>
              <Link href="/gap-report/detail" className="link">
                가이드 열기 →
              </Link>
            </div> */}
          </div>
        </div>
      </section>

      <Footer />

    </main>
  );
}
