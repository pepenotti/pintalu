/**
 * Flood-fill algorithm operating on a flat RGBA Uint8Array.
 * Used by the Fill Bucket tool.
 */

interface FillOptions {
  data: Uint8Array;
  width: number;
  height: number;
  startX: number;
  startY: number;
  fillColor: [number, number, number, number]; // RGBA 0-255
  antialiased: boolean;
  tolerance?: number; // 0-255, default 15
}

function colorAt(data: Uint8Array, idx: number): [number, number, number, number] {
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
}

function colorsMatch(
  a: [number, number, number, number],
  b: [number, number, number, number],
  tolerance: number
): boolean {
  return (
    Math.abs(a[0] - b[0]) <= tolerance &&
    Math.abs(a[1] - b[1]) <= tolerance &&
    Math.abs(a[2] - b[2]) <= tolerance &&
    Math.abs(a[3] - b[3]) <= tolerance
  );
}

export function floodFill({
  data,
  width,
  height,
  startX,
  startY,
  fillColor,
  tolerance = 15,
}: FillOptions): Uint8Array {
  const result = new Uint8Array(data);
  const startIdx = (startY * width + startX) * 4;
  const targetColor = colorAt(result, startIdx);

  // Don't fill if already the fill color
  if (colorsMatch(targetColor, fillColor, 0)) {
    return result;
  }

  const stack: number[] = [startX + startY * width];
  const visited = new Uint8Array(width * height);

  while (stack.length > 0) {
    const pos = stack.pop()!;
    if (visited[pos]) continue;
    visited[pos] = 1;

    const x = pos % width;
    const y = Math.floor(pos / width);
    const idx = pos * 4;

    if (!colorsMatch(colorAt(result, idx), targetColor, tolerance)) continue;

    result[idx] = fillColor[0];
    result[idx + 1] = fillColor[1];
    result[idx + 2] = fillColor[2];
    result[idx + 3] = fillColor[3];

    if (x > 0) stack.push(pos - 1);
    if (x < width - 1) stack.push(pos + 1);
    if (y > 0) stack.push(pos - width);
    if (y < height - 1) stack.push(pos + width);
  }

  return result;
}

/** Convert a CSS hex color (#RRGGBB or #RRGGBBAA) to an RGBA tuple. */
export function hexToRGBA(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const a = h.length === 8 ? parseInt(h.substring(6, 8), 16) : 255;
  return [r, g, b, a];
}
