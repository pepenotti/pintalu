import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/darkTheme';
import { useLanguage } from '../../i18n';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  isZoomed: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onGallery: () => void;
  onResetView: () => void;
}

export function TopBar({
  canUndo, canRedo, isZoomed,
  onUndo, onRedo, onClear, onSave, onGallery, onResetView,
}: Props) {
  const { t } = useLanguage();
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>

        {/* Left: Undo / Redo / Trash */}
        <View style={styles.group}>
          <IconBtn icon="arrow-undo-outline"  onPress={onUndo}  disabled={!canUndo} label={t.undo}     size={22} />
          <IconBtn icon="arrow-redo-outline"  onPress={onRedo}  disabled={!canRedo} label={t.redo}     size={22} />
          <IconBtn icon="trash-outline"        onPress={onClear}                     label={t.clearLabel} size={22} />
        </View>

        {/* Centre: zoom reset pill */}
        {isZoomed && (
          <TouchableOpacity onPress={onResetView} style={styles.zoomPill}>
            <Text style={styles.zoomText}>{t.resetView}</Text>
          </TouchableOpacity>
        )}

        {/* Right: Save / Gallery */}
        <View style={styles.group}>
          <IconBtn icon="save-outline"   onPress={onSave}    label={t.save}    size={22} />
          <IconBtn icon="images-outline" onPress={onGallery} label={t.gallery} size={22} />
        </View>

      </View>
    </SafeAreaView>
  );
}

// ─── Icon button ──────────────────────────────────────────────────────────────
function IconBtn({
  icon, onPress, disabled = false, label, size,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  disabled?: boolean;
  label: string;
  size: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={styles.iconBtn}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Ionicons
        name={icon}
        size={size}
        color={disabled ? colors.textSecondary : colors.textPrimary}
        style={disabled ? styles.iconDisabled : undefined}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDisabled: {
    opacity: 0.35,
  },
  zoomPill: {
    backgroundColor: colors.accentMuted,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  zoomText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
