// Sound effects via Web Audio API — no audio files needed, all synthesized.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

/** Play a short "fart-like" synthesized blip. */
export function playFartSound(): void {
  const c = getCtx();
  if (!c) return;

  const now = c.currentTime;
  // duration ~250ms
  const duration = 0.25;

  // A sawtooth oscillator with frequency sweep — gives a "raspberry" feel.
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  const startFreq = 180 + Math.random() * 60;
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + duration);

  // Lowpass filter to muffle it
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + duration);
  filter.Q.value = 6;

  // Gain envelope with a bit of vibrato-like wobble
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
  // wobble
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
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
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
