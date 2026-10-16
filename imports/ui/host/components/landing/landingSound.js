// The landing page's sound, all generated live with Web Audio (no files).
//
// Background: deep "brown" static that breathes, soft crackle, a slow moaning
// band, muffled interference swells every 7-16 s, 50 Hz mains hum and a low
// drone. Effects: key, error, ok, shutter, unlock, beep, flicker, presence.
//
// Off by default, and browsers only let it start from a user gesture. The
// page calls dispose() on unmount, which stops everything and closes the
// AudioContext; the next toggle() builds a fresh one.

const PREF_KEY = 'escapesnap.landingSound';

let ctx = null;
let master = null;
let on = false;
let noiseBuf = null;
let brownBuf = null;
let bed = null;

function onVisibility() {
  if (!ctx) return;
  if (document.hidden) ctx.suspend();
  else if (on) ctx.resume();
}

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    const n = ctx.sampleRate * 3;
    noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
    brownBuf = ctx.createBuffer(1, n, ctx.sampleRate);
    const w = noiseBuf.getChannelData(0);
    const br = brownBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      w[i] = Math.random() * 2 - 1;
      last = (last + 0.02 * w[i]) / 1.02;
      br[i] = last * 3.5;
    }
    document.addEventListener('visibilitychange', onVisibility);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

const filt = (type, f, q) => {
  const b = ctx.createBiquadFilter();
  b.type = type;
  b.frequency.value = f;
  if (q) b.Q.value = q;
  return b;
};
const amp = (v) => {
  const g = ctx.createGain();
  g.gain.value = v;
  return g;
};
const osc = (type, f) => {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = f;
  return o;
};
const loop = (buf) => {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  return s;
};
const chain = (...nodes) => {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
  return nodes[0];
};

// One crackle: a soft, muffled pop.
function click(when, dest, v) {
  const s = ctx.createBufferSource();
  const g = ctx.createGain();
  const d = 0.008 + Math.random() * 0.025;
  s.buffer = noiseBuf;
  g.gain.setValueAtTime(v ?? 0.03 + Math.random() * 0.07, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + d);
  chain(s, filt('lowpass', 700 + Math.random() * 900), g, dest);
  s.start(when, Math.random() * 2.5);
  s.stop(when + d + 0.01);
}

// Interference: a slow, muffled swell of static that wavers like a bad signal.
function burst(dest, dur = 1.5, peak = 0.1, lo = 120, hi = 900) {
  const t = ctx.currentTime;
  const s = loop(brownBuf);
  const bp = filt('bandpass', lo, 0.9);
  const g = ctx.createGain();
  const chop = amp(0.7);
  const a = lo * (1 + Math.random() * 0.5);
  const b = hi * (0.6 + Math.random() * 0.4);
  const up = Math.random() < 0.5;
  bp.frequency.setValueAtTime(up ? a : b, t);
  bp.frequency.exponentialRampToValueAtTime(up ? b : a, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.3);
  g.gain.setValueAtTime(peak, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const lfo = osc('triangle', 3 + Math.random() * 6);
  chain(lfo, amp(0.3), chop.gain);
  chain(s, bp, chop, g, dest);
  s.start(t, Math.random() * 2);
  lfo.start(t);
  s.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
  for (let i = 0; i < 3; i++) {
    click(t + Math.random() * dur, dest, 0.05 + Math.random() * 0.06);
  }
}

function startBed() {
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(1, t + 3);
  out.connect(master);
  const srcs = [];

  // 1) rumble: deep static that slowly breathes in and out
  const rumble = loop(brownBuf);
  const rumbleG = amp(0.22);
  chain(rumble, filt('highpass', 45), filt('lowpass', 520), rumbleG, out);
  srcs.push(rumble);

  // 2) the drift: a low band of noise moaning slowly up and down
  const drift = loop(brownBuf);
  const bp = filt('bandpass', 260, 2.5);
  const driftLfo = osc('sine', 0.04);
  chain(driftLfo, amp(140), bp.frequency);
  chain(drift, bp, amp(0.3), out);
  srcs.push(drift, driftLfo);

  // 3) mains hum, like old CCTV kit and fluorescent tubes
  const hum = osc('sawtooth', 50);
  const hum2 = osc('sine', 100);
  chain(hum, filt('lowpass', 200), amp(0.022), out);
  chain(hum2, amp(0.01), out);
  srcs.push(hum, hum2);

  // 4) the low drone underneath, for tension
  const lp = filt('lowpass', 140, 7);
  const d1 = osc('sawtooth', 48);
  const d2 = osc('sawtooth', 48.6);
  const dl = osc('sine', 0.07);
  d1.connect(lp);
  d2.connect(lp);
  chain(dl, amp(60), lp.frequency);
  chain(lp, amp(0.04), out);
  srcs.push(d1, d2, dl);

  srcs.forEach((node) => node.start(t));

  const timers = [
    setInterval(
      () =>
        rumbleG.gain.setTargetAtTime(
          0.14 + Math.random() * 0.14,
          ctx.currentTime,
          0.6
        ),
      900
    ),
    setInterval(() => {
      if (Math.random() < 0.5) {
        click(ctx.currentTime + 0.05 + Math.random() * 0.3, out);
      }
    }, 350),
  ];
  let burstT;
  const nextBurst = () => {
    burstT = setTimeout(
      () => {
        if (on && !document.hidden) {
          burst(out, 1.2 + Math.random() * 1.6, 0.08 + Math.random() * 0.06);
        }
        nextBurst();
      },
      7000 + Math.random() * 9000
    );
  };
  nextBurst();
  bed = {
    out,
    srcs,
    stopTimers: () => {
      timers.forEach(clearInterval);
      clearTimeout(burstT);
    },
  };
}

function stopBed() {
  if (!bed) return;
  const t = ctx.currentTime;
  const b = bed;
  bed = null;
  b.stopTimers();
  b.out.gain.cancelScheduledValues(t);
  b.out.gain.setValueAtTime(b.out.gain.value, t);
  b.out.gain.linearRampToValueAtTime(0, t + 0.4);
  b.srcs.forEach((node) => node.stop(t + 0.5));
}

function tone(f, d = 0.08, type = 'sine', v = 0.1, when = 0, to = null) {
  if (!on) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + d + 0.03);
}

function noise(d = 0.05, v = 0.2, hp = 1000, when = 0) {
  if (!on) return;
  const t = ctx.currentTime + when;
  const s = ctx.createBufferSource();
  const g = ctx.createGain();
  s.buffer = noiseBuf;
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  chain(s, filt('highpass', hp), g, master);
  s.start(t, Math.random());
  s.stop(t + d + 0.03);
}

export const sound = {
  isOn: () => on,

  // Whether the viewer had sound on last time. It still needs a gesture to
  // start again.
  remembered() {
    try {
      return window.localStorage.getItem(PREF_KEY) === '1';
    } catch {
      return false;
    }
  },

  toggle() {
    if (!ensure()) return false;
    on = !on;
    if (on) startBed();
    else stopBed();
    try {
      window.localStorage.setItem(PREF_KEY, on ? '1' : '0');
    } catch {
      // Storage blocked: the choice just isn't remembered.
    }
    return on;
  },

  dispose() {
    document.removeEventListener('visibilitychange', onVisibility);
    if (bed) bed.stopTimers();
    if (ctx) ctx.close().catch(() => {});
    ctx = null;
    master = null;
    noiseBuf = null;
    brownBuf = null;
    bed = null;
    on = false;
  },

  key: () => tone(1350, 0.06, 'square', 0.035),
  error: () => {
    tone(110, 0.3, 'square', 0.07);
    tone(104, 0.3, 'square', 0.05, 0.03);
  },
  ok: () => {
    tone(880, 0.09, 'sine', 0.1);
    tone(1320, 0.16, 'sine', 0.1, 0.1);
  },
  shutter: () => {
    noise(0.05, 0.35, 1800);
    noise(0.07, 0.22, 1200, 0.07);
  },
  unlock: () => {
    tone(170, 0.28, 'sine', 0.25, 0, 55);
    noise(0.12, 0.3, 400);
    tone(880, 0.18, 'triangle', 0.05, 0.2);
  },
  beep: () => tone(1046, 0.07, 'sine', 0.06),
  // The lights cut out: a hard crash of static.
  flicker: () => {
    if (on) burst(master, 0.6, 0.2, 150, 1400);
  },
  // Something moves in the dark: a low swell of static.
  presence: () => {
    if (on) burst(master, 2.6, 0.16, 60, 320);
  },
};
