import { Composition } from "remotion";
import { Main } from "./compositions/Main.jsx";

// devsecnews billboard format — 1600×320 wide banner, 8 seconds @ 30fps.
// Mirrors the static HTML billboard's aspect (devsecnews/billboard/*.html).

const SHARED = {
  component: Main,
  durationInFrames: 240,    // 8s × 30fps
  fps: 30,
  width: 1600,
  height: 320,
};

export const Root = () => {
  return (
    <>
      <Composition id="Main"   {...SHARED} defaultProps={{ lang: "en" }} />
      <Composition id="MainKO" {...SHARED} defaultProps={{ lang: "ko" }} />
    </>
  );
};
