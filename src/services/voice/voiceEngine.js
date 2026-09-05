/**
 * COOP HUB Centralized Voice Engine
 * 
 * Centralizes Speech-to-Text (STT) and Text-to-Speech (TTS)
 * across Customer, Pillar, Admin, Super Admin, and Mobile.
 * 
 * Uses Web Speech API (SpeechRecognition & SpeechSynthesis)
 * with robust language locale mapping and capability detection.
 * 
 * Note on Speech Datasets (Vaani / IndicVoices):
 * Vaani and IndicVoices are research/evaluation speech corpora,
 * not browser runtime TTS engines. We use client-native Web Speech API
 * with honest capability status flags for every language.
 */

import { LANGUAGES_MAP, getLanguageMetadata } from "../../i18n/languages.js";

// Voice capability status constants
export const VOICE_STATUS = {
  SUPPORTED: "SUPPORTED",
  UNSUPPORTED: "UNSUPPORTED",
  NOT_CONFIGURED: "NOT_CONFIGURED",
  LISTENING: "LISTENING",
  SPEAKING: "SPEAKING",
  IDLE: "IDLE",
  ERROR: "ERROR"
};

class VoiceEngine {
  constructor() {
    this.status = VOICE_STATUS.IDLE;
    this.currentLanguage = "en";
    this.recognition = null;
    this.synthesis = typeof window !== "undefined" ? window.speechSynthesis : null;
    this.isListening = false;
    this.activeUtterance = null;
    this.subscribers = new Set();

    this.initRecognition();
  }

  /**
   * Subscribe to voice state events
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(event) {
    this.subscribers.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error("[VoiceEngine] Subscriber error:", err);
      }
    });
  }

  /**
   * Initialize browser SpeechRecognition
   */
  initRecognition() {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  /**
   * Check if STT and TTS are supported for given language code
   */
  checkCapability(langCode) {
    const meta = getLanguageMetadata(langCode);
    const hasSTT = Boolean(this.recognition);
    const hasTTS = Boolean(this.synthesis);

    const isLangVoiceReady = Boolean(meta && meta.VOICE_SUPPORTED);

    return {
      langCode: meta.code,
      bcp47: meta.bcp47,
      voiceSupported: isLangVoiceReady,
      sttAvailable: hasSTT && isLangVoiceReady,
      ttsAvailable: hasTTS && isLangVoiceReady,
      overallStatus: isLangVoiceReady ? VOICE_STATUS.SUPPORTED : VOICE_STATUS.UNSUPPORTED
    };
  }

  /**
   * Synchronize selected language
   */
  setLanguage(langCode) {
    this.currentLanguage = langCode || "en";
    if (this.recognition) {
      const meta = getLanguageMetadata(this.currentLanguage);
      this.recognition.lang = meta.bcp47 || "en-IN";
    }
  }

  /**
   * Text to Speech (TTS)
   */
  speak(text, langCode = this.currentLanguage, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        return reject(new Error("Text-to-Speech synthesis is not supported on this platform"));
      }

      if (!text || typeof text !== "string" || !text.trim()) {
        return resolve();
      }

      // Stop any active utterance
      this.stopSpeaking();

      const meta = getLanguageMetadata(langCode);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = meta.bcp47 || "en-IN";
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      // Match available browser voice if found
      const voices = this.synthesis.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang === utterance.lang || v.lang.startsWith(meta.code)
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        this.status = VOICE_STATUS.SPEAKING;
        this.notify({ type: "SPEAK_START", text, lang: meta.code });
      };

      utterance.onend = () => {
        this.status = VOICE_STATUS.IDLE;
        this.activeUtterance = null;
        this.notify({ type: "SPEAK_END", text, lang: meta.code });
        resolve();
      };

      utterance.onerror = (event) => {
        this.status = VOICE_STATUS.ERROR;
        this.activeUtterance = null;
        this.notify({ type: "SPEAK_ERROR", error: event.error });
        // Don't throw fatal error if speech was just cancelled
        if (event.error === "canceled" || event.error === "interrupted") {
          resolve();
        } else {
          reject(new Error(`TTS Error: ${event.error}`));
        }
      };

      this.activeUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking() {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    this.status = VOICE_STATUS.IDLE;
  }

  /**
   * Speech to Text (STT)
   */
  listen({ langCode = this.currentLanguage, onInterim, onResult, onError } = {}) {
    if (!this.recognition) {
      const err = new Error("Speech recognition is not supported in this browser");
      if (onError) onError(err);
      return () => {};
    }

    if (this.isListening) {
      this.stopListening();
    }

    const meta = getLanguageMetadata(langCode);
    this.recognition.lang = meta.bcp47 || "en-IN";

    this.recognition.onstart = () => {
      this.isListening = true;
      this.status = VOICE_STATUS.LISTENING;
      this.notify({ type: "LISTEN_START", lang: meta.code });
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (interimTranscript && onInterim) {
        onInterim(interimTranscript);
      }

      if (finalTranscript) {
        this.notify({ type: "LISTEN_RESULT", transcript: finalTranscript, lang: meta.code });
        if (onResult) onResult(finalTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      this.status = VOICE_STATUS.ERROR;
      this.notify({ type: "LISTEN_ERROR", error: event.error });
      if (onError) onError(event);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.status = VOICE_STATUS.IDLE;
      this.notify({ type: "LISTEN_END", lang: meta.code });
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn("[VoiceEngine] Recognition start error:", err.message);
    }

    return () => this.stopListening();
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        // ignore
      }
    }
    this.isListening = false;
    this.status = VOICE_STATUS.IDLE;
  }
}

export const voiceEngine = new VoiceEngine();
export default voiceEngine;
