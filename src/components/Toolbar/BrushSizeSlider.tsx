import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, BRUSH_SIZES, BrushSizeKey } from '../../theme/darkTheme';
import { ToolType } from '../../store/types';

const SIZE_LABELS: { key: BrushSizeKey; label: string; dotSize: number }[] = [
  { key: 'small',  label: 'S', dotSize: 14 },
  { key: 'medium', label: 'M', dotSize: 22 },
  { key: 'large',  label: 'L', dotSize: 30 },
];

interface Props {
  activeSizeKey: BrushSizeKey;
  activeTool: ToolType;
  onSizeChange: (key: BrushSizeKey) => void;
}

const TOOLS_WITH_SIZE: ToolType[] = [
  'pencil', 'marker', 'paintbrush', 'sprayCan', 'crayon',
];

export function BrushSizeSlider({ activeSizeKey, activeTool, onSizeChange }: Props) {
  if (!TOOLS_WITH_SIZE.includes(activeTool)) return null;

  return (
    <View style={styles.container}>
      {SIZE_LABELS.map(({ key, label, dotSize }) => {
        const isActive = activeSizeKey === key;
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.sizeBtn,
              isActive && styles.sizeBtnActive,
              isActive && { borderColor: colors.accent, borderWidth: 2 },
            ]}
            onPress={() => onSizeChange(key)}
            accessibilityLabel={`Brush size ${label}`}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <View
              style={[
                styles.dot,
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: isActive ? colors.textPrimary : colors.textSecondary,
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'center',
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sizeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginHorizontal: 2,
  },
  sizeBtnActive: {
    backgroundColor: colors.accentMuted,
  },
  dot: {},
});
