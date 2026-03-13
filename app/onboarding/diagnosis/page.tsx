"use client";

import Link from "next/link";
import { TopNav } from "../../../components/TopNav";
import { useAppState } from "../../../components/AppState";
import { Footer } from "../../../components/Footer";
import { useAuth } from "../../../components/AuthContext";
import { useUserProfile } from "../../../components/useUserProfile";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

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
    role,
    setRole,
    decisionMaker,
    setDecisionMaker,
    progress
  } = useAppState();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const activeRule = decisionRule || "과반수";
  const roleOptions: Record<string, string[]> = {
    제품: ["CPO", "PO", "PM", "서비스 기획"],
    기술: ["CTO", "프론트엔드", "백엔드", "모바일", "DevOps"],
    비즈니스: ["COO", "사업개발", "세일즈", "CS"],
    마케팅: ["CMO", "퍼포먼스", "콘텐츠", "브랜딩"],
    운영: ["운영", "HR", "총무"],
    재무: ["CFO", "회계", "재무"],
    법무: ["Legal", "컴플라이언스"]
  };
  const rolesForDepartment = roleOptions[department] ?? ["CEO", "CPO", "CTO"];

  const handleNext = async () => {
    if (!user) return;
    const teamId = profile?.teamIds?.[0];
    if (teamId) {
      await updateDoc(doc(db, "teams", teamId), {
        progress
      });
      await setDoc(
        doc(db, "teams", teamId, "members", user.uid),
        {
          name: profile?.name || user.displayName || "팀원",
          role: role || "MEMBER",
          status: "active",
          progress
        },
        { merge: true }
      );
    }
    await updateDoc(doc(db, "users", user.uid), {
      department,
      role,
      updatedAt: serverTimestamp()
    });
  };

  return (
    <main className="page diagnosis-page">
      <TopNav links={[{ label: "대시보드", href: "/workspace" }]} active="합의 세션" />

      <section className="container diagnosis-wrap">
        <div className="diagnosis-card">
          <Link className="back-link" href="/session">
            ← 이전으로
          </Link>
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
                <h4>3.</h4>
                <div className="chip-grid">
                  {[
                    "전원합의",
                    "2/3 합",
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
                <h4>4. 팀원 님의 부서/직책</h4>
                <div className="select-stack">
                  <select
                    className="chip-select"
                    value={department}
                    onChange={(event) => {
                      setDepartment(event.target.value);
                      setRole("");
                    }}
                  >
                    <option value="">부서 선택</option>
                    <option value="제품">제품</option>
                    <option value="기술">기술</option>
                    <option value="비즈니스">비즈니스</option>
                    <option value="마케팅">마케팅</option>
                    <option value="운영">운영</option>
                    <option value="재무">재무</option>
                    <option value="법무">법무</option>
                  </select>
                  <select
                    className="chip-select"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                  >
                    <option value="">직책 선택</option>
                    {rolesForDepartment.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="diag-section">
                <h4>5. 결정권자</h4>
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
            <Link className="btn btn-primary" href="/login" onClick={handleNext}>
              다음 단계로 →
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
