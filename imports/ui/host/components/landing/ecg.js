import { sound } from './landingSound';

const BEAT = [{ transform: 'scale(1.55)' }, { transform: 'scale(1)' }];

// One bedside monitor drawing a live ECG trace on its <canvas>. Plain JS: the
// vitals section's effect creates these, drives step()/draw() from the shared
// frame loop, and calls destroy() on unmount.
//
// `fig` is the monitor's <figure>, carrying data-bpm and data-mode
// (easy | medium | hard). With `reduce` set it draws one static trace.
export class Ecg {
  constructor(fig, reduce) {
    this.fig = fig;
    this.reduce = reduce;
    this.c = fig.querySelector('canvas');
    this.ctx = this.c.getContext('2d');
    this.bpm = Number(fig.dataset.bpm);
    this.mode = fig.dataset.mode;
    this.readout = fig.querySelector('.lp-bpm');
    this.heart = fig.querySelector('.lp-heart');
    this.readout.textContent = this.bpm;
    this.speed = 110;
    this.kind = 'n';
    this.amp = 1;
    this.wander = 0;
    this.acc = 0;
    this.hover = false;
    this.beatT = Math.random() * 0.4;
    this.beatLen = this.nextLen();
    this.enter = () => {
      this.hover = true;
    };
    this.leave = () => {
      this.hover = false;
    };
    fig.addEventListener('pointerenter', this.enter);
    fig.addEventListener('pointerleave', this.leave);
    this.resize();
  }

  destroy() {
    this.fig.removeEventListener('pointerenter', this.enter);
    this.fig.removeEventListener('pointerleave', this.leave);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.c.clientWidth;
    const h = this.c.clientHeight;
    if (!w || !h || !this.ctx) return;
    this.c.width = Math.round(w * dpr);
    this.c.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w;
    this.h = h;
    this.buf = new Float32Array(Math.ceil(w)).fill(NaN);
    this.x = 0;
    this.color =
      getComputedStyle(this.fig).getPropertyValue('--trace').trim() || '#fff';
    if (this.reduce) {
      this.step(w / this.speed);
      this.draw();
    }
  }

  // Seconds until the next beat. Hard mode skips and doubles up.
  nextLen() {
    const base = 60 / this.bpm;
    const r = Math.random();
    this.kind = 'n';
    if (this.mode === 'easy') return base * (1 + (r - 0.5) * 0.04);
    if (this.mode === 'medium') return base * (1 + (r - 0.5) * 0.12);
    if (r < 0.14) {
      this.kind = 'pvc';
      return base * 0.62;
    }
    if (r < 0.22) return base * 1.75;
    return base * (1 + (Math.random() - 0.5) * 0.38);
  }

  // The PQRST shape, as a sum of gaussians over the time since the beat.
  wave(s) {
    const g = (c, w, a) => a * Math.exp(-(((s - c) / w) ** 2));
    if (this.kind === 'pvc') {
      return g(0.1, 0.05, -0.45) + g(0.18, 0.035, 1.15) + g(0.36, 0.06, -0.4);
    }
    return (
      g(0.06, 0.022, 0.12) +
      g(0.135, 0.009, -0.12) +
      g(0.16, 0.011, this.amp) +
      g(0.185, 0.011, -0.3) +
      g(0.34, 0.045, 0.28)
    );
  }

  onBeat() {
    this.readout.textContent =
      this.mode === 'hard'
        ? Math.round(this.bpm + (Math.random() - 0.5) * 36)
        : Math.round(60 / this.beatLen);
    this.heart.animate?.(BEAT, { duration: 320, easing: 'ease-out' });
    if (this.hover) sound.beep();
  }

  step(dt) {
    if (!this.buf) return;
    this.acc += dt * this.speed;
    const hard = this.mode === 'hard';
    while (this.acc >= 1) {
      this.acc -= 1;
      this.beatT += 1 / this.speed;
      if (this.beatT >= this.beatLen) {
        this.beatT -= this.beatLen;
        this.beatLen = this.nextLen();
        this.amp = hard ? 0.7 + Math.random() * 0.5 : 1;
        if (!this.reduce) this.onBeat();
      }
      this.wander =
        this.wander * 0.996 + (Math.random() - 0.5) * (hard ? 0.02 : 0.004);
      const n = (Math.random() - 0.5) * (hard ? 0.07 : 0.015);
      this.buf[this.x] =
        this.h * 0.62 -
        (this.wave(this.beatT) + n + this.wander) * this.h * 0.42;
      this.x = (this.x + 1) % this.buf.length;
    }
  }

  draw() {
    const { ctx, w, h, buf } = this;
    if (!buf) return;
    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.color;
    const gap = 26;
    const L = buf.length;
    // A soft wide glow, then the sharp line on top.
    for (const [lw, a] of [
      [5, 0.16],
      [1.8, 1],
    ]) {
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i < L; i++) {
        const ahead = (i - this.x + L) % L;
        const y = buf[i];
        if (ahead < gap || Number.isNaN(y)) {
          pen = false;
          continue;
        }
        if (!pen) {
          ctx.moveTo(i, y);
          pen = true;
        } else ctx.lineTo(i, y);
      }
      ctx.globalAlpha = a;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // The bright dot at the write head.
    const hx = (this.x - 1 + L) % L;
    const hy = buf[hx];
    if (!Number.isNaN(hy)) {
      ctx.fillStyle = '#fff';
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(hx, hy, 2.4, 0, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}
