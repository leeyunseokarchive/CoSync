"use client";

import { useState } from "react";
import { canShare, track } from "../lib/analytics";

/**
 * 초대 링크를 한 번에 내보내는 버튼.
 * 모바일에선 OS 공유 시트가 열려 카카오톡으로 바로 보낼 수 있고, 없으면 클립보드로 떨어진다.
 * 링크 형식은 team-setting과 동일하게 /workspace?inviteCode=... 를 쓴다.
 */
export function InviteLinkButton({
  inviteCode,
  teamName,
  className = "btn btn-primary",
  label = "초대 링크 보내기",
  style,
}: {
  inviteCode?: string;
  teamName?: string;
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}) {
  const [copied, setCopied] = useState(false);

  if (!inviteCode) return null;

  const send = async () => {
    const link = `${window.location.origin}/workspace?inviteCode=${inviteCode}`;
    track("invite_sent", { via: canShare() ? "share" : "clipboard" });
    try {
      if (canShare()) {
        await navigator.share({
          title: teamName ? `${teamName} 팀 진단` : "CoSync 팀 진단",
          text: "같은 진단 20문항 풀고 결과 같이 보자",
          url: link,
        });
        return;
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 공유 시트를 닫았거나 클립보드가 막힌 경우 — 조용히 넘어간다.
    }
  };

  return (
    <button type="button" className={className} onClick={send} style={style}>
      {copied ? "복사됐어요" : label}
    </button>
  );
}
