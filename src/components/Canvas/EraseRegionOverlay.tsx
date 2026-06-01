import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { colors } from '../../theme/darkTheme';

interface EraseRegionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  onConfirm: (rect: EraseRegionRect) => void;
  onCancel: () => void;
}

export function EraseRegionSelector({ onConfirm, onCancel }: Props) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<EraseRegionRect | null>(null);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: e => {
      const { locationX, locationY } = e.nativeEvent;
      startRef.current = { x: locationX, y: locationY };
      setSelection({ x: locationX, y: locationY, width: 0, height: 0 });
    },
    onPanResponderMove: e => {
      if (!startRef.current) return;
      const { locationX, locationY } = e.nativeEvent;
      const x = Math.min(startRef.current.x, locationX);
      const y = Math.min(startRef.current.y, locationY);
      const width = Math.abs(locationX - startRef.current.x);
      const height = Math.abs(locationY - startRef.current.y);
      setSelection({ x, y, width, height });
    },
    onPanResponderRelease: () => {},
  });

  return (
    <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
      {selection && selection.width > 4 && selection.height > 4 && (
        <View
          style={[
            styles.selectionBox,
            {
              left: selection.x,
              top: selection.y,
              width: selection.width,
              height: selection.height,
            },
          ]}
        >
          {/* Confirm / Cancel buttons float at bottom of selection */}
          <View style={styles.actions}>
            <View
              style={[styles.actionBtn, styles.cancelBtn]}
              // Using touchable-free pressable via hitSlop on parent — children handled by pointer events
            />
          </View>
        </View>
      )}

      {/* Always-visible Cancel & Confirm floating buttons */}
      <View style={styles.floatingActions}>
        <View
          style={[styles.floatingBtn, styles.cancelBtnFloat]}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Cancel erase region"
        >
          {/* ✕ */}
        </View>
        {selection && selection.width > 4 && (
          <View
            style={[styles.floatingBtn, styles.confirmBtnFloat]}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Confirm erase"
          >
            {/* ✓ */}
          </View>
        )}
      </View>
    </View>
  );
}

import { TouchableOpacity, Text } from 'react-native';

export function EraseRegionOverlay({ onConfirm, onCancel }: Props) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<EraseRegionRect | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: e => {
      const { locationX, locationY } = e.nativeEvent;
      startRef.current = { x: locationX, y: locationY };
      setSelection({ x: locationX, y: locationY, width: 0, height: 0 });
      setIsDragging(true);
    },
    onPanResponderMove: e => {
      if (!startRef.current) return;
      const { locationX, locationY } = e.nativeEvent;
      const x = Math.min(startRef.current.x, locationX);
      const y = Math.min(startRef.current.y, locationY);
      const width = Math.abs(locationX - startRef.current.x);
      const height = Math.abs(locationY - startRef.current.y);
      setSelection({ x, y, width, height });
    },
    onPanResponderRelease: () => {
      setIsDragging(false);
    },
  });

  const hasSelection = selection && selection.width > 8 && selection.height > 8;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} {...panResponder.panHandlers}>
      {hasSelection && (
        <View
          style={[
            styles.selectionBox,
            {
              left: selection.x,
              top: selection.y,
              width: selection.width,
              height: selection.height,
            },
          ]}
          pointerEvents="none"
        />
      )}

      <View style={styles.floatingActions}>
        <TouchableOpacity
          style={[styles.floatingBtn, styles.cancelBtnFloat]}
          onPress={onCancel}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.btnText}>✕</Text>
        </TouchableOpacity>

        {hasSelection && !isDragging && (
          <TouchableOpacity
            style={[styles.floatingBtn, styles.confirmBtnFloat]}
            onPress={() => onConfirm(selection)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.btnText}>✓</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 10,
  },
  selectionBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    backgroundColor: `${colors.accent}22`,
  },
  actions: {
    position: 'absolute',
    bottom: -40,
    right: 0,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.danger,
  },
  floatingActions: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    zIndex: 20,
  },
  floatingBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnFloat: {
    backgroundColor: colors.danger,
  },
  confirmBtnFloat: {
    backgroundColor: colors.success,
  },
  btnText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
