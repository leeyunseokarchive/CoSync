"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer } from "../../../components/Footer";
import { useAuth } from "../../../components/AuthContext";
import { useAppState } from "../../../components/AppState";
import { addDoc, arrayUnion, collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { generateInviteCode } from "../../../lib/team";
import { useEffect, useState } from "react";
import { useUserProfile } from "../../../components/useUserProfile";

export default function WorkspaceCreatePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const {
    activeTeams,
    activeSessions,
    setActiveTeams,
    setActiveSessions,
    progress,
    department,
    role
  } = useAppState();
  const { profile } = useUserProfile();
  const [teamName, setTeamName] = useState("");
  const [industry, setIndustry] = useState("선택해주세요");
  const [members, setMembers] = useState("선택해주세요");
  const [stage, setStage] = useState("선택해주세요");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const handleCreate = async () => {
    if (!user) return;
    if (!teamName.trim()) {
      setError("팀 이름을 입력해주세요.");
      return;
    }
    const inviteCode = generateInviteCode();
    const teamRef = await addDoc(collection(db, "teams"), {
      name: teamName,
      industry,
      memberCount: members,
      stage,
      inviteCode,
      createdBy: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp(),
      progress
    });
    await setDoc(doc(db, "inviteCodes", inviteCode), {
      teamId: teamRef.id,
      createdAt: serverTimestamp()
    });
    await setDoc(
      doc(db, "teams", teamRef.id, "members", user.uid),
      {
        name: profile?.name || user.displayName || "팀원",
        role: role || profile?.role || "OWNER",
        department: department || "",
        status: "active",
        progress
      },
      { merge: true }
    );
    await updateDoc(doc(db, "users", user.uid), {
      teamIds: arrayUnion(teamRef.id)
    });
    setActiveTeams(activeTeams + 1);
    setActiveSessions(activeSessions + 1);
    router.push("/session");
  };

  return (
    <main className="page auth-page">
      <div className="container">
        <Link className="back-arrow" href="/workspace">
          ←
        </Link>
      </div>
      <section className="center-card auth-card">
        <h1>팀 생성하기</h1>
        <p className="auth-sub">워크스페이스 정보를 입력하여 팀 구성을 완료하세요.</p>

        <div className="form-grid">
          <label className="label">팀 이름</label>
          <input
            className="input"
            placeholder="회사 또는 팀 이름을 입력하세요"
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
          />

          <label className="label">비즈니스 분야</label>
          <div className="select-row">
            <select className="input select" value={industry} onChange={(event) => setIndustry(event.target.value)}>
              <option>선택해주세요</option>
              <option>SaaS</option>
              <option>핀테크</option>
              <option>커머스</option>
              <option>콘텐츠</option>
              <option>바이오/헬스</option>
            </select>
          </div>

          <div className="two-col">
            <div>
              <label className="label">팀원 수</label>
              <div className="select-row">
                <select className="input select" value={members} onChange={(event) => setMembers(event.target.value)}>
                  <option>선택해주세요</option>
                  <option>1-2명</option>
                  <option>3-5명</option>
                  <option>6-10명</option>
                  <option>10명 이상</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">팀 단계</label>
              <div className="select-row">
                <select className="input select" value={stage} onChange={(event) => setStage(event.target.value)}>
                  <option>선택해주세요</option>
                  <option>아이디어 단계</option>
                  <option>MVP 단계</option>
                  <option>PMF 단계</option>
                  <option>스케일업 단계</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}

        <button className="btn btn-primary full" type="button" onClick={handleCreate}>
          생성하기 →
        </button>
      </section>
      <Footer />
    </main>
  );
}
