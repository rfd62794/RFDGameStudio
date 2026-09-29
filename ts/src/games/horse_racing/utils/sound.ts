/**
 * Web Audio API Procedural Sound Synthesizer
 * Race-day effects for Derby Sim — no audio files.
 * The AudioContext is created lazily inside the first play call, which
 * only ever runs from a click handler, so audio stays silent until a
 * user gesture.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.enabled;
  }

  /** Starting pistol — sharp crack as the gates open. */
  public playStartGun() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /** Finish line — two-tone call as the winner crosses. */
  public playFinish() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [880, 1174].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.11);
      gain.gain.setValueAtTime(0.12, now + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.11 + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + i * 0.11);
      osc.stop(now + i * 0.11 + 0.18);
    });
  }

  /** Winner's circle fanfare — player horse wins or a bet pays. */
  public playWin() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523, 659, 784, 1046].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.12, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.09 + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.26);
    });
  }

  /** Low sting — player finishes out of the money. */
  public playLoss() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }
}

export const sound = new SoundEngine();
