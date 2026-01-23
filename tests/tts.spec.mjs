import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('TTS Logic Integration Test', () => {
    test.beforeEach(async ({ page }) => {
        // 1. Mock window.speechSynthesis BEFORE page load
        await page.addInitScript(() => {
            window.speechSynthesisMock = {
                speak: [],
                cancel: 0,
                pause: 0,
                resume: 0,
                paused: false,
                speaking: false,
                getVoices: () => [
                    { name: 'Google 한국어', lang: 'ko-KR' },
                    { name: 'Alice', lang: 'en-US' }
                ]
            };

            // Define getter to return our mock whenever accessed
            Object.defineProperty(window, 'speechSynthesis', {
                get: () => ({
                    getVoices: () => window.speechSynthesisMock.getVoices(),
                    speak: (u) => {
                        window.speechSynthesisMock.speak.push(u.text);
                        window.speechSynthesisMock.speaking = true;
                        // Trigger onend immediately for testing flow
                        if (u.onend) setTimeout(u.onend, 10);
                    },
                    cancel: () => {
                        window.speechSynthesisMock.cancel++;
                        window.speechSynthesisMock.speaking = false;
                    },
                    pause: () => {
                        window.speechSynthesisMock.pause++;
                        window.speechSynthesisMock.paused = true;
                    },
                    resume: () => {
                        window.speechSynthesisMock.resume++;
                        window.speechSynthesisMock.paused = false;
                    },
                    get paused() { return window.speechSynthesisMock.paused; },
                    get speaking() { return window.speechSynthesisMock.speaking; },
                    set onvoiceschanged(fn) { setTimeout(fn, 50); },
                    addEventListener: (type, fn) => { if (type === 'voiceschanged') setTimeout(fn, 50); }
                }),
                configurable: true
            });

            // Mock SpeechSynthesisUtterance constructor
            window.SpeechSynthesisUtterance = class {
                constructor(text) {
                    this.text = text;
                    console.log("Utterance created with text length:", text.length);
                }
            };
        });

        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err));

        // Determine the absolute path to the generated HTML file
        const htmlPath = path.resolve('devsecnews-2026-01-node-java.html');
        await page.goto(`file://${htmlPath}`);
    });

    test('TTS buttons should call speechSynthesis API', async ({ page }) => {
        // 2. Check if voices populated
        const voiceSelect = page.locator('#tts-voice');
        await expect(voiceSelect).toBeVisible();

        // We expect options to be populated. The init script simulates voiceschanged.
        // The select logic selects High Quality Korean if available.
        // Our mock has "Google 한국어", so it should be selected.
        await expect(voiceSelect).toHaveValue('Google 한국어');

        // 3. Click "Read"
        const playBtn = page.locator('#tts-play');
        await expect(playBtn).toBeVisible();
        await playBtn.click();

        // 4. Verify speak() was called via our mock
        // Wait for async chunking logic
        await expect.poll(async () => {
            return await page.evaluate(() => window.speechSynthesisMock.speak.length);
        }, { timeout: 2000 }).toBeGreaterThan(0);

        // Verify text content of first chunk
        const firstChunk = await page.evaluate(() => window.speechSynthesisMock.speak[0]);
        console.log('Spoken text:', firstChunk);
        expect(firstChunk).toBeTruthy();
    });

    test('TTS Stop button should cancel speech', async ({ page }) => {
        // Force speaking state to enable Stop button
        await page.evaluate(() => {
            window.speechSynthesisMock.speaking = true;
            // The UI updates based on setButtonsState() which is called on events.
            // We can manually trigger a UI update or just force the button enabled.
            const stop = document.getElementById('tts-stop');
            stop.removeAttribute('disabled');
        });

        const stopBtn = page.locator('#tts-stop');
        await stopBtn.click();

        // Verify cancel called
        await expect.poll(async () => {
            return await page.evaluate(() => window.speechSynthesisMock.cancel);
        }, { timeout: 1000 }).toBeGreaterThan(0);
    });
});
