import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { FadeOutOverlay } from "remotion-kit-lib";
import { theme } from "../theme.js";
import { StripBackdrop } from "../scenes/strip/StripBackdrop.jsx";
import { Particles } from "../scenes/strip/Particles.jsx";
import { StripHook } from "../scenes/strip/StripHook.jsx";
import { StripFlood } from "../scenes/strip/StripFlood.jsx";
import { StripChain } from "../scenes/strip/StripChain.jsx";
import { StripFinal } from "../scenes/strip/StripFinal.jsx";

// "취약점 인플레이션" billboard — 1600×320 strip, 30s @ 30fps (900 frames).
// Same format as the Main banner. Flow: Hook → AI flood/triage → supply-chain
// break → final message. Beat lengths track the MeloTTS narration phrasing in
// the pre-mixed audio (board-mix.mp3) so visuals land with the voice + SFX.
// Final scene is long because its narration line is a full sentence (~7.4s).
//
// Audio is a single pre-mixed track (ducked BGM + paced narration + SFX). Built
// in ffmpeg — see public/audio/script-board.json. SFX land at: whooshes on
// scene transitions (~4.0/12.0/20.5s), ticks over the counter climb (~4–7.3s),
// low impact boom on TRUST CHAIN BROKEN (~19.5s, chain-local frame 225).
//
// Effective length = Σ(sequences) − Σ(transitions). 4 scenes → 3 fades.
//   135 + 255 + 270 + 285 = 945, minus 3 × 15-frame fades (45) = 900 = 30s.
//   Keep in sync with BILLBOARD_DURATION in Root.jsx.

const T = 15;

export const BoardBillboard = () => {
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      {/* Single pre-mixed track: ducked BGM + narration + SFX (see script-board.json) */}
      <Audio src={staticFile("audio/board-mix.mp3")} />

      <StripBackdrop />
      <Particles />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={135}>
          <StripHook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={255}>
          <StripFlood />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={270}>
          <StripChain />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={285}>
          <StripFinal />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <FadeOutOverlay fadeDuration={15} />
    </AbsoluteFill>
  );
};
