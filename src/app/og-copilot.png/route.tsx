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
          background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 45%, #dbeafe 100%)",
          color: "#0f172a",
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
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#2563eb",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Tulsa Applied AI
          </div>
          <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: -1, color: "#0f172a" }}>
            Copilot Readiness Assessment
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 28,
              fontWeight: 500,
              color: "#334155",
            }}
          >
            Microsoft 365 · Oklahoma businesses
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
