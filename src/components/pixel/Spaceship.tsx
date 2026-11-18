import { mirror, PixelSprite } from "./PixelSprite";

// The pilot's ship — 16 x 16, deep-purple hull with light-green accents.
const SHIP = mirror([
  ".......o",
  "......oo",
  "......oc",
  ".....occ",
  ".....ocl",
  ".....ooo",
  "....ogoo",
  "..l.ogoo",
  "..o.oooo",
  ".ooooooo",
  "oogooooo",
  "ogggoooo",
  "oo..oooo",
  ".....oo.",
]);

const FLAME = mirror([".....lg.", "......l."]);

export function Spaceship({
  size = 40,
  flame = true,
  className = "",
}: {
  size?: number;
  flame?: boolean;
  className?: string;
}) {
  const flameSize = size;
  return (
    <span className={`relative inline-flex flex-col items-center ${className}`}>
      <PixelSprite rows={SHIP} size={size} title="Your spaceship" />
      {flame && (
        <span className="anim-flame -mt-px block leading-none">
          <PixelSprite rows={FLAME} size={flameSize} />
        </span>
      )}
    </span>
  );
}
