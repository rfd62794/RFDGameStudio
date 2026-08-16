// Web Audio API Synthesizer and Web Speech Synthesis for Kid-Friendly Feedback

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

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

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted() {
    return this.isMuted;
  }

  // Play a gentle pop click sound for UI option selection
  public playPopSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Audio fallback
    }
  }

  // Play a happy success chime (ascending pentatonic notes: C5, E5, G5, C6)
  public playSuccessChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch {
      // Audio fallback
    }
  }

  // Gentle, warm, non-punitive wobble sound for retry
  public playGentleRetrySound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [392.00, 349.23]; // G4 to F4
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.3);
      });
    } catch {
      // Audio fallback
    }
  }

  // Grand triumph fanfare when unlocking a character
  public playUnlockFanfare() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      // Arpeggio + final triumphant chord
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        
        gain.gain.setValueAtTime(0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.45);
      });
    } catch {
      // Audio fallback
    }
  }

  // Play character action sound effect (sparkle, roar, beep, fly, jump)
  public playActionSound(actionType: string) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const act = actionType.toLowerCase();

      if (act.includes('roar') || act.includes('dino') || act.includes('stomp')) {
        // Deep friendly growl wobble
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (act.includes('beep') || act.includes('bot') || act.includes('laser')) {
        // Sci-fi cute beep sequence
        [880, 1320, 1760].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);

          gain.gain.setValueAtTime(0.08, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.1);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.12);
        });
      } else {
        // Sparkle / Fly / Dance sound (high tinkling bells)
        [1046.5, 1318.5, 1567.9, 2093.0].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.05);

          gain.gain.setValueAtTime(0.15, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.22);
        });
      }
    } catch {
      // Audio fallback
    }
  }

  // Stop any active speech synthesis safely
  public stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Fallback
      }
    }
  }

  // Text-to-Speech using window.speechSynthesis
  public speakText(text: string, rate: number = 0.9): Promise<void> {
    return new Promise((resolve) => {
      if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel(); // Stop any pending speech safely
      } catch {
        // Fallback
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate; // 0.9 is clear and friendly for 6-year-old
      utterance.pitch = 1.1; // Slightly higher, friendly tone
      
      // Try to find a clear English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        resolve();
      }
    });
  }
}

export const audio = new AudioEngine();
