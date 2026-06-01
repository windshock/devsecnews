import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useScale } from "remotion-kit-lib";

// Subtle drifting dust for the 1080×1080 square (full-height spread).
const N = 22;
const seeded = (i, k) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const SquareParticles = () => {
  const frame = useCurrentFrame();
  const s = useScale(1080);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {Array.from({ length: N }).map((_, i) => {
        const baseX = seeded(i, 1) * 1080;
        const baseY = seeded(i, 2) * 1080;
        const speed = 0.15 + seeded(i, 3) * 0.5;
        const sway = 8 + seeded(i, 4) * 20;
        const size = 1.4 + seeded(i, 5) * 2.0;
        const y = ((baseY - frame * speed) % 1080 + 1080) % 1080;
        const x = baseX + Math.sin(frame / 40 + i) * sway;
        const twinkle = 0.06 + 0.10 * (0.5 + 0.5 * Math.sin(frame / 18 + i * 2));
        return (
          <div key={i} style={{
            position: "absolute", left: x * s, top: y * s,
            width: size * s, height: size * s, borderRadius: "50%",
            background: "#8595a6", opacity: twinkle,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};
