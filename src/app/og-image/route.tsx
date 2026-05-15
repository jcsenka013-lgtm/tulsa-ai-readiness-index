import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
          color: "#f8fafc",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: 48,
            maxWidth: 1000,
            gap: 20,
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1 }}>
            Tulsa Applied AI
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 600,
              color: "#e2e8f0",
            }}
          >
            AI Readiness Assessment
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 8,
              fontSize: 30,
              fontWeight: 500,
              color: "#94a3b8",
              gap: 12,
            }}
          >
            <span>Free</span>
            <span style={{ color: "#64748b" }}>·</span>
            <span>5 minutes</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
