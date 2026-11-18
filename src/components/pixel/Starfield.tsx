import { useMemo } from "react";

// Deterministic pseudo-random so SSR and client render the same stars.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function Starfield({ count = 70, seed = 7 }: { count?: number; seed?: number }) {
  const stars = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => {
      const big = r() > 0.85;
      return {
        id: i,
        left: r() * 100,
        top: r() * 100,
        size: big ? 4 : r() > 0.5 ? 3 : 2,
        delay: r() * 3,
        duration: 2 + r() * 3,
        tone: r() > 0.7 ? "bg-flug-sage" : r() > 0.4 ? "bg-flug-mint" : "bg-flug-cream",
        plus: big,
      };
    });
  }, [count, seed]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          className={`anim-twinkle absolute ${s.tone}`}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            boxShadow: s.plus
              ? `0 -4px 0 0 currentColor, 0 4px 0 0 currentColor, -4px 0 0 0 currentColor, 4px 0 0 0 currentColor`
              : undefined,
            color: s.plus ? "var(--flug-mint)" : undefined,
          }}
        />
      ))}
    </div>
  );
}
