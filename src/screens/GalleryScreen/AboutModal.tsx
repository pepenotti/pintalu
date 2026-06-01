import React from 'react';
import {
  Modal,
  Pressable,
  TouchableOpacity,
  Text,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, radius } from '../../theme/darkTheme';
import { useLanguage } from '../../i18n';
import { APP_VERSION } from '../../constants';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AboutModal({ visible, onClose }: Props) {
  const { t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.emoji}>🎨</Text>
          <Text style={styles.title}>{t.aboutTitle}</Text>
          <Text style={styles.tagline}>{t.aboutTagline}</Text>
          <Text style={styles.body}>{t.aboutDescription}</Text>
          <Text style={styles.feedback}>{t.aboutFeedback}</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://github.com/pepenotti/pintalu')}
          >
            <Ionicons name="logo-github" size={16} color={colors.accent} />
            <Text style={styles.linkText}>{t.aboutGithub}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('mailto:antonio@franchinotti.com.ar')}
          >
            <Ionicons name="mail-outline" size={16} color={colors.accent} />
            <Text style={styles.linkText}>{t.aboutEmail}</Text>
          </TouchableOpacity>
          <Text style={styles.version}>{t.aboutVersion} {APP_VERSION}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t.aboutClose}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
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
    width: '85%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 52,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 4,
  },
  feedback: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 14,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  version: {
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.6,
    marginTop: 4,
  },
  closeBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
