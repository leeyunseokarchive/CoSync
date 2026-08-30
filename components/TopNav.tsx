"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BrandMark, CircleAvatar } from "./Brand";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { useAppState } from "./AppState";
import { useUserProfile } from "./useUserProfile";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export function TopNav({
  links,
  active,
  hideAuthLinks
}: {
  links: { label: string; href: string }[];
  active?: string;
  hideAuthLinks?: boolean;
}) {
  const { user, isGuest } = useAuth();
  const { profile } = useUserProfile();
  const { resetState } = useAppState();
  const router = useRouter();
  // 익명 세션도 user는 존재한다. 이름 없는 방문자에게 "김리더 / 로그아웃"을 보여주면
  // 로그인한 적 없는 사람이 로그인된 것처럼 읽힌다. 진짜 계정일 때만 계정 UI를 낸다.
  const isAuthed = Boolean(user) && !isGuest;

  // P1-#5: 모바일 햄버거 메뉴 상태
  const [menuOpen, setMenuOpen] = useState(false);

  // 라우트 변경 시 메뉴 닫기
  useEffect(() => {
    setMenuOpen(false);
  }, []);

  // Esc 키로 메뉴 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    await signOut(auth);
    resetState();
  };

  return (
    <header className="topbar">
      <div className="topbar-inner container">
        <div className="topbar-left">
          <Link href="/" aria-label="CoSync 홈으로 이동">
            <BrandMark />
          </Link>
          {/* 데스크탑 nav */}
          <nav className="nav-links" aria-label="주 메뉴">
            {links.map((link) => {
              const isLocked = (link.label === "합의 세션" || link.label === "합의서" || link.label === "히스토리" || link.label === "합의안 확정") && profile && profile.plan !== "premium";
              return (
                <Link
                  key={link.label}
                  className={link.label === active ? "active" : undefined}
                  href={isLocked ? "/agreement/preview" : link.href}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                      router.push("/agreement/preview");
                    }
                  }}
                  style={isLocked ? { display: "inline-flex", alignItems: "center", gap: "4px" } : undefined}
                >
                  {link.label}
                  {isLocked && <Lock size={14} color="#94a3b8" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="topbar-right">
          {isAuthed ? (
            <>
              <div style={{ fontSize: 12, color: "#1f2430", fontWeight: 600 }}>
                {/* 하드코딩된 "김리더"가 폴백이었다. 이름 없는 계정에 남의 이름이 뜬다. */}
                {user?.displayName || "내 계정"}
              </div>
              <CircleAvatar label={(user?.displayName || "?").slice(0, 1)} />
              <button className="logout-link" type="button" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : !hideAuthLinks ? (
            <div className="auth-links">
              <Link href="/login">로그인</Link>
              <Link className="auth-primary" href="/register">
                회원가입
              </Link>
            </div>
          ) : null}

          {/* P1-#5: 햄버거 버튼 (모바일) */}
          {links.length > 0 && (
            <button
              className="hamburger-btn"
              type="button"
              aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className={`hamburger-icon ${menuOpen ? "open" : ""}`}>
                <span />
                <span />
                <span />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* P1-#5: 모바일 드로어 메뉴 */}
      {menuOpen && links.length > 0 && (
        <>
          {/* 백드롭 */}
          <div
            className="mobile-nav-backdrop"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id="mobile-nav"
            className="mobile-nav"
            aria-label="모바일 메뉴"
          >
            {links.map((link) => {
              const isLocked = (link.label === "합의 세션" || link.label === "합의서" || link.label === "히스토리" || link.label === "합의안 확정") && profile && profile.plan !== "premium";
              return (
                <Link
                  key={link.label}
                  className={`mobile-nav-link ${link.label === active ? "active" : ""}`}
                  href={isLocked ? "/agreement/preview" : link.href}
                  onClick={(e) => {
                    setMenuOpen(false);
                    if (isLocked) {
                      e.preventDefault();
                      router.push("/agreement/preview");
                    }
                  }}
                  style={isLocked ? { display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" } : undefined}
                >
                  {link.label}
                  {isLocked && <Lock size={16} color="#94a3b8" />}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </header>
  );
}
