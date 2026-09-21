// Feature detection for the two Web Speech APIs the voice agent depends on.
// Neither has a single canonical global: SpeechRecognition still ships only
// under the vendor-prefixed `webkitSpeechRecognition` in Chrome/Edge/Safari,
// and Firefox currently ships neither. Centralizing the detection here means
// the component just asks "what's available?" once and adapts, rather than
// sprinkling `window.webkitSpeechRecognition` checks through the UI.
export function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

// speechSynthesis exists without SpeechSynthesisUtterance in a couple of old
// embedded WebViews — require both so `speak()` never has a working
// dispatcher but nothing to construct an utterance with.
export function getSpeechSynthesisApi() {
  if (typeof window === 'undefined') return null
  if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') return null
  return window.speechSynthesis
}

export function getSpeechSupport() {
  const RecognitionCtor = getSpeechRecognitionCtor()
  const synth = getSpeechSynthesisApi()
  return {
    RecognitionCtor,
    synth,
    canListen: Boolean(RecognitionCtor),
    canSpeak: Boolean(synth),
  }
}
