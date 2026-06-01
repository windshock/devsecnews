import { AbsoluteFill } from "remotion";
import { useScale } from "remotion-kit-lib";
import { theme } from "../../theme.js";

// Restrained terminal-editorial backdrop for the billboard.
// Near-black, a faint grid, one subtle red vignette up top — no cyan/purple
// glows, no moving scanline. Lets the data motion + typography carry the frame.
export const StripBackdrop = () => {
  const s = useScale(1600);
  const cellSize = 56 * s;

  return (
    <AbsoluteFill style={{
      background: `
        radial-gradient(120% 90% at 50% -10%, rgba(255, 75, 92, 0.07) 0%, transparent 45%),
        linear-gradient(180deg, #05080d 0%, ${theme.bg} 60%, #05080d 100%)
      `,
      pointerEvents: "none",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(148, 163, 184, 0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148, 163, 184, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: `${cellSize}px ${cellSize}px`,
        maskImage: "radial-gradient(circle at 50% 50%, black 40%, transparent 92%)",
        WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 40%, transparent 92%)",
      }} />
    </AbsoluteFill>
  );
};
