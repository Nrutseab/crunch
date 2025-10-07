let vocalQueue = [];

function addVocalUtterance(audioCtx, text, bpm) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = bpm / 60 * 0.5;
        utterance.pitch = 1;
        utterance.voice = speechSynthesis.getVoices().find(voice => voice.name.includes('female')) || null;
        utterance.onstart = () => console.log('vocal playing');
        speechSynthesis.speak(utterance);
        vocalQueue.push(utterance);
    }
}

function stopVocal(id) {
    speechSynthesis.cancel();
    vocalQueue = [];
}
