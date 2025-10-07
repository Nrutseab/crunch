async function loadAudioFile(audioCtx, file) {
    const arrayBuffer = await file.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
}

async function warpAudio(audioCtx, buffer, bpm, targetBpm) {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = targetBpm / bpm;
    const gain = audioCtx.createGain();
    source.connect(gain);
    applyAntiAliasing(gain, audioCtx);
    return gain;
}
