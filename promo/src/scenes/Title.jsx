import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { useScale } from "remotion-kit-lib";
import { theme } from "../theme.js";
import { STRINGS } from "../i18n.js";

export const Title = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useScale(1600);
  const str = STRINGS[lang];

  const brandFade = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: 14 } });

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
      <div style={{
        opacity: brandFade,
        background: `linear-gradient(135deg, ${theme.accent}33, ${theme.accent}11)`,
        border: `${1.5 * s}px solid ${theme.accent}66`,
        borderRadius: 999,
        padding: `${10 * s}px ${22 * s}px`,
        display: "flex",
        alignItems: "center",
        gap: 12 * s,
        fontSize: 24 * s,
        fontWeight: 700,
        letterSpacing: 0.3,
        flexShrink: 0,
      }}>
        <span style={{
          width: 10 * s, height: 10 * s, borderRadius: 5 * s,
          background: theme.accent,
          boxShadow: `0 0 ${10 * s}px ${theme.accent}`,
        }} />
        {str.brand}
      </div>

      <div style={{
        opacity: titleSpring,
        transform: `translateX(${(1 - titleSpring) * 30 * s}px)`,
        fontSize: 56 * s,
        fontWeight: 800,
        lineHeight: 1.1,
        letterSpacing: -0.5,
        flex: 1,
      }}>
        {str.title_main}
      </div>

      <div style={{
        opacity: brandFade,
        fontSize: 22 * s,
        color: theme.accent2,
        fontWeight: 700,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        flexShrink: 0,
      }}>
        {str.issue_label}
      </div>
    </AbsoluteFill>
  );
};
