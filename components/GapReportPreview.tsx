export function GapReportPreview() {
  const categories = [
    { label: "역할 & 책임",     fill: 38, status: "위험", color: "#ef4444" },
    { label: "이탈 & 회수",     fill: 62, status: "점검", color: "#f97316" },
    { label: "비전 & 가치관",   fill: 28, status: "위험", color: "#ef4444" },
    { label: "의사결정 & 실행", fill: 50, status: "점검", color: "#f97316" },
    { label: "조달 & 운용",     fill: 18, status: "위험", color: "#ef4444" },
    { label: "지분 & 보상",     fill: 22, status: "위험", color: "#ef4444" },
  ];

  const alignment = 32;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - alignment / 100);

  return (
    <div className="grp-root">
      {/* 헤더 */}
      <div className="grp-header">
        <p className="grp-header-sub">분석 결과 · 인식 격차 리포트</p>
        <h2 className="grp-header-title">GAP REPORT</h2>
        <div className="grp-header-bar" />
        <p className="grp-header-team">팀 통합 리포트: A · B · C</p>
      </div>

      {/* 상태 카드 */}
      <div className="grp-card grp-status-card">
        <div className="grp-status-grid">
          {[
            { label: "공식 합의", value: "미확정", muted: false },
            { label: "버전 기록", value: "없음",   muted: false },
            { label: "합의 조항", value: "생성되지 않음", muted: true },
          ].map(item => (
            <div key={item.label}>
              <p className="grp-status-label">{item.label}</p>
              <p className="grp-status-value" style={{ color: item.muted ? "#c0c8d8" : "#1f2430" }}>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="grp-status-note">
          <span className="grp-dot" />
          <span>현재 팀 기준은 문서로 고정되지 않았습니다. 아래의 격차를 먼저 확인하세요.</span>
        </div>
      </div>

      {/* 인사이트 카드 */}
      <div className="grp-card grp-insight-card">
        <p className="grp-section-title">팀 인사이트 요약</p>

        {/* 게이지 + 텍스트 */}
        <div className="grp-row">
          <div className="grp-gauge-col">
            <svg width="64" height="64" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="54"
                fill="none" stroke="#5b5be7" strokeWidth="10"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                strokeLinecap="round" transform="rotate(-90 60 60)"
              />
              <text x="60" y="55" textAnchor="middle" fontSize="22" fontWeight="800" fill="#5b5be7">{alignment}</text>
              <text x="60" y="68" textAnchor="middle" fontSize="9" fill="#94a3b8">인식 일치율</text>
              <text x="69" y="55" textAnchor="start" fontSize="11" fill="#94a3b8">%</text>
            </svg>
            <span className="grp-badge">위험 단계</span>
          </div>

          <div className="grp-text-col">
            <p className="grp-text-lead">
              현재 팀의 인식 차이는 실행 단계에서 경영권 분쟁으로 전환될 수 있는 수준입니다.
            </p>
            <p className="grp-text-sub">
              특히 지분/보상 영역에서 파트너 간 기준 차이가 가장 두드러집니다.
            </p>
          </div>
        </div>

        <div className="grp-divider" />

        {/* 수치 + 카테고리 */}
        <div className="grp-row">
          <div className="grp-stats-col">
            <div className="grp-stat-box">
              <span className="grp-stat-label">총 차이 항목</span>
              <span className="grp-stat-num">17</span>
              <span className="grp-stat-unit">개</span>
            </div>
            <div className="grp-stat-box danger">
              <span className="grp-stat-label">고위험 충돌</span>
              <span className="grp-stat-num danger">9</span>
              <span className="grp-stat-unit danger">개</span>
            </div>
          </div>

          <div className="grp-cat-grid">
            {categories.map(cat => (
              <div key={cat.label} className="grp-cat-item">
                <div className="grp-cat-header">
                  <span className="grp-cat-label">{cat.label}</span>
                  <span className="grp-cat-status" style={{ color: cat.color }}>{cat.status}</span>
                </div>
                <div className="grp-cat-track">
                  <div className="grp-cat-fill" style={{ width: `${cat.fill}%`, background: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
