# crunch daw tutorial

crunch daw is a browser-based digital audio workstation for creating professional-grade tracks on the go or in a studio, without physical instruments. its black-and-white, lowercase ui uses periods for minimalism, ensuring a nomadic, eye-friendly experience. this tutorial explains every element of crunch, from the grid to the orca-inspired playground, enabling beginners, professional mixers, and foley artists to create a fully mastered track. follow each section to understand and use all features.

## getting started

open `index.html` in chrome or edge. the interface includes:
- **header**: app name and controls (play, stop, live mode, export wav, undo, quantize dropdown, playground button).
- **palette (left)**: draggable blocks for instruments (piano, drum, bass, guitar), pattern, vocal, and master.
- **grid (center)**: 8x16 canvas for placing and linking blocks to create sounds and sequences.
- **session view (below grid)**: clip-based area for live performance, with tracks and scenes.
- **timeline (below session view)**: linear arrangement of clips for composing full tracks.
- **tracks (bottom)**: volume and pan controls for each track, plus master track with effect buttons.
- **parameter editor (right, hidden)**: opens on double-clicking a block to tweak instrument or effect settings.
- **automation editor (below timeline, hidden)**: opens on double-clicking a timeline clip to draw bezier curves for automation.
- **playground (right, hidden)**: orca-like sequencer for experimental live coding.
- **footer**: inputs for vocal text, adding vocals, and importing audio files.

ensure wav samples are in `/audio/` (e.g., `kick.wav`, `loop.wav`) for realistic drums or loops.

## palette and blocks

the palette contains draggable blocks to build your track:
- **piano**: fm synthesizer for melodic sounds. params: fm index (0–20, brightness), attack (0–1s, onset), decay (0–1s, fade), sustain (0–1, level), release (0–1s, tail). double-click to edit. load vst for custom synths.
- **drum**: synthesized or sample-based percussion. params: type (kick, snare, hihat), decay (0–1s), pitch (0–200hz), sample (wav file), sidechain (checkbox for ducking). upload wav via footer for realism.
- **bass**: subtractive synth for low-end. params: waveform (sawtooth, square, triangle), cutoff (0–2000hz, filter), resonance (0–20, filter emphasis), attack, decay, sustain, release. load vst for variety.
- **guitar**: physical modeling for string sounds. params: pluck (0–1, attack sharpness), damping (0–1, decay tone), attack, decay, sustain, release. load vst for advanced tones.
- **pattern**: triggers linked instruments. place on grid, drag to instrument block to link. y-axis sets pitch (lower y = higher note), x-axis sets timing.
- **vocal**: text-to-speech layer. enter text in footer, click add vocal to generate. synced to bpm.
- **master**: controls global effects. params: reverb wet (0–1), delay time (0–1s), delay feedback (0–1), eq low (±12db, 200hz), eq high (±12db, 8000hz), limiter threshold (-12–0db).

**example**:
1. drag piano to (2,2), drum to (4,2), bass to (6,2).
2. double-click piano, set fm index to 8 for brighter sound.
3. double-click drum, upload `kick.wav`, enable sidechain.

## grid

the 8x16 grid is the core workspace for composing:
- **placing blocks**: drag instruments or patterns from palette. each cell is 40x40 pixels.
- **linking**: drag from a pattern block to an instrument block to connect. e.g., pattern at (2,4) to piano at (2,2). links trigger the instrument at the pattern’s x-position (timing) and y-position (pitch).
- **pitch**: y-axis maps to midi notes (y=0 is high, y=7 is low). e.g., pattern at (2,4) linked to piano plays a middle c-ish note (440hz * 2^(-4/12)).
- **timing**: x-axis represents beats. one cell = 1/4 beat at 120 bpm.

**example**:
1. place pattern at (2,4), (3,4), (4,4). link all to piano at (2,2).
2. play: hear a three-note melody. move patterns to y=3 for higher pitch.

## session view

session view is for live performance, similar to ableton’s clip view:
- **structure**: shows tracks (1, 2) and scenes (0–3). each cell is a clip slot.
- **adding clips**: drag a pattern block to a slot (e.g., track 1, scene 1). this creates a clip that triggers the linked instrument.
- **playing clips**: click a clip to start/stop. set quantize (dropdown in header) to 1/4 or 1/2 beat for tight timing.
- **live mode**: click live mode button to enable. toggle to studio mode to disable.

**example**:
1. drag pattern from (2,4) to track 1, scene 1.
2. drag drum pattern to track 2, scene 1.
3. set quantize to 1/4 beat. click both clips to play a layered loop.

## timeline

the timeline arranges clips linearly for full tracks:
- **adding clips**: drag a pattern to timeline (e.g., track 1, start: 0, duration: 4 beats). adjust start/duration by dragging edges.
- **playback**: in studio mode (live mode off), click play to hear timeline clips in sequence.
- **automation**: double-click a clip to open automation editor (see below).

**example**:
1. drag piano pattern to track 1, start: 0, duration: 4.
2. drag drum pattern to track 2, start: 4, duration: 4.
3. play: hear piano for 4 beats, then drums.

## parameter editor

double-click a block on the grid to open the parameter editor:
- **instrument params**: tweak fm index, adsr, waveform, etc., as described in palette section.
- **master params**: adjust reverb wet, delay time/feedback, eq low/high, limiter threshold.
- **vst**: click load vst to apply a webassembly-based plugin (e.g., fm synth in `vst.js`). select from available plugins (currently one basic synth).
- **save preset**: click save preset, enter a name (e.g., `piano_bright`). presets save to local storage for reuse.

**example**:
1. double-click bass at (6,2). set cutoff to 800hz, resonance to 10 for a wobbly sound.
2. click load vst, select fm synth, adjust params.
3. save as `bass_wobble`.

## automation editor

double-click a timeline clip to open the automation editor:
- **canvas**: 800x100 pixels. x-axis is clip duration, y-axis is parameter value (0–1).
- **drawing curves**: click to add points, drag to draw bezier curves. automates volume, pan, or effect params (e.g., bass cutoff, reverb wet).
- **applying**: curves apply during playback/export. select param (e.g., volume) in editor dropdown.

**example**:
1. double-click piano clip in timeline (track 1, start: 0).
2. select cutoff param. click at x=0, y=0.2; x=0.5, y=0.8; x=1, y=0.2. drag for smooth curve.
3. play: hear filter sweep over 4 beats.

## effects

effects are applied via the master track or instrument params:
- **reverb**: click add reverb on master track. convolution-based, 2s decay. adjust wet (0–1) in master params.
- **delay**: click add delay. 0.3s delay, 0.5 feedback. tweak in master params.
- **eq**: click add eq. low shelf (200hz, ±12db), high shelf (8000hz, ±12db). adjust in master params.
- **limiter**: click add limiter. threshold -6db, ceiling 0db. tweak threshold in master params.
- **sidechain**: enable in drum params. links drum to another instrument (e.g., bass) for ducking.

**example**:
1. click add reverb, set wet to 0.5 for ambient piano.
2. click add eq, boost high shelf +3db for clarity.
3. enable sidechain on drum, link to bass for pumping effect.

## vocals and audio import

add vocals or samples via the footer:
- **vocal**: type text (e.g., “rise up”) in vocal text input. click add vocal. tts generates a vocal layer synced to bpm (rate = bpm/60 * 0.5).
- **audio import**: upload wav files (e.g., `loop.wav`) via footer. assign to drum block for playback or use as timeline clip.

**example**:
1. type “test vocal” and click add vocal. hear tts vocal.
2. upload `kick.wav`, assign to drum block at (4,2).

## playground

the playground is an orca-inspired sequencer for experimental live coding, accessible via the playground button in the header:
- **interface**: textarea for code, run button to execute, close button to hide.
- **syntax**: type `[id]:[freq]` per line. e.g., `a4:440` plays a 440hz note on beat 4. id format: `[letter][beat]` (e.g., `a4`, `b2`). letter is arbitrary, beat is 1–8.
- **execution**: click run to play notes. each note lasts 0.5s, triggered at beat * (60/bpm). uses sine wave for simplicity.
- **integration**: copy playground patterns to grid by dragging a pattern block and setting y-axis to match frequency (e.g., y=4 for 440hz).

**example**:
1. click playground button.
2. type:
