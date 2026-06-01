import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useScale } from "remotion-kit-lib";

// Deterministic drifting particle field — very subtle motion behind every beat.
// Restrained: few, dim, monochrome dust (no neon). Positions seeded by index.
const N = 14;
const seeded = (i, k) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x); // 0..1
};

export const Particles = () => {
  const frame = useCurrentFrame();
  const s = useScale(1600);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {Array.from({ length: N }).map((_, i) => {
        const baseX = seeded(i, 1) * 1600;
        const baseY = seeded(i, 2) * 320;
        const speed = 0.15 + seeded(i, 3) * 0.5;       // px/frame, slow drift up
        const sway = 8 + seeded(i, 4) * 20;
        const size = 1.2 + seeded(i, 5) * 1.8;

        // drift upward, wrap around; gentle horizontal sway
        const y = ((baseY - frame * speed) % 360 + 360) % 360;
        const x = baseX + Math.sin((frame / 40) + i) * sway;
        const twinkle = 0.06 + 0.10 * (0.5 + 0.5 * Math.sin(frame / 18 + i * 2));

        return (
          <div key={i} style={{
            position: "absolute",
            left: x * s,
            top: y * s,
            width: size * s,
            height: size * s,
            borderRadius: "50%",
            background: "#8595a6",
            opacity: twinkle,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};
