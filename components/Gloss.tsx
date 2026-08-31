"use client";

import React from "react";
import { GLOSSARY, TERM_RE } from "../lib/glossary";

/**
 * 말풍선을 화면 안으로 밀어 넣는다.
 *
 * 말풍선은 용어 왼쪽에 맞춰 뜨는데, 용어가 줄 끝에 있으면 오른쪽으로 넘치고
 * 정보 열처럼 오른쪽 정렬을 쓰는 곳에서는 왼쪽으로 넘친다. 어느 쪽으로 넘칠지는
 * 글이 어디서 줄바꿈되는지에 달려 있어 CSS만으로는 정할 수 없다.
 * 열리는 순간 재서 넘친 만큼만 되민다.
 */
export function keepInView(host: HTMLElement) {
  const pop = host.querySelector<HTMLElement>(".cq-term-pop");
  if (!pop) return;
  // 매번 0으로 되돌린 뒤 자연 위치를 재고 최종 값을 한 번에 넣는다. 이전 위치에서
  // 상대적으로 밀면 그 사이에 스크롤이 끼었을 때 중간값에서 멈춘다.
  // 몇 번을 불러도 같은 답이 나오므로 이벤트가 겹쳐도 안전하다.
  const place = () => {
    const pad = 12;
    pop.style.right = "auto";
    pop.style.left = "0px";
    const r = pop.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    let left = 0;
    if (r.right > vw - pad) left = vw - pad - r.right;
    if (r.left + left < pad) left = pad - r.left;
    pop.style.left = `${Math.round(left)}px`;
  };
  // 탭하면 브라우저가 요소를 화면 안으로 스크롤하는 경우가 있어, 그 뒤에 한 번 더 맞춘다.
  place();
  requestAnimationFrame(place);
  setTimeout(place, 120);
}

// 어려운 말에 뜻풀이를 붙인다. 마우스를 올리거나 키보드로 초점을 두면 보인다.
// 사전에 없는 말은 그대로 둔다 — 문장을 다시 쓰지 않는다.
export function Gloss({ text }: { text: string }) {
  return (
    <>
      {text.split(TERM_RE).map((part, i) =>
        GLOSSARY[part] ? (
          <span
            key={i}
            className="cq-term"
            tabIndex={0}
            onMouseEnter={(e) => keepInView(e.currentTarget)}
            onFocus={(e) => keepInView(e.currentTarget)}
            onPointerDown={(e) => keepInView(e.currentTarget)}
          >
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
