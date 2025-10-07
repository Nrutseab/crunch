# crunch daw

crunch daw is a professional-grade, browser-based digital audio workstation designed for live performance and studio production. it’s intuitive, customizable, and nomadic, enabling fully mastered tracks on the go or in a professional studio without physical instruments. features include advanced bezier-based automation curves, a built-in mastering suite (eq, limiter), real vst plugin integration via webassembly, and a playground inspired by orca’s sequencer for experimentation. see tutorial.md for a detailed guide.

## setup

1. clone repo to `crunch`.
2. add wav samples to `/audio/` (e.g., `kick.wav`, `loop.wav`).
3. open `index.html` in chrome/edge for browser use.
4. for apk, install android studio, open `/android/`, build, and deploy.
5. commit to github for collaboration.

## snapshots

(*insert snapshot here after generating with provided code*)

- main view: grid with piano (2,2), drum (4,2), bass (6,2), pattern (2,4) linked to piano. session view with clip (track 1, scene 1). timeline with clip (track 1, start: 0, duration: 4).
- param editor: double-click piano block, show fm index and adsr sliders.
- automation: timeline clip with bezier curve for bass cutoff.
- playground: orca-like sequencer with `a4:440` and `b2:220`.

**generate snapshot**:
1. open `index.html` in chrome.
2. drag piano (2,2), drum (4,2), bass (6,2), pattern (2,4). link pattern to piano.
3. drag pattern to session view (track 1, scene 1).
4. drag pattern to timeline (track 1, start: 0, duration: 4).
5. double-click piano block to show param editor.
6. double-click timeline clip to show automation editor, draw bezier curve.
7. click playground button, enter `a4:440` and `b2:220`.
8. screenshot at 1280x720.

## apk deployment

1. install android studio.
2. open `/android/` in android studio.
3. copy web files (`index.html`, `styles.css`, `script.js`, `assets/`) to `/android/app/src/main/assets/`.
4. ensure gradle syncs.
5. connect android device or use emulator.
6. build apk: `build > build bundle(s) / apk(s) > build apk`.
7. deploy to device or share apk.

## notes

- ui: black-and-white, lowercase, periods only. grayscale blocks (#666–#fff) and transparent panels for nomadic, eye-friendly design.
- limitations: vst is basic (fm synth). warping needs fft-based beat detection. add in `warping.js`. electron app for desktop could improve performance.
- extensibility: coders can add plugins to `vst.js`, effects to `effects.js`, or collaboration via websocket in `script.js`.

test in chrome, generate snapshots, deploy apk, and push to github. for ios app or more features (e.g., compressor, fft warping), provide details.
