import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, DRAWING_COLORS } from '../../theme/darkTheme';
import { BrushSizeKey } from '../../theme/darkTheme';
import { ToolType } from '../../store/types';
import { ColorRow } from '../ColorPicker/ColorRow';
import { useLanguage } from '../../i18n';

const TOOLBAR_TOOLS = [
  'paintbrush', 'pencil', 'crayon', 'marker', 'fillBucket', 'sprayCan', 'eraser',
] as const;

type ToolbarTool = (typeof TOOLBAR_TOOLS)[number];

/**
 * Emoji reflects what each tool VISUALLY produces, not its code name.
 *   paintbrush  → blurry/soft spray look  → 💨
 *   pencil      → clean round strokes     → ✏️
 *   crayon      → rough semi-transparent  → 🖍️
 *   marker      → flat square-cap stroke  → 🖌️
 *   fillBucket  → flood fill              → 🪣
 *   sprayCan    → dot scatter             → 🪥
 *   eraser      → erase                   → ❌
 */
const TOOL_EMOJI: Record<ToolbarTool, string> = {
  paintbrush: '💨',
  pencil:     '✏️',
  crayon:     '🖍️',
  marker:     '🖌️',
  fillBucket: '🪣',
  sprayCan:   '🪥',
  eraser:     '❌',
};

interface Props {
  activeTool: ToolType;
  activeColor: string;
  activeSizeKey: BrushSizeKey;
  toolbarVisible: boolean;
  onToolSelect: (tool: ToolType) => void;
  onColorSelect: (color: string) => void;
  onSizeChange: (key: BrushSizeKey) => void;
  onToggleToolbar: () => void;
}

export function BottomToolbar({
  activeTool,
  activeColor,
  activeSizeKey,
  toolbarVisible,
  onToolSelect,
  onColorSelect,
  onSizeChange,
  onToggleToolbar,
}: Props) {
  const { t } = useLanguage();
  const row1 = DRAWING_COLORS.slice(0, 10);
  const row2 = DRAWING_COLORS.slice(10);

  // Return nothing when hidden — canvas fills full screen
  if (!toolbarVisible) return null;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.outerCard}>
        {/* Collapse handle */}
        <TouchableOpacity
          onPress={onToggleToolbar}
          style={styles.collapseHandle}
          accessibilityLabel={t.hideToolbar}
          hitSlop={{ top: 10, bottom: 4, left: 60, right: 60 }}
        >
          <View style={styles.collapseBar} />
        </TouchableOpacity>

        {/* Tool row */}
        <View style={styles.toolRow}>
          {TOOLBAR_TOOLS.map(tool => (
            <TouchableOpacity
              key={tool}
              style={[styles.toolBtn, activeTool === tool && styles.toolBtnActive]}
              onPress={() => onToolSelect(tool)}
              accessibilityLabel={tool}
              accessibilityRole="button"
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <Text style={styles.toolEmoji}>{TOOL_EMOJI[tool]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Color palette rows */}
        <View style={styles.colorRows}>
          <ColorRow colors={row1} activeColor={activeColor} onColorSelect={onColorSelect} />
          <ColorRow colors={row2} activeColor={activeColor} onColorSelect={onColorSelect} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
  },
  collapseHandle: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 40,
    marginBottom: 2,
  },
  collapseBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  outerCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginHorizontal: 12,
    marginBottom: 10,
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toolBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    backgroundColor: colors.accentMuted,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  toolEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  colorRows: {
    gap: 6,
  },
});
