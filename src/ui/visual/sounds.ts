let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.08) {
  const ac = ctx();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

export function playCardSound() {
  tone(520, 0.08, 'triangle', 0.06);
}

export function playActionSound() {
  tone(380, 0.1, 'square', 0.05);
}

export function playCoinSound() {
  tone(880, 0.06, 'sine', 0.05);
  setTimeout(() => tone(1100, 0.05, 'sine', 0.04), 40);
}

export function playVpSound() {
  tone(660, 0.12, 'triangle', 0.07);
  setTimeout(() => tone(880, 0.1, 'triangle', 0.06), 80);
}

export function playEraSound() {
  tone(220, 0.25, 'sawtooth', 0.04);
  setTimeout(() => tone(330, 0.3, 'sawtooth', 0.04), 120);
}

export function vibrateTap() {
  try {
    navigator.vibrate?.(12);
  } catch {
    /* ignore */
  }
}
