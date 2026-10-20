/**
 * Ultimate Fruit Ninja - Web Audio API Procedural Sound Engine
 * Zero external dependencies. Works 100% offline with zero latency.
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.masterVolume = 0.8;
        this.vibrationEnabled = true;

        this.musicGain = null;
        this.sfxGain = null;
        this.isMusicPlaying = false;
        this.musicTimer = null;
        this.notes = [220, 246.94, 277.18, 329.63, 369.99, 440, 493.88, 554.37, 659.25]; // Pentatonic A minor/Dojo scale
        this.musicStep = 0;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.soundEnabled ? 1 : 0, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.35 : 0, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);
    }

    resume() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setValueAtTime(enabled ? 1 : 0, this.ctx.currentTime);
        }
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setValueAtTime(enabled ? 0.35 : 0, this.ctx.currentTime);
        }
        if (enabled && !this.isMusicPlaying) {
            this.startMusic();
        } else if (!enabled && this.isMusicPlaying) {
            this.stopMusic();
        }
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        }
    }

    setVibrationEnabled(enabled) {
        this.vibrationEnabled = enabled;
    }

    vibrate(pattern = 30) {
        if (!this.vibrationEnabled || !('vibrate' in navigator)) return;
        try {
            navigator.vibrate(pattern);
        } catch (e) {}
    }

    // --- SOUND EFFECTS ---

    /** Blade whoosh / swipe sound */
    playWhoosh(intensity = 1.0) {
        if (!this.soundEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const dur = 0.12 * Math.max(0.6, intensity);

        // White noise through sweeping bandpass filter
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.4;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(1800, now + dur * 0.5);
        filter.frequency.exponentialRampToValueAtTime(300, now + dur);
        filter.Q.setValueAtTime(3.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.3 * intensity, now + dur * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
    }

    /** Fruit slice sound - squelchy, crisp cutting impact */
    playSlice(fruitType = 'watermelon') {
        if (!this.soundEnabled) return;
        this.resume();
        if (!this.ctx) return;

        this.vibrate(35);
        const now = this.ctx.currentTime;

        // 1. Blade transient click/whack
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        const startFreq = fruitType === 'watermelon' ? 450 : fruitType === 'coconut' ? 520 : 600;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.1);

        // 2. Juicy squelch noise burst
        const dur = fruitType === 'watermelon' ? 0.22 : 0.16;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(fruitType === 'coconut' ? 1200 : 2400, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + dur);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noise.start(now);
    }

    /** Combo fanfare chords */
    playCombo(comboCount) {
        if (!this.soundEnabled) return;
        this.resume();
        if (!this.ctx) return;

        this.vibrate([40, 30, 60]);
        const now = this.ctx.currentTime;
        const baseFreq = 392; // G4
        // Arpeggio notes based on combo size
        const count = Math.min(6, Math.max(3, comboCount));
        const intervals = [1, 1.25, 1.5, 1.75, 2.0, 2.5];

        for (let i = 0; i < count; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            const f = baseFreq * intervals[i % intervals.length];
            const startTime = now + i * 0.06;

            osc.frequency.setValueAtTime(f, startTime);
            osc.frequency.exponentialRampToValueAtTime(f * 1.02, startTime + 0.15);

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(startTime);
            osc.stop(startTime + 0.36);
        }
    }

    /** Golden Fruit bonus chime */
    playGoldenChime() {
        if (!this.soundEnabled) return;
        this.resume();
        if (!this.ctx) return;

        this.vibrate([50, 40, 50, 40, 80]);
        const now = this.ctx.currentTime;
        const freqs = [587.33, 880, 1174.66, 1760]; // D major bell harmonics

        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);

            gain.gain.setValueAtTime(0.2, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6 + idx * 0.08);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + idx * 0.04);
            osc.stop(now + 0.7 + idx * 0.08);
        });
    }

    /** Bomb Explosion: Massive sub-bass impact, distorted rumble */
    playExplosion() {
        if (!this.soundEnabled) return;
        this.resume();
        if (!this.ctx) return;

        this.vibrate([100, 50, 300]);
        const now = this.ctx.currentTime;

        // Sub bass drop
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sawtooth';
        sub.frequency.setValueAtTime(160, now);
        sub.frequency.exponentialRampToValueAtTime(25, now + 0.6);

        subGain.gain.setValueAtTime(0.8, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        sub.connect(subGain);
        subGain.connect(this.sfxGain);
        sub.start(now);
        sub.stop(now + 0.75);

        // Noise rumble
        const dur = 1.0;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + dur);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.9, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noise.start(now);
    }

    /** Missed fruit strike / drop */
    playMiss() {
        if (!this.soundEnabled) return;
        this.resume();
        if (!this.ctx) return;

        this.vibrate(60);
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.25);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    /** UI Button tap */
    playClick() {
        if (!this.soundEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    /** Game Over Gong */
    playGameOver() {
        if (!this.soundEnabled) return;
        this.resume();
        if (!this.ctx) return;

        this.vibrate([100, 50, 150]);
        const now = this.ctx.currentTime;

        [110, 164.8, 220, 330].forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 1.8);
        });
    }

    /** Achievement fanfare */
    playAchievement() {
        if (!this.soundEnabled) return;
        this.resume();
        if (!this.ctx) return;

        this.vibrate([60, 40, 80, 40, 120]);
        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880]; // A major

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            const t = now + idx * 0.08;
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.3, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.5);
        });
    }

    /** Timer tick for arcade mode */
    playTick(isUrgent = false) {
        if (!this.soundEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(isUrgent ? 880 : 550, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // --- PROCEDURAL ZEN/DOJO MUSIC ---
    startMusic() {
        if (this.isMusicPlaying || !this.musicEnabled) return;
        this.resume();
        if (!this.ctx) return;

        this.isMusicPlaying = true;
        this.playMusicStep();
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }

    playMusicStep() {
        if (!this.isMusicPlaying || !this.musicEnabled || !this.ctx) return;

        const now = this.ctx.currentTime;
        // Select gentle pentatonic note
        const noteIdx = (this.musicStep + Math.floor(Math.random() * 3)) % this.notes.length;
        const freq = this.notes[noteIdx];

        // Soft bell/koto style pluck
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 1.25);

        this.musicStep = (this.musicStep + 1) % this.notes.length;
        // Schedule next note every 500ms - 900ms
        const delay = 450 + Math.random() * 350;
        this.musicTimer = setTimeout(() => this.playMusicStep(), delay);
    }
}

window.audioManager = new AudioManager();
