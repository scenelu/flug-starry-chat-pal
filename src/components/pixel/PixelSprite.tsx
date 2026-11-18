import type { CSSProperties } from "react";

export const PIXEL_COLORS: Record<string, string> = {
  o: "var(--flug-purple)",
  g: "var(--flug-sage)",
  l: "var(--flug-mint)",
  c: "var(--flug-cream)",
};

/** Mirror 8-char left halves into symmetric 16-char rows. */
export function mirror(halves: string[]): string[] {
  return halves.map((h) => h + h.split("").reverse().join(""));
}

export function applyOverlay(rows: string[], overlay: [number, number, string][]): string[] {
  const grid = rows.map((r) => r.split(""));
  for (const [x, y, ch] of overlay) {
    if (grid[y] && x >= 0 && x < grid[y].length) grid[y][x] = ch;
  }
  return grid.map((r) => r.join(""));
}

type Props = {
  rows: string[];
  size?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

/** Renders a character grid as crisp SVG pixels, merging horizontal runs of the same color. */
export function PixelSprite({ rows, size = 48, className, style, title }: Props) {
  const width = Math.max(...rows.map((r) => r.length));
  const height = rows.length;
  const rects: { x: number; y: number; w: number; fill: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      const fill = PIXEL_COLORS[ch];
      if (!fill) {
        x++;
        continue;
      }
      let w = 1;
      while (row[x + w] === ch) w++;
      rects.push({ x, y, w, fill });
      x += w;
    }
  });
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={(size * height) / width}
      className={className}
      style={style}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} style={{ fill: r.fill }} />
      ))}
    </svg>
  );
}
