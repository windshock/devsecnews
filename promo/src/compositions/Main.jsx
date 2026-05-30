import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { FadeOutOverlay } from "remotion-kit-lib";
import { theme } from "../theme.js";
import { GridBackdrop } from "../scenes/GridBackdrop.jsx";
import { Title } from "../scenes/Title.jsx";
import { Content } from "../scenes/Content.jsx";
import { Cta } from "../scenes/Cta.jsx";

// 8s timeline (240 frames @ 30fps), 3 scenes + 2 cross-fades. Each scene 90
// frames, last scene padded for transition absorption (90 + 0 since last
// scene has no transition after it — the math works out because each
// transition steals from both sides of its boundary):
//   Title:   0–90 (3s)
//   Content: 75–165 (3s, starts 15f early due to preceding fade absorb)
//   Cta:     150–240 (3s, padded to fill the trailing 30f)

const TRANSITION_FRAMES = 15;

export const Main = ({ lang }) => {
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      {/* Static backdrop behind every scene */}
      <GridBackdrop />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <Title lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <Content lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
        {/* Cta needs +30 padding so 2 cross-fade absorbs leave the composition
            filled all the way to frame 240 (last scene shows from frame 150). */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <Cta lang={lang} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <FadeOutOverlay fadeDuration={15} />
    </AbsoluteFill>
  );
};
