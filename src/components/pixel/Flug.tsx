import { applyOverlay, mirror, PixelSprite } from "./PixelSprite";

export type FlugMood = "idle" | "thinking" | "responding" | "error";

// Flug's body — 16 x 19 pixels, left halves mirrored for symmetry.
const BASE = mirror([
  "..oo....",
  ".ollo...",
  "..oo....",
  "...o....",
  "....oooo",
  "..oogggg",
  ".oglgggg",
  "oggggggg",
  "oggggggg",
  "oggggggg",
  "oggggggg",
  "oggggggg",
  ".ogggggg",
  "..oogggg",
  "....oooo",
  "...oggll",
  "...oggll",
  "...ooooo",
  "...ooo..",
]);

// Only one shine on the head (top-left light source).
const SHARED: [number, number, string][] = [
  [13, 6, "g"],
];

const FACES: Record<FlugMood, [number, number, string][]> = {
  idle: [
    // big round eyes with a shine
    [4, 8, "c"], [5, 8, "o"], [4, 9, "o"], [5, 9, "o"], [4, 10, "o"], [5, 10, "o"],
    [10, 8, "c"], [11, 8, "o"], [10, 9, "o"], [11, 9, "o"], [10, 10, "o"], [11, 10, "o"],
    // cheeks
    [2, 11, "l"], [13, 11, "l"],
    // smile
    [6, 11, "o"], [9, 11, "o"], [7, 12, "o"], [8, 12, "o"],
  ],
  thinking: [
    // eyes glancing up and to the side
    [5, 7, "c"], [6, 7, "o"], [5, 8, "o"], [6, 8, "o"],
    [11, 7, "c"], [12, 7, "o"], [11, 8, "o"], [12, 8, "o"],
    // raised brow
    [10, 6, "o"], [11, 6, "o"],
    // small pondering mouth
    [8, 12, "o"], [9, 12, "o"],
    // glowing antenna tips
    [2, 1, "c"], [3, 1, "c"], [12, 1, "c"], [13, 1, "c"],
  ],
  responding: [
    // happy ^ ^ eyes
    [4, 8, "o"], [5, 8, "o"], [3, 9, "o"], [6, 9, "o"],
    [10, 8, "o"], [11, 8, "o"], [9, 9, "o"], [12, 9, "o"],
    [2, 10, "l"], [13, 10, "l"],
    // open grin
    [6, 11, "o"], [7, 11, "o"], [8, 11, "o"], [9, 11, "o"],
    [6, 12, "o"], [7, 12, "c"], [8, 12, "c"], [9, 12, "o"],
    [7, 13, "o"], [8, 13, "o"],
    // bright antenna tips
    [2, 1, "c"], [3, 1, "c"], [12, 1, "c"], [13, 1, "c"],
  ],
  error: [
    // one X eye, one wide eye
    [3, 8, "o"], [5, 8, "o"], [4, 9, "o"], [3, 10, "o"], [5, 10, "o"],
    [10, 8, "o"], [11, 8, "o"], [10, 9, "o"], [11, 9, "o"], [10, 10, "o"], [11, 10, "o"],
    // wobbly mouth
    [5, 12, "o"], [6, 11, "o"], [7, 12, "o"], [8, 11, "o"], [9, 12, "o"], [10, 11, "o"],
    // drooping antenna
    [2, 1, "o"], [3, 1, "o"],
  ],
};

const SPRITES: Record<FlugMood, string[]> = {
  idle: applyOverlay(applyOverlay(BASE, SHARED), FACES.idle),
  thinking: applyOverlay(applyOverlay(BASE, SHARED), FACES.thinking),
  responding: applyOverlay(applyOverlay(BASE, SHARED), FACES.responding),
  error: applyOverlay(applyOverlay(BASE, SHARED), FACES.error),
};

const ANIM: Record<FlugMood, string> = {
  idle: "anim-flug-idle",
  thinking: "anim-flug-thinking",
  responding: "anim-flug-responding",
  error: "anim-flug-error",
};

const LABEL: Record<FlugMood, string> = {
  idle: "Flug the alien, smiling",
  thinking: "Flug the alien, thinking",
  responding: "Flug the alien, happily answering",
  error: "Flug the alien, confused",
};

export function Flug({
  mood = "idle",
  size = 48,
  animated = true,
  className = "",
}: {
  mood?: FlugMood;
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-block ${animated ? ANIM[mood] : ""} ${className}`} key={mood}>
      <PixelSprite rows={SPRITES[mood]} size={size} title={LABEL[mood]} />
    </span>
  );
}
