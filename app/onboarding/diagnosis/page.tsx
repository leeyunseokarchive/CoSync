"use client";

import Link from "next/link";
import { TopNav } from "../../../components/TopNav";
import { useAppState } from "../../../components/AppState";

export default function OnboardingDiagnosisPage() {
  const {
    decisionRule,
    setDecisionRule,
    repeatCount,
    setRepeatCount,
    timeElapsed,
    setTimeElapsed,
    timeElapsedUnit,
    setTimeElapsedUnit,
    decisionDeadline,
    setDecisionDeadline,
    decisionDeadlineUnit,
    setDecisionDeadlineUnit,
    department,
    setDepartment,
    decisionMaker,
    setDecisionMaker
  } = useAppState();
  const activeRule = decisionRule || "과반수";

  return (
    <main className="page diagnosis-page">
      <TopNav
        links={[
          { label: "대시보드", href: "/session" },
          { label: "합의 세션", href: "/onboarding/diagnosis" },
          { label: "리포트", href: "/gap-report" },
          { label: "팀 설정", href: "/team-setting" }
        ]}
        active="합의 세션"
        rightName="황주명"
        rightLabel="Product Owner"
      />

      <section className="container diagnosis-wrap">
        <div className="diagnosis-card">
          {/* <Link className="back-link" href="/session">
            ← 이전으로
          </Link> */}
          <div className="diagnosis-header">
            <h2>온보딩 진단</h2>
            <p>팀의 의사결정 방식과 규칙을 설정하는 단계입니다.</p>
          </div>
          <div className="info-box">
            <span className="info-dot">i</span>
            제품 방향을 두고 여러 차례 논의했지만 결론이 나지 않습니다. 마음은
            같다고 믿고, 실행은 지연되고 있습니다.
          </div>

          <div className="diagnosis-grid">
            <div>
              <div className="diag-section">
                <h4>1. 교착 판단 기준</h4>
                <div className="input-row">
                  <span>동일 의견</span>
                  <input
                    className="chip-input"
                    type="number"
                    min="0"
                    value={repeatCount}
                    onChange={(event) => setRepeatCount(event.target.value)}
                    placeholder="0"
                  />
                  <span>회 반복 시</span>
                </div>
                <div className="input-row">
                  <span>OR</span>
                  <input
                    className="chip-input"
                    type="number"
                    min="0"
                    value={timeElapsed}
                    onChange={(event) => setTimeElapsed(event.target.value)}
                    placeholder="0"
                  />
                  <select
                    className="chip-select"
                    value={timeElapsedUnit}
                    onChange={(event) => setTimeElapsedUnit(event.target.value)}
                  >
                    <option value="시간">시간</option>
                    <option value="일">일</option>
                  </select>
                  <span>경과 시</span>
                </div>
              </div>

              <div className="diag-section">
                <h4>2. 최종 결정 기한</h4>
                <div className="input-row">
                  <span>판단 후</span>
                  <input
                    className="chip-input"
                    type="number"
                    min="0"
                    value={decisionDeadline}
                    onChange={(event) => setDecisionDeadline(event.target.value)}
                    placeholder="0"
                  />
                  <select
                    className="chip-select"
                    value={decisionDeadlineUnit}
                    onChange={(event) => setDecisionDeadlineUnit(event.target.value)}
                  >
                    <option value="시간">시간</option>
                    <option value="일">일</option>
                  </select>
                  <span>이내 결정</span>
                </div>
              </div>
            </div>
            <div>
              <div className="diag-section">
                <h4>3. 결정 방식</h4>
                <div className="chip-grid">
                  {[
                    "전원 합의",
                    "2/3 합의",
                    "과반수",
                    "대표 결정",
                    "투표"
                  ].map((label) => (
                    <button
                      key={label}
                      className={`chip ${label === activeRule ? "active" : ""}`}
                      type="button"
                      onClick={() => setDecisionRule(label)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="diag-section">
                <h4>4. 본인의 부서/직책</h4>
                <input
                  className="input"
                  placeholder="부서/직책 입력"
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                />
              </div>
              <div className="diag-section">
                <h4>5. 최종 결정권자</h4>
                <input
                  className="input"
                  placeholder="결정권자 입력"
                  value={decisionMaker}
                  onChange={(event) => setDecisionMaker(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="diag-footer">
            <Link className="btn btn-primary" href="/login">
              다음 단계로 →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
