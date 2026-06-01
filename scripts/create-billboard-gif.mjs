import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { execSync } from "node:child_process";
import { chromium } from "playwright";

const inputFileName = process.argv[2];
if (!inputFileName || !fs.existsSync(inputFileName)) {
  console.error("Usage: node scripts/create-billboard-gif.mjs <input.html>");
  process.exit(1);
}

const inputPath = path.resolve(inputFileName);
const inputUrl = pathToFileURL(inputPath).toString();
const parsedPath = path.parse(inputPath);
const baseName = parsedPath.name;
const outDir = parsedPath.dir;
const tempFramesDir = path.join(outDir, ".tmp_frames");
fs.rmSync(tempFramesDir, { recursive: true, force: true });
fs.mkdirSync(tempFramesDir, { recursive: true });

console.log("Launching browser to capture frames deterministically...");
const browser = await chromium.launch();
const context = await browser.newContext({ deviceScaleFactor: 2 });
const page = await context.newPage();

await page.setViewportSize({ width: 1700, height: 600 });
await page.goto(inputUrl, { waitUntil: "networkidle" });
await page.waitForTimeout(500);

// Hide background so it's transparent, hide note, pause animations
await page.evaluate(() => {
  if (document.body) document.body.style.background = 'transparent';
  const stage = document.querySelector('.stage');
  if (stage) stage.style.width = '1600px';
  const note = document.querySelector('.note');
  if (note) note.style.display = 'none';
  
  // Pause animations so we can step them manually
  const style = document.createElement('style');
  style.textContent = '* { animation-play-state: paused !important; }';
  document.documentElement.appendChild(style);
});

const billboard = page.locator('.billboard, svg').first();
// Wait an extra tick to ensure layout is applied
await page.waitForTimeout(200);

const fps = 15;
const durationSec = 24;
const totalFrames = fps * durationSec;

console.log(`Capturing ${totalFrames} frames...`);
for (let i = 0; i < totalFrames; i++) {
  const currentTimeMs = i * (1000 / fps);
  
  await page.evaluate((ms) => {
    // step all animations manually
    document.getAnimations().forEach(a => {
      a.currentTime = ms;
    });
  }, currentTimeMs);

  const frameNum = String(i).padStart(4, '0');
  await billboard.screenshot({ 
    path: path.join(tempFramesDir, `frame_${frameNum}.png`),
    omitBackground: true 
  });
  if (i % 10 === 0) {
    process.stdout.write(`\rCaptured frame ${i}/${totalFrames}`);
  }
}
console.log(`\nFinished capturing ${totalFrames} frames.`);

await context.close();
await browser.close();

const gifOut = path.join(outDir, `${baseName}_highres.gif`);
const ffmpegPath = process.env.FFMPEG_PATH || "/opt/homebrew/bin/ffmpeg";

console.log(`Converting frames to ${gifOut} ...`);
try {
  execSync(
    `"${ffmpegPath}" -y -framerate ${fps} -i "${tempFramesDir}/frame_%04d.png" -filter_complex "split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4" "${gifOut}"`,
    { stdio: "inherit", env: { ...process.env, PATH: `/opt/homebrew/bin:${process.env.PATH}` } }
  );
  console.log(`Successfully created: ${gifOut}`);
} catch (e) {
  console.error("ffmpeg conversion failed:", e.message);
} finally {
  fs.rmSync(tempFramesDir, { recursive: true, force: true });
}
