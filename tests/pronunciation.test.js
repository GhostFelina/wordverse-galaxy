import { describe, expect, it, vi } from 'vitest';
import { createPronouncer, pickVoice, speechTag } from '../src/pronunciation.js';

const voice = (lang, localService = true, isDefault = false, name = lang) => ({
  lang,
  localService,
  default: isDefault,
  name,
});

describe('voice selection', () => {
  it('maps galaxy languages to speech tags', () => {
    expect(speechTag('İngilizce')).toBe('en-US');
    expect(speechTag('Español')).toBe('es-ES');
    expect(speechTag('Klingon')).toBeNull();
  });

  it('prefers an exact local voice, then the same language, never a remote one', () => {
    const voices = [voice('en-GB'), voice('en-US', false), voice('es-MX', true, true), voice('es-ES'), voice('es_US')];
    expect(pickVoice(voices, 'en-US').lang).toBe('en-GB');
    expect(pickVoice(voices, 'es-ES').lang).toBe('es-ES');
    expect(pickVoice([voice('es-MX'), voice('es-AR', true, true)], 'es-ES').lang).toBe('es-AR');
    expect(pickVoice([voice('fr-FR', false)], 'fr-FR')).toBeNull();
    expect(pickVoice(voices, null)).toBeNull();
  });
});

function fakeSynth(voices) {
  const listeners = {};
  return {
    voices,
    spoken: [],
    getVoices() {
      return this.voices;
    },
    speak(utterance) {
      this.spoken.push(utterance);
    },
    cancel: vi.fn(),
    addEventListener: (name, fn) => {
      listeners[name] = fn;
    },
    fire: (name) => listeners[name]?.(),
  };
}
class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

describe('pronouncer', () => {
  it('speaks with a matching local voice and refuses otherwise', () => {
    const synth = fakeSynth([voice('en-US')]);
    const pronouncer = createPronouncer({ synth, Utterance: FakeUtterance });
    expect(pronouncer.canSpeak('English')).toBe(true);
    expect(pronouncer.canSpeak('Spanish')).toBe(false);
    expect(pronouncer.speak('  serendipity ', 'English')).toBe(true);
    expect(synth.spoken[0]).toMatchObject({ text: 'serendipity', lang: 'en-US', rate: 0.9 });
    expect(synth.cancel).toHaveBeenCalled();
    expect(pronouncer.speak('hola', 'Spanish')).toBe(false);
    expect(pronouncer.speak('   ', 'English')).toBe(false);
  });

  it('picks up voices that load later', () => {
    const synth = fakeSynth([]);
    const changed = vi.fn();
    const pronouncer = createPronouncer({ synth, Utterance: FakeUtterance, onVoicesChanged: changed });
    expect(pronouncer.canSpeak('Türkçe')).toBe(false);
    synth.voices = [voice('tr-TR')];
    synth.fire('voiceschanged');
    expect(changed).toHaveBeenCalled();
    expect(pronouncer.canSpeak('Türkçe')).toBe(true);
  });

  it('is inert without speech synthesis', () => {
    const pronouncer = createPronouncer({ synth: undefined, Utterance: undefined });
    expect(pronouncer.supported).toBe(false);
    expect(pronouncer.canSpeak('English')).toBe(false);
    expect(pronouncer.speak('word', 'English')).toBe(false);
    expect(() => pronouncer.cancel()).not.toThrow();
  });
});
