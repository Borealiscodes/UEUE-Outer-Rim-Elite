/**
 * src/synthwave-space-audio.js — Mute-by-Default Ambient Space Synth & Laser/Jump Audio (Ledger 2)
 *
 * Signed-off-by: Borealis Serenity Hedling <chguard-sentinel@vaked.dev>
 */

const SPACE_CHORD_HZ = [146.83, 220.00, 261.63, 329.63]; // Dm9 ambient pad

export function createSpaceAudio() {
  let muted = true;
  let ctx = null;
  let padTimer = null;
  let step = 0;

  const ensureCtx = () => {
    if (!ctx && typeof window !== "undefined") {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) ctx = new Ctor();
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  };

  const playTone = (freq, type, peak, attack, decay, cutoff = 850) => {
    const ac = ensureCtx();
    if (!ac || muted) return;

    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + decay);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + decay + 0.05);
  };

  const tickPad = () => {
    if (!muted) {
      const note = SPACE_CHORD_HZ.at(step % SPACE_CHORD_HZ.length);
      playTone(note, "sine", 0.025, 0.35, 2.2, 540);
      step++;
    }
  };

  return {
    isMuted: () => muted,
    toggleMute: () => {
      muted = !muted;
      if (!muted) {
        ensureCtx();
        if (!padTimer && typeof window !== "undefined") {
          padTimer = window.setInterval(tickPad, 1400);
        }
        tickPad();
      }
      return muted;
    },
    playLaser: () => {
      playTone(520, "triangle", 0.045, 0.005, 0.18, 1600);
    },
    playJump: () => {
      playTone(220, "sine", 0.05, 0.04, 0.9, 1200);
      setTimeout(() => playTone(440, "sine", 0.04, 0.04, 0.9, 1400), 140);
    },
  };
}
