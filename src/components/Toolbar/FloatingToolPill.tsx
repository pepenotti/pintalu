import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/darkTheme';
import { ToolType } from '../../store/types';

const TOOL_EMOJI: Partial<Record<ToolType, string>> = {
  paintbrush: '💨',
  pencil:     '✏️',
  crayon:     '🖍️',
  marker:     '🖌️',
  fillBucket: '🪣',
  sprayCan:   '🪥',
  eraser:     '❌',
};

const CIRCLE = 48;
const EXPAND = 30;
const GAP = 6;
const PAD = 8;
const PILL_W = PAD * 2 + CIRCLE * 2 + EXPAND + GAP * 2;
const PILL_H = CIRCLE + PAD * 2;

interface Props {
  activeTool: ToolType;
  activeColor: string;
  onCycleTool: () => void;
  onCycleColor: () => void;
  onExpand: () => void;
}

export function FloatingToolPill({
  activeTool,
  activeColor,
  onCycleTool,
  onCycleColor,
  onExpand,
}: Props) {
  const { width: screenW, height: screenH } = useWindowDimensions();

  // Start position: bottom-centre
  const x = useSharedValue((screenW - PILL_W) / 2);
  const y = useSharedValue(screenH - PILL_H - 100);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const drag = Gesture.Pan()
    .minDistance(6)
    .onBegin(() => {
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate(e => {
      x.value = Math.max(0, Math.min(screenW - PILL_W, startX.value + e.translationX));
      y.value = Math.max(0, Math.min(screenH - PILL_H, startY.value + e.translationY));
    });

  const animStyle = useAnimatedStyle(() => ({
    left: x.value,
    top: y.value,
  }));

  return (
    <GestureDetector gesture={drag}>
      <Animated.View style={[styles.pill, animStyle]}>
        {/* Tool circle — tap to cycle to next tool */}
        <TouchableOpacity
          style={styles.circle}
          onPress={onCycleTool}
          activeOpacity={0.7}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={styles.emoji}>{TOOL_EMOJI[activeTool] ?? '✏️'}</Text>
        </TouchableOpacity>

        {/* Color circle — tap to cycle to next color */}
        <TouchableOpacity
          style={[styles.circle, styles.colorCircle, { backgroundColor: activeColor }]}
          onPress={onCycleColor}
          activeOpacity={0.7}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        />

        {/* Expand button */}
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={onExpand}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="chevron-up" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    width: PILL_W,
    height: PILL_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    gap: GAP,
    backgroundColor: 'rgba(22,20,18,0.88)',
    borderRadius: PILL_H / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircle: {
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  emoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  expandBtn: {
    width: EXPAND,
    height: EXPAND,
    borderRadius: EXPAND / 2,
    backgroundColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
