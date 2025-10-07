function applyAntiAliasing(node, audioCtx) {
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = audioCtx.sampleRate / 2 * 0.9;
    node.connect(filter);
    return filter;
}

function stopAllSounds() {
}

function encodeWAV(buffer) {
    const numOfChan = buffer.numberOfChannels,
          length = buffer.length * numOfChan * 2 + 44,
          rate = buffer.sampleRate,
          format = 1,
          bitDepth = 16,
          result = new DataView(new ArrayBuffer(length)),
          bytesPerSample = bitDepth / 8,
          bytesPerFrame = numOfChan * bytesPerSample;
    let offset = 0;

    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(result, offset, 'RIFF'); offset += 4;
    result.setUint32(offset, length - 8, true); offset += 4;
    writeString(result, offset, 'WAVE'); offset += 4;
    writeString(result, offset, 'fmt '); offset += 4;
    result.setUint32(offset, 16, true); offset += 4;
    result.setUint16(offset, format, true); offset += 2;
    result.setUint16(offset, numOfChan, true); offset += 2;
    result.setUint32(offset, rate, true); offset += 4;
    result.setUint32(offset, rate * bytesPerFrame, true); offset += 4;
    result.setUint16(offset, bytesPerFrame, true); offset += 2;
    result.setUint16(offset, bitDepth, true); offset += 2;
    writeString(result, offset, 'data'); offset += 4;
    result.setUint32(offset, buffer.length * bytesPerFrame, true); offset += 4;

    for (let channel = 0; channel < numOfChan; channel++) {
        const data = buffer.getChannelData(channel);
        let sampleOffset = 44;
        for (let i = 0; i < data.length; i++, sampleOffset += bytesPerFrame) {
            const sample = Math.max(-1, Math.min(1, data[i]));
            result.setInt16(sampleOffset + channel * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        }
    }

    return result.buffer;
}
