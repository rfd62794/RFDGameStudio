// Shared Speech Recognition Engine — generalized from Early Learning Buddy
//
// Real, working pattern: continuous listening that doesn't cut off on
// pauses, an explicit press-to-finish signal (evaluation happens once,
// on the user's signal, not on every interim transcript), and proper
// error handling for common browser speech recognition failure modes.
//
// Source: Early Learning Buddy (src/utils/speech.ts)
// Generalized: stripped all ELB-specific content (kid-friendly error
// messages, letter/word references). The interaction pattern and
// browser API wrapper are what's shared.

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SpeechRecognitionResultHandler {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export interface SpeechEngineOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export class SpeechEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private lang: string;
  private continuous: boolean;
  private interimResults: boolean;

  constructor(options: SpeechEngineOptions = {}) {
    this.lang = options.lang ?? 'en-US';
    this.continuous = options.continuous ?? true;
    this.interimResults = options.interimResults ?? true;
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  public startListening(handlers: SpeechRecognitionResultHandler) {
    if (!this.isSupported()) {
      handlers.onError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      if (this.recognition) {
        this.recognition.abort();
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = this.continuous;
      this.recognition.interimResults = this.interimResults;
      this.recognition.lang = this.lang;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        handlers.onTranscript(text.trim(), Boolean(finalTranscript));
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let msg = 'Speech recognition error. Please try again.';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          msg = 'Microphone access is blocked. Check browser permissions.';
        } else if (event.error === 'no-speech') {
          msg = 'No speech detected. Please try speaking again.';
        }
        handlers.onError(msg);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        handlers.onEnd();
      };

      this.recognition.start();
    } catch (e) {
      this.isListening = false;
      handlers.onError('Microphone failed to start. Check hardware and permissions.');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignored
      }
      this.isListening = false;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

// Default singleton instance with standard options
export const speechEngine = new SpeechEngine();
