import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { FadeOutOverlay } from "remotion-kit-lib";
import { theme } from "../theme.js";
import { SquareBackdrop } from "../scenes/square/SquareBackdrop.jsx";
import { SquareParticles } from "../scenes/square/SquareParticles.jsx";
import { SquareHook } from "../scenes/square/SquareHook.jsx";
import { SquareFlood } from "../scenes/square/SquareFlood.jsx";
import { SquareChain } from "../scenes/square/SquareChain.jsx";
import { SquareFinal } from "../scenes/square/SquareFinal.jsx";

// "취약점 인플레이션" — LinkedIn 1:1 (1080×1080), 30s @ 30fps (900 frames).
// SAME scene durations as the 1600×320 billboard so the shared pre-mixed audio
// (board-mix.mp3) stays in sync (narration · SFX · BROKEN @19.5s). Scenes are
// re-laid-out vertically for the square frame.
//   135 + 255 + 270 + 285 = 945, minus 3 × 15-frame fades (45) = 900 = 30s.

const T = 15;

export const BoardSquare = () => {
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <Audio src={staticFile("audio/board-mix.mp3")} />
      <SquareBackdrop />
      <SquareParticles />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={135}>
          <SquareHook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={255}>
          <SquareFlood />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={270}>
          <SquareChain />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={285}>
          <SquareFinal />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <FadeOutOverlay fadeDuration={15} />
    </AbsoluteFill>
  );
};
