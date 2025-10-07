function runPlayground(audioCtx, bpm, code, destination) {
    const lines = code.split('\n');
    lines.forEach(line => {
        const [id, freq] = line.split(':');
        if (id && freq) {
            const match = id.match(/([a-z])(\d)/);
            if (match) {
                const note = parseFloat(freq);
                const beat = parseInt(match[2]);
                const now = audioCtx.currentTime;
                const time = now + (beat * 60 / bpm);
                const osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = note;
                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(1, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
                osc.connect(gain);
                gain.connect(destination);
                osc.start(time);
                osc.stop(time + 0.5);
            }
        }
    });
}
