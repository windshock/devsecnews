import { Composition } from "remotion";
import { Main } from "./compositions/Main.jsx";
import { BoardBillboard } from "./compositions/BoardBillboard.jsx";
import { BoardSquare } from "./compositions/BoardSquare.jsx";

// devsecnews billboard format — 1600×320 wide banner @ 30fps.
// Mirrors the static HTML billboard's aspect (devsecnews/billboard/*.html).

const SHARED = {
  component: Main,
  durationInFrames: 240,    // 8s × 30fps
  fps: 30,
  width: 1600,
  height: 320,
};

// "취약점 인플레이션" 2026-05 billboard — same 1600×320 strip, 12s.
// Keep in sync with the scene math in compositions/BoardBillboard.jsx.
const BILLBOARD_DURATION = 900; // 30s × 30fps (paced narration + SFX, see board-mix.mp3)

export const Root = () => {
  return (
    <>
      <Composition id="Main"   {...SHARED} defaultProps={{ lang: "en" }} />
      <Composition id="MainKO" {...SHARED} defaultProps={{ lang: "ko" }} />
      <Composition
        id="Board"
        component={BoardBillboard}
        durationInFrames={BILLBOARD_DURATION}
        fps={30}
        width={1600}
        height={320}
      />
      <Composition
        id="BoardSquare"
        component={BoardSquare}
        durationInFrames={BILLBOARD_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
