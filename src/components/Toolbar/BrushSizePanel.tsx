import React, { useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { colors } from '../../theme/darkTheme';
import { ToolType } from '../../store/types';

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_SIZE = 2;
const MAX_SIZE = 80;
/** Pixel height of the draggable track area. */
const TRACK_HEIGHT = 200;
/** Width of the pill track (used for horizontal centering inside the worklet). */
const TRACK_WIDTH = 44;
/** Thumb diameter range — matches the visual brush tip scale. */
const THUMB_MAX = 24;
const THUMB_MIN = 6;
/** Keep thumb center inside the pill (half max-thumb margin on each end). */
const THUMB_HALF = THUMB_MAX / 2;

const TOOLS_WITH_SIZE: ToolType[] = [
  'paintbrush', 'pencil', 'crayon', 'marker', 'sprayCan', 'eraser',
];

interface Props {
  /** Current brush size in pixels. */
  brushSize: number;
  activeTool: ToolType;
  /** Called with a new brush size whenever the user moves the slider. */
  onSizeChange: (size: number) => void;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────
/** Map brush size → thumb Y within [0, TRACK_HEIGHT]. Top = large, bottom = small. */
function sizeToY(size: number): number {
  return ((MAX_SIZE - size) / (MAX_SIZE - MIN_SIZE)) * TRACK_HEIGHT;
}

/** Map thumb Y → brush size (worklet-safe). */
function yToSize(y: number): number {
  'worklet';
  const clamped = Math.max(0, Math.min(TRACK_HEIGHT, y));
  return Math.round(MAX_SIZE - (clamped / TRACK_HEIGHT) * (MAX_SIZE - MIN_SIZE));
}

export function BrushSizePanel({ brushSize, activeTool, onSizeChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  // All hooks must be called unconditionally (before any early return).
  const thumbY = useSharedValue(sizeToY(brushSize));

  // Keep thumb in sync when brushSize is changed externally
  useEffect(() => {
    thumbY.value = sizeToY(brushSize);
  }, [brushSize, thumbY]);

  const handleY = useCallback(
    (y: number) => onSizeChange(yToSize(y)),
    [onSizeChange],
  );

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin(e => {
      'worklet';
      const y = Math.max(0, Math.min(TRACK_HEIGHT, e.y));
      thumbY.value = y;
      runOnJS(handleY)(y);
    })
    .onUpdate(e => {
      'worklet';
      const y = Math.max(0, Math.min(TRACK_HEIGHT, e.y));
      thumbY.value = y;
      runOnJS(handleY)(y);
    });

  const thumbStyle = useAnimatedStyle(() => {
    // Clamp so the thumb center never exits the pill bounds.
    const y = Math.max(THUMB_HALF, Math.min(TRACK_HEIGHT - THUMB_HALF, thumbY.value));
    // Recompute diameter from worklet so it updates in sync with position (no JS-bridge lag).
    const sizeFrac = 1 - (y - THUMB_HALF) / (TRACK_HEIGHT - THUMB_MAX);
    const diameter = Math.round(THUMB_MIN + Math.max(0, Math.min(1, sizeFrac)) * (THUMB_MAX - THUMB_MIN));
    return {
      // Center vertically using the ACTUAL diameter (not the constant THUMB_HALF).
      top: y - diameter / 2,
      // Center horizontally inside the 44px track using the actual diameter.
      left: (TRACK_WIDTH - diameter) / 2,
      width: diameter,
      height: diameter,
      borderRadius: diameter / 2,
    };
  });

  // Hide the panel when the active tool doesn't support size changes.
  if (!TOOLS_WITH_SIZE.includes(activeTool)) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Toggle hide/show */}
      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={() => setCollapsed(c => !c)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? 'Show size slider' : 'Hide size slider'}
      >
        <View style={[styles.chevron, collapsed ? styles.chevronLeft : styles.chevronRight]} />
      </TouchableOpacity>

      {!collapsed && (
        <GestureDetector gesture={panGesture}>
          <View style={styles.track}>
            {/* Center line */}
            <View style={styles.trackLine} />
            {/* Draggable thumb — position & size are both worklet-driven */}
            <Animated.View style={[styles.thumb, thumbStyle]} />
          </View>
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 8,
    top: '25%',
    alignItems: 'center',
    gap: 6,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  chevron: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  chevronRight: {
    borderLeftWidth: 9,
    borderLeftColor: colors.textSecondary,
  },
  chevronLeft: {
    borderRightWidth: 9,
    borderRightColor: colors.textSecondary,
  },
  track: {
    width: 44,
    height: TRACK_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: 22,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
  },
  trackLine: {
    position: 'absolute',
    width: 4,
    top: THUMB_HALF,
    bottom: THUMB_HALF,
    backgroundColor: colors.accentMuted,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    backgroundColor: colors.textPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
});
