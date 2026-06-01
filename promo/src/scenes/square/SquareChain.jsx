import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { useScale } from "remotion-kit-lib";
import { theme } from "../../theme.js";

// Square beat 3 — TanStack signal, nodes stacked vertically. Same timing as strip.
const NODES = [
  { label: "NPM PACKAGE", sub: "malicious version" },
  { label: "DEV MACHINE", sub: "tokens · ssh keys" },
  { label: "CI/CD", sub: "cloud secrets" },
  { label: "SOURCE REPO", sub: "code access" },
  { label: "RELEASE", sub: "trust boundary" },
];

export const SquareChain = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useScale(1080);

  const BREAK = 225; // aligns with the impact boom in board-mix.mp3 (~19.5s)
  const headOpacity = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });
  const brokenIn = frame >= BREAK;
  const brokenSpring = spring({ frame: frame - BREAK, fps, config: { damping: 11 } });
  const accent = brokenIn ? theme.danger : theme.dim;

  const bt = frame - BREAK;
  const shaking = bt >= 0 && bt < 16;
  const decay = shaking ? 1 - bt / 16 : 0;
  const shakeX = shaking ? Math.sin(bt * 3.7) * 8 * s * decay : 0;
  const shakeY = shaking ? Math.cos(bt * 4.3) * 5 * s * decay : 0;
  const flash = bt >= 0 && bt < 10 ? 0.5 * (1 - bt / 10) : 0;

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 12 * s, padding: `${64 * s}px`,
      color: theme.fg, textAlign: "center",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      transform: `translate(${shakeX}px, ${shakeY}px)`,
    }}>
      <div style={{
        position: "absolute", inset: 0, background: theme.danger,
        opacity: flash, mixBlendMode: "screen", pointerEvents: "none",
      }} />
      <div style={{
        opacity: headOpacity, marginBottom: 6 * s,
        fontSize: 26 * s, fontWeight: 700, letterSpacing: 2 * s, color: theme.danger,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}>
        Case signal: TanStack supply chain attack
      </div>

      {NODES.map((n, i) => {
        const delay = 8 + i * 14;
        const sp = spring({ frame: frame - delay, fps, config: { damping: 16 } });
        const arrived = frame >= delay + 5;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <div style={{
              opacity: sp,
              transform: `translateY(${(1 - sp) * 16 * s}px)`,
              width: 600 * s,
              background: theme.surface, border: `${1.5 * s}px solid ${accent}88`,
              borderRadius: 12 * s, padding: `${14 * s}px ${22 * s}px`,
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              boxShadow: `0 ${6 * s}px ${20 * s}px rgba(0,0,0,0.5)`,
            }}>
              <span style={{ fontSize: 30 * s, fontWeight: 900 }}>{n.label}</span>
              <span style={{ fontSize: 20 * s, color: theme.muted, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{n.sub}</span>
            </div>
            {i < NODES.length - 1 && (
              <div style={{
                fontSize: 26 * s, lineHeight: 1, margin: `${3 * s}px 0`, fontWeight: 900,
                color: arrived ? accent : theme.dim, opacity: arrived ? 1 : 0.2,
              }}>↓</div>
            )}
          </div>
        );
      })}

      {brokenIn ? (
        <div style={{
          marginTop: 10 * s,
          opacity: brokenSpring, transform: `scale(${interpolate(brokenSpring, [0, 1], [0.85, 1])})`,
          fontSize: 52 * s, fontWeight: 900, letterSpacing: 4 * s, color: theme.danger,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          textShadow: `0 0 ${34 * s}px ${theme.danger}66`,
        }}>
          TRUST CHAIN BROKEN
        </div>
      ) : (
        <div style={{
          marginTop: 10 * s,
          opacity: interpolate(frame, [60, 84], [0, 1], { extrapolateRight: "clamp" }),
          fontSize: 30 * s, fontWeight: 800, color: theme.fg,
        }}>
          패키지 악성코드는 이제 개발 전장을 가로지른다
        </div>
      )}
    </AbsoluteFill>
  );
};
