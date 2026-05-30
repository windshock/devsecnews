# devsecnews-promo

Remotion-based promo/banner video. Scaffolded from
[remotion-kit](file:///Users/1004276/Downloads/remotion-kit/) and depends on
its shared `lib/` for `useScale`, `Watermark`, `FadeOutOverlay`, theme defaults,
and SRT helpers.

## Setup

```bash
npm install
```

Installs Remotion + React in this project's `node_modules`. `remotion-kit-lib`
is `link:`-ed to `~/Downloads/remotion-kit/lib`, so edits to the kit's lib
propagate immediately without reinstalling.

## Render

```bash
npm run render          # → dist/devsecnews-promo.mp4
npm run studio          # live preview at http://localhost:3000
```

## Layout

```
.
├── package.json
├── remotion.config.mjs
├── src/
│   ├── index.jsx          # registerRoot
│   ├── Root.jsx           # registers Composition(s) — adjust width/height
│   ├── i18n.js            # EN / KO string tables
│   ├── theme.js           # project-specific colors (overrides kit defaults)
│   ├── compositions/
│   │   └── Main.jsx       # 3-scene timeline with cross-fades
│   └── scenes/
│       ├── Title.jsx
│       ├── Content.jsx
│       └── Cta.jsx
└── public/audio/          # narration mp3s + script.json (when adding TTS)
```

## Customize

1. `src/Root.jsx` — set `width` / `height` / `durationInFrames` for your medium.
   - 1920×1080 (default): YouTube / 16:9
   - 1080×1080: Instagram square
   - 1080×1920: Reels / Shorts / Stories
   - 1600×320: web billboard / leaderboard ad

2. `src/theme.js` — pick brand colors. Spread `defaultTheme` and override
   `accent`, `card`, etc.

3. `src/i18n.js` — fill in EN + KO strings.

4. `src/scenes/*` — replace placeholder text/layout with real content. Each
   scene receives `lang` prop; pull strings from `STRINGS[lang]`.

5. `src/compositions/Main.jsx` — adjust scene durations. With N cross-fade
   transitions the LAST scene needs `+ N × transitionDurationInFrames` padding
   so the composition fills its full duration.

## Add narration / BGM

The shared TTS toolbox at `~/Downloads/tts/` produces narration mp3s:

```bash
~/Downloads/tts/kokoro     "English text"   public/audio/scene1-en.mp3 --speed 1.1
~/Downloads/tts/melotts-kr "한글 텍스트"     public/audio/scene1-ko.mp3 --speed 1.4
```

Reference them from `Main.jsx`:

```jsx
import { Audio, staticFile, Sequence } from "remotion";

<Sequence from={0} durationInFrames={300}>
  <Audio src={staticFile("audio/scene1-${lang}.mp3")} />
</Sequence>
```

For background music, drop a license-free track at `public/audio/bgm.mp3` and
add `<Audio src={staticFile("audio/bgm.mp3")} volume={0.1} />` as the first
audio child of the composition.

## Resources

- Remotion docs: https://www.remotion.dev/docs/
- remotion-kit lib README: `~/Downloads/remotion-kit/README.md`
- TTS toolbox: `~/Downloads/tts/README.md`
