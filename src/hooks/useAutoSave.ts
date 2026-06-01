import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { savePNG, saveProject } from '../store/projectsStore';
import { Project } from '../store/types';

interface UseAutoSaveOptions {
  project: Project | null;
  getSnapshotBase64: () => Promise<string | null>;
}

export function useAutoSave({ project, getSnapshotBase64 }: UseAutoSaveOptions) {
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (!project || isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      const base64 = await getSnapshotBase64();
      if (base64) {
        await savePNG(project.id, base64);
        saveProject({ ...project, updatedAt: Date.now() });
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [project, getSnapshotBase64]);

  // Auto-save when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        save();
      }
    });
    return () => subscription.remove();
  }, [save]);

  return { save };
}
