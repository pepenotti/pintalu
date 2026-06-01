import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../../theme/darkTheme';

interface Props {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Kid-friendly clear confirmation — no reading required.
 * Big 🗑️ emoji in the centre, large ✕ (cancel) and ✓ (confirm) buttons.
 */
export function ClearConfirmModal({ visible, onConfirm, onCancel }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Outer container — pointerEvents="box-none" so the View itself doesn't
          intercept touches, but children do.  The absoluteFill backdrop and the
          card are siblings, so tapping the card never reaches the backdrop. */}
      <View style={styles.outerContainer} pointerEvents="box-none">
        {/* Backdrop — covers the whole screen, sits behind the card */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onCancel}
        />
        {/* Card — onStartShouldSetResponder prevents touches from falling
            through to the backdrop when the user taps the emoji / empty area */}
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <Text style={styles.emoji}>🗑️</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelIcon}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Clear drawing"
            >
              <Text style={styles.confirmIcon}>✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  emoji: {
    fontSize: 80,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 24,
  },
  btn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#E57373',
  },
  confirmBtn: {
    backgroundColor: '#81C784',
  },
  cancelIcon: {
    fontSize: 34,
    color: '#fff',
    fontWeight: '700',
  },
  confirmIcon: {
    fontSize: 40,
    color: '#fff',
    fontWeight: '700',
  },
});
