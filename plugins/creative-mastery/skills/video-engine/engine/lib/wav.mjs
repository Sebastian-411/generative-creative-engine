// WAV PCM 16-bit: lectura/escritura mínima para el audio que genera el propio motor.
import fs from 'node:fs';

export const SR = 48000;

export function writeWav(file, channels, sr = SR) {
  const n = channels[0].length;
  const ch = channels.length;
  const buf = Buffer.alloc(44 + n * ch * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * ch * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(ch, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * ch * 2, 28); buf.writeUInt16LE(ch * 2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * ch * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
    const v = Math.max(-1, Math.min(1, channels[c][i]));
    buf.writeInt16LE(Math.round(v * 32767), o); o += 2;
  }
  fs.writeFileSync(file, buf);
}

export function readWav(file) {
  const buf = fs.readFileSync(file);
  if (buf.toString('ascii', 0, 4) !== 'RIFF') throw new Error(`${file} no es WAV`);
  let o = 12, fmt = null;
  while (o < buf.length - 8) {
    const id = buf.toString('ascii', o, o + 4);
    const size = buf.readUInt32LE(o + 4);
    if (id === 'fmt ') fmt = { format: buf.readUInt16LE(o + 8), ch: buf.readUInt16LE(o + 10), sr: buf.readUInt32LE(o + 12), bits: buf.readUInt16LE(o + 22) };
    if (id === 'data') {
      if (!fmt || fmt.format !== 1 || fmt.bits !== 16) throw new Error(`${file}: solo PCM 16-bit`);
      const n = Math.floor(Math.min(size, buf.length - o - 8) / (2 * fmt.ch));
      const chans = Array.from({ length: fmt.ch }, () => new Float32Array(n));
      let p = o + 8;
      for (let i = 0; i < n; i++) for (let c = 0; c < fmt.ch; c++) { chans[c][i] = buf.readInt16LE(p) / 32768; p += 2; }
      return { sr: fmt.sr, channels: chans };
    }
    o += 8 + size + (size % 2);
  }
  throw new Error(`${file}: WAV sin datos`);
}

export const dbToGain = (db) => Math.pow(10, db / 20);
