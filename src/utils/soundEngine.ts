// Pure Web Audio API Synthesizer for Alarm Profiles, HIIT Cues & Procedural Ambient Soundscapes

export type AlarmProfile = 'chime' | 'bowl' | 'beep' | 'pulse';
export type AmbientProfile = 'none' | 'brown' | 'rain' | 'gamma';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private volume: number = 0.75;
  private muted: boolean = false;
  private profile: AlarmProfile = 'chime';

  // Ambient Nodes
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientExtraNodes: AudioNode[] = [];
  private activeAmbient: AmbientProfile = 'none';
  private ambientVolume: number = 0.35;

  constructor() {
    try {
      const savedVol = localStorage.getItem('sw_sound_volume');
      const savedMute = localStorage.getItem('sw_sound_muted');
      const savedProf = localStorage.getItem('sw_sound_profile') as AlarmProfile | null;
      if (savedVol !== null) this.volume = Number(savedVol);
      if (savedMute !== null) this.muted = savedMute === 'true';
      if (savedProf) this.profile = savedProf;
    } catch {}
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    try {
      localStorage.setItem('sw_sound_volume', String(this.volume));
    } catch {}
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem('sw_sound_muted', String(this.muted));
    } catch {}
    if (m) {
      this.stopAmbient();
    }
  }

  public getProfile(): AlarmProfile {
    return this.profile;
  }

  public setProfile(p: AlarmProfile) {
    this.profile = p;
    try {
      localStorage.setItem('sw_sound_profile', p);
    } catch {}
  }

  public playAlarm(overrideProfile?: AlarmProfile) {
    if (this.muted || this.volume <= 0) return;
    const p = overrideProfile || this.profile;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    if (p === 'chime') {
      // Horological Minute Repeater Dual-Bell Chime
      const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.22);

        gain.gain.setValueAtTime(0.001, now + idx * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.35 * this.volume, now + idx * 0.22 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.22 + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.22);
        osc.stop(now + idx * 0.22 + 1.85);
      });
    } else if (p === 'bowl') {
      // Tibetan Singing Bowl Harmonic Resonance
      const partials = [432, 864, 1296, 1728];
      partials.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f + (i % 2 === 0 ? 1.5 : -1.5), now);

        const amp = (0.4 / (i + 1)) * this.volume;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(amp, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 3.5);
      });
    } else if (p === 'beep') {
      // Digital Precision Quartz Triple Beep
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2400, now + i * 0.14);

        gain.gain.setValueAtTime(0.3 * this.volume, now + i * 0.14);
        gain.gain.setValueAtTime(0.001, now + i * 0.14 + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.14);
        osc.stop(now + i * 0.14 + 0.1);
      }
    } else if (p === 'pulse') {
      // Urgency Pulse
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now + i * 0.18);
        osc.frequency.exponentialRampToValueAtTime(440, now + i * 0.18 + 0.14);

        gain.gain.setValueAtTime(0.25 * this.volume, now + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.16);
      }
    }
  }

  // Synthesized 3-2-1-GO countdown pips for HIIT / Tabata / Sports
  public playCountdownPip(isFinalGo: boolean = false) {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinalGo ? 1318.5 : 659.25, now);

    const duration = isFinalGo ? 0.38 : 0.12;
    gain.gain.setValueAtTime(0.32 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Subtle tactile click for Chess Clock / Lap splits
  public playClick() {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  // Procedural Ambient Noise Generators (Brown Noise, Pink Rain, 40Hz Gamma Focus Drone)
  public setAmbient(profile: AmbientProfile, vol?: number) {
    if (vol !== undefined) {
      this.ambientVolume = Math.max(0, Math.min(1, vol));
    }
    if (this.activeAmbient === profile && this.ambientSource) {
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.setTargetAtTime(this.ambientVolume * 0.35, this.ctx.currentTime, 0.1);
      }
      return;
    }

    this.stopAmbient();
    this.activeAmbient = profile;
    if (profile === 'none' || this.muted) return;

    const ctx = this.getContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.ambientVolume * 0.35, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this.ambientGain = masterGain;

    if (profile === 'brown' || profile === 'rain') {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      if (profile === 'brown') {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }
      } else {
        // Pink Rain approximation
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.08;
          b6 = white * 0.115926;
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = profile === 'brown' ? 420 : 1200;

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      whiteNoise.start(0);
      this.ambientSource = whiteNoise;
      this.ambientExtraNodes = [filter];
    } else if (profile === 'gamma') {
      // 40Hz Binaural Focus Drone (200Hz Left + 240Hz Right)
      const merger = ctx.createChannelMerger(2);
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      oscL.type = 'sine';
      oscR.type = 'sine';
      oscL.frequency.value = 200;
      oscR.frequency.value = 240; // 40Hz Gamma difference

      oscL.connect(merger, 0, 0);
      oscR.connect(merger, 0, 1);
      merger.connect(masterGain);

      oscL.start();
      oscR.start();
      this.ambientSource = oscL;
      this.ambientExtraNodes = [oscR, merger];
    }
  }

  public stopAmbient() {
    try {
      if (this.ambientSource && 'stop' in this.ambientSource) {
        (this.ambientSource as AudioScheduledSourceNode).stop();
      }
      this.ambientSource?.disconnect();
      this.ambientExtraNodes.forEach((n) => {
        if ('stop' in n) {
          try {
            (n as AudioScheduledSourceNode).stop();
          } catch {}
        }
        n.disconnect();
      });
      this.ambientGain?.disconnect();
    } catch {}
    this.ambientSource = null;
    this.ambientExtraNodes = [];
    this.ambientGain = null;
    this.activeAmbient = 'none';
  }

  public getActiveAmbient(): AmbientProfile {
    return this.activeAmbient;
  }

  public getAmbientVolume(): number {
    return this.ambientVolume;
  }

  public async notify(title: string, body: string) {
    if (!('Notification' in window)) return;
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/emblem.jpg' });
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/emblem.jpg' });
        }
      }
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
