import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { useScale } from "remotion-kit-lib";
import { theme } from "../../theme.js";

// Square beat 4 — final message + brand + URL, stacked center.
const TAGS = ["Triage", "Dedup", "Exploitability", "Patch Evidence", "Package Trust"];

export const SquareFinal = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useScale(1080);

  const headSpring = spring({ frame, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 26 * s, padding: `${80 * s}px`,
      color: theme.fg, textAlign: "center",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        opacity: headSpring, transform: `translateY(${(1 - headSpring) * 18 * s}px)`,
        fontSize: 96 * s, fontWeight: 900, letterSpacing: -1.5 * s, lineHeight: 1.04,
        textShadow: `0 0 ${30 * s}px ${theme.danger}44`,
      }}>
        취약점<br />인플레이션
      </div>

      <div style={{
        opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" }),
        fontSize: 30 * s, fontWeight: 700, color: theme.muted,
      }}>
        AI가 더 많이 찾고, 패키지는 더 빨리 퍼진다
      </div>

      <div style={{ display: "flex", gap: 10 * s, marginTop: 6 * s, flexWrap: "wrap", justifyContent: "center", maxWidth: 880 * s }}>
        {TAGS.map((t, i) => {
          const sp = spring({ frame: frame - (24 + i * 5), fps, config: { damping: 18 } });
          return (
            <div key={i} style={{
              opacity: sp,
              border: `${1 * s}px solid ${theme.line}`, background: theme.surface2,
              borderRadius: 999, padding: `${8 * s}px ${18 * s}px`,
              fontSize: 22 * s, fontWeight: 700, color: theme.fg,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}>{t}</div>
          );
        })}
      </div>

      <div style={{
        marginTop: 16 * s,
        opacity: interpolate(frame, [40, 62], [0, 1], { extrapolateRight: "clamp" }),
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 34 * s, fontWeight: 800, lineHeight: 1.5,
      }}>
        <div style={{ color: theme.dim }}>Discovery is cheap.</div>
        <div style={{ color: theme.fg }}>Verification is scarce.</div>
        <div style={{ color: theme.danger }}>Trust is the battlefield.</div>
      </div>

      <div style={{
        marginTop: 22 * s,
        opacity: interpolate(frame, [64, 86], [0, 1], { extrapolateRight: "clamp" }),
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8 * s,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 * s, fontSize: 40 * s, fontWeight: 900 }}>
          <span style={{
            width: 14 * s, height: 14 * s, borderRadius: 7 * s,
            background: theme.accent, boxShadow: `0 0 ${16 * s}px ${theme.accent}`,
          }} />
          DevSecNews
        </div>
        <div style={{
          fontSize: 22 * s, color: theme.dim, letterSpacing: 1 * s,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}>windshock.github.io/devsecnews</div>
      </div>
    </AbsoluteFill>
  );
};
