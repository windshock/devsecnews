import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { useScale } from "remotion-kit-lib";
import { theme } from "../../theme.js";

// Square beat 1 — "취약점 인플레이션" headline, stacked center.
export const SquareHook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useScale(1080);

  const pillFade = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const titleSpring = spring({ frame: frame - 6, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 34 * s, padding: `${90 * s}px`,
      color: theme.fg, textAlign: "center",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        opacity: pillFade,
        display: "flex", alignItems: "center", gap: 13 * s,
        background: `linear-gradient(135deg, ${theme.danger}33, ${theme.danger}11)`,
        border: `${1.5 * s}px solid ${theme.danger}66`,
        borderRadius: 999, padding: `${12 * s}px ${24 * s}px`,
        fontSize: 28 * s, fontWeight: 700, letterSpacing: 1 * s,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}>
        <span style={{
          width: 13 * s, height: 13 * s, borderRadius: 7 * s,
          background: theme.danger, boxShadow: `0 0 ${14 * s}px ${theme.danger}`,
        }} />
        DevSecNews 2026-05
      </div>

      <div style={{
        opacity: titleSpring,
        transform: `translateY(${(1 - titleSpring) * 26 * s}px)`,
        fontSize: 150 * s, fontWeight: 900, letterSpacing: -2 * s, lineHeight: 1.05,
        textShadow: `0 0 ${34 * s}px ${theme.danger}44`,
        background: `linear-gradient(180deg, ${theme.fg}, #ff8a94)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>
        취약점<br />인플레이션
      </div>

      <div style={{
        opacity: interpolate(frame, [22, 42], [0, 1], { extrapolateRight: "clamp" }),
        fontSize: 30 * s, color: theme.dim, letterSpacing: 3 * s,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}>
        Vulnerability Inflation
      </div>
    </AbsoluteFill>
  );
};
