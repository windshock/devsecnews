import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { useScale } from "remotion-kit-lib";
import { theme } from "../../theme.js";

// Billboard beat 1 — "취약점 인플레이션" headline on the 1600×320 strip.
export const StripHook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useScale(1600);

  const pillFade = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const titleSpring = spring({ frame: frame - 6, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 32 * s,
      padding: `0 ${56 * s}px`,
      color: theme.fg,
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        opacity: pillFade,
        display: "flex",
        alignItems: "center",
        gap: 12 * s,
        background: `linear-gradient(135deg, ${theme.danger}33, ${theme.danger}11)`,
        border: `${1.5 * s}px solid ${theme.danger}66`,
        borderRadius: 999,
        padding: `${10 * s}px ${20 * s}px`,
        fontSize: 22 * s,
        fontWeight: 700,
        letterSpacing: 1 * s,
        flexShrink: 0,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}>
        <span style={{
          width: 11 * s, height: 11 * s, borderRadius: 6 * s,
          background: theme.danger, boxShadow: `0 0 ${12 * s}px ${theme.danger}`,
        }} />
        DevSecNews 2026-05
      </div>

      <div style={{
        opacity: titleSpring,
        transform: `translateX(${(1 - titleSpring) * 26 * s}px)`,
        fontSize: 92 * s,
        fontWeight: 900,
        letterSpacing: -1.5 * s,
        lineHeight: 1,
        flex: 1,
        textShadow: `0 0 ${22 * s}px ${theme.danger}33`,
        background: `linear-gradient(180deg, ${theme.fg}, #ff8a94)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>
        취약점 인플레이션
      </div>

      <div style={{
        opacity: interpolate(frame, [22, 42], [0, 1], { extrapolateRight: "clamp" }),
        fontSize: 22 * s,
        color: theme.dim,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        letterSpacing: 1 * s,
        textAlign: "right",
        flexShrink: 0,
      }}>
        Vulnerability<br />Inflation
      </div>
    </AbsoluteFill>
  );
};
