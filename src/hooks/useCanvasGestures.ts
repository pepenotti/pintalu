import { useCallback } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface UseCanvasGesturesOptions {
  onDrawBegin: (x: number, y: number) => void;
  onDrawUpdate: (x: number, y: number) => void;
  onDrawEnd: () => void;
  /** Called when the gesture is cancelled (e.g. second finger touched down). */
  onDrawCancel: () => void;
  onDoubleTap: () => void;
  enabled: boolean;
  /** Canvas display width — used to prevent panning/zooming outside canvas bounds. */
  canvasW: number;
  /** Canvas display height — used to prevent panning/zooming outside canvas bounds. */
  canvasH: number;
  /**
   * Minimum squared distance (in document/canvas pixels) a touch must travel
   * before a draw update is forwarded to the JS thread.  Culling happens on
   * the UI thread so filtered events never cross the bridge at all.
   * Default 9 (= 3 px).  Spray-can should use 36 (= 6 px).
   */
  minDist2: number;
}

const ZOOM_MIN = 1.0;
const ZOOM_MAX = 4.0;

export function useCanvasGestures({
  onDrawBegin,
  onDrawUpdate,
  onDrawEnd,
  onDrawCancel,
  onDoubleTap,
  enabled,
  canvasW,
  canvasH,
  minDist2,
}: UseCanvasGesturesOptions) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // Keep canvas dimension shared values so worklets always see current sizes.
  const canvasWSV = useSharedValue(canvasW);
  const canvasHSV = useSharedValue(canvasH);
  canvasWSV.value = canvasW;
  canvasHSV.value = canvasH;

  // UI-thread culling: track the last forwarded document-space position so we
  // can reject events that haven't moved far enough — entirely on the UI thread,
  // so the JS bridge is never crossed for filtered points.
  const prevDocX = useSharedValue(0);
  const prevDocY = useSharedValue(0);
  const minDist2SV = useSharedValue(minDist2);
  minDist2SV.value = minDist2;

  // Tracks whether onEnd fired so onFinalize knows if the gesture succeeded
  const drawEndedNormally = useSharedValue(false);

  // Clamp helpers — keep canvas edges within the viewport at any scale.
  function clampTx(tx: number, s: number, cw: number): number {
    'worklet';
    if (s <= 1) return 0;
    return Math.max(cw * (1 - s), Math.min(0, tx));
  }
  function clampTy(ty: number, s: number, ch: number): number {
    'worklet';
    if (s <= 1) return 0;
    return Math.max(ch * (1 - s), Math.min(0, ty));
  }

  const drawGesture = Gesture.Pan()
    .maxPointers(1)
    .enabled(enabled)
    .onBegin(e => {
      'worklet';
      drawEndedNormally.value = false;
      const docX = (e.x - translateX.value) / scale.value;
      const docY = (e.y - translateY.value) / scale.value;
      prevDocX.value = docX;
      prevDocY.value = docY;
      runOnJS(onDrawBegin)(docX, docY);
    })
    .onUpdate(e => {
      'worklet';
      const docX = (e.x - translateX.value) / scale.value;
      const docY = (e.y - translateY.value) / scale.value;
      const dx = docX - prevDocX.value;
      const dy = docY - prevDocY.value;
      if (dx * dx + dy * dy < minDist2SV.value) return;
      prevDocX.value = docX;
      prevDocY.value = docY;
      runOnJS(onDrawUpdate)(docX, docY);
    })
    .onEnd(() => {
      'worklet';
      drawEndedNormally.value = true;
      runOnJS(onDrawEnd)();
    })
    .onFinalize(() => {
      'worklet';
      // Only cancel/cleanup if the gesture did NOT end normally (i.e. was cancelled
      // because a second finger was added, or the gesture otherwise failed).
      if (!drawEndedNormally.value) {
        runOnJS(onDrawCancel)();
      }
    });

  const pinchGesture = Gesture.Pinch()
    .onBegin(e => {
      'worklet';
      savedScale.value = scale.value;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onUpdate(e => {
      'worklet';
      const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, savedScale.value * e.scale));
      const scaleRatio = newScale / scale.value;
      const newTx = focalX.value - scaleRatio * (focalX.value - translateX.value);
      const newTy = focalY.value - scaleRatio * (focalY.value - translateY.value);
      scale.value = newScale;
      translateX.value = clampTx(newTx, newScale, canvasWSV.value);
      translateY.value = clampTy(newTy, newScale, canvasHSV.value);
    });

  const panTwoFinger = Gesture.Pan()
    .minPointers(2)
    .onBegin(() => {
      'worklet';
      savedTx.value = translateX.value;
      savedTy.value = translateY.value;
    })
    .onUpdate(e => {
      'worklet';
      translateX.value = clampTx(savedTx.value + e.translationX, scale.value, canvasWSV.value);
      translateY.value = clampTy(savedTy.value + e.translationY, scale.value, canvasHSV.value);
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      runOnJS(onDoubleTap)();
    });

  const composed = Gesture.Simultaneous(
    Gesture.Simultaneous(pinchGesture, panTwoFinger),
    drawGesture,
    doubleTapGesture,
  );

  const resetView = useCallback(() => {
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
  }, [scale, translateX, translateY]);

  return { composed, scale, translateX, translateY, resetView };
}
