// Sound effects via Web Audio API — 8 synthesized fart sounds + water + achievement.
// All synthesized at runtime — no audio files, zero weight.

import type { FartSound } from "./store";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Tone helper: create a simple oscillator note. */
function tone(
  c: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = "sawtooth",
  peakGain = 0.3
) {
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

// ===== 8 fart sound variants =====

function soundClassic(c: AudioContext) {
  const now = c.currentTime;
  const duration = 0.25;
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180 + Math.random() * 60, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + duration);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + duration);
  filter.Q.value = 6;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
  for (let i = 0; i < 4; i++) {
    const t = now + 0.03 + i * 0.05;
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.04);
  }
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function soundSqueaker(c: AudioContext) {
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(1800, now + 0.15);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  for (let i = 0; i < 6; i++) {
    const t = now + 0.02 + i * 0.04;
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.02);
  }
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.34);
}

function soundRumble(c: AudioContext) {
  const now = c.currentTime;
  const duration = 0.6;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(80, now);
  osc.frequency.linearRampToValueAtTime(50, now + duration);
  const osc2 = c.createOscillator();
  osc2.type = "sawtooth";
  osc2.frequency.setValueAtTime(40, now);
  osc2.frequency.linearRampToValueAtTime(35, now + duration);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 200;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.45, now + 0.05);
  // wobble
  for (let i = 0; i < 8; i++) {
    const t = now + 0.05 + i * 0.07;
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.035);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.07);
  }
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc2.start(now);
  osc.stop(now + duration + 0.05);
  osc2.stop(now + duration + 0.05);
}

function soundMachineGun(c: AudioContext) {
  const now = c.currentTime;
  // 6-8 short bursts
  const count = 7;
  for (let i = 0; i < count; i++) {
    const t = now + i * 0.08;
    tone(c, 200 + Math.random() * 100, t, 0.05, "sawtooth", 0.3);
  }
}

function soundWhoopee(c: AudioContext) {
  const now = c.currentTime;
  const duration = 0.4;
  // long descending flute-like sound (the classic cushion fart)
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + duration);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(600, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + duration);
  filter.Q.value = 8;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.3, now + 0.03);
  // flutter
  for (let i = 0; i < 10; i++) {
    const t = now + 0.03 + i * 0.035;
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.018);
  }
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function soundThunder(c: AudioContext) {
  const now = c.currentTime;
  const duration = 0.8;
  // low rumble with noise burst
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(60, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + duration);
  // noise
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 150;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.5, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  noise.connect(noiseFilter);
  noiseFilter.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  noise.start(now);
  osc.stop(now + duration + 0.05);
  noise.stop(now + duration + 0.05);
}

function soundSqueak(c: AudioContext) {
  const now = c.currentTime;
  // very short high-pitched squeak
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(2400, now);
  osc.frequency.exponentialRampToValueAtTime(3000, now + 0.05);
  osc.frequency.exponentialRampToValueAtTime(1800, now + 0.15);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.18);
}

function soundDeflate(c: AudioContext) {
  const now = c.currentTime;
  const duration = 0.7;
  // long descending airy sound (balloon deflate)
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(500, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + duration);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + duration);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.05);
  gain.gain.linearRampToValueAtTime(0.22, now + duration - 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

// ===== 5 NEW fart sound variants (whisper, burst, musical, wave, frog) =====

function soundWhisper(c: AudioContext) {
  const now = c.currentTime;
  const duration = 0.35;
  // Very quiet, filtered noise — like "shhhh"
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2500, now);
  filter.frequency.exponentialRampToValueAtTime(1500, now + duration);
  filter.Q.value = 1;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
  gain.gain.linearRampToValueAtTime(0.08, now + duration - 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  noise.start(now);
  noise.stop(now + duration + 0.02);
}

function soundBurst(c: AudioContext) {
  const now = c.currentTime;
  // Single sharp explosive burst
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);
  // Noise burst on top
  const bufferSize = c.sampleRate * 0.1;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 800;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.5, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  osc.connect(filter);
  filter.connect(gain);
  noise.connect(noiseFilter);
  noiseFilter.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  noise.start(now);
  osc.stop(now + 0.17);
  noise.stop(now + 0.17);
}

function soundMusical(c: AudioContext) {
  const now = c.currentTime;
  // Three ascending notes — like a tiny melody
  const notes = [220, 277, 330, 415];
  notes.forEach((freq, i) => {
    const start = now + i * 0.08;
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, start + 0.1);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.14);
  });
}

function soundWave(c: AudioContext) {
  const now = c.currentTime;
  const duration = 0.7;
  // Modulated sine wave — gets louder and quieter in waves
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, now);
  // LFO for amplitude modulation
  const lfo = c.createOscillator();
  lfo.frequency.setValueAtTime(8, now);
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.15;
  const baseGain = c.createGain();
  baseGain.gain.value = 0.2;
  lfo.connect(lfoGain);
  lfoGain.connect(baseGain.gain);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 600;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(1, now + 0.05);
  env.gain.linearRampToValueAtTime(1, now + duration - 0.1);
  env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(filter);
  filter.connect(baseGain);
  baseGain.connect(env);
  env.connect(c.destination);
  osc.start(now);
  lfo.start(now);
  osc.stop(now + duration + 0.02);
  lfo.stop(now + duration + 0.02);
}

function soundFrog(c: AudioContext) {
  const now = c.currentTime;
  // 4 short "ribbit" bursts
  for (let i = 0; i < 4; i++) {
    const start = now + i * 0.12;
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, start);
    osc.frequency.exponentialRampToValueAtTime(400, start + 0.04);
    osc.frequency.exponentialRampToValueAtTime(150, start + 0.08);
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 8;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.1);
  }
}

const SOUND_MAP: Record<Exclude<FartSound, "random">, (c: AudioContext) => void> = {
  classic: soundClassic,
  squeaker: soundSqueaker,
  rumble: soundRumble,
  machine_gun: soundMachineGun,
  whoopee: soundWhoopee,
  thunder: soundThunder,
  squeak: soundSqueak,
  deflate: soundDeflate,
  whisper: soundWhisper,
  burst: soundBurst,
  musical: soundMusical,
  wave: soundWave,
  frog: soundFrog,
};

const SOUND_KEYS = Object.keys(SOUND_MAP) as (keyof typeof SOUND_MAP)[];

/** Play the configured fart sound. */
export function playFartSound(sound: FartSound = "classic"): void {
  const c = getCtx();
  if (!c) return;
  const key = sound === "random" ? SOUND_KEYS[Math.floor(Math.random() * SOUND_KEYS.length)] : sound;
  const fn = SOUND_MAP[key];
  if (fn) fn(c);
}

/** Soft "water drop" sound for the water counter. */
export function playWaterSound(): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.22);
}

/** Short "achievement unlocked" fanfare (3 ascending notes). */
export function playAchievementSound(): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    const start = now + i * 0.1;
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.2);
  });
}

/** Initialize the audio context on first user gesture (mobile autoplay policy). */
export function primeAudio(): void {
  getCtx();
}
