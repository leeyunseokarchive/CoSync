import Image from "next/image";
import logo from "../logo.png";

export function BrandMark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Image src={logo} alt="" width={34} height={34} priority />
      <strong style={{ fontSize: 16 }}>CoSync</strong>
    </div>
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
