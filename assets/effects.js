async function addConvolutionReverb(audioCtx, destination) {
    const reverb = audioCtx.createConvolver();
    const impulse = await generateImpulseResponse(audioCtx, 2, 0.5);
    reverb.buffer = impulse;
    const wet = audioCtx.createGain();
    wet.gain.value = 0.3;
    destination.connect(reverb);
    reverb.connect(wet);
    wet.connect(audioCtx.destination);
}

async function generateImpulseResponse(audioCtx, duration, decay) {
    const sampleRate = audioCtx.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioCtx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
        const n = length - i;
        left[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
        right[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    }
    return impulse;
}

function addDelayEffect(audioCtx, destination) {
    const delay = audioCtx.createDelay(0.3);
    delay.delayTime.value = 0.3;
    const feedback = audioCtx.createGain();
    feedback.gain.value = 0.5;
    const wet = audioCtx.createGain();
    wet.gain.value = 0.3;
    destination.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(audioCtx.destination);
}

function addSidechain(audioCtx, source, trigger) {
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.ratio.value = 10;
    source.connect(compressor);
    trigger.connect(compressor);
    compressor.connect(audioCtx.destination);
}

function addEQ(audioCtx, destination) {
    const lowShelf = audioCtx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 200;
    lowShelf.gain.value = 0;
    const highShelf = audioCtx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 8000;
    highShelf.gain.value = 0;
    destination.connect(lowShelf);
    lowShelf.connect(highShelf);
    highShelf.connect(audioCtx.destination);
    return { lowShelf, highShelf };
}

function addLimiter(audioCtx, destination) {
    const limiter = audioCtx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;
    destination.connect(limiter);
    limiter.connect(audioCtx.destination);
}

function applyEffects(node, audioCtx) {
}
