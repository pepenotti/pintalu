import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

import { colors, spacing, radius } from '../../theme/darkTheme';
import { useLanguage } from '../../i18n';

interface Props {
  visible: boolean;
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function RenameModal({ visible, value, onChange, onSubmit, onCancel }: Props) {
  const { t } = useLanguage();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.card}>
          <Text style={styles.title}>{t.renameDrawingTitle}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            placeholderTextColor={colors.textSecondary}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btn} onPress={onCancel}>
              <Text style={styles.btnCancel}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onSubmit}>
              <Text style={styles.btnPrimaryText}>{t.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  btnCancel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
