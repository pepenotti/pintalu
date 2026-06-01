import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  ListRenderItemInfo,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, radius } from '../../theme/darkTheme';
import { Project, FillMode } from '../../store/types';
import {
  getAllProjects,
  deleteProject,
  renameProject,
  getPNGUri,
  pngExists,
} from '../../store/projectsStore';
import { useLanguage } from '../../i18n';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export default function GalleryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameText, setRenameText] = useState('');
  const { t, toggleLanguage } = useLanguage();
  const tRef = useRef(t);
  tRef.current = t;

  const refresh = useCallback(() => {
    setProjects(getAllProjects());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const openProject = useCallback(
    (project: Project) => {
      navigation.navigate('Canvas', { projectId: project.id });
    },
    [navigation]
  );

  const openRename = useCallback((project: Project) => {
    setRenameTarget(project);
    setRenameText(project.name);
  }, []);

  const submitRename = useCallback(() => {
    if (renameTarget && renameText.trim()) {
      renameProject(renameTarget.id, renameText.trim());
      refresh();
    }
    setRenameTarget(null);
  }, [renameTarget, renameText, refresh]);

  const exportToLibrary = useCallback(async (project: Project) => {
    const tr = tRef.current;
    // writeOnly: true — we only need to save, no read access required
    const { status } = await requestPermissionsAsync(true);
    if (status !== 'granted') {
      Alert.alert(tr.permissionNeeded, tr.permissionMessage);
      return;
    }
    const uri = getPNGUri(project.id);
    const exists = await pngExists(project.id);
    if (!exists) {
      Alert.alert(tr.noSavedImage, tr.saveFirst);
      return;
    }
    await Asset.create(uri);
    Alert.alert(tr.exported, tr.savedToLibrary);
  }, []);

  const confirmDelete = useCallback((project: Project) => {
    const tr = tRef.current;
    Alert.alert(
      tr.deleteDrawingTitle,
      tr.deleteDrawingMessage(project.name),
      [
        { text: tr.cancel, style: 'cancel' },
        {
          text: tr.delete,
          style: 'destructive',
          onPress: () => {
            deleteProject(project.id);
            refresh();
          },
        },
      ]
    );
  }, [refresh]);

  const handleNewDrawing = useCallback(() => {
    navigation.navigate('Canvas', {
      canvasWidth: Math.round(screenW),
      canvasHeight: Math.round(screenH),
      fillMode: 'antialiased',
    });
  }, [navigation, screenW, screenH]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Project>) => (
      <ProjectCard
        project={item}
        onPress={() => openProject(item)}
        onRename={() => openRename(item)}
        onExport={() => exportToLibrary(item)}
        onDelete={() => confirmDelete(item)}
      />
    ),
    [openProject, openRename, exportToLibrary, confirmDelete]
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.myDrawings}</Text>
        <TouchableOpacity
          onPress={toggleLanguage}
          style={styles.langToggle}
          accessibilityRole="button"
          accessibilityLabel="Toggle language"
        >
          <Text style={styles.langToggleText}>{t.languageToggle}</Text>
        </TouchableOpacity>
      </View>

      {projects.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🖼</Text>
          <Text style={styles.emptyText}>{t.noDrawingsYet}</Text>
          <Text style={styles.emptyHint}>{t.tapToStart}</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={p => p.id}
          numColumns={2}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewDrawing}
        accessibilityLabel={t.newDrawing}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={34} color="#FFF" />
      </TouchableOpacity>

      {/* ─── Rename modal ────────────────────────────────────────────────── */}
      <Modal
        visible={renameTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameTarget(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRenameTarget(null)} />
          <View style={styles.renameCard}>
            <Text style={styles.renameTitle}>{t.renameDrawingTitle}</Text>
            <TextInput
              style={styles.renameInput}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={submitRename}
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.renameActions}>
              <TouchableOpacity
                style={styles.renameBtn}
                onPress={() => setRenameTarget(null)}
              >
                <Text style={styles.renameBtnCancel}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.renameBtn, styles.renameBtnPrimary]}
                onPress={submitRename}
              >
                <Text style={styles.renameBtnPrimaryText}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onPress,
  onRename,
  onExport,
  onDelete,
}: {
  project: Project;
  onPress: () => void;
  onRename: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const [hasThumb, setHasThumb] = useState(false);
  const uri = getPNGUri(project.id);

  useEffect(() => {
    pngExists(project.id).then(setHasThumb);
  }, [project.id]);

  const date = new Date(project.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.thumb}>
        {hasThumb ? (
          <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <Text style={styles.thumbPlaceholder}>🎨</Text>
        )}

        {/* Quick-action overlay */}
        <View style={styles.thumbOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.thumbBtn}
            onPress={onRename}
            hitSlop={HIT_SLOP}
          >
            <Ionicons name="pencil-outline" size={15} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.thumbBtn}
            onPress={onExport}
            hitSlop={HIT_SLOP}
          >
            <Ionicons name="share-outline" size={15} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.thumbBtn, styles.thumbBtnDanger]}
            onPress={onDelete}
            hitSlop={HIT_SLOP}
          >
            <Ionicons name="trash-outline" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <Text style={styles.cardName} numberOfLines={1}>
          {project.name}
        </Text>
        <Text style={styles.cardDate}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
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
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  langToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: 999,
  },
  langToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  list: {
    padding: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  thumb: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    fontSize: 40,
  },
  cardMeta: {
    padding: spacing.sm,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyEmoji: { fontSize: 64 },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyHint: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  thumbOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  thumbBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbBtnDanger: {
    backgroundColor: 'rgba(210,45,45,0.65)',
  },
  // Rename modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  renameCard: {
    width: '100%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  renameTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  renameInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  renameBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  renameBtnCancel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  renameBtnPrimary: {
    backgroundColor: colors.accent,
  },
  renameBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});