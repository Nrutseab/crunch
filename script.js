class crunch {
    constructor() {
        this.canvas = document.getElementById('grid');
        this.ctx = this.canvas.getContext('2d');
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterNode = this.audioCtx.createGain();
        this.masterNode.connect(this.audioCtx.destination);
        this.isPlaying = false;
        this.liveMode = false;
        this.grid = this.initGrid(8, 16);
        this.blocks = [];
        this.links = [];
        this.clips = [];
        this.timelineClips = [];
        this.automationCurves = []; // {clipId, param, points: [{x, y}]}
        this.currentTime = 0;
        this.bpm = 120;
        this.quantize = 0;
        this.selectedBlock = null;
        this.selectedClip = null;
        this.presets = JSON.parse(localStorage.getItem('crunchPresets') || '{}');
        this.tracks = [
            { id: 1, gain: this.audioCtx.createGain(), pan: this.audioCtx.createStereoPanner() },
            { id: 2, gain: this.audioCtx.createGain(), pan: this.audioCtx.createStereoPanner() }
        ];
        this.tracks.forEach(t => {
            t.gain.connect(t.pan);
            t.pan.connect(this.masterNode);
        });
        this.initEventListeners();
        this.render();
        this.renderSessionView();
        this.startAudioContext();
    }

    initGrid(rows, cols) {
        return Array.from({ length: rows }, () => Array(cols).fill(null));
    }

    initEventListeners() {
        const blocks = document.querySelectorAll('.block');
        blocks.forEach(block => {
            block.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', block.dataset.type);
            });
        });

        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('text/plain');
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / 40);
            const y = Math.floor((e.clientY - rect.top) / 40);
            if (x < this.grid[0].length && y < this.grid.length) {
                this.addBlock(type, x, y);
                this.render();
            }
        });

        let isLinking = false;
        let startPos = null;
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            startPos = { x: Math.floor((e.clientX - rect.left) / 40), y: Math.floor((e.clientY - rect.top) / 40) };
            isLinking = true;
        });
        this.canvas.addEventListener('mouseup', (e) => {
            if (isLinking) {
                const rect = this.canvas.getBoundingClientRect();
                const endPos = { x: Math.floor((e.clientX - rect.left) / 40), y: Math.floor((e.clientY - rect.top) / 40) };
                this.addLink(startPos, endPos);
                isLinking = false;
                this.render();
            }
        });

        this.canvas.addEventListener('dblclick', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / 40);
            const y = Math.floor((e.clientY - rect.top) / 40);
            const block = this.blocks.find(b => b.x === x && b.y === y);
            if (block) {
                this.selectedBlock = block;
                this.showParamEditor(block);
            }
        });

        document.getElementById('closeEditor').addEventListener('click', () => {
            document.getElementById('paramEditor').classList.remove('active');
        });

        document.getElementById('savePreset').addEventListener('click', () => {
            if (this.selectedBlock) {
                const name = prompt('preset name.');
                if (name) {
                    this.presets[`${this.selectedBlock.type}_${name}`] = this.selectedBlock.params;
                    localStorage.setItem('crunchPresets', JSON.stringify(this.presets));
                }
            }
        });

        document.getElementById('loadVST').addEventListener('click', () => {
            if (this.selectedBlock) {
                loadVST(this.audioCtx, this.selectedBlock);
            }
        });

        const sessionView = document.getElementById('sessionView');
        sessionView.addEventListener('drop', (e) => {
            e.preventDefault();
            const patternId = e.dataTransfer.getData('text/plain');
            const track = parseInt(e.target.dataset.track);
            const scene = parseInt(e.target.dataset.scene);
            this.addClip(track, scene, patternId, 4);
            this.renderSessionView();
        });
        sessionView.addEventListener('dragover', (e) => e.preventDefault());

        const timeline = document.getElementById('timeline');
        timeline.addEventListener('drop', (e) => {
            e.preventDefault();
            const patternId = e.dataTransfer.getData('text/plain');
            const rect = timeline.getBoundingClientRect();
            const start = Math.floor((e.clientX - rect.left) / 20);
            this.addTimelineClip(1, start, 4, patternId);
            this.renderTimeline();
        });
        timeline.addEventListener('dragover', (e) => e.preventDefault());
        timeline.addEventListener('dblclick', (e) => {
            const rect = timeline.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const clip = this.timelineClips.find(c => x >= c.start * 20 && x <= (c.start + c.duration) * 20);
            if (clip) {
                this.selectedClip = clip;
                this.showAutomationEditor(clip);
            }
        });

        document.getElementById('closeAutomation').addEventListener('click', () => {
            document.getElementById('automationEditor').style.display = 'none';
        });

        const automationCanvas = document.getElementById('automationCanvas');
        let isDrawing = false;
        let currentCurve = null;
        automationCanvas.addEventListener('mousedown', (e) => {
            if (this.selectedClip) {
                const rect = automationCanvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = 1 - (e.clientY - rect.top) / rect.height;
                currentCurve = this.automationCurves.find(c => c.clipId === this.selectedClip.id) || { clipId: this.selectedClip.id, param: 'volume', points: [] };
                currentCurve.points.push({ x, y });
                this.automationCurves = this.automationCurves.filter(c => c.clipId !== this.selectedClip.id).concat(currentCurve);
                isDrawing = true;
                this.renderAutomation();
            }
        });
        automationCanvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                const rect = automationCanvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = 1 - (e.clientY - rect.top) / rect.height;
                currentCurve.points.push({ x, y });
                this.renderAutomation();
            }
        });
        automationCanvas.addEventListener('mouseup', () => {
            isDrawing = false;
        });

        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        document.getElementById('liveModeBtn').addEventListener('click', () => {
            this.liveMode = !this.liveMode;
            document.getElementById('liveModeBtn').textContent = this.liveMode ? 'studio mode' : 'live mode';
            this.renderSessionView();
        });
        document.getElementById('exportBtn').addEventListener('click', () => this.exportWAV());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('addVocal').addEventListener('click', () => this.addVocalLayer());
        document.getElementById('audioImport').addEventListener('change', (e) => this.importAudio(e.target.files[0]));
        document.getElementById('addReverb').addEventListener('click', () => this.addReverb());
        document.getElementById('addDelay').addEventListener('click', () => this.addDelay());
        document.getElementById('addEQ').addEventListener('click', () => this.addEQ());
        document.getElementById('addLimiter').addEventListener('click', () => this.addLimiter());
        document.getElementById('playgroundBtn').addEventListener('click', () => {
            document.getElementById('playground').style.display = 'flex';
        });
        document.getElementById('runPlayground').addEventListener('click', () => {
            const code = document.getElementById('playgroundCode').value;
            runPlayground(this.audioCtx, this.bpm, code, this.masterNode);
        });
        document.getElementById('closePlayground').addEventListener('click', () => {
            document.getElementById('playground').style.display = 'none';
        });

        document.querySelectorAll('.vol').forEach((vol, i) => {
            vol.addEventListener('input', (e) => this.setTrackVolume(i + 1, e.target.value));
        });
        document.querySelectorAll('.pan').forEach((pan, i) => {
            pan.addEventListener('input', (e) => this.setTrackPan(i + 1, e.target.value));
        });
    }

    addBlock(type, x, y) {
        const defaults = {
            piano: { fmIndex: 5, attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.5, vst: null },
            drum: { type: 'kick', decay: 0.2, pitch: 60, sample: null, sidechain: false },
            bass: { waveform: 'sawtooth', cutoff: 500, resonance: 5, attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.2, vst: null },
            guitar: { pluck: 0.1, damping: 0.5, attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.5, vst: null },
            pattern: {},
            vocal: {},
            master: { reverbWet: 0.3, delayTime: 0.3, delayFeedback: 0.5, eqLow: 0, eqHigh: 0, limiterThreshold: -6 }
        };
        const block = { type, x, y, id: Date.now(), params: defaults[type] || {}, track: 1 };
        this.grid[y][x] = block;
        this.blocks.push(block);
    }

    addLink(start, end) {
        this.links.push({ start, end });
    }

    addClip(track, scene, patternId, duration) {
        this.clips.push({ track, scene, patternId, duration, playing: false, id: Date.now() });
    }

    addTimelineClip(track, start, duration, patternId) {
        const clip = { track, start, duration, patternId, id: Date.now() };
        this.timelineClips.push(clip);
    }

    showParamEditor(block) {
        const paramsDiv = document.getElementById('params');
        paramsDiv.innerHTML = '';
        const params = block.params;
        for (const key in params) {
            if (key === 'sample' || key === 'vst') continue;
            const label = document.createElement('label');
            label.textContent = key;
            const input = document.createElement('input');
            input.type = 'range';
            input.min = 0;
            input.max = key === 'fmIndex' || key === 'resonance' ? 20 : key === 'cutoff' ? 2000 : key === 'pitch' ? 200 : key === 'eqLow' || key === 'eqHigh' ? 12 : key === 'limiterThreshold' ? 0 : 1;
            input.step = 0.01;
            input.value = params[key];
            input.addEventListener('input', (e) => {
                params[key] = parseFloat(e.target.value);
            });
            label.appendChild(input);
            paramsDiv.appendChild(label);
        }
        if (block.type === 'drum') {
            const select = document.createElement('select');
            ['kick', 'snare', 'hihat'].forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.text = opt;
                if (opt === params.type) option.selected = true;
                select.appendChild(option);
            });
            select.addEventListener('change', (e) => params.type = e.target.value);
            paramsDiv.appendChild(select);
            const sidechain = document.createElement('input');
            sidechain.type = 'checkbox';
            sidechain.checked = params.sidechain;
            sidechain.addEventListener('change', (e) => params.sidechain = e.target.checked);
            const sidechainLabel = document.createElement('label');
            sidechainLabel.textContent = 'sidechain';
            sidechainLabel.appendChild(sidechain);
            paramsDiv.appendChild(sidechainLabel);
        }
        if (block.type === 'bass' || block.type === 'guitar') {
            const waveSelect = document.createElement('select');
            ['sawtooth', 'square', 'triangle'].forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.text = opt;
                if (opt === params.waveform) option.selected = true;
                waveSelect.appendChild(option);
            });
            waveSelect.addEventListener('change', (e) => params.waveform = e.target.value);
            paramsDiv.appendChild(waveSelect);
        }
        document.getElementById('paramEditor').classList.add('active');
    }

    showAutomationEditor(clip) {
        document.getElementById('automationEditor').style.display = 'flex';
        this.renderAutomation();
    }

    renderAutomation() {
        const canvas = document.getElementById('automationCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        const curve = this.automationCurves.find(c => c.clipId === this.selectedClip.id);
        if (curve && curve.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(curve.points[0].x * canvas.width, (1 - curve.points[0].y) * canvas.height);
            for (let i = 1; i < curve.points.length - 2; i += 2) {
                ctx.bezierCurveTo(
                    curve.points[i].x * canvas.width, (1 - curve.points[i].y) * canvas.height,
                    curve.points[i + 1].x * canvas.width, (1 - curve.points[i + 1].y) * canvas.height,
                    curve.points[i + 2].x * canvas.width, (1 - curve.points[i + 2].y) * canvas.height
                );
            }
            ctx.stroke();
        }
    }

    addVocalLayer() {
        const text = document.getElementById('vocalText').value;
        if (text) {
            addVocalUtterance(this.audioCtx, text, this.bpm);
            document.getElementById('vocalText').value = '';
        }
    }

    async importAudio(file) {
        const buffer = await loadAudioFile(this.audioCtx, file);
        const block = this.blocks.find(b => b.type === 'drum' && !b.params.sample);
        if (block) {
            block.params.sample = buffer;
        }
    }

    addReverb() {
        addConvolutionReverb(this.audioCtx, this.masterNode);
    }

    addDelay() {
        addDelayEffect(this.audioCtx, this.masterNode);
    }

    addEQ() {
        addEQ(this.audioCtx, this.masterNode);
    }

    addLimiter() {
        addLimiter(this.audioCtx, this.masterNode);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.grid[0].length; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * 40, 0);
            this.ctx.lineTo(i * 40, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i <= this.grid.length; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * 40);
            this.ctx.lineTo(this.canvas.width, i * 40);
            this.ctx.stroke();
        }

        const colors = { piano: '#666', drum: '#888', bass: '#aaa', guitar: '#ccc', pattern: '#ddd', vocal: '#eee', master: '#fff' };
        this.blocks.forEach(block => {
            this.ctx.fillStyle = colors[block.type] || '#666';
            this.ctx.fillRect(block.x * 40 + 1, block.y * 40 + 1, 38, 38);
            this.ctx.fillStyle = block.type === 'pattern' || block.type === 'vocal' || block.type === 'master' ? 'black' : 'white';
            this.ctx.font = '12px helvetica';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(block.type.slice(0, 3), block.x * 40 + 20, block.y * 40 + 25);
        });

        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 2;
        this.links.forEach(link => {
            this.ctx.beginPath();
            this.ctx.moveTo(link.start.x * 40 + 20, link.start.y * 40 + 20);
            this.ctx.lineTo(link.end.x * 40 + 20, link.end.y * 40 + 20);
            this.ctx.stroke();
        });
    }

    renderSessionView() {
        const scenesDiv = document.getElementById('scenes');
        scenesDiv.innerHTML = '';
        for (let scene = 0; scene < 4; scene++) {
            const sceneDiv = document.createElement('div');
            sceneDiv.className = 'scene';
            this.tracks.forEach(track => {
                const clip = this.clips.find(c => c.track === track.id && c.scene === scene);
                const clipDiv = document.createElement('div');
                clipDiv.className = 'clip';
                clipDiv.dataset.track = track.id;
                clipDiv.dataset.scene = scene;
                clipDiv.textContent = clip ? 'clip' : '';
                if (clip && clip.playing) clipDiv.classList.add('playing');
                clipDiv.addEventListener('click', () => this.triggerClip(track.id, scene));
                sceneDiv.appendChild(clipDiv);
            });
            scenesDiv.appendChild(sceneDiv);
        }
    }

    renderTimeline() {
        const timeline = document.getElementById('timeline');
        timeline.innerHTML = '';
        this.timelineClips.forEach(clip => {
            const div = document.createElement('div');
            div.className = 'timeline-clip';
            div.style.width = `${clip.duration * 20}px`;
            div.style.left = `${clip.start * 20}px`;
            div.style.top = `${(clip.track - 1) * 50}px`;
            timeline.appendChild(div);
        });
    }

    startAudioContext() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    }

    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.currentTime = 0;
            requestAnimationFrame(() => this.updateLoop());
        }
    }

    stop() {
        this.isPlaying = false;
        this.clips.forEach(c => c.playing = false);
        this.renderSessionView();
        stopAllSounds();
    }

    triggerClip(track, scene) {
        const clip = this.clips.find(c => c.track === track && c.scene === scene);
        if (clip) {
            clip.playing = !clip.playing;
            if (clip.playing) {
                const startTime = this.quantize ? Math.ceil(this.currentTime / this.quantize) * this.quantize : this.currentTime;
                this.playClip(clip, startTime);
            }
            this.renderSessionView();
        }
    }

    playClip(clip, startTime) {
        const block = this.blocks.find(b => b.id === clip.patternId && b.type === 'pattern');
        if (block) {
            const linked = this.links.find(l => l.start.x === block.x && l.start.y === block.y);
            if (linked) {
                const targetBlock = this.blocks.find(b => b.x === linked.end.x && b.y === linked.end.y);
                if (targetBlock) {
                    const note = 440 * Math.pow(2, (block.y - 4) / 12);
                    this.triggerInstrument(targetBlock, note, clip.duration / (this.bpm / 60), startTime);
                }
            }
        }
    }

    triggerInstrument(block, freq, duration, startTime) {
        let node;
        const track = this.tracks.find(t => t.id === block.track || 1);
        if (block.params.vst) {
            node = playVST(this.audioCtx, block.params.vst, freq, duration);
        } else {
            switch (block.type) {
                case 'piano':
                    node = playPiano(this.audioCtx, freq, block.params);
                    break;
                case 'drum':
                    node = playDrum(this.audioCtx, block.params.type, block.params);
                    if (block.params.sidechain) {
                        const trigger = this.blocks.find(b => b.type === 'drum' && b !== block);
                        if (trigger) addSidechain(this.audioCtx, node, playDrum(this.audioCtx, trigger.params.type, trigger.params));
                    }
                    break;
                case 'bass':
                    node = playBass(this.audioCtx, freq, block.params);
                    break;
                case 'guitar':
                    node = playGuitar(this.audioCtx, freq, block.params);
                    break;
                case 'vocal':
                    node = playVocal(this.audioCtx, block.params);
                    break;
            }
        }
        if (node) {
            applyEffects(node, this.audioCtx);
            node.connect(track.gain);
        }
    }

    setTrackVolume(trackId, vol) {
        const track = this.tracks.find(t => t.id === trackId);
        if (track) track.gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
    }

    setTrackPan(trackId, pan) {
        const track = this.tracks.find(t => t.id === trackId);
        if (track) track.pan.pan.setValueAtTime(pan, this.audioCtx.currentTime);
    }

    async exportWAV() {
        const offlineCtx = new OfflineAudioContext(2, 44100 * 60, 44100);
        this.timelineClips.forEach(clip => {
            const block = this.blocks.find(b => b.id === clip.patternId && b.type === 'pattern');
            if (block) {
                const linked = this.links.find(l => l.start.x === block.x && l.start.y === block.y);
                if (linked) {
                    const targetBlock = this.blocks.find(b => b.x === linked.end.x && b.y === linked.end.y);
                    if (targetBlock) {
                        const curve = this.automationCurves.find(c => c.clipId === clip.id);
                        if (curve) {
                            // Apply bezier automation (simplified)
                            const node = this.triggerInstrument(targetBlock, 440 * Math.pow(2, (block.y - 4) / 12), clip.duration / (this.bpm / 60), clip.start / (this.bpm / 60));
                            node.gain.gain.setValueCurveAtTime(curve.points.map(p => p.y), clip.start / (this.bpm / 60), clip.duration / (this.bpm / 60));
                            node.connect(offlineCtx.destination);
                        }
                    }
                }
            }
        });
        const buffer = await offlineCtx.startRendering();
        const wav = encodeWAV(buffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.wav';
        a.click();
    }

    undo() {
        if (this.blocks.length > 0) {
            this.blocks.pop();
            this.grid = this.initGrid(8, 16);
            this.blocks.forEach(b => this.grid[b.y][b.x] = b);
            this.render();
        }
    }

    updateLoop() {
        if (!this.isPlaying) return;
        this.currentTime += 1 / 60;
        const beat = (this.currentTime * this.bpm / 60) % 32;

        if (!this.liveMode) {
            this.timelineClips.forEach(clip => {
                if (beat >= clip.start && beat < clip.start + clip.duration) {
                    this.playClip(clip, clip.start / (this.bpm / 60));
                }
            });
        }

        this.render();
        if (this.isPlaying) requestAnimationFrame(() => this.updateLoop);
    }
}

const daw = new crunch();
