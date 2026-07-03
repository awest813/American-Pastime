export type Stinger =
  | "click"
  | "deal"
  | "select"
  | "combo"
  | "crack"
  | "runs"
  | "homer"
  | "win"
  | "lose"
  | "buy";

/**
 * All-synthesized WebAudio stingers — no audio assets to load.
 * The context is created lazily inside a user gesture (first button click),
 * which keeps browser autoplay policies happy. Every stinger is a few
 * oscillator/noise nodes, so failures are non-fatal by design: juice only.
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  private ensure(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.35;
        this.master.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** @param variant index for pitched sequences (e.g. nth combo in a play). */
  play(name: Stinger, variant = 0): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    switch (name) {
      case "click":
        this.tone(880, t, 0.05, { type: "square", gain: 0.12 });
        break;
      case "deal":
        this.noise(t, 0.06, { filter: 4000, gain: 0.1 });
        break;
      case "select":
        this.tone(620, t, 0.05, { type: "triangle", gain: 0.15 });
        this.tone(930, t + 0.03, 0.05, { type: "triangle", gain: 0.1 });
        break;
      case "combo": {
        // Ascending pentatonic ding per combo landed
        const scale = [523.25, 587.33, 659.25, 783.99, 880];
        const freq = scale[Math.min(variant, scale.length - 1)];
        this.tone(freq, t, 0.22, { type: "triangle", gain: 0.22 });
        this.tone(freq * 2, t, 0.12, { type: "sine", gain: 0.08 });
        break;
      }
      case "crack":
        // Bat on ball: sharp noise snap + low thump
        this.noise(t, 0.08, { filter: 2500, gain: 0.35 });
        this.tone(160, t, 0.12, { type: "sine", gain: 0.3, slideTo: 60 });
        break;
      case "runs":
        this.tone(523.25, t, 0.1, { type: "square", gain: 0.14 });
        this.tone(659.25, t + 0.08, 0.1, { type: "square", gain: 0.14 });
        this.tone(783.99, t + 0.16, 0.18, { type: "square", gain: 0.16 });
        break;
      case "homer":
        // Crack plus a crowd-ish noise swell
        this.play("crack");
        this.noise(t + 0.05, 0.9, { filter: 1200, gain: 0.22, attack: 0.25 });
        this.tone(1046.5, t + 0.15, 0.4, { type: "sine", gain: 0.1, slideTo: 1568 });
        break;
      case "win":
        // Little organ fanfare
        for (const [i, f] of [523.25, 659.25, 783.99, 1046.5].entries()) {
          this.tone(f, t + i * 0.12, 0.28, { type: "square", gain: 0.13 });
          this.tone(f / 2, t + i * 0.12, 0.28, { type: "triangle", gain: 0.08 });
        }
        break;
      case "lose":
        this.tone(280, t, 0.5, { type: "sawtooth", gain: 0.16, slideTo: 130 });
        this.tone(140, t + 0.05, 0.55, { type: "sawtooth", gain: 0.1, slideTo: 70 });
        break;
      case "buy":
        this.tone(659.25, t, 0.08, { type: "square", gain: 0.14 });
        this.tone(987.77, t + 0.09, 0.16, { type: "square", gain: 0.14 });
        break;
    }
  }

  private tone(
    freq: number,
    when: number,
    duration: number,
    opts: { type: OscillatorType; gain: number; slideTo?: number },
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = opts.type;
    osc.frequency.setValueAtTime(freq, when);
    if (opts.slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), when + duration);
    }
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(opts.gain, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
    osc.connect(gain).connect(this.master!);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  private noise(
    when: number,
    duration: number,
    opts: { filter: number; gain: number; attack?: number },
  ): void {
    const ctx = this.ctx!;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = opts.filter;
    const gain = ctx.createGain();
    if (opts.attack) {
      gain.gain.setValueAtTime(0.001, when);
      gain.gain.exponentialRampToValueAtTime(opts.gain, when + opts.attack);
    } else {
      gain.gain.setValueAtTime(opts.gain, when);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
    src.connect(filter).connect(gain).connect(this.master!);
    src.start(when);
  }
}
