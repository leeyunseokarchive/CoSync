import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";

export default function TeamSettingPage() {
  return (
    <main className="page settings-page">
      <TopNav
        links={[
          { label: "대시보드", href: "/session" },
          { label: "합의 세션", href: "/onboarding/diagnosis" },
          { label: "리포트", href: "/gap-report" },
          { label: "팀 설정", href: "/team-setting" }
        ]}
        active="팀 설정"
        rightName="황주명"
        showBell
      />

      <section className="container settings-layout">
        <aside className="settings-sidebar">
          <div className="sidebar-title">팀 설정</div>
          <nav className="settings-nav">
            {[
              "팀 정보",
              "멤버 관리",
              "권한",
              "알림",
              "플랜"
            ].map((label) => (
              <button
                key={label}
                type="button"
                className={label === "멤버 관리" ? "nav-item active" : "nav-item"}
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
              <h1>팀 설정</h1>
              <p>팀 멤버와 권한, 초대 코드를 관리합니다.</p>
            </div>
            <button className="btn btn-primary">멤버 초대</button>
          </div>

          <div className="card settings-card">
            <div>
              <div className="card-title">코드로 팀원 초대하기</div>
              <div className="invite-code">
                <strong>CS-829-QX</strong>
                <span className="copy">복사</span>
                <span className="badge">사용 가능</span>
              </div>
              <p className="card-sub">
                초대 코드를 공유해 팀원을 초대할 수 있습니다.
              </p>
            </div>
            <span className="card-link">코드 재발급</span>
          </div>

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
                <input placeholder="멤버 이름 또는 이메일 검색..." />
              </div>
            </div>
            <div className="member-tabs">
              <button className="tab active">전체</button>
              <button className="tab">OWNER</button>
              <button className="tab">MEMBER</button>
            </div>

            <div className="member-table">
              <div className="member-row head">
                <span>이름 / 포지션</span>
                <span>이메일 주소</span>
                <span>권한</span>
                <span>상태</span>
              </div>
              <div className="member-row">
                <div className="member-cell">
                  <span className="avatar-sm">HJ</span>
                  <div>
                    <div className="member-name">황주명</div>
                    <div className="member-role">CEO</div>
                  </div>
                </div>
                <span>hwang@cosync.com</span>
                <span className="pill">OWNER</span>
                <span className="status online">활성</span>
              </div>
              <div className="member-row">
                <div className="member-cell">
                  <span className="avatar-sm orange">YS</span>
                  <div>
                    <div className="member-name">팀원 A</div>
                    <div className="member-role">PO</div>
                  </div>
                </div>
                <span>lee@cosync.com</span>
                <span className="pill">MEMBER</span>
                <span className="status pending">대기</span>
              </div>
            </div>
          </div>

          <div className="card settings-card collapse">
            <div>
              <div className="card-title">고급 설정 및 워크스페이스 삭제</div>
              <p className="card-sub">중요한 팀 설정 및 관리 도구</p>
            </div>
            <span className="chev">▾</span>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
