// Word pronunciation with the browser's built-in speech synthesis.
// Privacy: only on-device voices (localService) are used, so word text is
// never sent to a remote speech service. Without a matching local voice the
// control stays hidden instead of guessing another accent.
import { languageCode } from './word-records.js';

export const SPEECH_TAGS = Object.freeze({
  en: 'en-US',
  es: 'es-ES',
  tr: 'tr-TR',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-PT',
  ru: 'ru-RU',
  az: 'az-AZ',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
  ar: 'ar-SA',
});

/** BCP 47 speech tag for a galaxy's free-text language, or null. */
export function speechTag(language) {
  return SPEECH_TAGS[languageCode(language)] || null;
}

/** Best local voice for a tag: exact region first, then the same language, default voices preferred. */
export function pickVoice(voices, tag) {
  if (!tag) return null;
  const base = tag.split('-')[0].toLowerCase();
  const local = (voices || []).filter((voice) => voice?.localService && typeof voice.lang === 'string');
  const normalized = (voice) => voice.lang.replace('_', '-').toLowerCase();
  const exact = local.filter((voice) => normalized(voice) === tag.toLowerCase());
  const sameLanguage = local.filter((voice) => normalized(voice).split('-')[0] === base);
  const pool = exact.length ? exact : sameLanguage;
  return pool.find((voice) => voice.default) || pool[0] || null;
}

export function createPronouncer({
  synth = globalThis.speechSynthesis,
  Utterance = globalThis.SpeechSynthesisUtterance,
  onVoicesChanged,
} = {}) {
  const supported = Boolean(synth && typeof synth.speak === 'function' && typeof Utterance === 'function');
  let voices = supported ? synth.getVoices?.() || [] : [];
  if (supported && typeof synth.addEventListener === 'function')
    synth.addEventListener('voiceschanged', () => {
      voices = synth.getVoices?.() || [];
      onVoicesChanged?.();
    });
  return {
    supported,
    /** Whether a local voice can read words of this galaxy language. */
    canSpeak: (language) => supported && Boolean(pickVoice(voices, speechTag(language))),
    /** Speak text; returns false when no local voice matches. */
    speak(text, language, { rate = 0.9 } = {}) {
      const tag = speechTag(language);
      const voice = supported ? pickVoice(voices, tag) : null;
      const value = String(text ?? '').trim();
      if (!voice || !value) return false;
      synth.cancel();
      const utterance = new Utterance(value.slice(0, 300));
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = rate;
      synth.speak(utterance);
      return true;
    },
    cancel() {
      if (supported) synth.cancel();
    },
  };
}
