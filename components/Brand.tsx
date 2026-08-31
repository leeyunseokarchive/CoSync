import Image from "next/image";
import logo from "../public/images/cosync-logo.png";

// 로고가 심볼과 글자를 함께 담은 한 장이라 옆에 이름을 또 적지 않는다. 원본은 2172x724(3:1).
// display:block이 없으면 이미지가 인라인이라 baseline 아래 여백이 생겨 로고만 위로 뜬다.
export function BrandMark() {
  return (
    <Image
      src={logo}
      alt="CoSync"
      height={36}
      width={108}
      priority
      style={{ display: "block", height: 36, width: "auto" }}
    />
  );
}

export function CircleAvatar({
  label,
  size = 34
}: {
  label: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#f2f3f8",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#7c8494",
        fontWeight: 600,
        fontSize: Math.max(11, Math.round(size * 0.36))
      }}
    >
      {label}
    </div>
  );
}
