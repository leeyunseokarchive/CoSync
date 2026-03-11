export function BrandMark({ variant = "primary" }: { variant?: "primary" | "dark" }) {
  const fill = variant === "primary" ? "linear-gradient(135deg, #5b5be7, #8a8ff5)" : "#1f2430";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: fill,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: 14
        }}
      >
        C
      </span>
      <strong style={{ fontSize: 16 }}>CoSync</strong>
    </div>
  );
}

export function CircleAvatar({ label }: { label: string }) {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "#f2f3f8",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#7c8494",
        fontWeight: 600,
        fontSize: 12
      }}
    >
      {label}
    </div>
  );
}
