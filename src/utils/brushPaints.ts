import {
  Skia,
  PaintStyle,
  StrokeCap,
  StrokeJoin,
  BlurStyle,
  type SkPaint,
} from '@shopify/react-native-skia';
import { ToolType } from '../store/types';

export interface PaintConfig {
  color: string;
  size: number;
  opacity: number;
}

/** Returns a fully configured Skia paint for the given tool. */
export function makePaint(tool: ToolType, config: PaintConfig): SkPaint {
  const paint = Skia.Paint();

  switch (tool) {
    case 'pencil': {
      paint.setColor(Skia.Color(config.color));
      paint.setAlphaf(config.opacity);
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeWidth(config.size);
      paint.setStrokeCap(StrokeCap.Round);
      paint.setStrokeJoin(StrokeJoin.Round);
      paint.setAntiAlias(true);
      break;
    }
    case 'marker': {
      paint.setColor(Skia.Color(config.color));
      paint.setAlphaf(config.opacity * 0.85);
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeWidth(config.size);
      paint.setStrokeCap(StrokeCap.Square);
      paint.setStrokeJoin(StrokeJoin.Bevel);
      paint.setAntiAlias(true);
      break;
    }
    case 'paintbrush': {
      paint.setColor(Skia.Color(config.color));
      paint.setAlphaf(config.opacity);
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeWidth(config.size);
      paint.setStrokeCap(StrokeCap.Round);
      paint.setStrokeJoin(StrokeJoin.Round);
      paint.setAntiAlias(true);
      // Solid blur: core stays fully opaque, edges feather outward
      const maskFilter = Skia.MaskFilter.MakeBlur(BlurStyle.Solid, config.size * 0.99, true);
      paint.setMaskFilter(maskFilter);
      break;
    }
    case 'crayon': {
      // Crayon is a slightly rough, low-opacity stroke
      paint.setColor(Skia.Color(config.color));
      paint.setAlphaf(config.opacity * 0.7);
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeWidth(config.size);
      paint.setStrokeCap(StrokeCap.Round);
      paint.setStrokeJoin(StrokeJoin.Round);
      paint.setAntiAlias(false); // rough edges
      break;
    }
    case 'eraser': {
      // Erase by painting the canvas background color
      paint.setColor(Skia.Color('#FAFAF8'));
      paint.setAlphaf(1);
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeWidth(config.size);
      paint.setStrokeCap(StrokeCap.Round);
      paint.setStrokeJoin(StrokeJoin.Round);
      paint.setAntiAlias(true);
      break;
    }
    default: {
      // Fallback: pencil-style
      paint.setColor(Skia.Color(config.color));
      paint.setAlphaf(config.opacity);
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeWidth(config.size);
      paint.setStrokeCap(StrokeCap.Round);
      paint.setStrokeJoin(StrokeJoin.Round);
      paint.setAntiAlias(true);
    }
  }

  return paint;
}

/** Generates scattered spray dots around a center point.
 * Uses a squared-random radius so dots are denser at the centre,
 * mimicking a real aerosol can rather than a uniform scatter. */
export function getSprayDots(
  cx: number,
  cy: number,
  radius: number,
  density: number = 20
): { x: number; y: number }[] {
  const dots: { x: number; y: number }[] = [];
  for (let i = 0; i < density; i++) {
    const angle = Math.random() * Math.PI * 2;
    // r² distribution: most dots near centre, fewer at the edge.
    const dist = Math.random() * Math.random() * radius;
    dots.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
    });
  }
  return dots;
}
