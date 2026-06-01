import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors as themeColors } from '../../theme/darkTheme';

interface Props {
  colors: string[];
  activeColor: string;
  onColorSelect: (color: string) => void;
}

export function ColorRow({ colors, activeColor, onColorSelect }: Props) {
  const [rowWidth, setRowWidth] = useState(0);
  const colorCount = colors.length;
  const gap = colorCount >= 10 ? 4 : 8;
  const maxSize = colorCount >= 10 ? 34 : 40;
  const minSize = 24;

  const swatchSize = useMemo(() => {
    if (!rowWidth || colorCount === 0) return maxSize;

    // Keep a tiny side buffer so selected-ring scale stays inside the card.
    const horizontalBuffer = 8;
    const available = Math.max(0, rowWidth - horizontalBuffer * 2);
    const raw = Math.floor((available - gap * (colorCount - 1)) / colorCount);
    return Math.max(minSize, Math.min(maxSize, raw));
  }, [rowWidth, colorCount, gap, maxSize]);

  const selectedScale = colorCount >= 10 ? 1.04 : 1.08;

  return (
    <View style={styles.row} onLayout={e => setRowWidth(e.nativeEvent.layout.width)}>
      {colors.map(color => {
        const isSelected = activeColor === color;
        const isWhite = color.toUpperCase() === '#FFFFFF';
        const isLightGray = color.toUpperCase() === '#D0D0D0';
        const isBlack = color.toUpperCase() === '#212121';
        return (
          <TouchableOpacity
            key={color}
            style={[
              styles.swatch,
              {
                width: swatchSize,
                height: swatchSize,
                borderRadius: swatchSize / 2,
                backgroundColor: color,
              },
              isSelected && styles.swatchActive,
              isSelected && {
                borderColor: themeColors.accent,
                borderWidth: 2.5,
                transform: [{ scale: selectedScale }],
              },
              isWhite && styles.swatchWhite,
              isLightGray && styles.swatchLightGray,
              isBlack && styles.swatchBlack,
            ]}
            onPress={() => onColorSelect(color)}
            accessibilityLabel={`Color ${color}`}
            accessibilityRole="button"
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  swatch: {
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  swatchActive: {
    // borderColor set dynamically for selected
  },
  swatchWhite: {
    borderColor: themeColors.border,
    borderWidth: 1.5,
  },
  swatchLightGray: {
    borderColor: themeColors.border,
    borderWidth: 1.5,
  },
  swatchBlack: {
    borderColor: themeColors.border,
    borderWidth: 1.5,
  },
});
