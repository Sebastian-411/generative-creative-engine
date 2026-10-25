// Motor en la nube: Gemini TTS (nivel gratuito de la API de Google AI Studio).
// La dirección de actuación va en lenguaje natural; admite etiquetas en línea como <sigh>, <whispers>, <long pause>.
// Llave: variable GEMINI_API_KEY o "geminiApiKey" en ~/.generative-creative-engine/voice-config.json.
// Ojo: en el nivel gratuito Google puede usar el contenido para mejorar sus productos; hay límite diario de pedidos.
import { readConfig } from './voice-direction.mjs';

export async function geminiTTS({ text, style, voice = 'Charon', model }) {
  const cfg = readConfig();
  const key = process.env.GEMINI_API_KEY || cfg.geminiApiKey;
  if (!key) throw new Error('Falta la llave de Gemini: créala gratis en https://aistudio.google.com/apikey y guárdala con: node voices.mjs config --gemini-key <llave>');
  const mdl = model || cfg.geminiModel || 'gemini-3.8-flash-tts';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${key}`;
  const body = {
    contents: [{ parts: [{ text: `${style}\n\nTEXT:\n${text}` }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice || 'Charon' } } } },
  };
  let res, data;
  for (let attempt = 0; attempt < 4; attempt++) {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    data = await res.json().catch(() => ({}));
    if (res.ok) break;
    if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 4000 * (attempt + 1))); continue; }
    break;
  }
  if (!res.ok) throw new Error(`Gemini TTS ${res.status}: ${JSON.stringify(data.error || data).slice(0, 400)}${res.status === 429 ? ' (límite diario del nivel gratis)' : ''}`);
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error('Gemini no devolvió audio (a veces pasa al pedir acentos en el estilo; reintenta o quita el acento del estilo).');
  const buf = Buffer.from(part.inlineData.data, 'base64');
  const pcm = new Float32Array(buf.length / 2);
  for (let i = 0; i < pcm.length; i++) pcm[i] = buf.readInt16LE(i * 2) / 32768;
  return pcm; // PCM mono 24 kHz
}
