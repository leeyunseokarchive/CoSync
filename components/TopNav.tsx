"use client";

import Link from "next/link";
import { BrandMark, CircleAvatar } from "./Brand";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "./AuthContext";

export function TopNav({
  links,
  active,
  rightLabel,
  rightName,
  showBell
}: {
  links: { label: string; href: string }[];
  active?: string;
  rightLabel?: string;
  rightName?: string;
  showBell?: boolean;
}) {
  const { user } = useAuth();
  const isAuthed = Boolean(user);
  void showBell;
  void rightName;
  void rightLabel;
  const handleLogout = async () => {
    await signOut(auth);
  };
  return (
    <header className="topbar">
      <div className="topbar-inner container">
        <div className="topbar-left">
          <Link href="/" aria-label="CoSync Dashboard">
            <BrandMark />
          </Link>
          <div className="nav-links">
            {links.map((link) => (
              <Link
                key={link.label}
                className={link.label === active ? "active" : undefined}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
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
          ) : (
            <div className="auth-links">
              <Link href="/login">로그인</Link>
              <Link className="auth-primary" href="/register">
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
