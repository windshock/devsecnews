import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { useScale } from "remotion-kit-lib";
import { theme } from "../theme.js";
import { STRINGS } from "../i18n.js";

export const Cta = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useScale(1600);
  const str = STRINGS[lang];

  const arrowSpring = spring({ frame, fps, config: { damping: 14 } });
  const ctaSpring = spring({ frame: frame - 10, fps, config: { damping: 14 } });
  const urlSpring = spring({ frame: frame - 25, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 30 * s,
      padding: `${30 * s}px ${50 * s}px`,
      color: theme.fg,
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        opacity: arrowSpring,
        transform: `translateX(${(1 - arrowSpring) * -30 * s}px)`,
        fontSize: 72 * s,
        color: theme.accent,
        lineHeight: 1,
        flexShrink: 0,
      }}>
        →
      </div>

      <div style={{
        opacity: ctaSpring,
        transform: `translateY(${(1 - ctaSpring) * 12 * s}px)`,
        fontSize: 56 * s,
        fontWeight: 800,
        letterSpacing: -0.5,
        flex: 1,
      }}>
        {str.cta_main}
      </div>

      <div style={{
        opacity: urlSpring,
        transform: `translateX(${(1 - urlSpring) * 30 * s}px)`,
        background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
        color: "#0b0f1a",
        padding: `${14 * s}px ${24 * s}px`,
        borderRadius: 10 * s,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 22 * s,
        fontWeight: 700,
        flexShrink: 0,
      }}>
        {str.cta_url}
      </div>
    </AbsoluteFill>
  );
};
