import { useCallback, useEffect, useState } from "react";

// Tiny square-wave chiptune blips via Web Audio. Muted by default until the pilot turns them on.
type Blip = "send" | "receive" | "click" | "error";

let ctx: AudioContext | null = null;
const KEY = "flug-sound-on";
let enabled = false;
const listeners = new Set<(v: boolean) => void>();

const PATTERNS: Record<Blip, [number, number][]> = {
  send: [[523, 0.05], [784, 0.07]],
  receive: [[659, 0.05], [880, 0.05], [1046, 0.08]],
  click: [[440, 0.03]],
  error: [[220, 0.08], [165, 0.12]],
};

export function playBlip(kind: Blip) {
  if (!enabled || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    let t = ctx.currentTime;
    for (const [freq, dur] of PATTERNS[kind]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    }
  } catch {
    /* audio unavailable */
  }
}

export function useSoundToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    enabled = window.localStorage.getItem(KEY) === "1";
    setOn(enabled);
    const l = (v: boolean) => setOn(v);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const toggle = useCallback(() => {
    enabled = !enabled;
    window.localStorage.setItem(KEY, enabled ? "1" : "0");
    listeners.forEach((l) => l(enabled));
    if (enabled) playBlip("click");
  }, []);
  return { on, toggle };
}
