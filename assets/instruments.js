function playPiano(audioCtx, freq, params) {
    const carrier = audioCtx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = freq;

    const modulator = audioCtx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.value = freq * 2;

    const modGain = audioCtx.createGain();
    modGain.gain.value = params.fmIndex * 100;

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    const gain = audioCtx.createGain();
    carrier.connect(gain);

    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + params.attack);
    gain.gain.linearRampToValueAtTime(params.sustain, now + params.attack + params.decay);
    gain.gain.setValueAtTime(params.sustain, now + params.attack + params.decay + 1);
    gain.gain.linearRampToValueAtTime(0, now + params.attack + params.decay + 1 + params.release);

    applyAntiAliasing(gain, audioCtx);
    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + params.attack + params.decay + 1 + params.release);
    modulator.stop(now + params.attack + params.decay + 1 + params.release);

    return gain;
}

function playDrum(audioCtx, type, params) {
    let node, gain;
    const now = audioCtx.currentTime;
    gain = audioCtx.createGain();
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + params.decay);

    if (params.sample) {
        node = audioCtx.createBufferSource();
        node.buffer = params.sample;
        node.connect(gain);
        node.start(now);
        node.stop(now + params.decay);
    } else {
        if (type === 'kick') {
            node = audioCtx.createOscillator();
            node.type = 'sine';
            node.frequency.setValueAtTime(params.pitch, now);
            node.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
            node.connect(gain);
            node.start(now);
            node.stop(now + params.decay);
        } else if (type === 'snare') {
            node = audioCtx.createWhiteNoise();
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1000;
            node.connect(filter);
            filter.connect(gain);
            node.start(now);
            node.stop(now + params.decay);
        } else if (type === 'hihat') {
            node = audioCtx.createWhiteNoise();
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 5000;
            node.connect(filter);
            filter.connect(gain);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            node.start(now);
            node.stop(now + 0.05);
        }
    }

    applyAntiAliasing(gain, audioCtx);
    return gain;
}

function playBass(audioCtx, freq, params) {
    const osc = audioCtx.createOscillator();
    osc.type = params.waveform;
    osc.frequency.value = freq;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = params.cutoff;
    filter.Q.value = params.resonance;

    const gain = audioCtx.createGain();
    osc.connect(filter);
    filter.connect(gain);

    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + params.attack);
    gain.gain.linearRampToValueAtTime(params.sustain, now + params.attack + params.decay);
    gain.gain.setValueAtTime(params.sustain, now + params.attack + params.decay + 0.5);
    gain.gain.linearRampToValueAtTime(0, now + params.attack + params.decay + 0.5 + params.release);

    applyAntiAliasing(gain, audioCtx);
    osc.start(now);
    osc.stop(now + params.attack + params.decay + 0.5 + params.release);

    return gain;
}

function playGuitar(audioCtx, freq, params) {
    const bufferSize = audioCtx.sampleRate * 0.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq * 2;

    const gain = audioCtx.createGain();
    source.connect(filter);
    filter.connect(gain);

    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + params.attack);
    gain.gain.linearRampToValueAtTime(params.sustain, now + params.attack + params.decay);
    gain.gain.setValueAtTime(params.sustain, now + params.attack + params.decay + 1);
    gain.gain.linearRampToValueAtTime(0, now + params.attack + params.decay + 1 + params.release);

    applyAntiAliasing(gain, audioCtx);
    source.start(now);
    source.stop(now + params.attack + params.decay + 1 + params.release);

    return gain;
}
