import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { useScale } from "remotion-kit-lib";
import { theme } from "../../theme.js";

// Billboard beat 2 — AI scanner floods triage. Counter ramps to 10,000+.
// Restrained palette: only CRITICAL is red, HIGH is amber, the rest are neutral gray.
const CHIPS = [
  { label: "CRITICAL", colorKey: "danger" },
  { label: "HIGH", colorKey: "warn" },
  { label: "EXPLOITABLE?", colorKey: "dim" },
  { label: "DUPLICATE?", colorKey: "dim" },
  { label: "NEEDS PROOF", colorKey: "dim" },
  { label: "PATCH?", colorKey: "dim" },
  { label: "FALSE POSITIVE?", colorKey: "dim" },
];

const STEPS = [
  { at: 0, v: 12 }, { at: 22, v: 87 }, { at: 46, v: 431 },
  { at: 72, v: 1204 }, { at: 100, v: 10000 },
];
function queueValue(frame) {
  for (let i = 0; i < STEPS.length - 1; i++) {
    const a = STEPS[i], b = STEPS[i + 1];
    if (frame >= a.at && frame < b.at) return Math.round(interpolate(frame, [a.at, b.at], [a.v, b.v]));
  }
  return frame >= STEPS[STEPS.length - 1].at ? STEPS[STEPS.length - 1].v : STEPS[0].v;
}

export const StripFlood = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useScale(1600);

  const scannerSpring = spring({ frame, fps, config: { damping: 18 } });
  const raw = queueValue(frame);
  const atMax = frame >= STEPS[STEPS.length - 1].at;
  const display = atMax ? "10,000+" : raw.toLocaleString("en-US");
  const numColor = atMax ? theme.danger : theme.fg; // white while climbing, red at 10,000+

  return (
    <AbsoluteFill style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 30 * s,
      padding: `0 ${56 * s}px`,
      color: theme.fg,
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* AI scanner */}
      <div style={{
        opacity: scannerSpring,
        transform: `translateX(${(1 - scannerSpring) * -24 * s}px)`,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8 * s,
        flexShrink: 0,
      }}>
        <div style={{
          width: 92 * s, height: 92 * s, borderRadius: 18 * s,
          background: theme.surface,
          border: `${1.5 * s}px solid ${theme.line}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 48 * s,
        }}>🤖</div>
        <div style={{ fontSize: 20 * s, fontWeight: 800, letterSpacing: 1 * s, color: theme.muted }}>
          AI SCANNER
        </div>
      </div>

      {/* Finding chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 * s, flex: 1, maxWidth: 560 * s }}>
        {CHIPS.map((c, i) => {
          const localF = frame - (6 + i * 9);
          const sp = spring({ frame: localF, fps, config: { damping: 14 } });
          const color = theme[c.colorKey];
          // drop in from above (rain), then bob gently — adds motion, keeps it readable
          const fallIn = interpolate(localF, [0, 16], [-26 * s, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const bob = Math.sin(localF / 15 + i) * 4 * s;
          return (
            <div key={i} style={{
              opacity: sp,
              transform: `translateY(${fallIn + bob}px) scale(${interpolate(sp, [0, 1], [0.7, 1])})`,
              background: theme.surface,
              border: `${1.2 * s}px solid ${color}88`,
              borderRadius: 8 * s,
              padding: `${7 * s}px ${14 * s}px`,
              fontSize: 21 * s, fontWeight: 800, color,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              whiteSpace: "nowrap",
            }}>{c.label}</div>
          );
        })}
      </div>

      {/* Triage counter */}
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div style={{
          fontSize: 19 * s, fontWeight: 800, letterSpacing: 4 * s, color: theme.muted,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}>TRIAGE QUEUE</div>
        <div style={{
          fontSize: 96 * s, fontWeight: 900, lineHeight: 1, color: numColor,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          textShadow: `0 0 ${18 * s}px ${numColor}33`,
        }}>{display}</div>
        <div style={{
          opacity: interpolate(frame, [104, 126], [0, 1], { extrapolateRight: "clamp" }),
          fontSize: 22 * s, fontWeight: 800, marginTop: 4 * s,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}>
          <span style={{ color: theme.dim }}>Discovery is cheap. </span>
          <span style={{ color: theme.fg }}>Verification is scarce.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
