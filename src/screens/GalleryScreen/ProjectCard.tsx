import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, radius } from '../../theme/darkTheme';
import { Project } from '../../store/types';
import { getPNGUri, pngExists } from '../../store/projectsStore';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

interface Props {
  project: Project;
  onPress: () => void;
  onRename: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, onPress, onRename, onExport, onDelete }: Props) {
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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.thumb}>
        {hasThumb ? (
          <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <Text style={styles.thumbPlaceholder}>🎨</Text>
        )}

        <View style={styles.thumbOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.thumbBtn} onPress={onRename} hitSlop={HIT_SLOP}>
            <Ionicons name="pencil-outline" size={15} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.thumbBtn} onPress={onExport} hitSlop={HIT_SLOP}>
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
        <Text style={styles.cardName} numberOfLines={1}>{project.name}</Text>
        <Text style={styles.cardDate}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
