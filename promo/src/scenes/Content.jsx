import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { useScale } from "remotion-kit-lib";
import { theme } from "../theme.js";
import { STRINGS } from "../i18n.js";

const CHIPS = [
  { en: "CVE intel",       ko: "CVE 인텔",      colorKey: "danger" },
  { en: "Patch context",   ko: "패치 맥락",      colorKey: "warn" },
  { en: "Monthly digest",  ko: "월간 다이제스트", colorKey: "accent" },
];

export const Content = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useScale(1600);
  const str = STRINGS[lang];

  const textOpacity = interpolate(frame, [50, 75], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 36 * s,
      padding: `${30 * s}px ${50 * s}px`,
      color: theme.fg,
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 * s, flexShrink: 0 }}>
        {CHIPS.map((chip, i) => {
          const chipSpring = spring({ frame: frame - (5 + i * 10), fps, config: { damping: 18 } });
          const c = theme[chip.colorKey];
          return (
            <div key={i} style={{
              opacity: chipSpring,
              transform: `translateX(${(1 - chipSpring) * -20 * s}px)`,
              background: theme.surface,
              border: `${1 * s}px solid ${c}55`,
              borderRadius: 8 * s,
              padding: `${8 * s}px ${16 * s}px`,
              fontSize: 18 * s,
              fontWeight: 700,
              color: c,
              display: "flex",
              alignItems: "center",
              gap: 8 * s,
            }}>
              <span style={{
                width: 8 * s, height: 8 * s, borderRadius: 4 * s,
                background: c,
              }} />
              {chip[lang]}
            </div>
          );
        })}
      </div>

      <div style={{
        opacity: textOpacity,
        fontSize: 52 * s,
        fontWeight: 800,
        lineHeight: 1.2,
        letterSpacing: -0.5,
        flex: 1,
      }}>
        {str.content_text}
      </div>
    </AbsoluteFill>
  );
};
