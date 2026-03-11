"use client";

import Link from "next/link";
import { BrandMark, CircleAvatar } from "./Brand";
import { useAppState } from "./AppState";

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
  const { isAuthed } = useAppState();
  void showBell;
  void rightName;
  void rightLabel;
  return (
    <header className="topbar">
      <div className="topbar-inner container">
        <Link href="/" aria-label="CoSync 홈">
          <BrandMark />
        </Link>
        {isAuthed && (
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
        )}
        <div className="topbar-right">
          {isAuthed ? (
            <>
              <div style={{ fontSize: 12, color: "#1f2430", fontWeight: 600 }}>
                김리더
              </div>
              <CircleAvatar label="HJ" />
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
