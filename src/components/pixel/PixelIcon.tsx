const ICONS = {
  menu: ["########", "########", "........", "########", "########", "........", "########", "########"],
  plus: ["..###..", "..###..", "#######", "#######", "#######", "..###..", "..###.."],
  trash: ["..###..", "#######", ".......", ".#####.", ".#.#.#.", ".#.#.#.", ".#.#.#.", ".#####."],
  copy: ["#####...", "#...#...", "#.######", "#.#....#", "###....#", "..#....#", "..#....#", "..######"],
  check: [".......#", "......##", "#....##.", "##..##..", ".####...", "..##....", "........"],
  soundOn: ["...#....", "..##..#.", "####.#.#", "####.#.#", "####.#.#", "..##..#.", "...#...."],
  soundOff: ["...#....", "..##....", "####.#.#", "####..#.", "####.#.#", "..##....", "...#...."],
  send: ["#.......", "###.....", "#####...", "#######.", "#####...", "###.....", "#......."],
  close: ["##...##", ".##.##.", "..###..", "...#...", "..###..", ".##.##.", "##...##"],
} as const;

export type PixelIconName = keyof typeof ICONS;

export function PixelIcon({ name, size = 14, className = "" }: { name: PixelIconName; size?: number; className?: string }) {
  const rows = ICONS[name];
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={(size * h) / w}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      {rows.flatMap((row, y) =>
        row.split("").map((ch, x) => (ch === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)),
      )}
    </svg>
  );
}
