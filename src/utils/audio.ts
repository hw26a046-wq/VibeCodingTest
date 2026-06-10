/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmInterval: any = null;
  private isBgmPlaying: boolean = false;
  private bgmTempo: number = 130; // BPM

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return this.isMuted;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  // Generic osc sound generator
  private playTone(
    freqs: number[],
    duration: number,
    type: OscillatorType = 'sine',
    gainValues: number[] = [0.1, 0],
    modulateFreq: boolean = false
  ) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;

      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(freqs[0], now);
      
      if (modulateFreq && freqs.length > 1) {
        osc.frequency.exponentialRampToValueAtTime(freqs[1], now + duration);
      } else if (freqs.length > 1) {
        const step = duration / (freqs.length - 1);
        for (let i = 1; i < freqs.length; i++) {
          osc.frequency.setValueAtTime(freqs[i], now + i * step);
        }
      }

      gainNode.gain.setValueAtTime(gainValues[0], now);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(gainValues[1], 0.0001), now + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio failure:', e);
    }
  }

  // Noise sound generator for whip/explosions
  private playNoise(duration: number, lowpassFreq: number, gainVal: number) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(lowpassFreq, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + duration);

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      noiseNode.start();
    } catch (e) {
      console.warn('Noise Audio failure:', e);
    }
  }

  public playSelect() {
    this.playTone([440, 880], 0.08, 'triangle', [0.15, 0.01], true);
  }

  public playUpgradeSelect() {
    this.playTone([261.63, 329.63, 392.00, 523.25], 0.15, 'sine', [0.15, 0.01]);
  }

  public playWhip() {
    // Whip crack noise
    this.playNoise(0.12, 4000, 0.12);
    // Complementary slash sound
    setTimeout(() => {
      this.playTone([600, 200], 0.1, 'sawtooth', [0.08, 0.001], true);
    }, 20);
  }

  public playFireball() {
    this.playTone([500, 150], 0.15, 'triangle', [0.1, 0.001], true);
  }

  public playGarlicAura() {
    // Soft low chime
    this.playTone([120, 180], 0.1, 'sine', [0.03, 0.001], true);
  }

  public playAxeThrow() {
    this.playTone([200, 300, 150], 0.25, 'triangle', [0.08, 0.001], false);
  }

  public playBibleSpirt() {
    this.playTone([350, 450], 0.18, 'sine', [0.04, 0.0001], true);
  }

  public playLightningStrike() {
    // Powerful crackling sound
    this.playNoise(0.3, 8000, 0.16);
    this.playTone([1200, 100], 0.2, 'sawtooth', [0.12, 0.001], true);
  }

  public playHurt() {
    this.playTone([180, 80], 0.15, 'sawtooth', [0.12, 0.001], true);
  }

  public playEnemyDefeat(isBoss: boolean = false) {
    if (isBoss) {
      this.playNoise(0.5, 2000, 0.18);
      this.playTone([300, 60], 0.4, 'triangle', [0.2, 0.001], true);
    } else {
      this.playTone([150, 50], 0.08, 'sawtooth', [0.05, 0.001], true);
    }
  }

  public playExp() {
    const tones = [987.77, 1318.51, 1567.98]; // Sparkly metallic notes
    const now = Math.floor(Math.random() * tones.length);
    this.playTone([tones[now]], 0.12, 'sine', [0.06, 0.001]);
  }

  public playChicken() {
    this.playTone([330, 440, 660], 0.2, 'sine', [0.12, 0.001]);
  }

  public playLevelUp() {
    // Elegant arpeggio
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    chord.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone([freq, freq * 1.2], 0.3, 'sine', [0.1, 0.001], true);
      }, idx * 60);
    });
  }

  public playGameOver() {
    this.stopBgm();
    const chord = [493.88, 466.16, 440.00, 415.30, 392.00, 349.23, 293.66];
    chord.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone([freq, freq - 30], 0.4, 'sawtooth', [0.12, 0.0001], true);
      }, idx * 100);
    });
  }

  // Procedural retro 8-bit dynamic background music generator!
  public startBgm() {
    if (this.isMuted || this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.initCtx();

    let stepCount = 0;
    // Cool retro chord progression loop (A minor pentatonic vibe)
    // Am -> F -> G -> Em
    const bassline = [
      // Am
      110.00, 110.00, 130.81, 164.81, 
      // F
      87.31, 87.31, 130.81, 104.83,
      // G
      98.00, 98.00, 146.83, 116.54,
      // Em
      82.41, 82.41, 146.83, 164.81
    ];

    const melody = [
      // Am
      440.00, 440.00, 523.25, 587.33, 659.25, 587.33, 523.25, 392.00,
      // F
      349.23, 349.23, 523.25, 587.33, 659.25, 698.46, 659.25, 523.25,
      // G
      392.00, 392.00, 587.33, 659.25, 783.99, 659.25, 587.33, 493.88,
      // Em
      329.63, 329.63, 493.88, 523.25, 587.33, 659.25, 783.99, 880.00
    ];

    const stepIntervalMs = (60 / this.bgmTempo) * 1000 * 0.5; // Eighth note interval

    this.bgmInterval = setInterval(() => {
      if (this.isMuted) return;
      try {
        const bassNote = bassline[Math.floor(stepCount / 2) % bassline.length];
        
        // Play bass on odd steps
        if (stepCount % 2 === 0) {
          this.playTone([bassNote], stepIntervalMs * 1.8 / 1000, 'triangle', [0.03, 0.001]);
        }
        
        // Play light melody on selected beats to make it catchy but not intrusive
        if (stepCount % 4 === 0 || stepCount % 6 === 0) {
          const melodyNote = melody[stepCount % melody.length];
          // Sprinkle custom delays of octave transposition for classic chip arpeggios
          const playNote = Math.random() > 0.3 ? melodyNote : melodyNote * 2;
          this.playTone([playNote], stepIntervalMs * 0.8 / 1000, 'sine', [0.015, 0.001]);
        }

        // Tiny white noise snare snare / hi-hat on beats 2 and 4
        if (stepCount % 8 === 4) {
          this.playNoise(0.04, 3000, 0.01);
        } else if (stepCount % 4 === 2) {
          this.playNoise(0.01, 8000, 0.005);
        }

        stepCount = (stepCount + 1) % 64;
      } catch (err) {
        console.warn('BGM synthesis hiccup:', err);
      }
    }, stepIntervalMs);
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sfx = new SoundManager();
