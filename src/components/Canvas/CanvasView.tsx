import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  Canvas,
  Path,
  Rect,
  Skia,
  Image,
  ImageFormat,
  useCanvasRef,
  rect,
  AlphaType,
  ColorType,
  type SkImage,
  type SkPath,
} from '@shopify/react-native-skia';
import { StyleSheet, View, PixelRatio, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue as useSV } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import {
  DrawCommand,
  PointXY,
  StrokePathCommand,
  SprayDotsCommand,
  ToolType,
  BrushSettings,
} from '../../store/types';
import { makePaint, getSprayDots } from '../../utils/brushPaints';
import { floodFill, hexToRGBA } from '../../utils/floodFill';
import { useCanvasGestures } from '../../hooks/useCanvasGestures';
import { colors } from '../../theme/darkTheme';

// ─── Public API via ref ───────────────────────────────────────────────────────

export interface CanvasViewRef {
  getSnapshotBase64: () => Promise<string | null>;
  /** Returns the current zoom/pan transform so callers can convert screen coords → canvas coords. */
  getTransform: () => { scale: number; translateX: number; translateY: number };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  commands: DrawCommand[];
  activeTool: ToolType;
  brushSettings: BrushSettings;
  onCommandCommitted: (cmd: DrawCommand) => void;
  eraseRegionActive: boolean;
}

// ─── Spray constants ─────────────────────────────────────────────────────────
const SPRAY_DENSITY = 12;      // dots emitted per accepted move event
const SPRAY_DOT_RADIUS = 1.5;  // px

// ─── Consolidation constants ──────────────────────────────────────────────────
// Commands outside the undo window are periodically baked into a single base
// snapshot so Skia only draws a small fixed number of live paths per frame,
// regardless of total stroke count.
const CONSOLIDATION_KEEP = 50;  // keep this many recent commands live (= undo depth)
const CONSOLIDATION_BATCH = 15; // bake once this many commands have accumulated outside the window

// Maximum number of points accumulated before silently committing the current
// segment and starting a new one.  Keeps active-path geometry O(STROKE_CHUNK_SIZE)
// per frame regardless of how long the user keeps their finger down.
const STROKE_CHUNK_SIZE = 300;

// ─── Smooth path builder ──────────────────────────────────────────────────────
// Used by CommandRenderer to materialise committed strokes (built once per
// command thanks to React.memo).
function buildSmoothPath(points: PointXY[]) {
  const path = Skia.Path.Make();
  if (points.length < 2) return path;
  path.moveTo(points[0].x, points[0].y);
  if (points.length === 2) {
    path.lineTo(points[1].x, points[1].y);
  } else {
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) * 0.5;
      const midY = (points[i].y + points[i + 1].y) * 0.5;
      path.quadTo(points[i].x, points[i].y, midX, midY);
    }
    const last = points[points.length - 1];
    path.lineTo(last.x, last.y);
  }
  return path;
}

// ─── Incremental path builder ─────────────────────────────────────────────────
// Used exclusively for the LIVE active stroke.  The cached SkPath holds all
// committed Bézier segments (up to but NOT including the final lineTo tail).
// Each render only appends the new segments since the last call — O(new_points)
// JSI calls instead of O(all_points).  One native path.copy() replaces the old
// O(n) JS loop each frame once the cache is warm.
//
// cachedPathRef  — mutable SkPath that grows with committed segments.
// cachedUpToRef  — index of the first point NOT yet baked into the cache.
function buildIncrementalPath(
  points: PointXY[],
  cachedPathRef: React.MutableRefObject<SkPath | null>,
  cachedUpToRef: React.MutableRefObject<number>,
): SkPath {
  const n = points.length;
  if (n < 2) return Skia.Path.Make();

  const cached = cachedPathRef.current;
  const cachedIdx = cachedUpToRef.current;

  if (!cached || cachedIdx < 1) {
    // Cold start: build from scratch, caching everything except the lineTo tail.
    const newCache = Skia.Path.Make();
    newCache.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < n - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) * 0.5;
      const midY = (points[i].y + points[i + 1].y) * 0.5;
      newCache.quadTo(points[i].x, points[i].y, midX, midY);
    }
    cachedPathRef.current = newCache;
    cachedUpToRef.current = n - 1;
    // Render copy = cache + final lineTo
    const render = newCache.copy();
    render.lineTo(points[n - 1].x, points[n - 1].y);
    return render;
  }

  // Warm: mutate the cached path in-place (O(new) JSI calls), then copy for render.
  for (let i = cachedIdx; i < n - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) * 0.5;
    const midY = (points[i].y + points[i + 1].y) * 0.5;
    cached.quadTo(points[i].x, points[i].y, midX, midY);
  }
  cachedUpToRef.current = n - 1;

  // path.copy() is a native memcopy — much faster than re-running the JS loop.
  const render = cached.copy();
  render.lineTo(points[n - 1].x, points[n - 1].y);
  return render;
}

// ─── Spray dots renderer ─────────────────────────────────────────────────────
// Single SkPath per committed spray stroke (addCircle per dot) instead of N
// individual <Circle> elements. React.memo + useMemo ensure the path and paint
// are built exactly once per command — zero re-allocation on sibling updates.

const SprayDotsRenderer = React.memo(({ cmd }: { cmd: SprayDotsCommand }) => {
  const path = React.useMemo(() => {
    const p = Skia.Path.Make();
    cmd.dots.forEach(d => p.addCircle(d.x, d.y, cmd.dotRadius));
    return p;
  }, [cmd]);

  const paint = React.useMemo(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color(cmd.color));
    p.setAlphaf(cmd.opacity);
    p.setAntiAlias(true);
    return p;
  }, [cmd]);

  return <Path path={path} paint={paint} />;
});

// ─── Command renderer ─────────────────────────────────────────────────────────

const CommandRenderer = React.memo(({ cmd, bgColor }: { cmd: DrawCommand; bgColor: string }) => {
  switch (cmd.type) {
    case 'strokePath': {
      if (cmd.points.length < 2) return null;
      const path = buildSmoothPath(cmd.points);
      const paint = makePaint(cmd.tool, {
        color: cmd.color,
        size: cmd.size,
        opacity: cmd.opacity,
      });
      return <Path path={path} paint={paint} />;
    }

    case 'sprayDots': {
      return <SprayDotsRenderer cmd={cmd as SprayDotsCommand} />;
    }

    case 'fillRegion': {
      if (!cmd.resultImageBase64) return null;
      const data = Uint8Array.from(atob(cmd.resultImageBase64), c => c.charCodeAt(0));
      const imgData = Skia.Data.fromBytes(data);
      const image = Skia.Image.MakeImageFromEncoded(imgData);
      if (!image) return null;
      // image dimensions are physical pixels; divide by DPR to get logical canvas pixels
      const dpr = PixelRatio.get();
      return (
        <Image
          image={image}
          x={0}
          y={0}
          width={image.width() / dpr}
          height={image.height() / dpr}
          fit="fill"
        />
      );
    }

    case 'eraseRegion': {
      const paint = Skia.Paint();
      paint.setColor(Skia.Color(bgColor));
      const path = Skia.Path.Make();
      path.addRect(rect(cmd.x, cmd.y, cmd.width, cmd.height));
      return <Path path={path} paint={paint} />;
    }

    case 'clearCanvas': {
      const paint = Skia.Paint();
      paint.setColor(Skia.Color(cmd.backgroundColor));
      const path = Skia.Path.Make();
      // We rely on the canvas background; clear is handled by rendering a rect
      // (actual clear happens by filtering commands — see CanvasView logic)
      return null;
    }

    default:
      return null;
  }
});

// ─── CanvasView ───────────────────────────────────────────────────────────────

export const CanvasView = forwardRef<CanvasViewRef, Props>(function CanvasView(
  {
    canvasWidth,
    canvasHeight,
    backgroundColor,
    commands,
    activeTool,
    brushSettings,
    onCommandCommitted,
    eraseRegionActive,
  },
  ref
) {
  const skiaCanvasRef = useCanvasRef();

  // Measure the container so the canvas fills it exactly
  const [displayW, setDisplayW] = useState(0);
  const [displayH, setDisplayH] = useState(0);
  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setDisplayW(Math.round(width));
      setDisplayH(Math.round(height));
    }
  }, []);
  const effectiveW = displayW || canvasWidth;
  const effectiveH = displayH || canvasHeight;

  // ─── Consolidation state ──────────────────────────────────────────────────
  // Commands[0..baseCommandCount-1] are baked into baseImage.
  // Only commands[baseCommandCount..] are rendered as individual Skia elements.
  const [baseImage, setBaseImage] = useState<SkImage | null>(null);
  const [baseCommandCount, setBaseCommandCount] = useState(0);

  // Active stroke state (JS thread)
  const activePointsRef = useRef<PointXY[]>([]);
  const activeSprayDotsRef = useRef<PointXY[]>([]);
  // Incremental SkPath for the live spray preview — single element, O(1) React reconcile.
  const sprayPathRef = useRef<SkPath | null>(null);
  // Incremental path cache for the active stroke (Phase 3 optimisation).
  const cachedPathRef = useRef<SkPath | null>(null);
  const cachedUpToRef = useRef(0);
  const rafPendingRef = useRef(false);
  const [renderKey, setRenderKey] = useState(0);

  // Throttle re-renders to the display frame rate (~60 fps) instead of
  // re-rendering on every raw touch event (up to 120 Hz on modern devices).
  const scheduleRender = useCallback(() => {
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;
    requestAnimationFrame(() => {
      rafPendingRef.current = false;
      setRenderKey(k => k + 1);
    });
  }, []);
  const forceRender = useCallback(() => setRenderKey(k => k + 1), []);

  // ID counter for commands — use timestamp to avoid collisions with loaded history
  const nextId = useCallback(() => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, []);

  // ─── Drawing callbacks (called from gesture worklets via runOnJS) ──────────

  const onDrawBegin = useCallback(
    (x: number, y: number) => {
      if (activeTool === 'sprayCan') {
        sprayPathRef.current = Skia.Path.Make();
        const dots = getSprayDots(x, y, brushSettings.size / 2, SPRAY_DENSITY);
        dots.forEach(d => sprayPathRef.current!.addCircle(d.x, d.y, SPRAY_DOT_RADIUS));
        activeSprayDotsRef.current = dots;
      } else {
        activePointsRef.current = [{ x, y }];
        cachedPathRef.current = null;
        cachedUpToRef.current = 0;
      }
      scheduleRender();
    },
    [activeTool, brushSettings.size, scheduleRender]
  );

  const onDrawUpdate = useCallback(
    (x: number, y: number) => {
      if (activeTool === 'sprayCan') {
        const dots = getSprayDots(x, y, brushSettings.size / 2, SPRAY_DENSITY);
        dots.forEach(d => {
          sprayPathRef.current!.addCircle(d.x, d.y, SPRAY_DOT_RADIUS);
          activeSprayDotsRef.current.push(d);
        });
      } else {
        activePointsRef.current.push({ x, y });

        // Chunk: prevent unbounded path growth during long gestures.
        // Commit the current segment as a full command, then start a new one
        // seeded with the last point so strokes join seamlessly.
        if (activePointsRef.current.length >= STROKE_CHUNK_SIZE) {
          const pts = activePointsRef.current;
          const cmd: StrokePathCommand = {
            type: 'strokePath',
            id: nextId(),
            tool: activeTool as StrokePathCommand['tool'],
            points: [...pts],
            color: activeTool === 'eraser' ? backgroundColor : brushSettings.color,
            size: brushSettings.size,
            opacity: brushSettings.opacity,
          };
          onCommandCommitted(cmd);
          activePointsRef.current = [{ x, y }];
          // Reset incremental path cache so the next chunk starts fresh.
          cachedPathRef.current = null;
          cachedUpToRef.current = 0;
        }
      }
      scheduleRender();
    },
    [activeTool, brushSettings, backgroundColor, nextId, onCommandCommitted, scheduleRender]
  );

  const onDrawEnd = useCallback(() => {
    cachedPathRef.current = null;
    cachedUpToRef.current = 0;
    if (activeTool === 'sprayCan') {
      sprayPathRef.current = null;
      if (activeSprayDotsRef.current.length === 0) return;
      const cmd: SprayDotsCommand = {
        type: 'sprayDots',
        id: nextId(),
        dots: [...activeSprayDotsRef.current],
        color: brushSettings.color,
        dotRadius: SPRAY_DOT_RADIUS,
        opacity: brushSettings.opacity,
      };
      activeSprayDotsRef.current = [];
      onCommandCommitted(cmd);
    } else if (activeTool === 'fillBucket') {
      // Fill bucket commits immediately in onDrawBegin
      activePointsRef.current = [];
    } else {
      if (activePointsRef.current.length < 2) {
        activePointsRef.current = [];
        forceRender();
        return;
      }
      const cmd: StrokePathCommand = {
        type: 'strokePath',
        id: nextId(),
        tool: activeTool as StrokePathCommand['tool'],
        points: [...activePointsRef.current],
        color: activeTool === 'eraser' ? backgroundColor : brushSettings.color,
        size: brushSettings.size,
        opacity: brushSettings.opacity,
      };
      activePointsRef.current = [];
      onCommandCommitted(cmd);
    }
    forceRender();
  }, [activeTool, brushSettings, backgroundColor, nextId, onCommandCommitted, forceRender]);

  // Discard the in-progress stroke when the gesture is cancelled (e.g. second finger touched)
  const onDrawCancel = useCallback(() => {
    activePointsRef.current = [];
    activeSprayDotsRef.current = [];
    sprayPathRef.current = null;
    cachedPathRef.current = null;
    cachedUpToRef.current = 0;
    forceRender();
  }, [forceRender]);

  const onDoubleTap = useCallback(() => {}, []);

  // ─── Fill bucket: runs on tap (onDrawBegin) ────────────────────────────────

  const onFillTap = useCallback(
    async (x: number, y: number) => {
      const snapshot: SkImage | null = skiaCanvasRef.current?.makeImageSnapshot() ?? null;
      if (!snapshot) return;

      const dpr = PixelRatio.get();
      const imgWidth = snapshot.width();
      const imgHeight = snapshot.height();
      // readPixels with explicit unpremultiplied RGBA so flood-fill color
      // comparison works correctly regardless of canvas alpha type.
      const pixelData = snapshot.readPixels(0, 0, {
        width: imgWidth,
        height: imgHeight,
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Unpremul,
      });
      if (!pixelData) return;

      // Tap coords are in logical canvas units; snapshot is in physical pixels.
      const px = Math.round(Math.max(0, Math.min(imgWidth - 1, x * dpr)));
      const py = Math.round(Math.max(0, Math.min(imgHeight - 1, y * dpr)));

      const sourceData = pixelData as Uint8Array;
      const filled = floodFill({
        data: sourceData,
        width: imgWidth,
        height: imgHeight,
        startX: px,
        startY: py,
        fillColor: hexToRGBA(brushSettings.color),
        antialiased: false,
      });

      // Build a transparent-background diff image: only the pixels that the
      // flood fill actually changed are made opaque; everything else is fully
      // transparent (alpha = 0).  This makes every fillRegion command truly
      // independent — fills layer on top of each other correctly, undo works
      // as expected, and no previous draw is baked into the stored image.
      const diffData = new Uint8Array(imgWidth * imgHeight * 4);
      for (let i = 0; i < filled.length; i += 4) {
        if (
          filled[i]     !== sourceData[i]     ||
          filled[i + 1] !== sourceData[i + 1] ||
          filled[i + 2] !== sourceData[i + 2]
        ) {
          diffData[i]     = filled[i];
          diffData[i + 1] = filled[i + 1];
          diffData[i + 2] = filled[i + 2];
          diffData[i + 3] = 255; // fully opaque
          // else: stays 0,0,0,0 (transparent)
        }
      }

      // Must encode as PNG — JPEG drops the alpha channel.
      const resultImage = Skia.Image.MakeImage(
        {
          width: imgWidth,
          height: imgHeight,
          alphaType: AlphaType.Unpremul,
          colorType: ColorType.RGBA_8888,
        },
        Skia.Data.fromBytes(diffData),
        imgWidth * 4,
      );
      if (!resultImage) return;

      const encoded = resultImage.encodeToBase64(ImageFormat.PNG);
      onCommandCommitted({
        type: 'fillRegion',
        id: nextId(),
        x: px,
        y: py,
        color: brushSettings.color,
        antialiased: false,
        canvasWidth,
        canvasHeight,
        resultImageBase64: encoded,
      });
    },
    [skiaCanvasRef, brushSettings.color, nextId, onCommandCommitted, canvasWidth, canvasHeight],
  );

  // ─── Gestures ──────────────────────────────────────────────────────────────

  const { composed, scale, translateX, translateY, resetView } = useCanvasGestures({
    onDrawBegin: activeTool === 'fillBucket' ? (x, y) => { onFillTap(x, y); } : onDrawBegin,
    onDrawUpdate: activeTool === 'fillBucket' ? () => {} : onDrawUpdate,
    onDrawEnd: activeTool === 'fillBucket' ? () => {} : onDrawEnd,
    onDrawCancel,
    onDoubleTap,
    enabled: !eraseRegionActive,
    canvasW: effectiveW,
    canvasH: effectiveH,
    minDist2: activeTool === 'sprayCan' ? 36 : 9,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // ─── Active path for preview ────────────────────────────────────────────────

  let activePathEl: React.ReactElement | null = null;
  if (
    !eraseRegionActive &&
    activeTool !== 'fillBucket' &&
    activeTool !== 'eraseRegion'
  ) {
    if (activeTool === 'sprayCan' && sprayPathRef.current) {
      const paint = Skia.Paint();
      paint.setColor(Skia.Color(brushSettings.color));
      paint.setAlphaf(brushSettings.opacity);
      paint.setAntiAlias(true);
      activePathEl = <Path key={renderKey} path={sprayPathRef.current} paint={paint} />;
    } else if (activePointsRef.current.length >= 2) {
      const path = buildIncrementalPath(activePointsRef.current, cachedPathRef, cachedUpToRef);
      const paint = makePaint(activeTool, {
        color: activeTool === 'eraser' ? backgroundColor : brushSettings.color,
        size: brushSettings.size,
        opacity: brushSettings.opacity,
      });
      activePathEl = <Path key={renderKey} path={path} paint={paint} />;
    }
  }

  // ─── Snapshot helper ────────────────────────────────────────────────────────

  // Reset the base image when the canvas is cleared or the display size changes.
  useEffect(() => {
    if ((commands.length === 0 && baseCommandCount > 0) || displayW > 0 || displayH > 0) {
      setBaseImage(null);
      setBaseCommandCount(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commands.length === 0, displayW, displayH]);

  // Consolidate commands that have fallen outside the undo window into one
  // base snapshot.  This keeps the live Skia render tree small (≤ CONSOLIDATION_KEEP
  // elements) regardless of how many total strokes the user has made.
  useEffect(() => {
    const consolidatableCount = Math.max(0, commands.length - CONSOLIDATION_KEEP);
    if (consolidatableCount - baseCommandCount < CONSOLIDATION_BATCH) return;
    // Wait until after the current frame so Skia has drawn the latest commands.
    const frameId = requestAnimationFrame(() => {
      const img = skiaCanvasRef.current?.makeImageSnapshot();
      if (!img) return;
      setBaseImage(img);
      setBaseCommandCount(consolidatableCount);
    });
    return () => cancelAnimationFrame(frameId);
  }, [commands.length, baseCommandCount]);

  useImperativeHandle(ref, () => ({
    getSnapshotBase64: async () => {
      const img = skiaCanvasRef.current?.makeImageSnapshot();
      if (!img) return null;
      return img.encodeToBase64();
    },
    getTransform: () => ({
      scale: scale.value,
      translateX: translateX.value,
      translateY: translateY.value,
    }),
  }));

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <GestureDetector gesture={composed}>
        <Animated.View style={animatedStyle}>
          <Canvas
            ref={skiaCanvasRef}
            style={{ width: effectiveW, height: effectiveH }}
          >
            {/* Background drawn in Skia so makeImageSnapshot captures it correctly.
                Without this, empty areas read as transparent-black in readPixels,
                causing fill bucket and erase region to operate on the wrong colour. */}
            <Rect x={0} y={0} width={effectiveW} height={effectiveH} color={backgroundColor} />
            {/* Consolidated base layer: replaces all commands[0..baseCommandCount-1]
                with a single pre-baked snapshot, keeping the live element count small. */}
            {baseImage && (
              <Image
                image={baseImage}
                x={0}
                y={0}
                width={effectiveW}
                height={effectiveH}
                fit="fill"
              />
            )}
            {commands.slice(baseCommandCount).map(cmd => (
              <CommandRenderer key={cmd.id} cmd={cmd} bgColor={backgroundColor} />
            ))}
            {activePathEl}
          </Canvas>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
