import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ListRenderItemInfo,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../../theme/darkTheme';
import { Project } from '../../store/types';
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

import { ProjectCard } from './ProjectCard';
import { AboutModal } from './AboutModal';
import { RenameModal } from './RenameModal';

export default function GalleryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameText, setRenameText] = useState('');
  const [aboutVisible, setAboutVisible] = useState(false);
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

      {/* About button — bottom left */}
      <TouchableOpacity
        style={styles.aboutBtn}
        onPress={() => setAboutVisible(true)}
        accessibilityLabel={t.aboutBtn}
        accessibilityRole="button"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
      </TouchableOpacity>

      <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} />
      <RenameModal
        visible={renameTarget !== null}
        value={renameText}
        onChange={setRenameText}
        onSubmit={submitRename}
        onCancel={() => setRenameTarget(null)}
      />
    </SafeAreaView>
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
  aboutBtn: {
    position: 'absolute',
    bottom: 36,
    left: 24,
  },
});