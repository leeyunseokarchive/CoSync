"use client";

import React from "react";
import { GLOSSARY, TERM_RE } from "../lib/glossary";

// 어려운 말에 뜻풀이를 붙인다. 마우스를 올리거나 키보드로 초점을 두면 보인다.
// 사전에 없는 말은 그대로 둔다 — 문장을 다시 쓰지 않는다.
export function Gloss({ text }: { text: string }) {
  return (
    <>
      {text.split(TERM_RE).map((part, i) =>
        GLOSSARY[part] ? (
          <span key={i} className="cq-term" tabIndex={0}>
            {part}
            <span className="cq-term-pop" role="tooltip">{GLOSSARY[part]}</span>
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
