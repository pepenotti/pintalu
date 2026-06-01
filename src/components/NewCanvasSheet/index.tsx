import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme/darkTheme';
import {
  CANVAS_PRESETS,
  CANVAS_MIN_SIZE,
  CANVAS_MAX_SIZE,
  FillMode,
  CanvasPreset,
} from '../../store/types';
import { useLanguage } from '../../i18n';

interface Props {
  visible: boolean;
  onConfirm: (width: number, height: number, fillMode: FillMode) => void;
  onCancel: () => void;
}

export function NewCanvasSheet({ visible, onConfirm, onCancel }: Props) {
  const { t } = useLanguage();
  const [selectedPreset, setSelectedPreset] = useState<CanvasPreset | null>(
    CANVAS_PRESETS[0]
  );
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [fillMode, setFillMode] = useState<FillMode>('antialiased');

  const handleConfirm = () => {
    let w: number;
    let h: number;

    if (isCustom) {
      w = clamp(parseInt(customW, 10) || CANVAS_MIN_SIZE, CANVAS_MIN_SIZE, CANVAS_MAX_SIZE);
      h = clamp(parseInt(customH, 10) || CANVAS_MIN_SIZE, CANVAS_MIN_SIZE, CANVAS_MAX_SIZE);
    } else if (selectedPreset) {
      w = selectedPreset.width;
      h = selectedPreset.height;
    } else {
      w = 800;
      h = 600;
    }

    onConfirm(w, h, fillMode);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.newDrawingSheetTitle}</Text>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.cancelText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>{t.canvasSize}</Text>

            {/* Presets */}
            <View style={styles.presets}>
              {CANVAS_PRESETS.map(preset => (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.presetBtn,
                    !isCustom && selectedPreset?.label === preset.label && styles.presetBtnActive,
                  ]}
                  onPress={() => {
                    setSelectedPreset(preset);
                    setIsCustom(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${preset.label} — ${preset.width}×${preset.height}`}
                >
                  <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                  <Text style={styles.presetLabel}>{preset.label}</Text>
                  <Text style={styles.presetDims}>
                    {preset.width}×{preset.height}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Custom */}
              <TouchableOpacity
                style={[styles.presetBtn, isCustom && styles.presetBtnActive]}
                onPress={() => setIsCustom(true)}
                accessibilityRole="button"
                accessibilityLabel="Custom size"
              >
                <Text style={styles.presetEmoji}>⚙️</Text>
                <Text style={styles.presetLabel}>{t.customSize}</Text>
              </TouchableOpacity>
            </View>

            {isCustom && (
              <View style={styles.customRow}>
                <View style={styles.customInputWrap}>
                  <Text style={styles.inputLabel}>{t.widthPx}</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    placeholder={`${CANVAS_MIN_SIZE}–${CANVAS_MAX_SIZE}`}
                    placeholderTextColor={colors.textSecondary}
                    value={customW}
                    onChangeText={setCustomW}
                    maxLength={4}
                  />
                </View>
                <Text style={styles.inputSep}>×</Text>
                <View style={styles.customInputWrap}>
                  <Text style={styles.inputLabel}>{t.heightPx}</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    placeholder={`${CANVAS_MIN_SIZE}–${CANVAS_MAX_SIZE}`}
                    placeholderTextColor={colors.textSecondary}
                    value={customH}
                    onChangeText={setCustomH}
                    maxLength={4}
                  />
                </View>
              </View>
            )}

            {/* Fill mode */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>
              {t.fillBucketStyle}
            </Text>
            <View style={styles.toggleRow}>
              {(['antialiased', 'pixel'] as FillMode[]).map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.toggleBtn,
                    fillMode === mode && styles.toggleBtnActive,
                  ]}
                  onPress={() => setFillMode(mode)}
                  accessibilityRole="button"
                  accessibilityLabel={mode === 'antialiased' ? t.smoothFillLabel : t.pixelFillLabel}
                >
                  <Text style={styles.toggleEmoji}>
                    {mode === 'antialiased' ? '🌊' : '🔲'}
                  </Text>
                  <Text style={styles.toggleLabel}>
                    {mode === 'antialiased' ? t.smoothFill : t.pixelFill}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel="Create drawing"
            >
              <Text style={styles.confirmText}>{t.startDrawing}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cancelText: {
    fontSize: 22,
    color: colors.textSecondary,
  },
  body: {
    padding: spacing.xl,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetBtn: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  presetEmoji: { fontSize: 26 },
  presetLabel: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  presetDims: { fontSize: 10, color: colors.textSecondary },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  customInputWrap: { flex: 1, gap: 6 },
  inputLabel: { fontSize: 12, color: colors.textSecondary },
  input: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  inputSep: {
    fontSize: 22,
    color: colors.textSecondary,
    marginTop: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toggleBtn: {
    flex: 1,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toggleBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  toggleEmoji: { fontSize: 24 },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  footer: {
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  confirmBtn: {
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});
