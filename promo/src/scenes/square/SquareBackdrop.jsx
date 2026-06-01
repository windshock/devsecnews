import { AbsoluteFill } from "remotion";
import { useScale } from "remotion-kit-lib";
import { theme } from "../../theme.js";

// Dark terminal-editorial backdrop for the 1080×1080 LinkedIn square.
export const SquareBackdrop = () => {
  const s = useScale(1080);
  const cell = 60 * s;
  return (
    <AbsoluteFill style={{
      background: `
        radial-gradient(95% 55% at 50% 0%, rgba(255,75,92,.10), transparent 52%),
        linear-gradient(180deg, #05080d 0%, ${theme.bg} 55%, #05080d 100%)`,
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(148,163,184,.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148,163,184,.05) 1px, transparent 1px)`,
        backgroundSize: `${cell}px ${cell}px`,
        maskImage: "radial-gradient(circle at 50% 48%, black 45%, transparent 92%)",
        WebkitMaskImage: "radial-gradient(circle at 50% 48%, black 45%, transparent 92%)",
      }} />
    </AbsoluteFill>
  );
};
