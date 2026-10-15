import { getLanguageInfo } from '../data/languages';
import { LanguageCode } from '../types';

export interface SpeechPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentSentenceIndex: number;
  totalSentences: number;
  rate: number; // 0.8 or 1.0
  activeSource: 'gemini' | 'browser' | 'idle';
}

type StateListener = (state: SpeechPlaybackState) => void;

class SpeechService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<StateListener> = new Set();
  private sentences: string[] = [];
  private sentenceInterval: any = null;
  private state: SpeechPlaybackState = {
    isPlaying: false,
    isPaused: false,
    currentSentenceIndex: 0,
    totalSentences: 0,
    rate: 1.0,
    activeSource: 'idle',
  };

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  public getState(): SpeechPlaybackState {
    return { ...this.state };
  }

  public setRate(rate: number) {
    this.state.rate = rate;
    if (this.currentAudio) {
      this.currentAudio.playbackRate = rate;
    }
    this.notify();
  }

  public stop() {
    if (this.sentenceInterval) {
      clearInterval(this.sentenceInterval);
      this.sentenceInterval = null;
    }

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;

    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.currentSentenceIndex = 0;
    this.state.activeSource = 'idle';
    this.notify();
  }

  public pause() {
    if (this.currentAudio && this.state.isPlaying) {
      this.currentAudio.pause();
      this.state.isPaused = true;
      this.state.isPlaying = false;
      this.notify();
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.state.isPlaying) {
      window.speechSynthesis.pause();
      this.state.isPaused = true;
      this.state.isPlaying = false;
      this.notify();
    }
  }

  public resume() {
    if (this.currentAudio && this.state.isPaused) {
      this.currentAudio.play();
      this.state.isPaused = false;
      this.state.isPlaying = true;
      this.notify();
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.state.isPaused) {
      window.speechSynthesis.resume();
      this.state.isPaused = false;
      this.state.isPlaying = true;
      this.notify();
    }
  }

  /**
   * Split script into clean sentences
   */
  public parseSentences(text: string): string[] {
    if (!text) return [];
    // Split by danda (।), full stop (.), exclamation mark (!), or question mark (?)
    const raw = text
      .split(/(?<=[।\.!\?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return raw.length > 0 ? raw : [text];
  }

  /**
   * Play Gemini TTS WAV Audio (Base64) or fallback to Web Speech
   */
  public async playVoiceNote(
    text: string,
    lang: LanguageCode | string,
    base64WavAudio?: string | null
  ): Promise<void> {
    this.stop();

    this.sentences = this.parseSentences(text);
    this.state.totalSentences = this.sentences.length;
    this.state.currentSentenceIndex = 0;
    this.state.rate = 1.0;

    // Try playing Gemini TTS audio if available
    if (base64WavAudio) {
      try {
        const audioSrc = `data:audio/wav;base64,${base64WavAudio}`;
        const audio = new Audio(audioSrc);
        audio.playbackRate = this.state.rate;
        this.currentAudio = audio;

        audio.onplay = () => {
          this.state.isPlaying = true;
          this.state.isPaused = false;
          this.state.activeSource = 'gemini';
          this.notify();

          // Approximate sentence progression during audio playback
          const estimatedDuration = audio.duration || Math.max(8, this.sentences.length * 3.5);
          const perSentence = Math.max(2, (estimatedDuration / Math.max(1, this.sentences.length)) * 1000);
          this.sentenceInterval = setInterval(() => {
            if (this.state.isPlaying && !this.state.isPaused) {
              if (this.state.currentSentenceIndex < this.sentences.length - 1) {
                this.state.currentSentenceIndex += 1;
                this.notify();
              }
            }
          }, perSentence);
        };

        audio.onended = () => {
          this.stop();
        };

        audio.onerror = () => {
          console.warn('Gemini audio playback error, falling back to Web Speech synthesis');
          this.playWithBrowserSpeech(text, lang);
        };

        await audio.play();
        return;
      } catch (err) {
        console.warn('Failed to play Gemini audio element, falling back:', err);
      }
    }

    // Fallback: Web Speech API
    this.playWithBrowserSpeech(text, lang);
  }

  /**
   * Speak with browser Web Speech API (speechSynthesis)
   */
  public playWithBrowserSpeech(text: string, lang: LanguageCode | string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser environment');
      return;
    }

    this.stop();
    window.speechSynthesis.cancel();

    this.sentences = this.parseSentences(text);
    this.state.totalSentences = this.sentences.length;
    this.state.currentSentenceIndex = 0;
    this.state.activeSource = 'browser';

    const langInfo = getLanguageInfo(lang);
    const targetLocale = langInfo?.speechLocale || 'hi-IN';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLocale;
    utterance.rate = this.state.rate;
    utterance.pitch = 1.0;

    // Pick best matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(
      (v) =>
        v.lang === targetLocale ||
        v.lang.toLowerCase().startsWith(targetLocale.slice(0, 2).toLowerCase())
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      this.state.isPlaying = true;
      this.state.isPaused = false;
      this.notify();

      // Estimate sentence highlighting
      const perSentence = Math.max(2500, (text.length / Math.max(1, this.sentences.length)) * 60);
      this.sentenceInterval = setInterval(() => {
        if (this.state.isPlaying && !this.state.isPaused) {
          if (this.state.currentSentenceIndex < this.sentences.length - 1) {
            this.state.currentSentenceIndex += 1;
            this.notify();
          }
        }
      }, perSentence);
    };

    utterance.onend = () => {
      this.stop();
    };

    utterance.onerror = () => {
      this.stop();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Speak a short UI label or instruction on user tap
   */
  public speakPrompt(text: string, lang: LanguageCode | string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const langInfo = getLanguageInfo(lang);
    const targetLocale = langInfo?.speechLocale || 'hi-IN';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLocale;
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(
      (v) =>
        v.lang === targetLocale ||
        v.lang.toLowerCase().startsWith(targetLocale.slice(0, 2).toLowerCase())
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}

export const speechService = new SpeechService();
