import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { useScale } from "remotion-kit-lib";
import { theme } from "../../theme.js";

// Billboard beat 3 — TanStack signal: malware crosses the whole dev chain.
const NODES = [
  { label: "NPM PACKAGE", sub: "malicious version" },
  { label: "DEV MACHINE", sub: "tokens · ssh keys" },
  { label: "CI/CD", sub: "cloud secrets" },
  { label: "SOURCE REPO", sub: "code access" },
  { label: "RELEASE", sub: "trust boundary" },
];

export const StripChain = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useScale(1600);

  const BREAK = 225; // aligns with the impact boom in board-mix.mp3 (~19.5s)
  const headOpacity = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });
  const brokenIn = frame >= BREAK;
  const brokenSpring = spring({ frame: frame - BREAK, fps, config: { damping: 11 } });
  const accent = brokenIn ? theme.danger : theme.dim; // neutral steel until it breaks

  // Screen shake + red flash on the break (decays over ~16 frames).
  const bt = frame - BREAK;
  const shaking = bt >= 0 && bt < 16;
  const decay = shaking ? 1 - bt / 16 : 0;
  const shakeX = shaking ? Math.sin(bt * 3.7) * 7 * s * decay : 0;
  const shakeY = shaking ? Math.cos(bt * 4.3) * 4 * s * decay : 0;
  const flash = bt >= 0 && bt < 10 ? 0.5 * (1 - bt / 10) : 0;

  return (
    <AbsoluteFill style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 14 * s,
      padding: `0 ${40 * s}px`,
      color: theme.fg,
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      transform: `translate(${shakeX}px, ${shakeY}px)`,
    }}>
      {/* red flash on impact */}
      <div style={{
        position: "absolute", inset: 0,
        background: theme.danger,
        opacity: flash,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }} />
      <div style={{
        opacity: headOpacity,
        fontSize: 20 * s, fontWeight: 700, letterSpacing: 2 * s, color: theme.danger,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}>
        Case signal: TanStack supply chain attack
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        {NODES.map((n, i) => {
          const delay = 8 + i * 14;
          const sp = spring({ frame: frame - delay, fps, config: { damping: 16 } });
          const arrived = frame >= delay + 5;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                opacity: sp,
                transform: `translateY(${(1 - sp) * 16 * s}px)`,
                width: 196 * s,
                background: theme.surface,
                border: `${1.4 * s}px solid ${accent}88`,
                borderRadius: 11 * s,
                padding: `${12 * s}px ${14 * s}px`,
                display: "flex", flexDirection: "column", gap: 5 * s,
                boxShadow: `0 ${5 * s}px ${18 * s}px rgba(0,0,0,0.5)`,
              }}>
                <div style={{ fontSize: 23 * s, fontWeight: 900 }}>{n.label}</div>
                <div style={{
                  fontSize: 17 * s, color: theme.muted,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}>{n.sub}</div>
              </div>
              {i < NODES.length - 1 && (
                <div style={{
                  width: 34 * s, textAlign: "center", fontSize: 32 * s, fontWeight: 900,
                  color: arrived ? accent : theme.dim, opacity: arrived ? 1 : 0.2,
                }}>›</div>
              )}
            </div>
          );
        })}
      </div>

      {brokenIn ? (
        <div style={{
          opacity: brokenSpring,
          transform: `scale(${interpolate(brokenSpring, [0, 1], [0.85, 1])})`,
          fontSize: 40 * s, fontWeight: 900, letterSpacing: 3 * s, color: theme.danger,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          textShadow: `0 0 ${28 * s}px ${theme.danger}66`,
        }}>
          TRUST CHAIN BROKEN
        </div>
      ) : (
        <div style={{
          opacity: interpolate(frame, [60, 84], [0, 1], { extrapolateRight: "clamp" }),
          fontSize: 26 * s, fontWeight: 800, color: theme.fg,
        }}>
          패키지 악성코드는 이제 개발 전장을 가로지른다
        </div>
      )}
    </AbsoluteFill>
  );
};
