import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { useScale } from "remotion-kit-lib";
import { theme } from "../../theme.js";

// Billboard beat 4 — final message + brand.
const TAGS = ["Triage", "Dedup", "Exploitability", "Patch Evidence", "Package Trust"];

export const StripFinal = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useScale(1600);

  const leftSpring = spring({ frame, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 40 * s,
      padding: `0 ${56 * s}px`,
      color: theme.fg,
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Left — headline */}
      <div style={{
        opacity: leftSpring,
        transform: `translateX(${(1 - leftSpring) * -20 * s}px)`,
        flex: 1,
      }}>
        <div style={{
          fontSize: 60 * s, fontWeight: 900, letterSpacing: -1 * s, lineHeight: 1,
          textShadow: `0 0 ${26 * s}px ${theme.danger}44`,
        }}>
          취약점 인플레이션
        </div>
        <div style={{ fontSize: 24 * s, fontWeight: 700, color: theme.muted, marginTop: 10 * s }}>
          AI가 더 많이 찾고, 패키지는 더 빨리 퍼진다
        </div>
        <div style={{ display: "flex", gap: 8 * s, marginTop: 14 * s, flexWrap: "wrap" }}>
          {TAGS.map((t, i) => {
            const sp = spring({ frame: frame - (24 + i * 5), fps, config: { damping: 18 } });
            return (
              <div key={i} style={{
                opacity: sp,
                border: `${1 * s}px solid ${theme.line}`,
                background: theme.surface2,
                borderRadius: 999,
                padding: `${6 * s}px ${14 * s}px`,
                fontSize: 17 * s, fontWeight: 700, color: theme.fg,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}>{t}</div>
            );
          })}
        </div>
      </div>

      {/* Right — tagline + brand */}
      <div style={{
        flexShrink: 0, textAlign: "right",
        opacity: interpolate(frame, [16, 38], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <div style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 28 * s, fontWeight: 800, lineHeight: 1.4,
        }}>
          <div style={{ color: theme.dim }}>Discovery is cheap.</div>
          <div style={{ color: theme.fg }}>Verification is scarce.</div>
          <div style={{ color: theme.danger }}>Trust is the battlefield.</div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 * s,
          marginTop: 16 * s, fontSize: 28 * s, fontWeight: 900,
        }}>
          <span style={{
            width: 12 * s, height: 12 * s, borderRadius: 6 * s,
            background: theme.danger, boxShadow: `0 0 ${12 * s}px ${theme.danger}88`,
          }} />
          DevSecNews
        </div>
      </div>
    </AbsoluteFill>
  );
};
