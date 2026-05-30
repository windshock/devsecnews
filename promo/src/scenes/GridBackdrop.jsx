import { AbsoluteFill } from "remotion";
import { useScale } from "remotion-kit-lib";
import { theme } from "../theme.js";

// Subtle grid + radial glow backdrop — mirrors the static billboard's mood.
// Rendered behind every scene as a constant base layer.
export const GridBackdrop = () => {
  const s = useScale(1600);  // billboard design width
  const cellSize = 32 * s;

  return (
    <AbsoluteFill style={{
      background: `
        radial-gradient(circle at 88% 50%, rgba(34, 211, 238, 0.18) 0 8%, transparent 28%),
        radial-gradient(circle at 96% 38%, rgba(167, 139, 250, 0.18) 0 7%, transparent 24%),
        linear-gradient(135deg, ${theme.bg} 0%, #06111f 55%, ${theme.bg} 100%)
      `,
      pointerEvents: "none",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(34, 211, 238, 0.045) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(34, 211, 238, 0.045) 1px, transparent 1px)
        `,
        backgroundSize: `${cellSize}px ${cellSize}px`,
        maskImage: "linear-gradient(90deg, transparent 0%, black 17%, black 83%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 17%, black 83%, transparent 100%)",
      }} />
    </AbsoluteFill>
  );
};
