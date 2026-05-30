import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { FadeOutOverlay } from "remotion-kit-lib";
import { theme } from "../theme.js";
import { GridBackdrop } from "../scenes/GridBackdrop.jsx";
import { Title } from "../scenes/Title.jsx";
import { Content } from "../scenes/Content.jsx";
import { Cta } from "../scenes/Cta.jsx";

// 8s timeline (240 frames @ 30fps), 3 scenes + 2 cross-fades.
//   Title:   0–90  (3s)
//   Content: 75–165 (3s, 15f cross-fade absorbed at boundary)
//   Cta:     150–240 (3s, +30f padding so the last frame is filled)
//
// Audio: single narration mp3 per language covers the full 8 s (no per-scene
// split since the banner is too short to cut narration). BGM plays underneath
// at volume 0.1 — Pixabay license-free Tech Ambient Corporate, trimmed to 8s.
//
// Korean narration transliterates English brand names to Hangul (MeloTTS KR
// butchers raw English) — see public/audio/script.json.

const TRANSITION_FRAMES = 15;

export const Main = ({ lang }) => {
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      {/* BGM underlay */}
      <Audio src={staticFile("audio/bgm.mp3")} volume={0.1} />

      {/* Narration spans the whole composition */}
      <Audio src={staticFile(`audio/narr-${lang}.mp3`)} />

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
