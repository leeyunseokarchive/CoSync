"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { arrayRemove, deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../components/AuthContext";
import { useTeamMembers } from "../../components/useTeamMembers";
import { CircleAvatar } from "../../components/Brand";

export function TeamSettingClient() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId") || undefined;
  const router = useRouter();
  const { user, loading } = useAuth();
  const { members, loading: membersLoading } = useTeamMembers(teamId);
  const [team, setTeam] = useState<{ id: string; name?: string; inviteCode?: string; industry?: string; stage?: string; teamStatus?: string } | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [teamStatus, setTeamStatus] = useState("active");
  const [dissolvedReason, setDissolvedReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("팀 정보");
  const [permissions, setPermissions] = useState({
    requireAllAgree: false,
    allowMemberInvite: true
  });
  const [inviteCopied, setInviteCopied] = useState(false);
  const [modalCopied, setModalCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) {
        setTeam(null);
        setTeamLoading(false);
        return;
      }
      const teamSnap = await getDoc(doc(db, "teams", teamId));
      if (teamSnap.exists()) {
        const data = teamSnap.data() as {
          name?: string;
          inviteCode?: string;
          industry?: string;
          stage?: string;
          teamStatus?: string;
          dissolvedReason?: string;
          settings?: { permissions?: { requireAllAgree?: boolean; allowMemberInvite?: boolean } };
        };
        setTeam({ id: teamSnap.id, ...data });
        setTeamName(data.name || "");
        setIndustry(data.industry || "");
        setStage(data.stage || "");
        setTeamStatus(data.teamStatus || "active");
        setDissolvedReason(data.dissolvedReason || "");
        setPermissions({
          requireAllAgree: data.settings?.permissions?.requireAllAgree ?? false,
          allowMemberInvite: data.settings?.permissions?.allowMemberInvite ?? true
        });
      }
      setTeamLoading(false);
    };
    fetchTeam();
  }, [teamId]);

  const roleTabs = useMemo(() => ["전체", "OWNER", "MEMBER"], []);
  const [roleFilter, setRoleFilter] = useState("전체");
  const [query, setQuery] = useState("");

  const roleOrder = ["CEO", "공동대표", "COO", "CTO", "CPO", "CFO", "CMO", "CDO", "프론트엔드", "백엔드", "모바일", "DevOps", "데이터", "퍼포먼스 마케팅", "콘텐츠 마케팅", "PR/커뮤니케이션", "디자인", "OWNER", "MEMBER"];

  const filteredMembers = useMemo(() => {
    const needle = query.toLowerCase();
    const base = members.filter((member) =>
      [member.name, member.id].some((value) => (value || "").toLowerCase().includes(needle))
    );
    const filtered = roleFilter === "전체" ? base : base.filter((member) => member.role === roleFilter);
    return [...filtered].sort((a, b) => {
      const ai = roleOrder.indexOf(a.role || "");
      const bi = roleOrder.indexOf(b.role || "");
      const av = ai === -1 ? 999 : ai;
      const bv = bi === -1 ? 999 : bi;
      return av - bv;
    });
  }, [members, roleFilter, query]);

  const formatStatus = (status: string) => {
    if (!status || status === "active") return { label: "재직", className: "online" };
    if (status === "pending") return { label: "휴직", className: "pending" };
    return { label: "퇴사", className: "offline" };
  };

  const handleCopy = async () => {
    if (!team?.inviteCode) return;
    const inviteLink = `${window.location.origin}/workspace?inviteCode=${team.inviteCode}`;
    await navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 1600);
  };

  const handleSaveTeam = async () => {
    if (!teamId) return;
    setSaving(true);
    const updateData: Record<string, unknown> = {
      name: teamName.trim() || "팀",
      industry,
      stage,
      teamStatus,
      statusUpdatedAt: new Date().toISOString(),
      settings: { permissions }
    };
    if (teamStatus === "dissolved" || teamStatus === "exited") {
      updateData.dissolvedReason = dissolvedReason.trim();
    }
    await updateDoc(doc(db, "teams", teamId), updateData as any);
    setSaving(false);
  };

  const handleInviteSubmit = async () => {
    if (!team?.inviteCode) return;
    const inviteLink = `${window.location.origin}/workspace?inviteCode=${team.inviteCode}`;
    await navigator.clipboard.writeText(inviteLink);
    setModalCopied(true);
    setTimeout(() => setModalCopied(false), 1600);
  };

  const handleDeleteTeam = async () => {
    if (!teamId) return;
    if (!confirm("팀을 삭제하면 복구할 수 없습니다. 계속하시겠습니까?")) return;
    await updateDoc(doc(db, "teams", teamId), {
      status: "archived",
      archivedAt: serverTimestamp()
    });
    router.push("/workspace");
  };

  const handleLeaveTeam = async () => {
    if (!teamId || !user) return;
    if (!confirm("이 팀에서 나가시겠습니까?")) return;
    await updateDoc(doc(db, "teams", teamId), {
      members: arrayRemove(user.uid)
    });
    await updateDoc(doc(db, "users", user.uid), {
      teamIds: arrayRemove(teamId)
    });
    await deleteDoc(doc(db, "teams", teamId, "members", user.uid));
    router.push("/workspace");
  };

  return (
    <main className="page settings-page">
      <TopNav links={[{ label: "대시보드", href: "/workspace" }]} active="대시보드" />

      <section className="container settings-layout">
        <aside className="settings-sidebar">
          <div className="sidebar-title">팀 설정</div>
          <nav className="settings-nav">
            {["팀 정보", "멤버 관리", "고급 설정"].map((label) => (
              <button
                key={label}
                type="button"
                className={label === activeSection ? "nav-item active" : "nav-item"}
                onClick={() => setActiveSection(label)}
              >
                <span className="nav-dot" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="settings-content">
          <div className="settings-head">
            <div>
              <h1>{team?.name || "팀 설정"}</h1>
              <p>팀 멤버와 권한, 초대 코드를 관리합니다.</p>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => setInviteOpen(true)}>
              멤버 초대
            </button>
          </div>

          {activeSection === "팀 정보" && (
            <div className="card settings-card">
              <div className="form-grid">
                <label className="label">팀 이름</label>
                <input
                  className="input"
                  placeholder="팀 이름"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                />

                <label className="label">비즈니스 분야</label>
                <div className="select-row">
                  <select className="input select" value={industry} onChange={(event) => setIndustry(event.target.value)}>
                    <option value="">선택해주세요</option>
                    <option>SaaS</option>
                    <option>핀테크</option>
                    <option>커머스</option>
                    <option>콘텐츠</option>
                    <option>바이오/헬스</option>
                  </select>
                </div>

                <label className="label">팀 단계</label>
                <div className="select-row">
                  <select className="input select" value={stage} onChange={(event) => setStage(event.target.value)}>
                    <option value="">선택해주세요</option>
                    <option>아이디어 단계</option>
                    <option>MVP 단계</option>
                    <option>PMF 단계</option>
                    <option>스케일업 단계</option>
                  </select>
                </div>

                <label className="label">팀 상태</label>
                <div className="select-row">
                  <select className="input select" value={teamStatus} onChange={(event) => setTeamStatus(event.target.value)}>
                    <option value="active">운영 중</option>
                    <option value="pivoted">피벗</option>
                    <option value="exited">엑싯 (M&A/IPO)</option>
                    <option value="dissolved">해산</option>
                  </select>
                </div>

                {(teamStatus === "dissolved" || teamStatus === "exited") && (
                  <>
                    <label className="label">사유</label>
                    <input
                      className="input"
                      placeholder={teamStatus === "dissolved" ? "해산 사유 (선택)" : "엑싯 형태 (선택)"}
                      value={dissolvedReason}
                      onChange={(event) => setDissolvedReason(event.target.value)}
                    />
                  </>
                )}
              </div>
              <div style={{ marginTop: 14 }}>
                <button className="btn btn-primary" type="button" onClick={handleSaveTeam} disabled={saving}>
                  팀 정보 저장
                </button>
              </div>
            </div>
          )}

          {activeSection === "팀 정보" && (
            <div className="card settings-card">
              <div className="card-row">
                <h2>권한 설정</h2>
                <button className="btn btn-primary" type="button" onClick={handleSaveTeam} disabled={saving}>
                  저장
                </button>
              </div>
              <div className="settings-toggle">
                <div>
                  <div className="card-title">전원 합의 필수</div>
                  <p className="card-sub">중요한 변경은 모든 멤버 동의 필요</p>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.requireAllAgree}
                  onChange={(event) =>
                    setPermissions((prev) => ({ ...prev, requireAllAgree: event.target.checked }))
                  }
                />
              </div>
              <div className="settings-toggle">
                <div>
                  <div className="card-title">멤버 초대 허용</div>
                  <p className="card-sub">멤버가 직접 초대 링크를 공유할 수 있음</p>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.allowMemberInvite}
                  onChange={(event) =>
                    setPermissions((prev) => ({ ...prev, allowMemberInvite: event.target.checked }))
                  }
                />
              </div>
            </div>
          )}

          {activeSection === "팀 정보" && (
            <div className="card settings-card">
              <div>
                <div className="card-title">코드로 팀원 초대하기</div>
                <div className="invite-code">
                  <strong>{team?.inviteCode || "로딩 중..."}</strong>
                  <button className="copy" type="button" onClick={handleCopy}>
                    {inviteCopied ? "복사됨" : "복사"}
                  </button>
                  <span className="badge">사용 가능</span>
                </div>
                <p className="card-sub">초대 코드를 공유해 팀원을 초대할 수 있습니다.</p>
              </div>
            </div>
          )}

          {activeSection === "멤버 관리" && (
            <div className="card settings-card">
              <div className="card-row">
                <h2>멤버 관리</h2>
                <div className="member-search">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm9 2-4.2-4.2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    placeholder="멤버 이름 또는 이메일 검색..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </div>
              <div className="member-tabs">
                {roleTabs.map((tab) => (
                  <button
                    key={tab}
                    className={`tab ${tab === roleFilter ? "active" : ""}`}
                    onClick={() => setRoleFilter(tab)}
                    type="button"
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="member-table">
                <div className="member-row head">
                  <span>이름 / 포지션</span>
                  <span>이메일 주소</span>
                  <span>권한</span>
                  <span>상태</span>
                  <span>진행률</span>
                </div>
                {(membersLoading || teamLoading) && <div className="member-row">멤버 불러오는 중...</div>}
                {!membersLoading &&
                  filteredMembers.map((member) => (
                    <div className="member-row" key={member.id}>
                      <div className="member-cell">
                        <CircleAvatar label={member.name?.[0] ?? "?"} size={28} />
                        <div>
                          <div className="member-name">{member.name}</div>
                          <div className="member-role">{member.role}</div>
                        </div>
                      </div>
                      <span>-</span>
                      <span className="pill">{member.role}</span>
                      <span className={`status ${formatStatus(member.status).className}`}>
                        {formatStatus(member.status).label}
                      </span>
                      <span>{member.progress ?? 0}%</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeSection === "고급 설정" && (
            <>
              <div className="card settings-card">
                <div>
                  <div className="card-title">이 팀 나가기</div>
                  <p className="card-sub">팀에서 나가면 세션 접근이 제한됩니다.</p>
                </div>
                <button className="btn btn-ghost" type="button" onClick={handleLeaveTeam}>
                  팀 나가기
                </button>
              </div>
              <div className="card settings-card danger">
                <div>
                  <div className="card-title">팀 삭제</div>
                  <p className="card-sub">삭제하면 멤버 접근이 중단되며 복구할 수 없습니다.</p>
                </div>
                <button className="btn btn-danger" type="button" onClick={handleDeleteTeam}>
                  팀 삭제
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />

      {inviteOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-top">
              <div />
              <button className="close" type="button" onClick={() => setInviteOpen(false)}>
                ✕
              </button>
            </div>
            <h2>멤버 초대</h2>
            <p className="section-sub join-modal-sub">초대 코드를 복사해 팀원에게 전달하세요.</p>
            <div className="invite-code" style={{ marginBottom: 16 }}>
              <strong>{team?.inviteCode || "로딩 중..."}</strong>
              <button className="copy" type="button" onClick={handleInviteSubmit}>
                {modalCopied ? "복사됨" : "복사"}
              </button>
              <span className="badge">사용 가능</span>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" type="button" onClick={() => setInviteOpen(false)}>
                취소
              </button>
              <button className="btn btn-primary" type="button" onClick={handleInviteSubmit}>
                초대 링크 복사
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
