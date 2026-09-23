// Web Speech Recognition Wrapper for Kids' Voice Practice

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SpeechRecognitionResultHandler {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export class SpeechEngine {
  private recognition: any = null;
  private isListening: boolean = false;

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
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

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
        let msg = 'Could not hear clearly. Try again!';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          msg = 'Microphone access is blocked. You can type instead!';
        } else if (event.error === 'no-speech') {
          msg = 'No speech detected. Press the mic and speak out loud!';
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
      handlers.onError('Microphone failed to start. You can type instead!');
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

export const speechEngine = new SpeechEngine();
