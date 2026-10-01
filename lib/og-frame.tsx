export const OG_SIZE = { width: 1200, height: 630 };

export function OgFrame({
  kicker,
  title,
  detail,
  score,
}: {
  kicker: string;
  title: string;
  detail?: string;
  score?: string | null;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0a0a0a",
        color: "#f5f5f5",
        padding: "64px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em" }}>LivRank</div>
        {score ? (
          <div style={{ display: "flex", color: "#c4a35a", fontSize: 36, fontWeight: 700 }}>{score}</div>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", color: "#8a8a8a", fontSize: 22 }}>{kicker}</div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 42 ? 48 : 60,
            fontWeight: 650,
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {detail ? (
          <div style={{ display: "flex", color: "#8a8a8a", fontSize: 24, maxWidth: 900 }}>{detail}</div>
        ) : null}
      </div>
    </div>
  );
}
