"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BrandMark, CircleAvatar } from "./Brand";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { useAppState } from "./AppState";

export function TopNav({
  links,
  active,
  rightLabel,
  rightName,
  showBell,
  hideAuthLinks
}: {
  links: { label: string; href: string }[];
  active?: string;
  rightLabel?: string;
  rightName?: string;
  showBell?: boolean;
  hideAuthLinks?: boolean;
}) {
  const { user } = useAuth();
  const { resetState } = useAppState();
  const isAuthed = Boolean(user);
  void showBell;
  void rightName;
  void rightLabel;

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
            {links.map((link) => (
              <Link
                key={link.label}
                className={link.label === active ? "active" : undefined}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="topbar-right">
          {isAuthed ? (
            <>
              <div style={{ fontSize: 12, color: "#1f2430", fontWeight: 600 }}>
                {user?.displayName || "김리더"}
              </div>
              <CircleAvatar label={(user?.displayName || "김리더").slice(0, 1)} />
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
            {links.map((link) => (
              <Link
                key={link.label}
                className={`mobile-nav-link ${link.label === active ? "active" : ""}`}
                href={link.href}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}
