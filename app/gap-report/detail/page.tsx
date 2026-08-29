import Link from "next/link";

export default function GapReportDetailPage() {
  return (
    <main className="page modal-page">
      <div className="modal-backdrop">
        <div className="modal-card">
          <div className="modal-top">
            <span className="pill">HIGH CONFLICT</span>
            <Link className="close" href="/gap-report">
              ✕
            </Link>
          </div>
          <h2>최종 의사결정권자의 권한 범위</h2>
          <div className="modal-grid">
            <div className="modal-user">
              <div className="user-head">
                <div className="avatar">KM</div>
                <div className="user-name">김민준</div>
              </div>
              <div className="quote">“영업 및 마케팅 전체 영역에서 대표가 독점적 결정권을 가져야 한다.”</div>
            </div>
            <div className="modal-user">
              <div className="user-head">
                <div className="avatar">YS</div>
                <div className="user-name">팀원 A</div>
              </div>
              <div className="quote">“중요한 전략은 공동 창업자 간의 합의를 통한 집단 의사결정이 필수적이다.”</div>
            </div>
          </div>
          <div className="insight">
            <span className="spark">✦</span>
            <div>
              <div className="insight-title">GAP INSIGHT</div>
              <p>
                결정권의 독점 여부에 대한 상반된 이해도가 존재하며, 이는 추후
                실행 속도와 팀 결속력에 큰 영향을 줄 수 있습니다.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <Link className="btn btn-ghost" href="/gap-report">
              닫기
            </Link>
            <Link className="btn btn-primary" href="/workspace">
              이 주제로 합의 시작하기 →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
