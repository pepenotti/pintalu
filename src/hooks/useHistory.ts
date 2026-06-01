import { useCallback, useRef, useState } from 'react';
import { DrawCommand } from '../store/types';
import { loadHistory, persistHistory } from '../store/projectsStore';

// Canvas state (commands) is unlimited — every stroke drawn stays visible forever.
// Undo depth is capped separately so the undo stack doesn't grow unboundedly.
const MAX_UNDO_DEPTH = 50;

interface UseHistoryReturn {
  commands: DrawCommand[];
  canUndo: boolean;
  canRedo: boolean;
  pushCommand: (cmd: DrawCommand) => void;
  undo: () => void;
  redo: () => void;
  loadFromProject: (projectId: string) => void;
  clearHistory: () => void;
}

export function useHistory(projectId: string | null): UseHistoryReturn {
  const [commands, setCommands] = useState<DrawCommand[]>([]);
  // undoStack tracks the last MAX_UNDO_DEPTH commands that can be undone.
  // Commands that fall outside the window stay visible but can't be undone.
  const undoStack = useRef<DrawCommand[]>([]);
  const redoStack = useRef<DrawCommand[]>([]);

  const persistIfNeeded = useCallback(
    (cmds: DrawCommand[]) => {
      if (projectId) {
        persistHistory(projectId, cmds);
      }
    },
    [projectId]
  );

  const loadFromProject = useCallback((id: string) => {
    const saved = loadHistory(id);
    setCommands(saved);
    // Allow undoing the most recent strokes from the loaded drawing.
    undoStack.current = saved.slice(-MAX_UNDO_DEPTH);
    redoStack.current = [];
  }, []);

  const pushCommand = useCallback(
    (cmd: DrawCommand) => {
      // Append to unlimited canvas state — no slice, O(1) amortised.
      setCommands(prev => {
        const next = [...prev, cmd];
        persistIfNeeded(next);
        return next;
      });
      // Track in the capped undo window.
      undoStack.current = [...undoStack.current, cmd].slice(-MAX_UNDO_DEPTH);
      redoStack.current = [];
    },
    [persistIfNeeded]
  );

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const removed = undoStack.current[undoStack.current.length - 1];
    undoStack.current = undoStack.current.slice(0, -1);
    redoStack.current = [...redoStack.current, removed];
    // The undoable command is always the last element in commands.
    setCommands(prev => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      persistIfNeeded(next);
      return next;
    });
  }, [persistIfNeeded]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current = [...undoStack.current, next].slice(-MAX_UNDO_DEPTH);
    setCommands(prev => {
      const updated = [...prev, next];
      persistIfNeeded(updated);
      return updated;
    });
  }, [persistIfNeeded]);

  const clearHistory = useCallback(() => {
    setCommands([]);
    undoStack.current = [];
    redoStack.current = [];
    if (projectId) persistHistory(projectId, []);
  }, [projectId]);

  return {
    commands,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    pushCommand,
    undo,
    redo,
    loadFromProject,
    clearHistory,
  };
}
